/**
 * Compendium Service Tests
 * Tests CRUD operations, run deltas, sharding checks, weekly summaries, and curator logic
 */

jest.mock('backend/dataAccess', () => ({
  queryRecords: jest.fn(),
  insertRecord: jest.fn(),
  updateRecord: jest.fn()
}));

const dataAccess = require('backend/dataAccess');
const {
  getCompendiumIndex,
  getCompendiumEntry,
  createCompendiumEntry,
  updateCompendiumEntry,
  getRecentRunDeltas,
  checkShardingNeeded,
  generateWeeklySummary,
  runCurator
} = require('backend/compendiumService');

describe('CompendiumService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getCompendiumIndex ────────────────────────────────────────────────

  describe('getCompendiumIndex', () => {
    it('returns structured index with entries array for a department', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [
          { topic: 'outreach-cadence', file_path: 'Compendium/recruiter/outreach.md', type: 'playbook', confidence: 85, last_updated: '2026-02-10', content_summary: 'Outreach cadence best practices' },
          { topic: 'follow-up-timing', file_path: 'Compendium/recruiter/followup.md', type: 'pattern', confidence: 70, last_updated: '2026-02-11', content_summary: 'Follow-up timing patterns' }
        ]
      });

      const result = await getCompendiumIndex('recruiter');

      expect(result.department).toBe('recruiter');
      expect(result.entries).toHaveLength(2);
      expect(result.entries[0]).toMatchObject({
        topic: 'outreach-cadence',
        file_path: 'Compendium/recruiter/outreach.md',
        summary: 'Outreach cadence best practices'
      });
      expect(dataAccess.queryRecords).toHaveBeenCalledWith('compendiumEntries', {
        filters: { department: 'recruiter' },
        limit: 200,
        suppressAuth: true
      });
    });

    it('returns all entries when no department specified', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await getCompendiumIndex(undefined);

      expect(result.department).toBe('all');
      expect(result.entries).toEqual([]);
      expect(dataAccess.queryRecords).toHaveBeenCalledWith('compendiumEntries', {
        filters: {},
        limit: 200,
        suppressAuth: true
      });
    });
  });

  // ── getCompendiumEntry ────────────────────────────────────────────────

  describe('getCompendiumEntry', () => {
    it('returns full entry for department + topic', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{
          _id: 'rec123',
          department: 'recruiter',
          topic: 'outreach-cadence',
          file_path: 'Compendium/recruiter/outreach.md',
          type: 'playbook',
          confidence: 85,
          content_summary: 'Best practices for outreach',
          evidence: 'Evidence line 1',
          related_topics: 'follow-up,timing',
          last_updated: '2026-02-10',
          created_at: '2026-01-15'
        }]
      });

      const result = await getCompendiumEntry('recruiter', 'outreach-cadence');

      expect(result).toMatchObject({
        entry_id: 'rec123',
        department: 'recruiter',
        topic: 'outreach-cadence',
        content_summary: 'Best practices for outreach'
      });
    });

    it('returns null when department is missing', async () => {
      const result = await getCompendiumEntry(null, 'topic');
      expect(result).toBeNull();
      expect(dataAccess.queryRecords).not.toHaveBeenCalled();
    });

    it('returns null when topic is missing', async () => {
      const result = await getCompendiumEntry('recruiter', '');
      expect(result).toBeNull();
    });

    it('returns null when entry not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await getCompendiumEntry('recruiter', 'nonexistent');
      expect(result).toBeNull();
    });
  });

  // ── createCompendiumEntry ─────────────────────────────────────────────

  describe('createCompendiumEntry', () => {
    it('inserts record with all fields and returns created result', async () => {
      dataAccess.insertRecord.mockResolvedValue({});

      const result = await createCompendiumEntry('recruiter', {
        topic: 'outreach-cadence',
        file_path: 'Compendium/recruiter/outreach.md',
        type: 'playbook',
        content_summary: 'Outreach best practices',
        confidence: 85,
        evidence: 'Based on 50 runs',
        related_topics: 'follow-up,timing'
      });

      expect(result.created).toBe(true);
      expect(result.entry_id).toMatch(/^comp_/);
      expect(dataAccess.insertRecord).toHaveBeenCalledWith(
        'compendiumEntries',
        expect.objectContaining({
          department: 'recruiter',
          topic: 'outreach-cadence',
          file_path: 'Compendium/recruiter/outreach.md',
          type: 'playbook',
          confidence: 85
        }),
        { suppressAuth: true }
      );
    });

    it('returns error when department is missing', async () => {
      const result = await createCompendiumEntry(null, { topic: 'test' });
      expect(result.created).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns error when topic is missing', async () => {
      const result = await createCompendiumEntry('recruiter', {});
      expect(result.created).toBe(false);
    });

    it('uses default values for optional fields', async () => {
      dataAccess.insertRecord.mockResolvedValue({});

      await createCompendiumEntry('driver', { topic: 'test-topic' });

      expect(dataAccess.insertRecord).toHaveBeenCalledWith(
        'compendiumEntries',
        expect.objectContaining({
          type: 'pattern',
          confidence: 50,
          file_path: '',
          evidence: '',
          related_topics: ''
        }),
        { suppressAuth: true }
      );
    });
  });

  // ── updateCompendiumEntry ─────────────────────────────────────────────

  describe('updateCompendiumEntry', () => {
    it('updates confidence, evidence, and last_updated', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [{ _id: 'rec456', department: 'recruiter', topic: 'outreach-cadence' }]
      });
      dataAccess.updateRecord.mockResolvedValue({});

      const result = await updateCompendiumEntry('recruiter', 'outreach-cadence', {
        confidence: 90,
        evidence: 'New evidence from latest runs'
      });

      expect(result.updated).toBe(true);
      expect(result.entry_id).toBe('rec456');
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'compendiumEntries',
        'rec456',
        expect.objectContaining({
          confidence: 90,
          evidence: 'New evidence from latest runs',
          last_updated: expect.any(String)
        }),
        { suppressAuth: true }
      );
    });

    it('returns error when entry not found', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await updateCompendiumEntry('recruiter', 'nonexistent', { confidence: 50 });

      expect(result.updated).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns error when department or topic missing', async () => {
      const result = await updateCompendiumEntry('', 'topic', {});
      expect(result.updated).toBe(false);
    });
  });

  // ── getRecentRunDeltas ────────────────────────────────────────────────

  describe('getRecentRunDeltas', () => {
    it('returns tool effectiveness and patterns for role with runs', async () => {
      const now = Date.now();
      const recent = new Date(now - 1000 * 3600).toISOString(); // 1 hour ago

      dataAccess.queryRecords
        // runs query
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', role: 'recruiter', started_at: recent },
            { run_id: 'run-2', role: 'recruiter', started_at: recent }
          ]
        })
        // steps query
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', tool_name: 'search_drivers', status: 'ok', latency_ms: 200 },
            { run_id: 'run-1', tool_name: 'get_pipeline', status: 'ok', latency_ms: 150 },
            { run_id: 'run-2', tool_name: 'search_drivers', status: 'error', result_summary: 'error', latency_ms: 500 }
          ]
        })
        // outcomes query
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', quality_score: 80 },
            { run_id: 'run-2', quality_score: 40 }
          ]
        });

      const result = await getRecentRunDeltas('recruiter', 7);

      expect(result.role).toBe('recruiter');
      expect(result.period_days).toBe(7);
      expect(result.total_runs).toBe(2);
      expect(result.tool_effectiveness).toEqual(expect.arrayContaining([
        expect.objectContaining({ tool: 'search_drivers', success_count: 1, fail_count: 1 })
      ]));
      expect(result.regressions).toEqual(expect.arrayContaining([
        expect.objectContaining({ tool: 'search_drivers' })
      ]));
    });

    it('returns empty arrays when no runs exist', async () => {
      dataAccess.queryRecords.mockResolvedValueOnce({ items: [] });

      const result = await getRecentRunDeltas('recruiter', 7);

      expect(result.total_runs).toBe(0);
      expect(result.tool_effectiveness).toEqual([]);
      expect(result.top_patterns).toEqual([]);
      expect(result.regressions).toEqual([]);
    });

    it('identifies top patterns from high-quality runs', async () => {
      const now = Date.now();
      const recent = new Date(now - 1000 * 3600).toISOString();

      dataAccess.queryRecords
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', role: 'recruiter', started_at: recent },
            { run_id: 'run-2', role: 'recruiter', started_at: recent }
          ]
        })
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', tool_name: 'search_drivers', status: 'ok', latency_ms: 100 },
            { run_id: 'run-1', tool_name: 'get_pipeline', status: 'ok', latency_ms: 100 },
            { run_id: 'run-2', tool_name: 'search_drivers', status: 'ok', latency_ms: 100 },
            { run_id: 'run-2', tool_name: 'get_pipeline', status: 'ok', latency_ms: 100 }
          ]
        })
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', quality_score: 90 },
            { run_id: 'run-2', quality_score: 85 }
          ]
        });

      const result = await getRecentRunDeltas('recruiter', 7);

      expect(result.top_patterns.length).toBeGreaterThan(0);
      expect(result.top_patterns[0]).toMatchObject({
        tools: expect.stringContaining('get_pipeline'),
        occurrences: 2
      });
    });
  });

  // ── checkShardingNeeded ───────────────────────────────────────────────

  describe('checkShardingNeeded', () => {
    it('returns true when content exceeds 5000 character threshold', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [
          { topic: 'big-entry', file_path: 'Compendium/recruiter/big.md', content_summary: 'x'.repeat(6000) },
          { topic: 'small-entry', file_path: 'Compendium/recruiter/small.md', content_summary: 'short' }
        ]
      });

      const result = await checkShardingNeeded('recruiter');

      expect(result.needs_sharding).toBe(true);
      expect(result.files_over_threshold).toHaveLength(1);
      expect(result.files_over_threshold[0]).toMatchObject({
        topic: 'big-entry',
        length: 6000
      });
    });

    it('returns false when all entries are under threshold', async () => {
      dataAccess.queryRecords.mockResolvedValue({
        items: [
          { topic: 'small-1', file_path: 'a.md', content_summary: 'short text' },
          { topic: 'small-2', file_path: 'b.md', content_summary: 'also short' }
        ]
      });

      const result = await checkShardingNeeded('driver');

      expect(result.needs_sharding).toBe(false);
      expect(result.files_over_threshold).toHaveLength(0);
    });
  });

  // ── generateWeeklySummary ─────────────────────────────────────────────

  describe('generateWeeklySummary', () => {
    it('returns aggregated stats with new entries, updates, and regressions', async () => {
      const now = Date.now();
      const twoDaysAgo = new Date(now - 2 * 86400000).toISOString();
      const tenDaysAgo = new Date(now - 10 * 86400000).toISOString();
      const threeDaysAgo = new Date(now - 3 * 86400000).toISOString();

      dataAccess.queryRecords.mockResolvedValue({
        items: [
          { topic: 'new-entry', confidence: 80, created_at: twoDaysAgo, last_updated: twoDaysAgo },
          { topic: 'updated-entry', confidence: 70, created_at: tenDaysAgo, last_updated: threeDaysAgo },
          { topic: 'old-stable', confidence: 90, created_at: tenDaysAgo, last_updated: tenDaysAgo },
          { topic: 'regression', confidence: 30, created_at: tenDaysAgo, last_updated: tenDaysAgo }
        ]
      });

      const result = await generateWeeklySummary('recruiter');

      expect(result.department).toBe('recruiter');
      expect(result.period).toBe('7d');
      expect(result.total_entries).toBe(4);
      expect(result.new_entries).toBe(1);
      expect(result.updates).toBe(1);
      expect(result.avg_confidence).toBe(68); // (80+70+90+30)/4 = 67.5 -> 68
      expect(result.regressions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ topic: 'regression', confidence: 30 })
        ])
      );
    });

    it('returns zeros when no entries exist', async () => {
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await generateWeeklySummary('admin');

      expect(result.total_entries).toBe(0);
      expect(result.new_entries).toBe(0);
      expect(result.updates).toBe(0);
      expect(result.avg_confidence).toBe(0);
      expect(result.regressions).toEqual([]);
    });
  });

  // ── runCurator ────────────────────────────────────────────────────────

  describe('runCurator', () => {
    it('creates new patterns from tool effectiveness data', async () => {
      const now = Date.now();
      const recent = new Date(now - 1000 * 3600).toISOString();

      // getRecentRunDeltas calls: runs, steps, outcomes
      dataAccess.queryRecords
        // runs for recruiter
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', role: 'recruiter', started_at: recent },
            { run_id: 'run-2', role: 'recruiter', started_at: recent }
          ]
        })
        // steps
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', tool_name: 'search_drivers', status: 'ok', latency_ms: 200 },
            { run_id: 'run-2', tool_name: 'search_drivers', status: 'ok', latency_ms: 300 }
          ]
        })
        // outcomes
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', quality_score: 80 },
            { run_id: 'run-2', quality_score: 90 }
          ]
        })
        // getCompendiumEntry for tool:search_drivers (not found -> create new)
        .mockResolvedValueOnce({ items: [] })
        // getCompendiumEntry for pattern combo (not found)
        .mockResolvedValueOnce({ items: [] });

      dataAccess.insertRecord.mockResolvedValue({});

      const result = await runCurator('recruiter', 7);

      expect(result.departments_curated).toBe(1);
      expect(result.new_patterns).toBeGreaterThanOrEqual(1);
      expect(dataAccess.insertRecord).toHaveBeenCalledWith(
        'compendiumEntries',
        expect.objectContaining({
          department: 'recruiter',
          topic: 'tool:search_drivers'
        }),
        { suppressAuth: true }
      );
    });

    it('updates existing patterns when entry already exists', async () => {
      const now = Date.now();
      const recent = new Date(now - 1000 * 3600).toISOString();

      dataAccess.queryRecords
        // runs
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', role: 'driver', started_at: recent },
            { run_id: 'run-2', role: 'driver', started_at: recent }
          ]
        })
        // steps
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', tool_name: 'find_matches', status: 'ok', latency_ms: 100 },
            { run_id: 'run-2', tool_name: 'find_matches', status: 'ok', latency_ms: 150 }
          ]
        })
        // outcomes
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', quality_score: 85 },
            { run_id: 'run-2', quality_score: 75 }
          ]
        })
        // getCompendiumEntry for tool:find_matches (exists)
        .mockResolvedValueOnce({
          items: [{
            _id: 'existing-rec',
            department: 'driver',
            topic: 'tool:find_matches',
            evidence: 'Old evidence',
            confidence: 70
          }]
        })
        // updateCompendiumEntry query (find existing)
        .mockResolvedValueOnce({
          items: [{
            _id: 'existing-rec',
            department: 'driver',
            topic: 'tool:find_matches'
          }]
        })
        // getCompendiumEntry for pattern combo (not found)
        .mockResolvedValueOnce({ items: [] });

      dataAccess.updateRecord.mockResolvedValue({});
      dataAccess.insertRecord.mockResolvedValue({});

      const result = await runCurator('driver', 7);

      expect(result.updated_patterns).toBeGreaterThanOrEqual(1);
      expect(dataAccess.updateRecord).toHaveBeenCalledWith(
        'compendiumEntries',
        'existing-rec',
        expect.objectContaining({
          confidence: expect.any(Number),
          evidence: expect.stringContaining('Old evidence')
        }),
        { suppressAuth: true }
      );
    });

    it('curates all departments when "all" is passed', async () => {
      // Return no runs for each department so the loop exits early
      dataAccess.queryRecords.mockResolvedValue({ items: [] });

      const result = await runCurator('all', 7);

      expect(result.departments_curated).toBe(5);
      expect(result.new_patterns).toBe(0);
      expect(result.updated_patterns).toBe(0);
      expect(result.regressions).toBe(0);
    });

    it('records regressions from tools with errors in low-quality runs', async () => {
      const now = Date.now();
      const recent = new Date(now - 1000 * 3600).toISOString();

      dataAccess.queryRecords
        // runs
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', role: 'admin', started_at: recent },
            { run_id: 'run-2', role: 'admin', started_at: recent }
          ]
        })
        // steps
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', tool_name: 'get_system_health', status: 'error', result_summary: 'error', latency_ms: 5000 },
            { run_id: 'run-2', tool_name: 'get_system_health', status: 'error', result_summary: 'error', latency_ms: 4000 }
          ]
        })
        // outcomes
        .mockResolvedValueOnce({
          items: [
            { run_id: 'run-1', quality_score: 30 },
            { run_id: 'run-2', quality_score: 25 }
          ]
        })
        // getCompendiumEntry for tool:get_system_health (not found)
        .mockResolvedValueOnce({ items: [] })
        // getCompendiumEntry for regression:get_system_health (not found)
        .mockResolvedValueOnce({ items: [] });

      dataAccess.insertRecord.mockResolvedValue({});

      const result = await runCurator('admin', 7);

      expect(result.regressions).toBeGreaterThanOrEqual(1);
      expect(dataAccess.insertRecord).toHaveBeenCalledWith(
        'compendiumEntries',
        expect.objectContaining({
          topic: expect.stringContaining('regression:'),
          type: 'regression',
          confidence: 30
        }),
        { suppressAuth: true }
      );
    });
  });
});
