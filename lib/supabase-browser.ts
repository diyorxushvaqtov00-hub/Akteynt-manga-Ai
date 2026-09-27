import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mnbyaetebzfjtpyekcpg.supabase.co";

// Modern Supabase publishable key. It is intentionally browser-safe.
// Do not put a secret/service_role key in NEXT_PUBLIC_* variables.
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_Cmrq4p-rqhB-uhiSvd6YPQ_mzcJ98qm";

export const supabaseBrowser = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
