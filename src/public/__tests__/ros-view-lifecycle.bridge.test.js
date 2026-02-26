/* eslint-env jest */
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.resolve(__dirname, '../recruiter/os/js/views/ros-view-lifecycle.js'), 'utf8');

describe('ros-view-lifecycle.js Bridge Tests', () => {
    let registeredView;
    let mockBridgeSend;

    beforeEach(() => {
        mockBridgeSend = jest.fn();

        global.document = {
            getElementById: jest.fn(() => ({
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                },
                offsetWidth: 100
            }))
        };

        global.ROS = {
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
        expect(registeredView.messages).toContain('timelineLoaded');
    });

    test('onMount fetches timeline events', () => {
        registeredView.onMount();
        expect(mockBridgeSend).toHaveBeenCalledWith('getTimelineEvents', { driverId: 'mock-123' });
    });

    test('lifecycle handlers are attached to ROS.views', () => {
        expect(ROS.views.lifecycle.openLogModal).toBeDefined();
        expect(ROS.views.lifecycle.closeLogModal).toBeDefined();
        expect(ROS.views.lifecycle.openTermModal).toBeDefined();
        expect(ROS.views.lifecycle.closeTermModal).toBeDefined();
    });

    test('openLogModal manipulates DOM correctly', () => {
        const mockModal = { classList: { add: jest.fn(), remove: jest.fn() }, offsetWidth: 100 };
        const mockContent = { classList: { add: jest.fn(), remove: jest.fn() } };

        global.document.getElementById.mockImplementation((id) => {
            if (id === 'lifecycle-log-modal') return mockModal;
            if (id === 'lifecycle-log-content') return mockContent;
            return null;
        });

        ROS.views.lifecycle.openLogModal();

        expect(mockModal.classList.remove).toHaveBeenCalledWith('hidden');
        expect(mockModal.classList.remove).toHaveBeenCalledWith('opacity-0');
        expect(mockContent.classList.remove).toHaveBeenCalledWith('scale-95');
    });
});
