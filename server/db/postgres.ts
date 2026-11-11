// Direct PostgreSQL connection pooling layer for ASTRAFLAME backend.
// Supports both Supabase Transaction Pooler (port 6543) and direct connection (port 5432).

import pg from 'pg';
import type { QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  '';

export const isPostgresConfigured = Boolean(
  connectionString &&
  !connectionString.includes('your-db-password') &&
  !connectionString.includes('placeholder')
);

// Configure pool with SSL required for Supabase PostgreSQL
export const pool = new Pool({
  connectionString: isPostgresConfigured ? connectionString : undefined,
  ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')
    ? { rejectUnauthorized: false }
    : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err: Error) => {
  console.error('[PostgreSQL Pool Error]', err.message);
});

/**
 * Executes a parameterized SQL query with security protections.
 */
export async function query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  if (!isPostgresConfigured) {
    throw new Error('PostgreSQL connection is not configured in environment variables.');
  }
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.debug('[PostgreSQL Query]', { text: text.slice(0, 100), duration, rows: res.rowCount });
  }
  return res;
}

/**
 * Tests direct PostgreSQL connectivity.
 */
export async function checkPostgresHealth(): Promise<{ ok: boolean; message: string; timestamp?: string }> {
  if (!isPostgresConfigured) {
    return {
      ok: false,
      message: 'DATABASE_URL is not configured or contains placeholder credentials.',
    };
  }

  try {
    const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    return {
      ok: true,
      message: `Connected to PostgreSQL database: ${res.rows[0].db_name}`,
      timestamp: res.rows[0].current_time,
    };
  } catch (error: any) {
    return {
      ok: false,
      message: `PostgreSQL connection failed: ${error.message || 'Unknown error'}`,
    };
  }
}
