// ============================================================================
// PIPELINE EXECUTION AGENT - Test Suite
// Tests decision logic, SLA enforcement, and event processing
// ============================================================================

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ── Mock dataAccess ──
const mockQueryRecords = jest.fn();
const mockInsertRecord = jest.fn();
const mockUpdateRecord = jest.fn();
const mockGetRecord = jest.fn();

jest.unstable_mockModule('backend/dataAccess', () => ({
  queryRecords: mockQueryRecords,
  insertRecord: mockInsertRecord,
  updateRecord: mockUpdateRecord,
  getRecord: mockGetRecord
}));

// ── Mock tcpaGuard ──
const mockIsTCPACompliant = jest.fn();
const mockGetNextAllowedWindow = jest.fn();

jest.unstable_mockModule('backend/utils/tcpaGuard', () => ({
  isTCPACompliant: mockIsTCPACompliant,
  getNextAllowedWindow: mockGetNextAllowedWindow
}));

// ── Import after mocks ──
const {
  decide,
  enforceContactSLA,
  getStageProgression,
  getPipelineHealth
} = await import('backend/pipelineExecutionAgent');

// ── Default mock setup ──
beforeEach(() => {
  jest.clearAllMocks();
  mockIsTCPACompliant.mockReturnValue(true);
  mockGetNextAllowedWindow.mockReturnValue({
    canSendAt: new Date().toISOString(),
    reason: 'Currently within allowed window'
  });
  mockQueryRecords.mockResolvedValue({ success: true, items: [] });
  mockInsertRecord.mockResolvedValue({ success: true, record: {} });
});

// ============================================================================
// decide() — Stage Change Decisions
// ============================================================================

describe('decide() — stage_change events', () => {
  it('returns SMS + voice actions for stage_to=interested', async () => {
    const result = await decide({
      event_type: 'stage_change',
      stage_to: 'interested',
      candidate_id: 'drv_001',
      carrier_dot: '1234567'
    });

    expect(result.actions.length).toBeGreaterThanOrEqual(1);
    expect(result.reasoning).toContain('interest');

    const smsAction = result.actions.find(a => a.type === 'send_sms');
    expect(smsAction).toBeDefined();
    expect(smsAction.priority).toBe('high');

    const voiceAction = result.actions.find(a => a.type === 'schedule_voice_call');
    expect(voiceAction).toBeDefined();
    expect(voiceAction.template_id).toBe('vat_warm_lead');
  });

  it('returns confirmation SMS + qualification screen for stage_to=applied', async () => {
    const result = await decide({
      event_type: 'stage_change',
      stage_to: 'applied',
      candidate_id: 'drv_002',
      carrier_dot: '1234567'
    });

    expect(result.actions.length).toBeGreaterThanOrEqual(1);
    const voiceAction = result.actions.find(a => a.type === 'schedule_voice_call');
    expect(voiceAction).toBeDefined();
    expect(voiceAction.template_id).toBe('vat_qualification');
  });

  it('schedules voice escalation for stage_to=contacted', async () => {
    const result = await decide({
      event_type: 'stage_change',
      stage_to: 'contacted',
      candidate_id: 'drv_003',
      carrier_dot: '1234567'
    });

    const voiceAction = result.actions.find(a => a.type === 'schedule_voice_call');
    expect(voiceAction).toBeDefined();
    expect(voiceAction.delay_minutes).toBe(24 * 60);
  });

  it('schedules background + technical screening for stage_to=in_review', async () => {
    const result = await decide({
      event_type: 'stage_change',
      stage_to: 'in_review',
      candidate_id: 'drv_004',
      carrier_dot: '1234567'
    });

    expect(result.actions.length).toBe(2);
    const templateIds = result.actions.map(a => a.template_id);
    expect(templateIds).toContain('vat_background');
    expect(templateIds).toContain('vat_technical');
  });

  it('sends offer email + orientation call for stage_to=offer', async () => {
    const result = await decide({
      event_type: 'stage_change',
      stage_to: 'offer',
      candidate_id: 'drv_005',
      carrier_dot: '1234567'
    });

    const emailAction = result.actions.find(a => a.type === 'send_email');
    expect(emailAction).toBeDefined();
    expect(emailAction.template).toBe('offer_letter');

    const voiceAction = result.actions.find(a => a.type === 'schedule_voice_call');
    expect(voiceAction).toBeDefined();
    expect(voiceAction.template_id).toBe('vat_orientation');
  });

  it('triggers onboarding for stage_to=hired', async () => {
    const result = await decide({
      event_type: 'stage_change',
      stage_to: 'hired',
      candidate_id: 'drv_006',
      carrier_dot: '1234567'
    });

    const emailAction = result.actions.find(a => a.type === 'send_email');
    expect(emailAction).toBeDefined();
    expect(emailAction.template).toBe('welcome_onboarding');

    const voiceAction = result.actions.find(a => a.type === 'schedule_voice_call');
    expect(voiceAction).toBeDefined();
    expect(voiceAction.template_id).toBe('vat_first_day');
  });

  it('returns empty actions for unknown stage', async () => {
    const result = await decide({
      event_type: 'stage_change',
      stage_to: 'some_unknown_stage',
      candidate_id: 'drv_007',
      carrier_dot: '1234567'
    });

    expect(result.actions).toEqual([]);
  });
});

