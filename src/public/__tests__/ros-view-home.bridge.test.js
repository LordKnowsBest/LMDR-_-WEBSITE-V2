/* eslint-env jest */
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.resolve(__dirname, '../recruiter/os/js/views/ros-view-home.js'), 'utf8');

describe('ros-view-home.js Bridge Tests', () => {
    let registeredView;
    let mockBridgeSend;

    beforeEach(() => {
        mockBridgeSend = jest.fn();

        global.document = {
            getElementById: jest.fn()
        };

        global.ROS = {
            config: { brand: { logo: 'VM' } },
            bridge: { sendToVelo: mockBridgeSend },
            views: {
                registerView: (id, conf) => { registeredView = conf; },
                showView: jest.fn()
            }
        };

        // Execute the IIFE
        eval(jsSource);
    });

    test('registers view correctly', () => {
        expect(registeredView).toBeDefined();
        expect(registeredView.messages).toContain('pipelineLoaded');
        expect(registeredView.messages).toContain('unreadCountData');
    });

    test('onMount fetches pipeline and unread count', () => {
        jest.useFakeTimers();
        registeredView.onMount();
        expect(mockBridgeSend).toHaveBeenCalledWith('getPipeline', {});
        expect(mockBridgeSend).toHaveBeenCalledWith('getUnreadCount', {});
        jest.useRealTimers();
    });

    test('onMessage updates pipeline stat', () => {
        const mockEl = { textContent: '' };
        global.document.getElementById.mockImplementation((id) => {
            if (id === 'home-stat-pipeline') return mockEl;
            return null;
        });

        // Simulating the stage output structure
        registeredView.onMessage('pipelineLoaded', {
            stages: [
                { id: 'interested', candidates: [{ _id: 1 }, { _id: 2 }] },
                { id: 'review', candidates: [{ _id: 3 }] },
                { id: 'hired', candidates: [] }
            ]
        });

        expect(global.document.getElementById).toHaveBeenCalledWith('home-stat-pipeline');
        expect(mockEl.textContent).toBe(3);
    });

    test('onMessage updates unread messages stat', () => {
        const mockEl = { textContent: '' };
        global.document.getElementById.mockImplementation((id) => {
            if (id === 'home-stat-messages') return mockEl;
            return null;
        });

        registeredView.onMessage('unreadCountData', { count: 14 });

        expect(global.document.getElementById).toHaveBeenCalledWith('home-stat-messages');
        expect(mockEl.textContent).toBe(14);
    });
});
