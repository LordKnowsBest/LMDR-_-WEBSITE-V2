import {
  log,
  startTrace,
  endTrace,
  getLogs,
  getMetrics,
  getAgentBehavior
} from 'backend/observabilityService';
import * as dataAccess from 'backend/dataAccess';

jest.mock('backend/dataAccess', () => ({
  insertRecord: jest.fn(),
  queryRecords: jest.fn(),
  updateRecord: jest.fn(),
  getRecord: jest.fn(),
  removeRecord: jest.fn()
}));

jest.mock('wix-members-backend', () => ({
  currentMember: {
    getMember: jest.fn().mockResolvedValue({
      _id: 'admin-1',
      contactDetails: { customFields: { role: 'super_admin' } }
    })
  }
}));

describe('observabilityService persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dataAccess.insertRecord.mockResolvedValue({ success: true, record: { _id: 'rec1' } });
    dataAccess.updateRecord.mockResolvedValue({ success: true, record: { _id: 'rec1' } });
    dataAccess.queryRecords.mockResolvedValue({ success: true, items: [], totalCount: 0 });
  });

  test('log persists to systemLogs and systemErrors for error level', async () => {
    await log({ level: 'ERROR', source: 'agent-orchestrator', message: 'tool failed', details: { code: 'E_TOOL' } });

    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'systemLogs',
      expect.objectContaining({ service: 'agent-orchestrator', level: 'error' }),
      expect.any(Object)
    );
    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'systemErrors',
      expect.objectContaining({ source: 'agent-orchestrator', level: 'ERROR' }),
      expect.any(Object)
    );
  });

  test('startTrace + endTrace persist and finalize trace record', async () => {
    dataAccess.queryRecords.mockResolvedValueOnce({ success: true, items: [{ _id: 'trace-1', trace_id: 'tr_x' }] });

    const trace = await startTrace('agent-run', { source: 'agent-orchestrator', tags: ['agent'] });
    await endTrace(trace.traceId, 'completed', { ok: true });

    expect(dataAccess.insertRecord).toHaveBeenCalledWith(
      'systemTraces',
      expect.objectContaining({ name: 'agent-run', status: 'in_progress' }),
      expect.any(Object)
    );
    expect(dataAccess.updateRecord).toHaveBeenCalledWith(
      'systemTraces',
      expect.objectContaining({ _id: 'trace-1', status: 'completed' }),
      expect.any(Object)
    );
  });

  test('getLogs normalizes service/log_date fields for dashboard', async () => {
    dataAccess.queryRecords.mockResolvedValueOnce({
      success: true,
      totalCount: 1,
      items: [{ _id: 'l1', level: 'info', service: 'agent-orchestrator', message: 'ok', log_date: '2026-02-18T10:00:00Z' }]
    });

    const result = await getLogs({ level: 'INFO' });

    expect(dataAccess.queryRecords).toHaveBeenCalledWith(
      'systemLogs',
      expect.objectContaining({ filters: { level: 'info' } })
    );
    expect(result.items[0]).toEqual(expect.objectContaining({
      level: 'INFO',
      source: 'agent-orchestrator',
      timestamp: '2026-02-18T10:00:00Z'
    }));
  });

  test('getMetrics returns agent-compatible health summary shape', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({ success: true, items: [] })
      .mockResolvedValueOnce({ success: true, items: [] })
      .mockResolvedValueOnce({ success: true, items: [] });

    const result = await getMetrics({ period: 'hour' });

    expect(result).toEqual(expect.objectContaining({
      period: 'hour',
      summary: expect.objectContaining({
        totalRequests: expect.any(Number),
        totalErrors: expect.any(Number),
        errorRate: expect.any(Number),
        activeAnomalies: expect.any(Number)
      })
    }));
  });

  test('getAgentBehavior returns source/runs/events payload', async () => {
    dataAccess.queryRecords
      .mockResolvedValueOnce({
        success: true,
        items: [{ _id: 'l1', level: 'info', service: 'agent-orchestrator', message: 'run started', log_date: '2026-02-18T10:00:00Z', trace_id: 'tr_1' }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{ _id: 'e1', level: 'ERROR', source: 'agent-orchestrator', message: 'tool error', timestamp: '2026-02-18T10:00:30Z', trace_id: 'tr_1' }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{ _id: 't1', trace_id: 'tr_1', name: 'agent-run', start_time: '2026-02-18T10:00:00Z', end_time: '2026-02-18T10:00:40Z', status: 'error', duration: 40000, metadata: JSON.stringify({ source: 'agent-orchestrator' }) }]
      })
      .mockResolvedValueOnce({
        success: true,
        items: [{ functionId: 'agent_orchestration', tokensUsed: 321, timestamp: '2026-02-18T10:00:20Z' }]
      });

    const result = await getAgentBehavior({ period: 'day', limit: 50 });

    expect(result).toEqual(expect.objectContaining({
      summary: expect.objectContaining({
        totalRuns: expect.any(Number),
        totalEvents: expect.any(Number),
        totalErrors: expect.any(Number)
      }),
      bySource: expect.any(Array),
      recentRuns: expect.any(Array),
      recentEvents: expect.any(Array)
    }));
    expect(result.bySource[0].source).toBe('agent-orchestrator');
  });
});
