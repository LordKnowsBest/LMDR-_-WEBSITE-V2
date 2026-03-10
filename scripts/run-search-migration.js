import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config({ path: '../cloud-run-api/.env' });

const pool = new Pool({
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'lmdr',
  user: process.env.PG_USER || 'lmdr_user',
  password: process.env.PG_PASSWORD,
  max: 3,
});

async function run() {
  const client = await pool.connect();
  try {
    // 1. Extensions
    console.log('=== Installing extensions ===');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
    console.log('  pg_trgm OK');
    await client.query('CREATE EXTENSION IF NOT EXISTS unaccent');
    console.log('  unaccent OK');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis');
    console.log('  postgis OK');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('  vector OK');

    // 2. Carriers: search_vector + location columns
    console.log('\n=== Carriers: adding search + geo columns ===');
    await client.query('ALTER TABLE carriers ADD COLUMN IF NOT EXISTS search_vector tsvector');
    await client.query('CREATE INDEX IF NOT EXISTS idx_carriers_search ON carriers USING GIN(search_vector)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_carriers_name_trgm ON carriers USING GIN(company_name gin_trgm_ops)');
    await client.query('ALTER TABLE carriers ADD COLUMN IF NOT EXISTS location geography(Point, 4326)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_carriers_location ON carriers USING GIST(location)');
    console.log('  Columns + indexes OK');

    // Carrier search trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_carrier_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english',
          coalesce(NEW.company_name, '') || ' ' ||
          coalesce(NEW.state, '') || ' ' ||
          coalesce(NEW.city, '') || ' ' ||
          coalesce(NEW.freight_type, '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await client.query('DROP TRIGGER IF EXISTS trg_carrier_search ON carriers');
    await client.query('CREATE TRIGGER trg_carrier_search BEFORE INSERT OR UPDATE ON carriers FOR EACH ROW EXECUTE FUNCTION update_carrier_search_vector()');
    console.log('  Trigger OK');

    // Backfill carriers
    const carrierResult = await client.query(`
      UPDATE carriers SET search_vector = to_tsvector('english',
        coalesce(company_name, '') || ' ' ||
        coalesce(state, '') || ' ' ||
        coalesce(city, '') || ' ' ||
        coalesce(freight_type, '')
      )
    `);
    console.log(`  Backfilled ${carrierResult.rowCount} carriers`);

    // 3. Driver profiles: search_vector column
    console.log('\n=== Driver Profiles: adding search column ===');
    await client.query('ALTER TABLE airtable_driver_profiles ADD COLUMN IF NOT EXISTS search_vector tsvector');
    await client.query('CREATE INDEX IF NOT EXISTS idx_driver_profiles_search ON airtable_driver_profiles USING GIN(search_vector)');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_driver_profiles_name_trgm ON airtable_driver_profiles USING GIN((data->>'first_name') gin_trgm_ops)`);
    console.log('  Columns + indexes OK');

    // Driver search trigger
    await client.query(`
      CREATE OR REPLACE FUNCTION update_driver_profile_search_vector()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.search_vector := to_tsvector('english',
          coalesce(NEW.data->>'first_name', '') || ' ' ||
          coalesce(NEW.data->>'last_name', '') || ' ' ||
          coalesce(NEW.data->>'cdl_class', '') || ' ' ||
          coalesce(NEW.data->>'endorsements', '') || ' ' ||
          coalesce(NEW.data->>'state', '') || ' ' ||
          coalesce(NEW.data->>'city', '')
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await client.query('DROP TRIGGER IF EXISTS trg_driver_profile_search ON airtable_driver_profiles');
    await client.query('CREATE TRIGGER trg_driver_profile_search BEFORE INSERT OR UPDATE ON airtable_driver_profiles FOR EACH ROW EXECUTE FUNCTION update_driver_profile_search_vector()');
    console.log('  Trigger OK');

    // Backfill driver profiles
    const driverResult = await client.query(`
      UPDATE airtable_driver_profiles SET search_vector = to_tsvector('english',
        coalesce(data->>'first_name', '') || ' ' ||
        coalesce(data->>'last_name', '') || ' ' ||
        coalesce(data->>'cdl_class', '') || ' ' ||
        coalesce(data->>'endorsements', '') || ' ' ||
        coalesce(data->>'state', '') || ' ' ||
        coalesce(data->>'city', '')
      )
    `);
    console.log(`  Backfilled ${driverResult.rowCount} driver profiles`);

    // 4. pgvector embeddings table
    console.log('\n=== Creating document_embeddings table ===');
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        source_collection TEXT NOT NULL,
        source_id TEXT NOT NULL,
        chunk_index INTEGER DEFAULT 0,
        content TEXT NOT NULL,
        embedding vector(1536),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await client.query('CREATE INDEX IF NOT EXISTS idx_embeddings_source ON document_embeddings(source_collection, source_id)');
    console.log('  Table + index OK');

    // 5. Verification
    console.log('\n=== Verification ===');
    const ext = await client.query("SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_trgm', 'unaccent', 'postgis', 'vector') ORDER BY extname");
    console.log('Extensions:', ext.rows.map(r => `${r.extname} v${r.extversion}`).join(', '));

    const idx = await client.query("SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE 'idx_%search%' OR indexname LIKE 'idx_%trgm%' OR indexname LIKE 'idx_%location%' OR indexname LIKE 'idx_%embed%' ORDER BY tablename");
    console.log('Indexes:', idx.rows.map(r => `${r.tablename}.${r.indexname}`).join(', '));

    const counts = await client.query(`
      SELECT 'carriers' as tbl, COUNT(*) as total, COUNT(search_vector) as with_search FROM carriers
      UNION ALL
      SELECT 'driver_profiles', COUNT(*), COUNT(search_vector) FROM airtable_driver_profiles
    `);
    counts.rows.forEach(r => console.log(`  ${r.tbl}: ${r.total} total, ${r.with_search} with search vector`));

    console.log('\n=== Phase 4 Search Migration COMPLETE ===');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
