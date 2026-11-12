// ASTRAFLAME Secondary Analytical Database Migration Runner
// Applies SQL migrations (reporting summaries, flammability aggregates, sync log) to Secondary PostgreSQL.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { config } from './config/index.ts';

dotenv.config();

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../supabase/migrations');

const connectionString = config.secondaryDatabase.url;

async function runSecondaryMigrations() {
  console.log('================================================================');
  console.log('      ASTRAFLAME SECONDARY ANALYTICAL MIGRATION RUNNER          ');
  console.log('================================================================\n');

  if (!connectionString || connectionString.includes('your-analytics-password')) {
    console.error('✘ Error: SECONDARY_DATABASE_URL not configured in .env.');
    console.log('Please configure SECONDARY_DATABASE_URL in .env to apply secondary migrations.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('sslmode=disable')
      ? undefined
      : { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to Secondary Analytical PostgreSQL database...');
    await client.connect();
    console.log('✔ Connected to Secondary database successfully.\n');

    const migrationFiles = [
      '20261112000002_create_secondary_analytics_schema.sql',
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠ Skipping ${file}: File not found.`);
        continue;
      }

      console.log(`Applying secondary analytical migration: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      const start = Date.now();
      await client.query(sql);
      const elapsed = Date.now() - start;
      console.log(`✔ ${file} applied successfully (${elapsed}ms).\n`);
    }

    console.log('================================================================');
    console.log('   ALL SECONDARY ANALYTICAL MIGRATIONS APPLIED SUCCESSFULLY!    ');
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('✘ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runSecondaryMigrations();
