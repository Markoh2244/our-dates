import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

function getServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  );
}

export function isCloudConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getServiceRoleKey() && process.env.CALENDAR_ACCESS_CODE);
}

export function getServiceSupabase(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();

  if (!url || !key) {
    throw new Error('Supabase is not configured on the server.');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function verifyAccessCode(provided: string | null | undefined): boolean {
  const expected = process.env.CALENDAR_ACCESS_CODE;
  if (!expected) return false;
  return Boolean(provided && provided === expected);
}
