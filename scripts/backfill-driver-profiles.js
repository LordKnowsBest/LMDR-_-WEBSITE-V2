#!/usr/bin/env node
'use strict';

const Airtable = require('airtable');
const { Pool } = require('pg');
const { v5: uuidv5 } = require('uuid');

const UUID_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const pool = new Pool({
  host: '127.0.0.1', port: 5432, database: 'lmdr',
  user: 'lmdr_user', password: 'cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o', ssl: false
});

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT })
  .base('app9N1YCJ3gdhExA0');

async function fetchProfiles() {
  const records = [];
  const tableName = 'v2_Driver Profiles';
  console.log(`Fetching from Airtable: "${tableName}"...`);

  await base(tableName).select({ pageSize: 100 }).eachPage((page, next) => {
    records.push(...page);
    process.stdout.write(`\r  Fetched ${records.length} records...`);
    next();
  });
  console.log('');
  return records;
}

async function main() {
  // Test DB connection
  await pool.query('SELECT 1');
  console.log('Postgres connection: OK');

  let records;
  try {
    records = await fetchProfiles();
  } catch (e) {
    console.error('Airtable fetch failed:', e.message);
    // Try alternate field discovery
    console.log('\nAttempting field discovery on known driver tables...');
    for (const name of ['v2_Driver Profiles', 'Driver Profiles', 'v2_DriverProfiles']) {
      try {
        const test = [];
        await base(name).select({ maxRecords: 1 }).eachPage((p, n) => { test.push(...p); n(); });
        if (test.length > 0) {
          console.log(`  "${name}": found! Fields: ${Object.keys(test[0].fields).join(', ')}`);
        } else {
          console.log(`  "${name}": exists but empty`);
        }
      } catch (e2) {
        console.log(`  "${name}": ${e2.message.substring(0, 50)}`);
      }
    }
    await pool.end();
    return;
  }

  console.log(`${records.length} driver profiles fetched from Airtable`);

  if (records.length === 0) {
    console.log('No records to insert.');
    await pool.end();
    return;
  }

  // Show sample fields
  console.log('Sample fields:', Object.keys(records[0].fields).join(', '));

  const client = await pool.connect();
  let inserted = 0;
  let errors = 0;

  for (const rec of records) {
    const f = rec.fields;
    const uuid = uuidv5('driverProfiles:' + rec.id, UUID_NS);

    try {
      await client.query(`
        INSERT INTO driver_profiles (
          _id, "_createdDate", "_updatedDate", airtable_id, member_id,
          first_name, last_name, email, phone, home_state, home_city,
          cdl_class, cdl_state, years_experience, has_hazmat, has_tanker, has_doubles,
          freight_preference, home_time_pref, pay_min, willing_to_relocate,
          docs_submitted, is_searchable, profile_score
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
        ON CONFLICT (airtable_id) DO NOTHING
      `, [
        uuid,
        rec._rawJson?.createdTime ? new Date(rec._rawJson.createdTime) : new Date(),
        new Date(),
        rec.id,
        f['Member ID'] || f['member_id'] || null,
        f['First Name'] || f['first_name'] || null,
        f['Last Name'] || f['last_name'] || null,
        f['Email'] || f['email'] || null,
        f['Phone'] || f['phone'] || null,
        f['Home State'] || f['home_state'] || null,
        f['Home City'] || f['home_city'] || null,
        f['CDL Class'] || f['cdl_class'] || null,
        f['CDL State'] || f['cdl_state'] || null,
        f['Years Experience'] != null ? parseInt(f['Years Experience'] || f['years_experience']) || 0 : 0,
        f['Has Hazmat'] === true || f['Has Hazmat'] === 'Yes' || false,
        f['Has Tanker'] === true || f['Has Tanker'] === 'Yes' || false,
        f['Has Doubles'] === true || f['Has Doubles'] === 'Yes' || false,
        f['Freight Preference'] || f['freight_preference'] || null,
        f['Home Time Preference'] || f['home_time_pref'] || null,
        f['Minimum Pay'] != null ? parseFloat(f['Minimum Pay'] || f['pay_min']) || null : null,
        f['Willing to Relocate'] === true || f['Willing to Relocate'] === 'Yes' || false,
        f['Docs Submitted'] === true || f['Docs Submitted'] === 'Yes' || f['Docs Complete'] === 'Yes' || false,
        f['Is Searchable'] === true || f['Is Searchable'] === 'Yes' || f['Is Discoverable'] === 'Yes' || false,
        parseInt(f['Profile Score'] || f['profile_score']) || 0
      ]);
      inserted++;

      // id_mapping
      await client.query(`
        INSERT INTO id_mapping (airtable_id, gcp_uuid, collection_name)
        VALUES ($1, $2, 'driver_profiles')
        ON CONFLICT DO NOTHING
      `, [rec.id, uuid]);

    } catch (e) {
      errors++;
      if (errors <= 5) console.error(`  Error for ${rec.id}: ${e.message.substring(0, 80)}`);
    }
  }

  client.release();
  console.log(`\nInserted: ${inserted}, Errors: ${errors}`);

  // Verify
  const count = await pool.query('SELECT COUNT(*) FROM driver_profiles');
  console.log(`driver_profiles final count: ${count.rows[0].count}`);

  const mapCount = await pool.query("SELECT COUNT(*) FROM id_mapping WHERE collection_name = 'driver_profiles'");
  console.log(`id_mapping (driver_profiles): ${mapCount.rows[0].count}`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  pool.end();
  process.exit(1);
});
