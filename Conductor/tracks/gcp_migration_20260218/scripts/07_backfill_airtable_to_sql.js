#!/usr/bin/env node
// =============================================================================
// LMDR GCP Migration — Script 07: Airtable → Cloud SQL Backfill
// Phase 4 & 5 | Run from local machine or Cloud Shell with Node.js
// =============================================================================
// HOW TO RUN:
//   1. Install deps: npm install airtable pg uuid
//   2. Set env vars or create a .env file (see CONFIGURATION below)
//   3. Run: node 07_backfill_airtable_to_sql.js --collection=carriers
//      Or run all: node 07_backfill_airtable_to_sql.js --all
//
// SAFETY: This script is READ from Airtable and INSERT/IGNORE to Postgres.
//         It NEVER modifies Airtable data.
// =============================================================================

const Airtable = require('airtable');
const { Pool } = require('pg');
const { v5: uuidv5, v4: uuidv4 } = require('uuid');

// ─────────────────────────────────────────────
// CONFIGURATION — Set these as environment variables or replace directly
// ─────────────────────────────────────────────
const CONFIG = {
    // Airtable
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY || 'YOUR_AIRTABLE_API_KEY',
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID || 'app9N1YCJ3gdhExA0',

    // Postgres (Cloud SQL)
    PG_HOST: process.env.PG_HOST || '127.0.0.1',  // Use Cloud SQL Auth Proxy for local
    PG_PORT: process.env.PG_PORT || 5432,
    PG_DATABASE: process.env.PG_DATABASE || 'lmdr',
    PG_USER: process.env.PG_USER || 'lmdr_user',
    PG_PASSWORD: process.env.PG_PASSWORD || 'YOUR_DB_PASSWORD',
};

// UUID namespace for deterministic ID generation (seeded from Airtable RecordID)
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // URL namespace

// ─────────────────────────────────────────────
// Initialize clients
// ─────────────────────────────────────────────
const base = new Airtable({ apiKey: CONFIG.AIRTABLE_API_KEY }).base(CONFIG.AIRTABLE_BASE_ID);
const pool = new Pool({
    host: CONFIG.PG_HOST,
    port: CONFIG.PG_PORT,
    database: CONFIG.PG_DATABASE,
    user: CONFIG.PG_USER,
    password: CONFIG.PG_PASSWORD,
    ssl: { rejectUnauthorized: false }  // Required for Cloud SQL
});

// ─────────────────────────────────────────────
// UTILITY: Generate deterministic UUID from Airtable ID
// This ensures the same Airtable record always maps to the same UUID
// for reproducible backfills.
// ─────────────────────────────────────────────
function getGcpUuid(airtableId, collectionName) {
    return uuidv5(`${collectionName}:${airtableId}`, UUID_NAMESPACE);
}

// ─────────────────────────────────────────────
// UTILITY: Save ID mapping to the id_mapping table
// ─────────────────────────────────────────────
async function saveIdMapping(client, airtableId, gcpUuid, collectionName) {
    await client.query(`
    INSERT INTO id_mapping (airtable_id, gcp_uuid, collection_name)
    VALUES ($1, $2, $3)
    ON CONFLICT (airtable_id, collection_name) DO NOTHING
  `, [airtableId, gcpUuid, collectionName]);
}

// ─────────────────────────────────────────────
// UTILITY: Fetch all records from Airtable with pagination
// ─────────────────────────────────────────────
async function fetchAllAirtableRecords(tableName, fields = []) {
    console.log(`\n→ Fetching Airtable records from: ${tableName} ...`);
    const records = [];

    await base(tableName).select({
        fields: fields.length > 0 ? fields : undefined,
        pageSize: 100,
    }).eachPage((pageRecords, fetchNextPage) => {
        records.push(...pageRecords);
        console.log(`   Fetched ${records.length} records so far...`);
        fetchNextPage();
    });

    console.log(`✓ Total records from Airtable: ${records.length}`);
    return records;
}

