/* eslint-env jest */
const fs = require('fs');
const path = require('path');

const jsSource = fs.readFileSync(path.resolve(__dirname, '../recruiter/os/js/views/ros-view-pipeline.js'), 'utf8');

describe('ros-view-pipeline.js Bridge Tests', () => {
    let registeredView;
    let mockBridgeSend;

    beforeEach(() => {
        mockBridgeSend = jest.fn();

        global.document = {
            getElementById: jest.fn((id) => {
                if (id === 'pipe-drawer') return { classList: { add: jest.fn(), remove: jest.fn() }, dataset: {} };
                if (id === 'pipe-new-note') return { value: '' };
                if (id === 'drawer-status') return { value: 'interested' };
                return {
                    classList: { add: jest.fn(), remove: jest.fn() },
                    offsetWidth: 100,
                    dataset: {}
                };
            }),
            createElement: jest.fn(() => ({
                classList: { add: jest.fn(), remove: jest.fn() },
                style: {},
                className: '',
                innerHTML: '',
                textContent: '',
                appendChild: jest.fn(),
                remove: jest.fn()
            })),
            body: {
                appendChild: jest.fn()
            },
            querySelectorAll: jest.fn(() => []),
            addEventListener: jest.fn()
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
        expect(registeredView.messages).toContain('candidateDetails');
        expect(registeredView.messages).toContain('notesAdded');
    });

    test('onMount fetches pipeline and stats', () => {
        registeredView.onMount();
        expect(mockBridgeSend).toHaveBeenCalledWith('getPipeline', {});
        expect(mockBridgeSend).toHaveBeenCalledWith('getStats', {});
    });

    test('public API has correct methods', () => {
        expect(ROS.views._pipeline.viewCandidate).toBeDefined();
        expect(ROS.views._pipeline.updateStatus).toBeDefined();
        expect(ROS.views._pipeline.closeDrawer).toBeDefined();
        expect(ROS.views._pipeline.openNoteModal).toBeDefined();
        expect(ROS.views._pipeline.closeNoteModal).toBeDefined();
        expect(ROS.views._pipeline.saveNote).toBeDefined();
    });

    test('viewCandidate sends message to Velo', () => {
        ROS.views._pipeline.viewCandidate('cand-123');
        expect(mockBridgeSend).toHaveBeenCalledWith('getCandidateDetails', { candidateId: 'cand-123' });
    });

    test('updateStatus sends message to Velo', () => {
        ROS.views._pipeline.updateStatus('cand-123', 'hired');
        expect(mockBridgeSend).toHaveBeenCalledWith('updateCandidateStatus', { candidateId: 'cand-123', status: 'hired' });
    });

    test('saveNote sends message to Velo with candidate id and note text', () => {
        global.document.getElementById.mockImplementation((id) => {
            if (id === 'pipe-new-note') return { value: 'Great driver', trim: () => 'Great driver' };
            if (id === 'pipe-drawer') return { dataset: { candidateId: 'cand-123' } };
            return null;
        });

        ROS.views._pipeline.saveNote();
        expect(mockBridgeSend).toHaveBeenCalledWith('addCandidateNote', { candidateId: 'cand-123', note: 'Great driver' });
    });

    test('onMessage handles notesAdded successfully', () => {
        // Setup spy and dataset
        global.document.getElementById.mockImplementation((id) => {
            if (id === 'pipe-drawer') return { dataset: { candidateId: 'cand-123' } };
            if (id === 'pipe-notes-modal') return { classList: { add: jest.fn() } };
            if (id === 'pipe-notes-content') return { classList: { add: jest.fn() } };
            return null;
        });

        registeredView.onMessage('notesAdded', {});

        // It should close modal and refresh candidate details
        expect(mockBridgeSend).toHaveBeenCalledWith('getCandidateDetails', { candidateId: 'cand-123' });
    });
});
