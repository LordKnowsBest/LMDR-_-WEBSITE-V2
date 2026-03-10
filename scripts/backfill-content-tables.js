#!/usr/bin/env node
'use strict';

const Airtable = require('airtable');
const { Pool } = require('pg');
const { v5: uuidv5 } = require('uuid');

const UUID_NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const pool = new Pool({
  host: '127.0.0.1', port: 5432, database: 'lmdr',
  user: 'lmdr_user', password: process.env.PG_PASSWORD || 'cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o',
  ssl: false
});

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base('app9N1YCJ3gdhExA0');

async function fetchAll(tableName) {
  const records = [];
  try {
    await base(tableName).select({ pageSize: 100 }).eachPage((page, next) => {
      records.push(...page);
      next();
    });
  } catch (e) {
    return { records: [], error: e.message };
  }
  return { records, error: null };
}

async function backfillFaqs(client) {
  const { records, error } = await fetchAll('v2_FAQs');
  if (error) return console.log(`  FAQs: SKIP — ${error.substring(0, 50)}`);
  if (!records.length) return console.log('  FAQs: 0 records in Airtable');

  console.log(`  FAQs: ${records.length} records, inserting...`);
  let inserted = 0;
  for (const rec of records) {
    const f = rec.fields;
    const uuid = uuidv5('faqs:' + rec.id, UUID_NS);
    try {
      await client.query(`
        INSERT INTO faqs (_id, "_createdDate", "_updatedDate", airtable_id, question, answer, category, is_published, sort_order)
        VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
        ON CONFLICT (airtable_id) DO NOTHING
      `, [uuid, rec._rawJson?.createdTime ? new Date(rec._rawJson.createdTime) : new Date(),
          rec.id,
          f['Question'] || f['question'] || 'Untitled',
          f['Answer'] || f['answer'] || '',
          f['Category'] || f['category'] || null,
          f['Is Published'] !== false,
          parseInt(f['Sort Order'] || f['sort_order']) || 0]);
      inserted++;
      await client.query(`INSERT INTO id_mapping (airtable_id, gcp_uuid, collection_name) VALUES ($1, $2, 'faqs') ON CONFLICT DO NOTHING`, [rec.id, uuid]);
    } catch (e) {
      console.error(`    Error: ${e.message.substring(0, 60)}`);
    }
  }
  console.log(`  FAQs: ${inserted} inserted`);
}

async function backfillBlogPosts(client) {
  const { records, error } = await fetchAll('v2_Blog Posts');
  if (error) return console.log(`  Blog Posts: SKIP — ${error.substring(0, 50)}`);
  if (!records.length) return console.log('  Blog Posts: 0 records in Airtable');

  console.log(`  Blog Posts: ${records.length} records, inserting...`);
  let inserted = 0;
  for (const rec of records) {
    const f = rec.fields;
    const uuid = uuidv5('blogPosts:' + rec.id, UUID_NS);
    try {
      await client.query(`
        INSERT INTO blog_posts (_id, "_createdDate", "_updatedDate", airtable_id, title, slug, content, excerpt, category, is_published, published_at)
        VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (airtable_id) DO NOTHING
      `, [uuid, rec._rawJson?.createdTime ? new Date(rec._rawJson.createdTime) : new Date(),
          rec.id,
          f['Title'] || f['title'] || 'Untitled',
          f['Slug'] || f['slug'] || null,
          f['Content'] || f['content'] || null,
          f['Excerpt'] || f['excerpt'] || null,
          f['Category'] || f['category'] || null,
          f['Is Published'] === true || f['Is Published'] === 'Yes',
          f['Published At'] ? new Date(f['Published At']) : null]);
      inserted++;
      await client.query(`INSERT INTO id_mapping (airtable_id, gcp_uuid, collection_name) VALUES ($1, $2, 'blogPosts') ON CONFLICT DO NOTHING`, [rec.id, uuid]);
    } catch (e) {
      console.error(`    Error: ${e.message.substring(0, 60)}`);
    }
  }
  console.log(`  Blog Posts: ${inserted} inserted`);
}

async function backfillComplianceGuides(client) {
  const { records, error } = await fetchAll('v2_Compliance Guides');
  if (error) return console.log(`  Compliance Guides: SKIP — ${error.substring(0, 50)}`);
  if (!records.length) return console.log('  Compliance Guides: 0 records in Airtable');

  console.log(`  Compliance Guides: ${records.length} records, inserting...`);
  let inserted = 0;
  for (const rec of records) {
    const f = rec.fields;
    const uuid = uuidv5('complianceGuides:' + rec.id, UUID_NS);
    try {
      await client.query(`
        INSERT INTO compliance_guides (_id, "_createdDate", "_updatedDate", airtable_id, title, content, regulation_type, is_published)
        VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
        ON CONFLICT (airtable_id) DO NOTHING
      `, [uuid, rec._rawJson?.createdTime ? new Date(rec._rawJson.createdTime) : new Date(),
          rec.id,
          f['Title'] || f['title'] || 'Untitled',
          f['Content'] || f['content'] || null,
          f['Regulation Type'] || f['regulation_type'] || null,
          f['Is Published'] !== false]);
      inserted++;
      await client.query(`INSERT INTO id_mapping (airtable_id, gcp_uuid, collection_name) VALUES ($1, $2, 'complianceGuides') ON CONFLICT DO NOTHING`, [rec.id, uuid]);
    } catch (e) {
      console.error(`    Error: ${e.message.substring(0, 60)}`);
    }
  }
  console.log(`  Compliance Guides: ${inserted} inserted`);
}