// ─────────────────────────────────────────────
// BACKFILL: Carriers
// Source: v2_Carriers → carriers table
// ─────────────────────────────────────────────
async function backfillCarriers() {
    const client = await pool.connect();
    try {
        const records = await fetchAllAirtableRecords('v2_Carriers');
        console.log(`\n→ Inserting ${records.length} carriers into Postgres...`);

        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        for (const record of records) {
            const f = record.fields;
            const gcpUuid = getGcpUuid(record.id, 'carriers');

            try {
                await client.query(`
          INSERT INTO carriers (
            _id, "_createdDate", "_updatedDate", _owner,
            airtable_id, dot_number, company_name, state, city,
            num_trucks, num_drivers, freight_type, home_time,
            pay_per_mile, pay_per_mile_max, sign_on_bonus,
            combined_score, safety_score, is_enriched, last_enriched_at,
            ai_summary, subscription_tier, is_active
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8, $9,
            $10, $11, $12, $13,
            $14, $15, $16,
            $17, $18, $19, $20,
            $21, $22, $23
          )
          ON CONFLICT (dot_number) DO NOTHING
        `, [
                    gcpUuid,
                    f['Created'] ? new Date(f['Created']) : new Date(),
                    f['Last Modified'] ? new Date(f['Last Modified']) : new Date(),
                    null, // _owner — not applicable for carrier records
                    record.id,
                    f['DOT Number'] || f['dot_number'] || null,
                    f['Company Name'] || f['company_name'] || 'Unknown',
                    f['State'] || f['state'] || null,
                    f['City'] || f['city'] || null,
                    f['Number of Trucks'] || f['num_trucks'] || 0,
                    f['Number of Drivers'] || f['num_drivers'] || 0,
                    f['Freight Type'] || f['freight_type'] || null,
                    f['Home Time'] || f['home_time'] || null,
                    f['Pay Per Mile'] || f['pay_per_mile'] || null,
                    f['Pay Per Mile Max'] || f['pay_per_mile_max'] || null,
                    f['Sign On Bonus'] || f['sign_on_bonus'] || null,
                    f['Combined Score'] || f['combined_score'] || 0,
                    f['Safety Score'] || f['safety_score'] || 0,
                    f['Is Enriched'] || f['is_enriched'] || false,
                    f['Last Enriched At'] ? new Date(f['Last Enriched At']) : null,
                    f['AI Summary'] || f['ai_summary'] || null,
                    f['Subscription Tier'] || 'free',
                    true,
                ]);

                await saveIdMapping(client, record.id, gcpUuid, 'carriers');
                inserted++;

                if (inserted % 100 === 0) {
                    console.log(`   Progress: ${inserted}/${records.length} inserted...`);
                }
            } catch (err) {
                if (err.code === '23505') { // Unique violation
                    skipped++;
                } else {
                    console.error(`   ✗ Error on record ${record.id}:`, err.message);
                    errors++;
                }
            }
        }

        console.log(`\n✓ Carriers backfill complete:`);
        console.log(`   Inserted: ${inserted}`);
        console.log(`   Skipped (already exist): ${skipped}`);
        console.log(`   Errors: ${errors}`);

        // Verification count
        const countResult = await client.query('SELECT COUNT(*) FROM carriers');
        console.log(`   Postgres row count: ${countResult.rows[0].count}`);

    } finally {
        client.release();
    }
}

// ─────────────────────────────────────────────
// BACKFILL: Driver Profiles
// Source: v2_Driver Profiles → driver_profiles table
// ─────────────────────────────────────────────
async function backfillDriverProfiles() {
    const client = await pool.connect();
    try {
        const records = await fetchAllAirtableRecords('v2_Driver Profiles');
        console.log(`\n→ Inserting ${records.length} driver profiles into Postgres...`);

        let inserted = 0;
        let skipped = 0;
        let errors = 0;

        for (const record of records) {
            const f = record.fields;
            const gcpUuid = getGcpUuid(record.id, 'driver_profiles');

            try {
                await client.query(`
          INSERT INTO driver_profiles (
            _id, "_createdDate", "_updatedDate", _owner,
            airtable_id, member_id,
            first_name, last_name, email, phone,
            home_state, home_city,
            cdl_class, cdl_state, cdl_expiry, years_experience,
            has_hazmat, has_tanker, has_doubles,
            freight_preference, home_time_pref, pay_min,
            docs_submitted, is_searchable, visibility_level, profile_score
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6,
            $7, $8, $9, $10,
            $11, $12,
            $13, $14, $15, $16,
            $17, $18, $19,
            $20, $21, $22,
            $23, $24, $25, $26
          )
          ON CONFLICT (airtable_id) DO NOTHING
        `, [
                    gcpUuid,
                    f['Created'] ? new Date(f['Created']) : new Date(),
                    f['Last Modified'] ? new Date(f['Last Modified']) : new Date(),
                    f['Member ID'] || null,
                    record.id,
                    f['Member ID'] || f['member_id'] || null,
                    f['First Name'] || f['first_name'] || null,
                    f['Last Name'] || f['last_name'] || null,
                    f['Email'] || f['email'] || null,
                    f['Phone'] || f['phone'] || null,
                    f['Home State'] || f['home_state'] || null,
                    f['Home City'] || f['home_city'] || null,
                    f['CDL Class'] || f['cdl_class'] || null,
                    f['CDL State'] || f['cdl_state'] || null,
                    f['CDL Expiry'] ? new Date(f['CDL Expiry']) : null,
                    f['Years Experience'] || f['years_experience'] || 0,
                    f['Has Hazmat'] || false,
                    f['Has Tanker'] || false,
                    f['Has Doubles'] || false,
                    f['Freight Preference'] || null,
                    f['Home Time Preference'] || null,
                    f['Pay Min'] || null,
                    f['Docs Submitted'] || f['docs_submitted'] || false,
                    f['Is Searchable'] || f['is_searchable'] || false,
                    f['Visibility Level'] || f['visibility_level'] || 'none',
                    f['Profile Score'] || f['profile_score'] || 0,
                ]);

                await saveIdMapping(client, record.id, gcpUuid, 'driver_profiles');
                inserted++;

                if (inserted % 100 === 0) {
                    console.log(`   Progress: ${inserted}/${records.length} inserted...`);
                }
            } catch (err) {
                if (err.code === '23505') {
                    skipped++;
                } else {
                    console.error(`   ✗ Error on record ${record.id}:`, err.message);
                    errors++;
                }
            }
        }

        console.log(`\n✓ Driver profiles backfill complete:`);
        console.log(`   Inserted: ${inserted}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Errors: ${errors}`);

        const countResult = await client.query('SELECT COUNT(*) FROM driver_profiles');
        console.log(`   Postgres row count: ${countResult.rows[0].count}`);

    } finally {
        client.release();
    }
}