// ============================================================================
// decide() — TCPA Enforcement
// ============================================================================

describe('decide() — TCPA quiet hours', () => {
  it('skips SMS when outside TCPA hours', async () => {
    mockIsTCPACompliant.mockReturnValue(false);
    mockGetNextAllowedWindow.mockReturnValue({
      canSendAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      reason: 'TCPA quiet hours'
    });

    const result = await decide({
      event_type: 'stage_change',
      stage_to: 'interested',
      candidate_id: 'drv_008',
      carrier_dot: '1234567'
    });

    const smsAction = result.actions.find(a => a.type === 'send_sms');
    expect(smsAction).toBeUndefined();

    // Voice call should still be scheduled (with delay)
    const voiceAction = result.actions.find(a => a.type === 'schedule_voice_call');
    expect(voiceAction).toBeDefined();
    expect(voiceAction.delay_minutes).toBeGreaterThan(30);
  });
});

// ============================================================================
// decide() — No Response Escalation
// ============================================================================

describe('decide() — no_response events', () => {
  it('escalates through SMS → email → voice → recruiter queue', async () => {
    // Attempt 0: SMS
    let result = await decide({
      event_type: 'no_response',
      candidate_id: 'drv_009',
      carrier_dot: '1234567',
      metadata: { attempt_count: 0 }
    });
    expect(result.actions[0].type).toBe('send_sms');

    // Attempt 1: email
    result = await decide({
      event_type: 'no_response',
      candidate_id: 'drv_009',
      carrier_dot: '1234567',
      metadata: { attempt_count: 1 }
    });
    expect(result.actions[0].type).toBe('send_email');

    // Attempt 2: voice
    result = await decide({
      event_type: 'no_response',
      candidate_id: 'drv_009',
      carrier_dot: '1234567',
      metadata: { attempt_count: 2 }
    });
    expect(result.actions[0].type).toBe('schedule_voice_call');

    // Attempt 3+: recruiter queue
    result = await decide({
      event_type: 'no_response',
      candidate_id: 'drv_009',
      carrier_dot: '1234567',
      metadata: { attempt_count: 3 }
    });
    expect(result.actions[0].type).toBe('queue_recruiter');
  });
});

// ============================================================================
// decide() — Call Completed
// ============================================================================

describe('decide() — call_completed events', () => {
  it('advances to in_review for interested outcome', async () => {
    const result = await decide({
      event_type: 'call_completed',
      candidate_id: 'drv_010',
      carrier_dot: '1234567',
      metadata: { outcome: 'interested' }
    });

    expect(result.actions[0].type).toBe('advance_stage');
    expect(result.actions[0].new_stage).toBe('in_review');
  });

  it('rejects for not_qualified outcome', async () => {
    const result = await decide({
      event_type: 'call_completed',
      candidate_id: 'drv_010',
      carrier_dot: '1234567',
      metadata: { outcome: 'not_qualified' }
    });

    expect(result.actions[0].type).toBe('advance_stage');
    expect(result.actions[0].new_stage).toBe('rejected');
  });

  it('schedules follow-up for callback outcome', async () => {
    const result = await decide({
      event_type: 'call_completed',
      candidate_id: 'drv_010',
      carrier_dot: '1234567',
      metadata: { outcome: 'callback' }
    });

    expect(result.actions[0].type).toBe('schedule_voice_call');
    expect(result.actions[0].delay_minutes).toBe(120);
  });
});

// ============================================================================
// decide() — Document Received
// ============================================================================

describe('decide() — document_received events', () => {
  it('auto-advances to offer when all docs complete', async () => {
    const result = await decide({
      event_type: 'document_received',
      candidate_id: 'drv_011',
      carrier_dot: '1234567',
      metadata: { all_documents_received: true }
    });

    expect(result.actions[0].type).toBe('advance_stage');
    expect(result.actions[0].new_stage).toBe('offer');
  });

  it('sends ack SMS for partial docs', async () => {
    const result = await decide({
      event_type: 'document_received',
      candidate_id: 'drv_011',
      carrier_dot: '1234567',
      metadata: { all_documents_received: false }
    });

    expect(result.actions[0].type).toBe('send_sms');
  });
});

// ============================================================================
// decide() — Application Submitted
// ============================================================================

