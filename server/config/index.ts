// Server Configuration for ASTRAFLAME Backend
import dotenv from 'dotenv';

dotenv.config();

// Allowed origins for CORS (production and local dev)
const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
];

const configuredOrigins = process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...configuredOrigins]));

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like server-to-server, scripts, or local testing)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin '${origin}' is not permitted by CORS policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'Accept'],
  },
  // Administrative credentials & Role keys
  adminApiKey: process.env.ADMIN_API_KEY || (process.env.NODE_ENV === 'production' ? '' : 'astraflame-dev-admin-secret'),
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
  // AI Chatbot Backend Settings
  llm: {
    apiKey: process.env.GEMINI_API_KEY || process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
    model: process.env.LLM_MODEL || 'gemini-1.5-flash',
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
  // Rate limiting configurations
  rateLimits: {
    apiWindowMs: 60 * 1000,
    apiMaxRequests: 150,
    authWindowMs: 15 * 60 * 1000,
    authMaxRequests: 15,
    chatWindowMs: 60 * 1000,
    chatMaxRequests: 30,
    adminWindowMs: 60 * 1000,
    adminMaxRequests: 10,
  },
};