// ─────────────────────────────────────────────
// BACKFILL: Content (FAQs, Blog Posts, Compliance Guides)
// Phase 4 — low-risk test migration
// ─────────────────────────────────────────────
async function backfillContent() {
    const client = await pool.connect();
    try {
        // FAQs
        const faqs = await fetchAllAirtableRecords('v2_FAQs');
        for (const record of faqs) {
            const f = record.fields;
            const gcpUuid = getGcpUuid(record.id, 'faqs');
            await client.query(`
        INSERT INTO faqs (_id, "_createdDate", "_updatedDate", airtable_id, question, answer, category, is_published, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (airtable_id) DO NOTHING
      `, [
                gcpUuid, new Date(), new Date(), record.id,
                f['Question'] || '', f['Answer'] || '',
                f['Category'] || null, f['Published'] !== false, f['Sort Order'] || 0,
            ]);
            await saveIdMapping(client, record.id, gcpUuid, 'faqs');
        }
        console.log(`✓ FAQs backfill: ${faqs.length} records`);

    } finally {
        client.release();
    }
}

// ─────────────────────────────────────────────
// VERIFICATION: Compare row counts
// ─────────────────────────────────────────────
async function verifyRowCounts() {
    const client = await pool.connect();
    try {
        console.log('\n============================================');
        console.log(' VERIFICATION: Postgres Row Counts');
        console.log('============================================');

        const tables = ['carriers', 'driver_profiles', 'driver_applications',
            'messages', 'carrier_subscriptions', 'matching_scores',
            'faqs', 'blog_posts', 'id_mapping'];

        for (const table of tables) {
            try {
                const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`   ${table.padEnd(30)} ${result.rows[0].count} rows`);
            } catch (e) {
                console.log(`   ${table.padEnd(30)} table not found`);
            }
        }
    } finally {
        client.release();
    }
}

// ─────────────────────────────────────────────
// MAIN — Parse CLI args and run
// ─────────────────────────────────────────────
async function main() {
    const args = process.argv.slice(2);
    const collectionArg = args.find(a => a.startsWith('--collection='));
    const collection = collectionArg ? collectionArg.split('=')[1] : null;
    const runAll = args.includes('--all');
    const verifyOnly = args.includes('--verify');

    console.log('============================================');
    console.log(' LMDR: Airtable → Postgres Backfill');
    console.log('============================================');

    try {
        // Test DB connection
        await pool.query('SELECT 1');
        console.log('✓ Postgres connection: OK\n');

        if (verifyOnly) {
            await verifyRowCounts();
        } else if (runAll) {
            await backfillContent();
            await backfillCarriers();
            await backfillDriverProfiles();
            await verifyRowCounts();
        } else if (collection === 'carriers') {
            await backfillCarriers();
        } else if (collection === 'drivers') {
            await backfillDriverProfiles();
        } else if (collection === 'content') {
            await backfillContent();
        } else {
            console.log('Usage:');
            console.log('  node 07_backfill_airtable_to_sql.js --all');
            console.log('  node 07_backfill_airtable_to_sql.js --collection=carriers');
            console.log('  node 07_backfill_airtable_to_sql.js --collection=drivers');
            console.log('  node 07_backfill_airtable_to_sql.js --collection=content');
            console.log('  node 07_backfill_airtable_to_sql.js --verify');
        }

    } catch (err) {
        console.error('✗ Fatal error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
