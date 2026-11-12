// Server Configuration for ASTRAFLAME Backend
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  // Primary Authoritative Database (Supabase PostgreSQL)
  primaryDatabase: {
    url: process.env.PRIMARY_DATABASE_URL || process.env.DATABASE_URL || '',
    directUrl: process.env.PRIMARY_DIRECT_URL || process.env.DIRECT_URL || '',
  },
  // Legacy / fallback database reference
  database: {
    url: process.env.PRIMARY_DATABASE_URL || process.env.DATABASE_URL || '',
    directUrl: process.env.PRIMARY_DIRECT_URL || process.env.DIRECT_URL || '',
  },
  // Secondary Analytical Database (Separate PostgreSQL)
  secondaryDatabase: {
    url: process.env.SECONDARY_DATABASE_URL || '',
  },
  // Background Synchronization Engine
  sync: {
    intervalMs: parseInt(process.env.SYNC_INTERVAL_MS || '5000', 10),
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '50', 10),
    maxRetries: parseInt(process.env.SYNC_MAX_RETRIES || '3', 10),
  },
  // In-Memory Performance Cache
  cache: {
    analyticsTtlMs: parseInt(process.env.ANALYTICS_CACHE_TTL_MS || '30000', 10),
  },
  storage: {
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'astraflame-evidence',
  },
};

