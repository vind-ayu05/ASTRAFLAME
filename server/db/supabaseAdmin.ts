// Supabase Service Role client for privileged backend operations.
// Never exposed to client-side code.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl &&
  serviceRoleKey &&
  !supabaseUrl.includes('placeholder') &&
  !serviceRoleKey.includes('placeholder')
);

export const supabaseAdmin: SupabaseClient | null = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Secondary fallback client using anon key if service role is not yet entered
export const supabasePublic: SupabaseClient | null = (supabaseUrl && anonKey && !anonKey.includes('placeholder'))
  ? createClient(supabaseUrl, anonKey)
  : null;

export async function checkSupabaseHealth(): Promise<{ ok: boolean; message: string; version?: string; latencyMs?: number }> {
  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    return {
      ok: false,
      message: 'Supabase credentials are not configured in environment variables.',
    };
  }

  const client = supabaseAdmin || supabasePublic;
  if (!client) {
    return { ok: false, message: 'Supabase client initialization failed.' };
  }

  const start = Date.now();
  try {
    const { data, error } = await client.from('sources').select('count', { count: 'exact', head: true });
    const latencyMs = Date.now() - start;
    if (error) {
      return {
        ok: false,
        message: `Supabase API responded with error: ${error.message}`,
        latencyMs,
      };
    }
    return {
      ok: true,
      message: `Supabase API reachable. Sources table accessible (rows: ${data ?? 'verified'}).`,
      latencyMs,
    };
  } catch (err: any) {
    return {
      ok: false,
      message: `Supabase network check failed: ${err.message || 'Unknown error'}`,
    };
  }
}

