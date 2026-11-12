// Secondary PostgreSQL Connection Management (Analytical Database)
import pg from 'pg';
import { config } from '../config/index.ts';

const { Pool } = pg;

export const isSecondaryConfigured = Boolean(
  config.secondaryDatabase.url &&
    !config.secondaryDatabase.url.includes('your-analytics-password') &&
    !config.secondaryDatabase.url.includes('your-secondary-host')
);

export const secondaryPool = new Pool({
  connectionString: isSecondaryConfigured ? config.secondaryDatabase.url : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl:
    config.secondaryDatabase.url.includes('sslmode=disable')
      ? false
      : { rejectUnauthorized: false },
});

secondaryPool.on('error', (err) => {
  console.warn('[Secondary Postgres Pool Warning]:', err.message);
});

export async function querySecondary<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  if (!isSecondaryConfigured) {
    throw new Error('Secondary Analytical PostgreSQL is not configured.');
  }
  const client = await secondaryPool.connect();
  try {
    return await client.query<T>(text, params);
  } finally {
    client.release();
  }
}

export async function checkSecondaryPostgresHealth(): Promise<{
  connected: boolean;
  message: string;
  latencyMs?: number;
  pool?: { total: number; idle: number; waiting: number };
}> {
  if (!isSecondaryConfigured) {
    return {
      connected: false,
      message: 'Secondary PostgreSQL is in STANDBY mode (SECONDARY_DATABASE_URL not configured).',
    };
  }

  const start = Date.now();
  try {
    const client = await secondaryPool.connect();
    try {
      await client.query('SELECT 1');
      const latencyMs = Date.now() - start;
      return {
        connected: true,
        message: 'Secondary Analytical PostgreSQL connected successfully.',
        latencyMs,
        pool: {
          total: secondaryPool.totalCount,
          idle: secondaryPool.idleCount,
          waiting: secondaryPool.waitingCount,
        },
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return {
      connected: false,
      message: `Secondary PostgreSQL connection error: ${err.message}`,
    };
  }
}
