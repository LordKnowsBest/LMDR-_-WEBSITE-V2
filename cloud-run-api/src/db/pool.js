import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (pool) return pool;

  const cloudSqlInstance = process.env.CLOUD_SQL_INSTANCE;
  const pgHost = process.env.PG_HOST || '127.0.0.1';
  const isUnixSocket = cloudSqlInstance || pgHost.startsWith('/cloudsql/');

  if (isUnixSocket) {
    const socketPath = cloudSqlInstance
      ? `/cloudsql/${cloudSqlInstance}`
      : pgHost;
    pool = new Pool({
      host: socketPath,
      database: process.env.PG_DATABASE || 'lmdr',
      user: process.env.PG_USER || 'lmdr_user',
      password: process.env.PG_PASSWORD,
      max: 10,
    });
  } else {
    pool = new Pool({
      host: pgHost,
      port: parseInt(process.env.PG_PORT || '5432'),
      database: process.env.PG_DATABASE || 'lmdr',
      user: process.env.PG_USER || 'lmdr_user',
      password: process.env.PG_PASSWORD,
      max: 5,
    });
  }

  pool.on('error', (err) => {
    console.error('Unexpected pg pool error:', err.message);
  });

  return pool;
}

export async function query(sql, params = []) {
  return getPool().query(sql, params);
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
