/* eslint-disable */
/**
 * @jest-environment node
 */
/* eslint-env jest */

import * as notificationRulesService from 'backend/notificationRulesService';
import * as dataAccess from 'backend/dataAccess';

jest.mock('backend/dataAccess', () => ({
  getRecord: jest.fn(),
  queryRecords: jest.fn(),
  insertRecord: jest.fn().mockResolvedValue({ success: true }),
  updateRecord: jest.fn().mockResolvedValue({ success: true }),
  deleteRecord: jest.fn().mockResolvedValue({ success: true }),
}), { virtual: true });

jest.mock('backend/utils/conditionEvaluator', () => ({
  evaluateConditions: jest.fn().mockReturnValue(true),
}), { virtual: true });

describe('notificationRulesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('testRule renders enabled channel preview and marks dispatch true', async () => {
    dataAccess.getRecord.mockResolvedValue({
      _id: 'r1',
      name: 'Match Rule',
      isActive: true,
      triggerEvent: 'match.new',
      conditions: [],
      channels: [
        { type: 'in_app', enabled: true, template: 'New {{match.score}}% with {{carrier.name}}' }
      ]
    });

    const result = await notificationRulesService.testRule('r1', {
      match: { score: 91 },
      carrier: { name: 'Acme' }
    });

    expect(result.wouldDispatch).toBe(true);
    expect(result.channels[0].preview).toContain('91%');
    expect(result.channels[0].preview).toContain('Acme');
  });

  test('previewNotification throws when channel not configured', async () => {
    dataAccess.getRecord.mockResolvedValue({
      _id: 'r1',
      channels: [{ type: 'email', enabled: true, templateKey: 'welcome_driver' }]
    });

    await expect(notificationRulesService.previewNotification('r1', 'push', {}))
      .rejects.toThrow("does not have channel 'push'");
  });
});
