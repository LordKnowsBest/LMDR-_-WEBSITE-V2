jest.mock('backend/dataAccess', () => ({
  insertRecord: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const reliability = require('backend/metaReliabilityService');

describe('metaReliabilityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    reliability.__resetReliabilityStateForTests();
  });

  test('executeWithRetryAndCircuit retries transient failures and then succeeds', async () => {
    let attempts = 0;
    const result = await reliability.executeWithRetryAndCircuit(
      'meta_test.retry_success',
      async () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error('temporary failure');
        }
        return { success: true, value: 'ok' };
      },
      { retries: 3, backoffMs: 1, backoffFactor: 1 }
    );

    expect(result.success).toBe(true);
    expect(result.value).toBe('ok');
    expect(attempts).toBe(3);
  });

  test('executeWithRetryAndCircuit opens circuit after repeated failures', async () => {
    await reliability.executeWithRetryAndCircuit(
      'meta_test.circuit',
      async () => ({ success: false, error: 'hard fail' }),
      { retries: 0, circuitThreshold: 1, backoffMs: 1 }
    );

    const blocked = await reliability.executeWithRetryAndCircuit(
      'meta_test.circuit',
      async () => ({ success: true }),
      { retries: 0, circuitThreshold: 1, backoffMs: 1 }
    );

    expect(blocked.success).toBe(false);
    expect(blocked.type).toBe('circuit_open');
    expect(dataAccess.insertRecord).toHaveBeenCalled();
  });

  test('executeWithRetryAndCircuit enqueues dead letter after retry exhaustion', async () => {
    const result = await reliability.executeWithRetryAndCircuit(
      'meta_test.dead_letter',
      async () => ({ success: false, error: 'persistent failure' }),
      { retries: 1, backoffMs: 1, backoffFactor: 1 }
    );

    expect(result.success).toBe(false);
    expect(result.deadLetterEnqueued).toBe(true);
    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'metaErrorEvents',
      expect.objectContaining({
        error_code: 'meta_dead_letter',
        severity: 'critical',
        operation_key: 'meta_test.dead_letter'
      }),
      { suppressAuth: true }
    );
  });

  test('executeWithRetryAndCircuit bypasses circuit retries for non-retryable business failures', async () => {
    let attempts = 0;
    const first = await reliability.executeWithRetryAndCircuit(
      'meta_test.business_failure',
      async () => {
        attempts += 1;
        return { success: false, error: 'Campaign not found: cmp_missing', retryable: false };
      },
      { retries: 3, circuitThreshold: 1, backoffMs: 1 }
    );

    const second = await reliability.executeWithRetryAndCircuit(
      'meta_test.business_failure',
      async () => ({ success: true, value: 'ok' }),
      { retries: 0, circuitThreshold: 1, backoffMs: 1 }
    );

    expect(first.success).toBe(false);
    expect(first.type).toBe('non_retryable_failure');
    expect(attempts).toBe(1);
    expect(second.success).toBe(true);
    expect(second.type).toBeUndefined();
  });

  test('consumeRequestBudget blocks once minute budget is exceeded', async () => {
    const limit = 2;
    const a = await reliability.consumeRequestBudget('meta_test.budget', { limitPerMinute: limit });
    const b = await reliability.consumeRequestBudget('meta_test.budget', { limitPerMinute: limit });
    const c = await reliability.consumeRequestBudget('meta_test.budget', { limitPerMinute: limit });

    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    expect(c.allowed).toBe(false);
  });

  test('readWithCache returns cached value within ttl', async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return { payload: 'cached' };
    };

    const first = await reliability.readWithCache('meta_test.cache', fetcher, 1000);
    const second = await reliability.readWithCache('meta_test.cache', fetcher, 1000);

    expect(first.payload).toBe('cached');
    expect(second.payload).toBe('cached');
    expect(calls).toBe(1);
  });

  test('readWithCache does not cache failed fetch attempts', async () => {
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error('temporary failure');
      }
      return { payload: 'recovered' };
    };

    await expect(reliability.readWithCache('meta_test.cache.failure', fetcher, 1000)).rejects.toThrow('temporary failure');
    const second = await reliability.readWithCache('meta_test.cache.failure', fetcher, 1000);

    expect(second.payload).toBe('recovered');
    expect(calls).toBe(2);
  });
});
