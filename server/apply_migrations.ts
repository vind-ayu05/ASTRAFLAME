// ASTRAFLAME Database Migration Runner
// Applies SQL migrations (schema, seed data, RLS security policies) to PostgreSQL / Supabase.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../supabase/migrations');

const connectionString =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  '';

async function runMigrations() {
  console.log('================================================================');
  console.log('              ASTRAFLAME SQL MIGRATION RUNNER                   ');
  console.log('================================================================\n');

  if (!connectionString || connectionString.includes('your-db-password')) {
    console.error('✘ Error: DIRECT_URL or DATABASE_URL not set in .env.');
    console.log('Please enter your database connection string in .env and re-run.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('✔ Connected to database successfully.\n');

    const migrationFiles = [
      '20261111000001_create_astraflame_schema.sql',
      '20261111000002_seed_astraflame_data.sql',
      '20261111000003_rls_and_security.sql',
      '20261112000001_create_sync_outbox.sql',
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠ Skipping ${file}: File not found.`);
        continue;
      }

      console.log(`Applying migration: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      const start = Date.now();
      await client.query(sql);
      const elapsed = Date.now() - start;
      console.log(`  ✔ Migration ${file} applied successfully (${elapsed}ms).`);
    }

    console.log('\n================================================================');
    console.log('       ALL MIGRATIONS APPLIED SUCCESSFULLY!                     ');
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('✘ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations().catch(console.error);

