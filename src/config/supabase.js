// Supabase client for the MakePlays internal admin panel.
// Backend→Supabase migration (Wave 0). Provisioned now; the panel keeps
// using the legacy axios backend until a module's USE_SUPABASE_* flag is
// enabled (see ./featureFlags.js). See c:\mp\MIGRATION_PLAN.md.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // The admin panel logs in as a super_admin user; session lives in
    // localStorage (supabase-js default for web).
    storageKey: "mkpl-admin-auth",
  },
});

export default supabase;
