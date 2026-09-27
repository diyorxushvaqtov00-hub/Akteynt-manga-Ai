import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mnbyaetebzfjtpyekcpg.supabase.co";

// Legacy anon is public and is restricted by Storage RLS to jobs/*.
const SUPABASE_STORAGE_KEY =
  process.env.SUPABASE_STORAGE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uYnlhZXRlYnpmanRweWVrY3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MjUxMzgsImV4cCI6MjEwNTUwMTEzOH0.h2Ein6jw5AF8Cc-eG309e0nrSY4j0AMpOdGpNH5wTxs";

export function getSupabaseStorage() {
  return createClient(SUPABASE_URL, SUPABASE_STORAGE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