describe('decide() — application_submitted events', () => {
  it('sends SMS + schedules qualification screen', async () => {
    const result = await decide({
      event_type: 'application_submitted',
      candidate_id: 'drv_012',
      carrier_dot: '1234567'
    });

    const smsAction = result.actions.find(a => a.type === 'send_sms');
    expect(smsAction).toBeDefined();

    const voiceAction = result.actions.find(a => a.type === 'schedule_voice_call');
    expect(voiceAction).toBeDefined();
    expect(voiceAction.template_id).toBe('vat_qualification');
  });
});

// ============================================================================
// enforceContactSLA()
// ============================================================================

describe('enforceContactSLA()', () => {
  it('returns inSLA=true when no events exist', async () => {
    mockQueryRecords.mockResolvedValue({ success: true, items: [] });

    const result = await enforceContactSLA('drv_013');
    expect(result.inSLA).toBe(true);
    expect(result.action_needed).toBeNull();
  });

  it('detects SLA breach for old unprocessed events', async () => {
    const oldTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago
    mockQueryRecords.mockResolvedValue({
      success: true,
      items: [{
        event_id: 'pe_test',
        event_type: 'stage_change',
        candidate_id: 'drv_014',
        created_at: oldTime,
        processed: 'No'
      }]
    });

    const result = await enforceContactSLA('drv_014');
    expect(result.inSLA).toBe(false);
    expect(result.elapsed_ms).toBeGreaterThan(5 * 60 * 1000);
    expect(result.action_needed).toBe('urgent_outreach');
  });

  it('returns inSLA=true for recent events', async () => {
    const recentTime = new Date(Date.now() - 60 * 1000).toISOString(); // 1 min ago
    mockQueryRecords.mockResolvedValue({
      success: true,
      items: [{
        event_id: 'pe_test2',
        event_type: 'stage_change',
        candidate_id: 'drv_015',
        created_at: recentTime,
        processed: 'No'
      }]
    });

    const result = await enforceContactSLA('drv_015');
    expect(result.inSLA).toBe(true);
  });
});

// ============================================================================
// getStageProgression()
// ============================================================================

describe('getStageProgression()', () => {
  it('returns sorted event timeline', async () => {
    mockQueryRecords.mockResolvedValue({
      success: true,
      items: [
        { event_id: 'pe_1', event_type: 'stage_change', stage_to: 'interested', created_at: '2026-02-01T10:00:00Z' },
        { event_id: 'pe_2', event_type: 'stage_change', stage_to: 'applied', created_at: '2026-02-02T10:00:00Z' },
        { event_id: 'pe_3', event_type: 'stage_change', stage_to: 'in_review', created_at: '2026-02-03T10:00:00Z' }
      ]
    });

    const timeline = await getStageProgression('drv_016');
    expect(timeline.length).toBe(3);
    expect(timeline[0].stage_to).toBe('interested');
    expect(timeline[2].stage_to).toBe('in_review');
  });

  it('returns empty array for unknown candidate', async () => {
    mockQueryRecords.mockResolvedValue({ success: true, items: [] });

    const timeline = await getStageProgression('nonexistent');
    expect(timeline).toEqual([]);
  });
});

// ============================================================================
// getPipelineHealth()
// ============================================================================

describe('getPipelineHealth()', () => {
  it('returns health metrics for recruiter', async () => {
    mockQueryRecords.mockResolvedValue({
      success: true,
      items: [
        {
          event_id: 'pe_h1',
          event_type: 'stage_change',
          recruiter_id: 'rec_001',
          stage_from: 'interested',
          stage_to: 'contacted',
          processed: 'Yes',
          created_at: new Date(Date.now() - 60000).toISOString(),
          processed_at: new Date(Date.now() - 30000).toISOString()
        },
        {
          event_id: 'pe_h2',
          event_type: 'stage_change',
          recruiter_id: 'rec_001',
          stage_from: 'contacted',
          stage_to: 'applied',
          processed: 'Yes',
          created_at: new Date(Date.now() - 120000).toISOString(),
          processed_at: new Date(Date.now() - 100000).toISOString()
        }
      ]
    });

    const health = await getPipelineHealth('rec_001', 7);
    expect(health.total_events).toBe(2);
    expect(health.sla_compliance_pct).toBeGreaterThanOrEqual(0);
    expect(health.period_days).toBe(7);
  });

  it('returns 100% SLA when no events exist', async () => {
    mockQueryRecords.mockResolvedValue({ success: true, items: [] });

    const health = await getPipelineHealth('rec_empty', 7);
    expect(health.sla_compliance_pct).toBe(100);
    expect(health.total_events).toBe(0);
  });
});

// ============================================================================
// Unknown event types
// ============================================================================

describe('decide() — unknown event types', () => {
  it('returns empty actions for unknown event_type', async () => {
    const result = await decide({
      event_type: 'some_future_event',
      candidate_id: 'drv_099',
      carrier_dot: '1234567'
    });

    expect(result.actions).toEqual([]);
    expect(result.reasoning).toContain('No automation');
  });
});
