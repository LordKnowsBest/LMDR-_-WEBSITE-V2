const { verifyPlannedResponse } = require('backend/agentVerifierService');

describe('agentVerifierService', () => {
  it('verifies a normal admin diagnostics response', async () => {
    const result = await verifyPlannedResponse('admin', { workflow_type: 'admin_diagnostics' }, {
      responseText: 'API health is stable and trace latency is within thresholds.',
      prefetchedSummary: '- external_api.get_api_health: ok'
    });

    expect(result.status).toBe('verified');
    expect(result.verifier_type).toBe('consistency_verifier');
  });

  it('degrades admin diagnostics response when diagnostic terms are missing', async () => {
    const result = await verifyPlannedResponse('admin', { workflow_type: 'admin_diagnostics' }, {
      responseText: 'Everything looks good.',
      prefetchedSummary: '- external_api.get_api_health: ok'
    });

    expect(result.status).toBe('degraded_but_acceptable');
    expect(result.issues).toContain('missing_diagnostic_terms');
  });

  it('blocks an empty response', async () => {
    const result = await verifyPlannedResponse('driver', { workflow_type: 'driver_general' }, {
      responseText: ''
    });

    expect(result.status).toBe('blocked');
    expect(result.issues).toContain('empty_response');
  });

  it('degrades when prefetched evidence is partially failed', async () => {
    const result = await verifyPlannedResponse('recruiter', {
      workflow_type: 'recruiter_candidate_assessment',
      nodes: [{ verifier_required: true }]
    }, {
      responseText: 'Candidate assessment is ready.',
      prefetchedResults: [
        { success: true, result: { ok: true } },
        { success: false, result: { error: 'timeout' } }
      ]
    });

    expect(result.status).toBe('degraded_but_acceptable');
    expect(result.issues).toContain('partial_prefetch_failure');
    expect(result.evidence_count).toBe(2);
  });
});
