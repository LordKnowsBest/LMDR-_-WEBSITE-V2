/**
 * backfill-typed-tables.js
 *
 * Reads from JSONB airtable_* tables and populates the typed
 * carriers, driver_applications, faqs, and id_mapping tables.
 *
 * Usage: node backfill-typed-tables.js
 */

const { Client } = require('pg');
const { v5: uuidv5 } = require('uuid');

// ── Config ──────────────────────────────────────────────────────────
const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // DNS namespace
const BATCH_SIZE = 500;

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 5432,
  database: 'lmdr',
  user: 'lmdr_user',
  password: 'cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o',
};

// ── Helpers ─────────────────────────────────────────────────────────

function deterministicUUID(collection, airtableId) {
  return uuidv5(`${collection}:${airtableId}`, NAMESPACE);
}

function parseNum(val, decimals) {
  if (val == null || val === '') return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  if (decimals != null) return Number(n.toFixed(decimals));
  return n;
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Truncate string to maxLen, or return null */
function trunc(val, maxLen) {
  if (val == null) return null;
  const s = String(val);
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function parseSafetyData(safetyRow) {
  if (!safetyRow) return {};
  const data = safetyRow.data || {};
  const result = {};

  if (data['BASIC Scores']) {
    try {
      const basics = typeof data['BASIC Scores'] === 'string'
        ? JSON.parse(data['BASIC Scores'])
        : data['BASIC Scores'];
      if (basics.basics) {
        const b = basics.basics;
        result.unsafe_driving_percentile = parseNum(b.unsafe_driving?.percentile, 2);
        result.hos_compliance_percentile = parseNum(b.hos_compliance?.percentile, 2);
        result.crash_indicator_percentile = parseNum(b.crash_indicator?.percentile, 2);
      }
    } catch (_) { /* ignore */ }
  }

  if (data['Inspections']) {
    try {
      const insp = typeof data['Inspections'] === 'string'
        ? JSON.parse(data['Inspections'])
        : data['Inspections'];
      result.out_of_service_rate = parseNum(insp.vehicle_oos_rate, 2);
    } catch (_) { /* ignore */ }
  }

  return result;
}

function parseEnrichmentData(enrichRow) {
  if (!enrichRow) return {};
  const data = enrichRow.data || {};
  return {
    ai_summary: data['AI Summary'] || null,
    driver_sentiment: data['Driver Sentiment'] || null,
    is_enriched: true,
    last_enriched_at: parseDate(data['Enriched Date']),
    freight_type_enriched: data['Freight Types'] || null,
    home_time_enriched: data['Home Time'] || null,
    pay_cpm_range: data['Pay CPM Range'] || null,
    sign_on_bonus_enriched: data['Sign On Bonus'] || null,
  };
}

// ── Generic batch INSERT with row-by-row fallback ───────────────────

const CARRIER_COLS = `_id, "_createdDate", "_updatedDate", _owner, airtable_id, dot_number, company_name,
          state, city, num_trucks, num_drivers, freight_type, home_time,
          pay_per_mile, pay_per_mile_max, sign_on_bonus, combined_score, safety_score,
          is_enriched, last_enriched_at, ai_summary, driver_sentiment,
          unsafe_driving_percentile, hos_compliance_percentile, crash_indicator_percentile,
          out_of_service_rate, subscription_tier, is_active`;

const APP_COLS = `_id, "_createdDate", "_updatedDate", _owner, airtable_id,
          driver_id, carrier_id, dot_number, status, match_score,
          applied_at, reviewed_at, notes, interview_status, interview_date`;

async function batchInsertWithFallback(client, tableName, columns, conflictCol, paramSets, allValues, colsPerRow) {
  const sql = `INSERT INTO ${tableName} (${columns}) VALUES ${paramSets.join(', ')} ON CONFLICT (${conflictCol}) DO NOTHING`;
  try {
    const res = await client.query(sql, allValues);
    return res.rowCount;
  } catch (batchErr) {
    // Row-by-row fallback
    let count = 0;
    for (let r = 0; r < paramSets.length; r++) {
      const rowVals = allValues.slice(r * colsPerRow, (r + 1) * colsPerRow);
      const ph = rowVals.map((_, i) => `$${i + 1}`).join(', ');
      try {
        const res = await client.query(
          `INSERT INTO ${tableName} (${columns}) VALUES (${ph}) ON CONFLICT (${conflictCol}) DO NOTHING`,
          rowVals
        );
        count += res.rowCount;
      } catch (rowErr) {
        console.log(`  SKIP ${tableName} row airtable=${rowVals[4]}: ${rowErr.message}`);
      }
    }
    return count;
  }
}

// ── Carriers backfill ───────────────────────────────────────────────

async function backfillCarriers(client) {
  console.log('\n── Backfilling carriers ──');

  // Load enrichments indexed by DOT
  const enrichRes = await client.query('SELECT data FROM airtable_carrier_enrichments');
  const enrichByDot = {};
  for (const row of enrichRes.rows) {
    const dot = String(row.data['Carrier DOT'] || '');
    if (dot) enrichByDot[dot] = row;
  }
  console.log(`  Enrichments loaded: ${Object.keys(enrichByDot).length}`);

  // Load safety data indexed by DOT
  const safetyRes = await client.query('SELECT data FROM airtable_carrier_safety_data');
  const safetyByDot = {};
  for (const row of safetyRes.rows) {
    const dot = String(row.data['DOT Number'] || '');
    if (dot) safetyByDot[dot] = row;
  }
  console.log(`  Safety records loaded: ${Object.keys(safetyByDot).length}`);

  const countRes = await client.query('SELECT count(*) FROM airtable_carriers');
  const totalRows = parseInt(countRes.rows[0].count);
  console.log(`  Source rows: ${totalRows}`);

  let offset = 0;
  let inserted = 0;
  let skipped = 0;
  let mappings = [];

  while (offset < totalRows) {
    const batch = await client.query(
      `SELECT airtable_id, _created_at, _updated_at, data FROM airtable_carriers ORDER BY _id LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset]
    );
    if (batch.rows.length === 0) break;

    const carrierValues = [];
    const paramSets = [];
    let paramIdx = 1;
    const COLS_PER_ROW = 28;

    for (const row of batch.rows) {
      const d = row.data;
      const dotStr = String(d.DOT_NUMBER || '');
      if (!dotStr || dotStr === 'undefined' || dotStr === 'null') { skipped++; continue; }

      const uuid = deterministicUUID('carriers', row.airtable_id);
      const enrich = parseEnrichmentData(enrichByDot[dotStr]);
      const safety = parseSafetyData(safetyByDot[dotStr]);

      let signOnBonus = null;
      if (enrich.sign_on_bonus_enriched) {
        const m = enrich.sign_on_bonus_enriched.match(/\$?([\d,]+)/);
        if (m) signOnBonus = parseNum(m[1].replace(/,/g, ''), 2);
      }

      let payMax = null;
      if (enrich.pay_cpm_range) {
        const rm = enrich.pay_cpm_range.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
        if (rm) payMax = parseNum(rm[2], 3);
      }

      const vals = [
        uuid,                                                      // _id (varchar 36)
        row._created_at || new Date().toISOString(),               // _createdDate
        row._updated_at || new Date().toISOString(),               // _updatedDate
        'system',                                                  // _owner
        row.airtable_id,                                           // airtable_id (varchar 64)
        trunc(dotStr, 20),                                         // dot_number (varchar 20)
        trunc(d.LEGAL_NAME || 'UNKNOWN', 255),                     // company_name (varchar 255)
        trunc(d.PHY_STATE, 2),                                     // state (varchar 2)
        trunc(d.PHY_CITY, 100),                                    // city (varchar 100)
        parseNum(d.NBR_POWER_UNIT) || 0,                           // num_trucks (int)
        parseNum(d.DRIVER_TOTAL) || 0,                             // num_drivers (int)
        trunc(enrich.freight_type_enriched || d.CARRIER_OPERATION, 100), // freight_type (varchar 100)
        trunc(enrich.home_time_enriched, 100),                     // home_time (varchar 100)
        parseNum(d.PAY_CPM, 3),                                    // pay_per_mile numeric(5,3) max=99.999
        payMax,                                                    // pay_per_mile_max numeric(5,3)
        signOnBonus,                                               // sign_on_bonus numeric(10,2)
        parseNum(d.COMBINED_SCORE, 2) || 0,                        // combined_score numeric(5,2) max=999.99
        parseNum(d.SAFETY_SCORE, 2) || 0,                          // safety_score numeric(5,2)
        enrich.is_enriched || false,                               // is_enriched
        enrich.last_enriched_at || null,                           // last_enriched_at
        enrich.ai_summary || null,                                 // ai_summary (text)
        enrich.driver_sentiment || null,                           // driver_sentiment (text)
        safety.unsafe_driving_percentile || null,                  // numeric(5,2)
        safety.hos_compliance_percentile || null,                  // numeric(5,2)
        safety.crash_indicator_percentile || null,                 // numeric(5,2)
        safety.out_of_service_rate || null,                        // numeric(6,2) — altered
        trunc('free', 20),                                         // subscription_tier (varchar 20)
        true,                                                      // is_active
      ];

      const placeholders = vals.map((_, i) => `$${paramIdx + i}`).join(', ');
      paramSets.push(`(${placeholders})`);
      carrierValues.push(...vals);
      paramIdx += vals.length;

      mappings.push({ airtable_id: row.airtable_id, gcp_uuid: uuid, collection: 'carriers' });
    }

    if (paramSets.length > 0) {
      inserted += await batchInsertWithFallback(
        client, 'carriers', CARRIER_COLS, 'dot_number',
        paramSets, carrierValues, COLS_PER_ROW
      );
    }

    offset += BATCH_SIZE;
    process.stdout.write(`  Processed ${Math.min(offset, totalRows)}/${totalRows}\r`);
  }

  console.log(`\n  Carriers inserted: ${inserted} (skipped ${skipped} invalid DOTs)`);
  await insertIdMappings(client, mappings);
  return inserted;
}

// ── Driver Applications backfill ────────────────────────────────────

async function backfillDriverApplications(client) {
  console.log('\n── Backfilling driver_applications ──');

  const countRes = await client.query('SELECT count(*) FROM airtable_driver_applications');
  const totalRows = parseInt(countRes.rows[0].count);
  console.log(`  Source rows: ${totalRows}`);

  let offset = 0;
  let inserted = 0;
  let mappings = [];

  while (offset < totalRows) {
    const batch = await client.query(
      `SELECT airtable_id, _created_at, _updated_at, data FROM airtable_driver_applications ORDER BY _id LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset]
    );
    if (batch.rows.length === 0) break;

    const values = [];
    const paramSets = [];
    let paramIdx = 1;
    const COLS_PER_ROW = 15;

    for (const row of batch.rows) {
      const d = row.data;
      const uuid = deterministicUUID('driver_applications', row.airtable_id);
      const dotNumber = d['Carrier DOT'] ? trunc(String(d['Carrier DOT']), 20) : null;

      const vals = [
        uuid,                                                       // _id (varchar 36)
        row._created_at || new Date().toISOString(),                // _createdDate
        row._updated_at || new Date().toISOString(),                // _updatedDate
        'system',                                                   // _owner
        row.airtable_id,                                            // airtable_id (varchar 64)
        null,                                                       // driver_id (FK — leave null)
        null,                                                       // carrier_id (FK — leave null)
        dotNumber,                                                  // dot_number (varchar 20)
        trunc(d['Status'] || d['Driver Category'] || 'pending', 50), // status (varchar 50)
        parseNum(d['Total_Score'] || d['Match Score'], 2),          // match_score
        parseDate(d['Submission Date']) || row._created_at,         // applied_at
        parseDate(d['Last Update Date']),                           // reviewed_at
        d['Notes'] || null,                                         // notes (text)
        trunc(d['Interview Status'], 20),                           // interview_status (varchar 20)
        parseDate(d['Interview Date']),                             // interview_date
      ];

      const placeholders = vals.map((_, i) => `$${paramIdx + i}`).join(', ');
      paramSets.push(`(${placeholders})`);
      values.push(...vals);
      paramIdx += vals.length;

      mappings.push({ airtable_id: row.airtable_id, gcp_uuid: uuid, collection: 'driver_applications' });
    }

    if (paramSets.length > 0) {
      inserted += await batchInsertWithFallback(
        client, 'driver_applications', APP_COLS, 'airtable_id',
        paramSets, values, COLS_PER_ROW
      );
    }

    offset += BATCH_SIZE;
    process.stdout.write(`  Processed ${Math.min(offset, totalRows)}/${totalRows}\r`);
  }

  console.log(`\n  Driver applications inserted: ${inserted}`);
  await insertIdMappings(client, mappings);
  return inserted;
}

// ── FAQs backfill ───────────────────────────────────────────────────

async function backfillFaqs(client) {
  console.log('\n── Backfilling faqs ──');

  const tableCheck = await client.query(
    `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='airtable_faqs')`
  );

  if (!tableCheck.rows[0].exists) {
    console.log('  No airtable_faqs source table found — skipping');
    return 0;
  }

  const countRes = await client.query('SELECT count(*) FROM airtable_faqs');
  const totalRows = parseInt(countRes.rows[0].count);
  console.log(`  Source rows: ${totalRows}`);

  if (totalRows === 0) {
    console.log('  No FAQ rows to migrate');
    return 0;
  }

  const batch = await client.query('SELECT airtable_id, _created_at, _updated_at, data FROM airtable_faqs ORDER BY _id');
  const values = [];
  const paramSets = [];
  const mappings = [];
  let paramIdx = 1;

  for (const row of batch.rows) {
    const d = row.data;
    const question = d['Question'] || d['question'];
    const answer = d['Answer'] || d['answer'];
    if (!question || !answer) continue;

    const uuid = deterministicUUID('faqs', row.airtable_id);
    const vals = [
      uuid,
      row._created_at || new Date().toISOString(),
      row._updated_at || new Date().toISOString(),
      'system',
      row.airtable_id,
      question,
      answer,
      d['Category'] || d['category'] || null,
      d['Is Published'] != null ? Boolean(d['Is Published']) : true,
      parseNum(d['Sort Order'] || d['sort_order']) || 0,
    ];

    const placeholders = vals.map((_, i) => `$${paramIdx + i}`).join(', ');
    paramSets.push(`(${placeholders})`);
    values.push(...vals);
    paramIdx += vals.length;
    mappings.push({ airtable_id: row.airtable_id, gcp_uuid: uuid, collection: 'faqs' });
  }

  let inserted = 0;
  if (paramSets.length > 0) {
    const sql = `
      INSERT INTO faqs (
        _id, "_createdDate", "_updatedDate", _owner, airtable_id,
        question, answer, category, is_published, sort_order
      ) VALUES ${paramSets.join(', ')}
      ON CONFLICT (airtable_id) DO NOTHING
    `;
    const res = await client.query(sql, values);
    inserted = res.rowCount;
  }

  console.log(`  FAQs inserted: ${inserted}`);
  await insertIdMappings(client, mappings);
  return inserted;
}

// ── id_mapping helper ───────────────────────────────────────────────

async function insertIdMappings(client, mappings) {
  if (mappings.length === 0) return;

  for (let i = 0; i < mappings.length; i += BATCH_SIZE) {
    const chunk = mappings.slice(i, i + BATCH_SIZE);
    const values = [];
    const paramSets = [];
    let paramIdx = 1;

    for (const m of chunk) {
      paramSets.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, NOW())`);
      values.push(m.airtable_id, m.gcp_uuid, m.collection);
      paramIdx += 3;
    }

    await client.query(
      `INSERT INTO id_mapping (airtable_id, gcp_uuid, collection_name, migrated_at)
       VALUES ${paramSets.join(', ')}
       ON CONFLICT (airtable_id, collection_name) DO NOTHING`,
      values
    );
  }

  console.log(`  id_mapping entries written: ${mappings.length}`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected to Cloud SQL');

  const t0 = Date.now();

  try {
    await backfillCarriers(client);
    await backfillDriverApplications(client);
    await backfillFaqs(client);

    // Final row counts
    console.log('\n══════════════════════════════════════');
    console.log('  BACKFILL COMPLETE');
    console.log('══════════════════════════════════════');

    for (const table of ['carriers', 'driver_applications', 'faqs', 'id_mapping']) {
      const res = await client.query(`SELECT count(*) FROM ${table}`);
      console.log(`  ${table}: ${res.rows[0].count} rows`);
    }

    console.log(`\n  Duration: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error('BACKFILL ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
