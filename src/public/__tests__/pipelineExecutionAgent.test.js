/* eslint-disable */
/**
 * PIPELINE EXECUTION AGENT - Test Suite
 *
 * Tests decision logic, SLA enforcement, and channel escalation.
 * Replicates core decision logic from src/backend/pipelineExecutionAgent.jsw
 * for direct testing (Wix .jsw modules can't be imported in Node).
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const AGENT_FILE = path.resolve(
  __dirname, '..', '..', 'backend', 'pipelineExecutionAgent.jsw'
);
const sourceCode = fs.readFileSync(AGENT_FILE, 'utf8');

// =============================================================================
// REPLICATED CORE LOGIC (mirrors pipelineExecutionAgent.jsw for testability)
// =============================================================================

const CONTACT_SLA_MS = 5 * 60 * 1000;
const ESCALATION_CHAIN = ['sms', 'email', 'voice', 'recruiter_queue'];

// Mock TCPA state (toggle per test)
let _tcpaCompliant = true;
function isTCPACompliant() { return _tcpaCompliant; }
function getDelayUntilWindow() { return 480; } // 8h default when outside window

function handleStageChange(event) {
  const { stage_to, candidate_id, carrier_dot } = event;
  const tcpaOk = isTCPACompliant();

  switch (stage_to) {
    case 'interested':
      return {
        actions: [
          ...(tcpaOk ? [{
            type: 'send_sms', to: candidate_id,
            message: 'Thanks for your interest! A recruiter will be in touch shortly. Reply STOP to opt out.',
            priority: 'high'
          }] : []),
          { type: 'schedule_voice_call', candidate_id, carrier_dot, template_id: 'vat_warm_lead',
            delay_minutes: tcpaOk ? 30 : getDelayUntilWindow(), priority: 'high' }
        ],
        reasoning: 'New interest → immediate SMS confirmation + schedule voice follow-up in 30 min'
      };
    case 'applied':
      return {
        actions: [
          ...(tcpaOk ? [{
            type: 'send_sms', to: candidate_id,
            message: 'Application received! We\'ll review your qualifications and reach out soon.',
            priority: 'high'
          }] : []),
          { type: 'schedule_voice_call', candidate_id, carrier_dot, template_id: 'vat_qualification',
            delay_minutes: tcpaOk ? 60 : getDelayUntilWindow(), priority: 'medium' }
        ],
        reasoning: 'Application submitted → confirmation SMS + schedule qualification screen'
      };
    case 'contacted':
      return {
        actions: [{ type: 'schedule_voice_call', candidate_id, carrier_dot, template_id: 'vat_warm_lead',
          delay_minutes: 24 * 60, priority: 'low', condition: 'no_response_after_24h' }],
        reasoning: 'Contacted → schedule voice escalation if no response in 24h'
      };
    case 'in_review':
      return {
        actions: [
          { type: 'schedule_voice_call', candidate_id, carrier_dot, template_id: 'vat_background',
            delay_minutes: tcpaOk ? 15 : getDelayUntilWindow(), priority: 'medium' },
          { type: 'schedule_voice_call', candidate_id, carrier_dot, template_id: 'vat_technical',
            delay_minutes: tcpaOk ? 120 : getDelayUntilWindow() + 120, priority: 'medium' }
        ],
        reasoning: 'In review → schedule background + technical screening calls'
      };
    case 'offer':
      return {
        actions: [
          { type: 'send_email', to: candidate_id, template: 'offer_letter', data: { carrier_dot }, priority: 'high' },
          { type: 'schedule_voice_call', candidate_id, carrier_dot, template_id: 'vat_orientation',
            delay_minutes: tcpaOk ? 60 : getDelayUntilWindow(), priority: 'high' }
        ],
        reasoning: 'Offer extended → send offer email + schedule orientation call'
      };
    case 'hired':
      return {
        actions: [
          { type: 'send_email', to: candidate_id, template: 'welcome_onboarding', data: { carrier_dot }, priority: 'high' },
          { type: 'schedule_voice_call', candidate_id, carrier_dot, template_id: 'vat_first_day',
            delay_minutes: 24 * 60, priority: 'medium' }
        ],
        reasoning: 'Hired → trigger onboarding sequence + schedule first-day call'
      };
    default:
      return { actions: [], reasoning: `No automation for stage transition to: ${stage_to}` };
  }
}

function handleNoResponse(event) {
  const { candidate_id, carrier_dot } = event;
  const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : (event.metadata || {});
  const attemptCount = meta.attempt_count || 0;
  const tcpaOk = isTCPACompliant();

  const nextChannel = ESCALATION_CHAIN[Math.min(attemptCount, ESCALATION_CHAIN.length - 1)];

  if (nextChannel === 'recruiter_queue') {
    return {
      actions: [{ type: 'queue_recruiter', candidate_id, carrier_dot,
        reason: 'All automated outreach exhausted — manual follow-up needed' }],
      reasoning: `No response after ${attemptCount} attempts across all channels → escalating to recruiter queue`
    };
  }

  const actions = [];
  if (nextChannel === 'sms' && tcpaOk) {
    actions.push({ type: 'send_sms', to: candidate_id,
      message: 'Hi, we tried reaching you about a driving opportunity. Reply YES if you\'re still interested!',
      priority: 'medium' });
  } else if (nextChannel === 'email') {
    actions.push({ type: 'send_email', to: candidate_id, template: 'follow_up_no_response',
      data: { carrier_dot, attempt: attemptCount }, priority: 'medium' });
  } else if (nextChannel === 'voice' && tcpaOk) {
    actions.push({ type: 'schedule_voice_call', candidate_id, carrier_dot,
      template_id: 'vat_warm_lead', delay_minutes: 0, priority: 'high' });
  }

  return { actions, reasoning: `No response attempt #${attemptCount + 1} → escalating to ${nextChannel}` };
}

function handleCallCompleted(event) {
  const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : (event.metadata || {});
  const outcome = meta.outcome || meta.call_outcome || '';
  const { candidate_id, carrier_dot } = event;

  switch (outcome) {
    case 'interested':
    case 'qualified':
      return { actions: [{ type: 'advance_stage', interest_id: candidate_id, new_stage: 'in_review',
        notes: `Voice screen completed — outcome: ${outcome}` }],
        reasoning: `Call outcome: ${outcome} → advancing to in_review` };
    case 'not_qualified':
    case 'wrong_fit':
      return { actions: [{ type: 'advance_stage', interest_id: candidate_id, new_stage: 'rejected',
        notes: `Voice screen completed — outcome: ${outcome}` }],
        reasoning: `Call outcome: ${outcome} → marking as rejected` };
    case 'callback':
    case 'voicemail':
      return { actions: [{ type: 'schedule_voice_call', candidate_id, carrier_dot,
        template_id: 'vat_warm_lead', delay_minutes: outcome === 'callback' ? 120 : 24 * 60,
        priority: 'medium' }],
        reasoning: `Call outcome: ${outcome} → scheduling follow-up call` };
    default:
      return { actions: [], reasoning: `Call completed with unhandled outcome: ${outcome}` };
  }
}

function handleDocumentReceived(event) {
  const meta = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : (event.metadata || {});
  const allDocsComplete = meta.all_documents_received || false;
  const { candidate_id } = event;

  if (allDocsComplete) {
    return { actions: [{ type: 'advance_stage', interest_id: candidate_id, new_stage: 'offer',
      notes: 'All required documents received — advancing to offer stage' }],
      reasoning: 'All documents received → auto-advance to offer' };
  }
  return { actions: [{ type: 'send_sms', to: candidate_id,
    message: 'Document received! You still have outstanding items. Check your portal for details.',
    priority: 'low' }], reasoning: 'Partial documents received → acknowledgment SMS' };
}

function handleApplicationSubmitted(event) {
  const { candidate_id, carrier_dot } = event;
  const tcpaOk = isTCPACompliant();
  return {
    actions: [
      ...(tcpaOk ? [{ type: 'send_sms', to: candidate_id,
        message: 'Your application has been submitted! A recruiter will review it shortly.',
        priority: 'high' }] : []),
      { type: 'schedule_voice_call', candidate_id, carrier_dot, template_id: 'vat_qualification',
        delay_minutes: tcpaOk ? 30 : getDelayUntilWindow(), priority: 'high' }
    ],
    reasoning: 'Application submitted → auto-qualify + route to screening'
  };
}

function decide(event) {
  const { event_type } = event;
  switch (event_type) {
    case 'stage_change':
    case 'status_change':
      return handleStageChange(event);
    case 'no_response':
      return handleNoResponse(event);
    case 'call_completed':
      return handleCallCompleted(event);
    case 'document_received':
      return handleDocumentReceived(event);
    case 'application_submitted':
      return handleApplicationSubmitted(event);
    default:
      return { actions: [], reasoning: `No automation rules for event_type: ${event_type}` };
  }
}

// =============================================================================
// TESTS
// =============================================================================

beforeEach(() => {
  _tcpaCompliant = true;
});

// ── Source file exists ──
describe('Source file', () => {
  test('pipelineExecutionAgent.jsw exists and has expected exports', () => {
    expect(fs.existsSync(AGENT_FILE)).toBe(true);
    expect(sourceCode).toContain('export async function decide(');
    expect(sourceCode).toContain('export async function enforceContactSLA(');
    expect(sourceCode).toContain('export async function getStageProgression(');
    expect(sourceCode).toContain('export async function getPipelineHealth(');
  });

  test('source imports tcpaGuard', () => {
    expect(sourceCode).toContain("from 'backend/utils/tcpaGuard'");
  });

  test('source imports dataAccess', () => {
    expect(sourceCode).toContain("from 'backend/dataAccess'");
  });

  test('CONTACT_SLA_MS is 5 minutes', () => {
    expect(sourceCode).toContain('const CONTACT_SLA_MS = 5 * 60 * 1000');
  });
});

// ── Stage Change: interested ──
describe('decide() — stage_change → interested', () => {
  test('returns SMS + voice actions during TCPA hours', () => {
    const result = decide({
      event_type: 'stage_change', stage_to: 'interested',
      candidate_id: 'drv_001', carrier_dot: '1234567'
    });

    expect(result.actions.length).toBe(2);
    expect(result.actions[0].type).toBe('send_sms');
    expect(result.actions[0].priority).toBe('high');
    expect(result.actions[1].type).toBe('schedule_voice_call');
    expect(result.actions[1].template_id).toBe('vat_warm_lead');
    expect(result.actions[1].delay_minutes).toBe(30);
  });

  test('skips SMS outside TCPA hours, delays voice call', () => {
    _tcpaCompliant = false;
    const result = decide({
      event_type: 'stage_change', stage_to: 'interested',
      candidate_id: 'drv_002', carrier_dot: '1234567'
    });

    expect(result.actions.length).toBe(1);
    expect(result.actions[0].type).toBe('schedule_voice_call');
    expect(result.actions[0].delay_minutes).toBeGreaterThan(30);
  });
});

// ── Stage Change: applied ──
describe('decide() — stage_change → applied', () => {
  test('returns SMS + qualification screen', () => {
    const result = decide({
      event_type: 'stage_change', stage_to: 'applied',
      candidate_id: 'drv_003', carrier_dot: '1234567'
    });

    expect(result.actions.length).toBe(2);
    const voice = result.actions.find(a => a.type === 'schedule_voice_call');
    expect(voice.template_id).toBe('vat_qualification');
  });
});

// ── Stage Change: contacted ──
describe('decide() — stage_change → contacted', () => {
  test('schedules 24h voice escalation', () => {
    const result = decide({
      event_type: 'stage_change', stage_to: 'contacted',
      candidate_id: 'drv_004', carrier_dot: '1234567'
    });

    expect(result.actions.length).toBe(1);
    expect(result.actions[0].delay_minutes).toBe(1440); // 24h
  });
});

// ── Stage Change: in_review ──
describe('decide() — stage_change → in_review', () => {
  test('schedules background + technical screening', () => {
    const result = decide({
      event_type: 'stage_change', stage_to: 'in_review',
      candidate_id: 'drv_005', carrier_dot: '1234567'
    });

    expect(result.actions.length).toBe(2);
    const templates = result.actions.map(a => a.template_id);
    expect(templates).toContain('vat_background');
    expect(templates).toContain('vat_technical');
  });
});

// ── Stage Change: offer ──
describe('decide() — stage_change → offer', () => {
  test('sends offer email + orientation call', () => {
    const result = decide({
      event_type: 'stage_change', stage_to: 'offer',
      candidate_id: 'drv_006', carrier_dot: '1234567'
    });

    expect(result.actions.length).toBe(2);
    expect(result.actions[0].type).toBe('send_email');
    expect(result.actions[0].template).toBe('offer_letter');
    expect(result.actions[1].template_id).toBe('vat_orientation');
  });
});

// ── Stage Change: hired ──
describe('decide() — stage_change → hired', () => {
  test('triggers onboarding + first-day call', () => {
    const result = decide({
      event_type: 'stage_change', stage_to: 'hired',
      candidate_id: 'drv_007', carrier_dot: '1234567'
    });

    expect(result.actions.length).toBe(2);
    expect(result.actions[0].template).toBe('welcome_onboarding');
    expect(result.actions[1].template_id).toBe('vat_first_day');
  });
});

// ── Unknown stage ──
describe('decide() — stage_change → unknown', () => {
  test('returns empty actions', () => {
    const result = decide({
      event_type: 'stage_change', stage_to: 'some_weird_stage',
      candidate_id: 'drv_008', carrier_dot: '1234567'
    });

    expect(result.actions).toEqual([]);
    expect(result.reasoning).toContain('No automation');
  });
});

// ── No Response Escalation Chain ──
describe('decide() — no_response escalation', () => {
  test('attempt 0 → SMS', () => {
    const result = decide({
      event_type: 'no_response', candidate_id: 'drv_009', carrier_dot: '123',
      metadata: { attempt_count: 0 }
    });
    expect(result.actions[0].type).toBe('send_sms');
  });

  test('attempt 1 → email', () => {
    const result = decide({
      event_type: 'no_response', candidate_id: 'drv_009', carrier_dot: '123',
      metadata: { attempt_count: 1 }
    });
    expect(result.actions[0].type).toBe('send_email');
  });

  test('attempt 2 → voice', () => {
    const result = decide({
      event_type: 'no_response', candidate_id: 'drv_009', carrier_dot: '123',
      metadata: { attempt_count: 2 }
    });
    expect(result.actions[0].type).toBe('schedule_voice_call');
  });

  test('attempt 3+ → recruiter queue', () => {
    const result = decide({
      event_type: 'no_response', candidate_id: 'drv_009', carrier_dot: '123',
      metadata: { attempt_count: 3 }
    });
    expect(result.actions[0].type).toBe('queue_recruiter');
  });
});

// ── Call Completed ──
describe('decide() — call_completed outcomes', () => {
  test('interested → advance to in_review', () => {
    const result = decide({
      event_type: 'call_completed', candidate_id: 'drv_010', carrier_dot: '123',
      metadata: { outcome: 'interested' }
    });
    expect(result.actions[0].new_stage).toBe('in_review');
  });

  test('not_qualified → reject', () => {
    const result = decide({
      event_type: 'call_completed', candidate_id: 'drv_010', carrier_dot: '123',
      metadata: { outcome: 'not_qualified' }
    });
    expect(result.actions[0].new_stage).toBe('rejected');
  });

  test('callback → schedule 2h follow-up', () => {
    const result = decide({
      event_type: 'call_completed', candidate_id: 'drv_010', carrier_dot: '123',
      metadata: { outcome: 'callback' }
    });
    expect(result.actions[0].delay_minutes).toBe(120);
  });

  test('voicemail → schedule 24h follow-up', () => {
    const result = decide({
      event_type: 'call_completed', candidate_id: 'drv_010', carrier_dot: '123',
      metadata: { outcome: 'voicemail' }
    });
    expect(result.actions[0].delay_minutes).toBe(1440);
  });
});

// ── Document Received ──
describe('decide() — document_received', () => {
  test('all docs complete → advance to offer', () => {
    const result = decide({
      event_type: 'document_received', candidate_id: 'drv_011', carrier_dot: '123',
      metadata: { all_documents_received: true }
    });
    expect(result.actions[0].type).toBe('advance_stage');
    expect(result.actions[0].new_stage).toBe('offer');
  });

  test('partial docs → SMS acknowledgment', () => {
    const result = decide({
      event_type: 'document_received', candidate_id: 'drv_011', carrier_dot: '123',
      metadata: { all_documents_received: false }
    });
    expect(result.actions[0].type).toBe('send_sms');
  });
});

// ── Application Submitted ──
describe('decide() — application_submitted', () => {
  test('sends SMS + schedules qualification screen', () => {
    const result = decide({
      event_type: 'application_submitted', candidate_id: 'drv_012', carrier_dot: '123'
    });

    expect(result.actions.length).toBe(2);
    expect(result.actions[0].type).toBe('send_sms');
    expect(result.actions[1].template_id).toBe('vat_qualification');
    expect(result.actions[1].delay_minutes).toBe(30);
  });
});

// ── Unknown event type ──
describe('decide() — unknown event type', () => {
  test('returns empty actions', () => {
    const result = decide({ event_type: 'something_new', candidate_id: 'drv_099' });
    expect(result.actions).toEqual([]);
    expect(result.reasoning).toContain('No automation');
  });
});

// ── Supporting files exist ──
describe('Supporting files', () => {
  test('tcpaGuard.js exists', () => {
    const tcpaFile = path.resolve(__dirname, '..', '..', 'backend', 'utils', 'tcpaGuard.js');
    expect(fs.existsSync(tcpaFile)).toBe(true);
    const src = fs.readFileSync(tcpaFile, 'utf8');
    expect(src).toContain('isTCPACompliant');
    expect(src).toContain('getNextAllowedWindow');
  });

  test('pipelineEventBus.jsw exists', () => {
    const busFile = path.resolve(__dirname, '..', '..', 'backend', 'pipelineEventBus.jsw');
    expect(fs.existsSync(busFile)).toBe(true);
    const src = fs.readFileSync(busFile, 'utf8');
    expect(src).toContain('export async function emitEvent(');
    expect(src).toContain('export async function processEvent(');
    expect(src).toContain('export async function reprocessFailedEvents(');
  });

  test('voiceAgentTemplates.jsw exists with 13 templates', () => {
    const templateFile = path.resolve(__dirname, '..', '..', 'backend', 'voiceAgentTemplates.jsw');
    expect(fs.existsSync(templateFile)).toBe(true);
    const src = fs.readFileSync(templateFile, 'utf8');
    expect(src).toContain('export async function getTemplate(');
    expect(src).toContain('export async function seedDefaultTemplates(');
    // Verify all 13 template IDs are present
    const templateIds = [
      'vat_cold_outreach', 'vat_warm_lead', 'vat_referral',
      'vat_qualification', 'vat_background', 'vat_technical',
      'vat_application_helper', 'vat_document_collector',
      'vat_orientation', 'vat_first_day',
      'vat_satisfaction', 'vat_retention', 'vat_winback'
    ];
    for (const id of templateIds) {
      expect(src).toContain(id);
    }
  });

  test('pipelineJobs.jsw exists', () => {
    const jobsFile = path.resolve(__dirname, '..', '..', 'backend', 'pipelineJobs.jsw');
    expect(fs.existsSync(jobsFile)).toBe(true);
    const src = fs.readFileSync(jobsFile, 'utf8');
    expect(src).toContain('export async function enforceContactSLAs(');
    expect(src).toContain('export async function reprocessFailedPipelineEvents(');
  });
});

// ── Config integration ──
describe('configData.js integration', () => {
  const configFile = path.resolve(__dirname, '..', '..', 'backend', 'configData.js');
  const configSrc = fs.readFileSync(configFile, 'utf8');

  test('pipelineEvents in DATA_SOURCE', () => {
    expect(configSrc).toContain("pipelineEvents: 'airtable'");
  });

  test('voiceAgentTemplates in DATA_SOURCE', () => {
    expect(configSrc).toContain("voiceAgentTemplates: 'airtable'");
  });

  test('pipelineEvents in WIX_COLLECTION_NAMES', () => {
    expect(configSrc).toContain("pipelineEvents: 'PipelineEvents'");
  });

  test('voiceAgentTemplates in WIX_COLLECTION_NAMES', () => {
    expect(configSrc).toContain("voiceAgentTemplates: 'VoiceAgentTemplates'");
  });

  test('pipelineEvents in AIRTABLE_TABLE_NAMES', () => {
    expect(configSrc).toContain("pipelineEvents: 'v2_Pipeline Events'");
  });

  test('voiceAgentTemplates in AIRTABLE_TABLE_NAMES', () => {
    expect(configSrc).toContain("voiceAgentTemplates: 'v2_Voice Agent Templates'");
  });
});

// ── jobs.config integration ──
describe('jobs.config integration', () => {
  const jobsConfigFile = path.resolve(__dirname, '..', '..', 'backend', 'jobs.config');
  const jobsSrc = fs.readFileSync(jobsConfigFile, 'utf8');

  test('enforceContactSLAs cron entry exists', () => {
    expect(jobsSrc).toContain('enforceContactSLAs');
    expect(jobsSrc).toContain('pipelineJobs.jsw');
  });

  test('reprocessFailedPipelineEvents cron entry exists', () => {
    expect(jobsSrc).toContain('reprocessFailedPipelineEvents');
  });
});

// ── agentService.jsw integration ──
describe('agentService.jsw integration', () => {
  const agentFile = path.resolve(__dirname, '..', '..', 'backend', 'agentService.jsw');
  const agentSrc = fs.readFileSync(agentFile, 'utf8');

  test('has initiate_voice_screen tool', () => {
    expect(agentSrc).toContain('initiate_voice_screen');
    expect(agentSrc).toContain("serviceModule: 'backend/voiceAgentTemplates'");
  });

  test('has get_pipeline_health tool', () => {
    expect(agentSrc).toContain('get_pipeline_health');
    expect(agentSrc).toContain("serviceModule: 'backend/pipelineExecutionAgent'");
  });

  test('has emit_pipeline_event tool', () => {
    expect(agentSrc).toContain('emit_pipeline_event');
    expect(agentSrc).toContain("serviceModule: 'backend/pipelineEventBus'");
  });

  test('executeTool is exported', () => {
    expect(agentSrc).toContain('export async function executeTool(');
  });
});

// ── recruiter_service.jsw integration ──
describe('recruiter_service.jsw integration', () => {
  const recruiterFile = path.resolve(__dirname, '..', '..', 'backend', 'recruiter_service.jsw');
  const recruiterSrc = fs.readFileSync(recruiterFile, 'utf8');

  test('emitPipelineEventNonBlocking routes through event bus', () => {
    expect(recruiterSrc).toContain("import('backend/pipelineEventBus')");
    expect(recruiterSrc).toContain('eventBus.emitEvent(');
  });
});

// ── http-functions.js integration ──
describe('http-functions.js integration', () => {
  const httpFile = path.resolve(__dirname, '..', '..', 'backend', 'http-functions.js');
  const httpSrc = fs.readFileSync(httpFile, 'utf8');

  test('has template-scoped tool routing', () => {
    expect(httpSrc).toContain('template_id');
    expect(httpSrc).toContain("import('backend/voiceAgentTemplates')");
    expect(httpSrc).toContain("import('backend/agentService')");
  });
});