async function backfillMessages(client) {
  const { records, error } = await fetchAll('v2_Messages');
  if (error) return console.log(`  Messages: SKIP — ${error.substring(0, 50)}`);
  if (!records.length) return console.log('  Messages: 0 records in Airtable');

  console.log(`  Messages: ${records.length} records, inserting...`);
  let inserted = 0;
  for (const rec of records) {
    const f = rec.fields;
    const uuid = uuidv5('messages:' + rec.id, UUID_NS);
    try {
      await client.query(`
        INSERT INTO messages (_id, "_createdDate", "_updatedDate", airtable_id, sender_id, recipient_id, thread_id, content, is_read, message_type)
        VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (airtable_id) DO NOTHING
      `, [uuid, rec._rawJson?.createdTime ? new Date(rec._rawJson.createdTime) : new Date(),
          rec.id,
          f['Sender ID'] || f['sender_id'] || 'system',
          f['Recipient ID'] || f['recipient_id'] || 'unknown',
          f['Thread ID'] || f['thread_id'] || null,
          f['Content'] || f['content'] || f['Message'] || '',
          f['Is Read'] === true || f['Is Read'] === 'Yes' || false,
          f['Message Type'] || f['message_type'] || 'text']);
      inserted++;
      await client.query(`INSERT INTO id_mapping (airtable_id, gcp_uuid, collection_name) VALUES ($1, $2, 'messages') ON CONFLICT DO NOTHING`, [rec.id, uuid]);
    } catch (e) {
      console.error(`    Error: ${e.message.substring(0, 60)}`);
    }
  }
  console.log(`  Messages: ${inserted} inserted`);
}

async function backfillSubscriptions(client) {
  const { records, error } = await fetchAll('v2_Subscriptions');
  if (error) return console.log(`  Subscriptions: SKIP — ${error.substring(0, 50)}`);
  if (!records.length) return console.log('  Subscriptions: 0 records in Airtable');

  console.log(`  Subscriptions: ${records.length} records, inserting...`);
  let inserted = 0;
  for (const rec of records) {
    const f = rec.fields;
    const uuid = uuidv5('carrierSubscriptions:' + rec.id, UUID_NS);
    try {
      await client.query(`
        INSERT INTO carrier_subscriptions (_id, "_createdDate", "_updatedDate", airtable_id, dot_number, stripe_customer_id, stripe_subscription_id, tier, status)
        VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8)
        ON CONFLICT (airtable_id) DO NOTHING
      `, [uuid, rec._rawJson?.createdTime ? new Date(rec._rawJson.createdTime) : new Date(),
          rec.id,
          f['DOT Number'] || f['dot_number'] || f['Carrier DOT'] || null,
          f['Stripe Customer ID'] || f['stripe_customer_id'] || null,
          f['Stripe Subscription ID'] || f['stripe_subscription_id'] || null,
          f['Tier'] || f['tier'] || f['Plan'] || 'free',
          f['Status'] || f['status'] || 'active']);
      inserted++;
      await client.query(`INSERT INTO id_mapping (airtable_id, gcp_uuid, collection_name) VALUES ($1, $2, 'carrierSubscriptions') ON CONFLICT DO NOTHING`, [rec.id, uuid]);
    } catch (e) {
      console.error(`    Error: ${e.message.substring(0, 60)}`);
    }
  }
  console.log(`  Subscriptions: ${inserted} inserted`);
}

async function main() {
  await pool.query('SELECT 1');
  console.log('=== Content Tables Backfill ===\n');

  const client = await pool.connect();
  try {
    await backfillFaqs(client);
    await backfillBlogPosts(client);
    await backfillComplianceGuides(client);
    await backfillMessages(client);
    await backfillSubscriptions(client);
  } finally {
    client.release();
  }

  // Final counts
  console.log('\n=== Final Row Counts ===');
  for (const t of ['carriers', 'driver_profiles', 'driver_applications', 'carrier_subscriptions', 'messages', 'faqs', 'blog_posts', 'compliance_guides', 'id_mapping']) {
    const r = await pool.query(`SELECT COUNT(*) FROM "${t}"`);
    console.log(`  ${t.padEnd(30)} ${r.rows[0].count} rows`);
  }

  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  pool.end();
  process.exit(1);
});
