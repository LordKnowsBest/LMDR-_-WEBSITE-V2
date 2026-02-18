/* eslint-disable */
jest.mock('backend/dataAccess', () => ({
  getRecord: jest.fn(),
  queryRecords: jest.fn(),
  insertRecord: jest.fn(),
  updateRecord: jest.fn()
}));

jest.mock('wix-users-backend', () => ({
  __esModule: true,
  default: {
    currentUser: {
      loggedIn: true,
      id: 'recruiter-1',
      getEmail: jest.fn(async () => 'recruiter@test.com')
    }
  }
}));

jest.mock('wix-members-backend', () => ({
  currentMember: {
    getMember: jest.fn(async () => null)
  }
}));

describe('onboardingWorkflowService', () => {
  let service;
  let dataAccess;
  let wixUsersBackend;

  beforeEach(() => {
    jest.resetModules();
    service = require('backend/onboardingWorkflowService');
    dataAccess = require('backend/dataAccess');
    wixUsersBackend = require('wix-users-backend').default;
    jest.clearAllMocks();
    wixUsersBackend.currentUser.loggedIn = true;
    wixUsersBackend.currentUser.id = 'recruiter-1';
  });

  test('createOnboardingWorkflow creates workflow for authorized recruiter', async () => {
    dataAccess.getRecord.mockImplementation(async (key, id) => {
      if (key === 'carriers' && id === 'carrier-1') return { _id: 'carrier-1', dot_number: '1234567', legal_name: 'Carrier One' };
      if (key === 'driverProfiles' && id === 'driver-1') return { _id: 'driver-1', display_name: 'Jane Driver' };
      return null;
    });

    dataAccess.queryRecords
      .mockResolvedValueOnce({ success: true, items: [{ recruiter_id: 'recruiter-1', carrier_dot: '1234567', is_active: true }] })
      .mockResolvedValueOnce({ success: true, items: [] });

    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'wf-1', status: 'pending' } });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: {} });

    const result = await service.createOnboardingWorkflow('driver-1', 'carrier-1');

    expect(result.success).toBe(true);
    expect(result.workflowId).toBe('wf-1');
    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'onboardingWorkflows',
      expect.objectContaining({
        driver_id: 'driver-1',
        carrier_id: 'carrier-1',
        recruiter_id: 'recruiter-1',
        status: 'pending'
      })
    );
  });

  test('getActiveWorkflows returns unauthorized when user is not logged in', async () => {
    wixUsersBackend.currentUser.loggedIn = false;
    const result = await service.getActiveWorkflows();
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('ERR_UNAUTHORIZED');
  });

  test('updateWorkflowStatus rejects invalid state transition', async () => {
    dataAccess.getRecord.mockImplementation(async (key, id) => {
      if (key === 'onboardingWorkflows' && id === 'wf-1') {
        return { _id: 'wf-1', status: 'pending', carrier_id: 'carrier-1', recruiter_id: 'recruiter-1', driver_id: 'driver-1' };
      }
      if (key === 'carriers' && id === 'carrier-1') {
        return { _id: 'carrier-1', dot_number: '1234567', legal_name: 'Carrier One' };
      }
      return null;
    });

    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [{ recruiter_id: 'recruiter-1', carrier_dot: '1234567', is_active: true }] });

    const result = await service.updateWorkflowStatus('wf-1', 'completed');

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('ERR_INVALID_TRANSITION');
  });
});

