// Supabase client for the MakePlays internal admin panel.
// Backend→Supabase migration (Wave 0). Provisioned now; the panel keeps
// using the legacy axios backend until a module's USE_SUPABASE_* flag is
// enabled (see ./featureFlags.js). See c:\mp\MIGRATION_PLAN.md.
import { createClient } from "@supabase/supabase-js";
import {
  SUPABASE_STORAGE_KEY,
  readSessionValue,
  writeSessionValue,
  clearSessionValue,
} from "../lib/session";

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Storage adapter backing "Keep me signed in".
//
// supabase-js picks its storage at createClient() time — which runs at module
// import, long before the admin ticks the checkbox on the login form. So we
// hand it an adapter that resolves the destination on every single call
// instead, routing to localStorage or sessionStorage based on the persist mode
// recorded at login (see lib/session.js).
const dualStorage = {
  getItem: (key) => readSessionValue(key),
  setItem: (key, value) => writeSessionValue(key, value),
  // Always remove from BOTH stores — a logout must not leave a copy behind in
  // whichever store happens to be inactive right now.
  removeItem: (key) => clearSessionValue(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // The admin panel logs in as a super_admin user. Where that session is
    // persisted depends on "Keep me signed in": localStorage when checked,
    // sessionStorage (dies with the tab) when not.
    storageKey: SUPABASE_STORAGE_KEY,
    storage: dualStorage,
  },
});

export default supabase;
