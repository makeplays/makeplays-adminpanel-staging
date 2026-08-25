// Session policy for the admin panel — one place for every timing constant and
// the storage keys they need. Deliberately framework-free (no React, no redux,
// no supabase import) so it stays trivially unit-testable and can be imported
// from anywhere without creating a cycle.
//
// Why this exists: the panel used to keep an admin signed in forever —
// `persistSession` + `autoRefreshToken` renewed the session indefinitely and
// nothing ever expired it. These constants bound that.

export const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // sign out after 30 min idle
export const IDLE_WARNING_MS = 2 * 60 * 1000; // warn 2 min before that
export const ABSOLUTE_MAX_MS = 12 * 60 * 60 * 1000; // hard ceiling from login

// Storage keys owned by this module.
export const LOGIN_AT_KEY = "mkpl-admin-login-at";
export const PERSIST_KEY = "mkpl-admin-persist"; // "local" | "session"
export const LAST_ACTIVITY_KEY = "mkpl-admin-last-activity";

// The key supabase-js persists its session under (see config/supabase.js).
export const SUPABASE_STORAGE_KEY = "mkpl-admin-auth";

const isBrowser = () => typeof window !== "undefined";

// ─── persist mode ("Keep me signed in") ─────────────────────────────────────
// The mode itself always lives in localStorage: it has to survive the tab
// closing in order to be readable on the next page load.

export const getPersistMode = () => {
  if (!isBrowser()) return "session";
  try {
    return window.localStorage.getItem(PERSIST_KEY) === "local"
      ? "local"
      : "session";
  } catch {
    return "session";
  }
};

export const setPersistMode = (mode) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PERSIST_KEY, mode === "local" ? "local" : "session");
  } catch {
    /* storage disabled (private mode / quota) — fall back to session default */
  }
};

// The store the current session's data belongs in.
export const activeStore = () =>
  getPersistMode() === "local" ? window.localStorage : window.sessionStorage;

const otherStore = () =>
  getPersistMode() === "local" ? window.sessionStorage : window.localStorage;

// Read from the active store, falling back to the other one. The fallback
// matters when the persist mode is flipped while a session is already live —
// without it the session would look lost rather than simply relocated.
export const readSessionValue = (key) => {
  if (!isBrowser()) return null;
  try {
    return activeStore().getItem(key) ?? otherStore().getItem(key);
  } catch {
    return null;
  }
};

export const writeSessionValue = (key, value) => {
  if (!isBrowser()) return;
  try {
    activeStore().setItem(key, value);
    // Never leave a stale duplicate behind in the store we're not using.
    otherStore().removeItem(key);
  } catch {
    /* ignore */
  }
};

export const clearSessionValue = (key) => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

// ─── absolute session cap ───────────────────────────────────────────────────

export const markLoginAt = (now = Date.now()) => {
  writeSessionValue(LOGIN_AT_KEY, String(now));
};

export const getLoginAt = () => {
  const raw = readSessionValue(LOGIN_AT_KEY);
  const parsed = Number(raw);
  return raw != null && Number.isFinite(parsed) ? parsed : null;
};

// True when the session has outlived ABSOLUTE_MAX_MS.
//
// A MISSING timestamp also counts as expired. That is intentional: admins who
// were already signed in before this feature shipped have no stamp, and the
// safe reading of "unknown age" is "too old". It costs them exactly one forced
// re-login, after which every session carries a stamp.
export const isSessionExpired = (now = Date.now()) => {
  const loginAt = getLoginAt();
  if (loginAt == null) return true;
  // A stamp in the future means a clock change or tampering — treat as expired.
  if (loginAt > now) return true;
  return now - loginAt > ABSOLUTE_MAX_MS;
};

// ─── idle tracking ──────────────────────────────────────────────────────────
// Shared across tabs so that activity in one keeps its siblings alive.

export const markActivity = (now = Date.now()) => {
  writeSessionValue(LAST_ACTIVITY_KEY, String(now));
};

export const getLastActivity = () => {
  const raw = readSessionValue(LAST_ACTIVITY_KEY);
  const parsed = Number(raw);
  return raw != null && Number.isFinite(parsed) ? parsed : null;
};

// Every key this module and the auth layer own — the exact set logout clears.
export const SESSION_KEYS = [
  "token",
  "refreshtoken",
  LOGIN_AT_KEY,
  LAST_ACTIVITY_KEY,
  SUPABASE_STORAGE_KEY,
];
