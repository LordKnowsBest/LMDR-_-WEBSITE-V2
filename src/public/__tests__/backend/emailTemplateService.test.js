/* eslint-disable */
/**
 * @jest-environment node
 */
/* eslint-env jest */

import * as emailTemplateService from 'backend/emailTemplateService';
import * as dataAccess from 'backend/dataAccess';

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  findByField: jest.fn(),
  insertRecord: jest.fn().mockResolvedValue({ success: true }),
  updateRecord: jest.fn().mockResolvedValue({ success: true }),
}), { virtual: true });

jest.mock('backend/observabilityService', () => ({
  log: jest.fn().mockResolvedValue({}),
}), { virtual: true });

describe('emailTemplateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderEmail replaces nested variables', async () => {
    dataAccess.findByField.mockResolvedValue({
      templateKey: 'welcome_driver',
      subject: 'Welcome {{user.firstName}}',
      preheader: 'Hi {{user.firstName}}',
      htmlContent: '<p>Hello {{user.firstName}}</p>'
    });

    const result = await emailTemplateService.renderEmail('welcome_driver', {
      user: { firstName: 'Jordan' }
    });

    expect(result.subject).toContain('Jordan');
    expect(result.preheader).toContain('Jordan');
    expect(result.htmlContent).toContain('Jordan');
  });

  test('renderEmail enforces required variables list', async () => {
    dataAccess.findByField.mockResolvedValue({
      templateKey: 'status_update',
      subject: 'Status changed',
      htmlContent: '<p>Update</p>',
      variables: [{ key: 'application.status', required: true }]
    });

    await expect(emailTemplateService.renderEmail('status_update', {}))
      .rejects.toThrow('Missing required variables');
  });
});
