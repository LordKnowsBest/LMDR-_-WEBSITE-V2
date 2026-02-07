jest.mock('backend/apiWebhookService', () => ({
  processPendingWebhookRetries: jest.fn()
}));
jest.mock('backend/observabilityService', () => ({
  log: jest.fn().mockResolvedValue(undefined)
}));

const { processPendingWebhookRetries } = require('backend/apiWebhookService');
const { processApiWebhookRetries } = require('../../backend/apiWebhookJobs.jsw');

describe('apiWebhookJobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('processes queued webhook retries', async () => {
    processPendingWebhookRetries.mockResolvedValue({
      success: true,
      processed: 3,
      outcomes: [{ success: true }]
    });

    const result = await processApiWebhookRetries(25);

    expect(processPendingWebhookRetries).toHaveBeenCalledWith(25);
    expect(result.success).toBe(true);
    expect(result.processed).toBe(3);
  });

  test('returns failure payload when retry processor throws', async () => {
    processPendingWebhookRetries.mockRejectedValue(new Error('boom'));

    const result = await processApiWebhookRetries(25);

    expect(result.success).toBe(false);
    expect(result.error).toBe('boom');
  });
});
