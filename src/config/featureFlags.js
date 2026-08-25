// Per-module migration flags (Backend→Supabase) for the admin panel.
// Flip a module to `true` once its Supabase path is verified; flip back to
// `false` to fall back to the legacy backend instantly.
// Keep ALL flags false until the owning wave's test break passes.
//
// Only the flags below are checked anywhere in this app (verified: every
// `USE_SUPABASE.x` reference across api/*.js resolves to one of these six).
// volunteer/announcement/playlist flags from the mobile app's equivalent
// file don't apply here — the admin panel has no volunteer/playlist
// screens, and its announcement-template screens are gated by `event`
// instead — so they were removed rather than kept as dead placeholders.
export const USE_SUPABASE = {
  auth: true, // Wave 1 (Supabase) — flip to false to fall back to legacy backend
  team: true, // Wave 2 (Supabase)
  member: true, // Wave 3 (Supabase)
  event: true, // Wave 4
  voice: true, // Wave 6a (AI voice catalog) — Supabase
  admin: true, // Wave 9 (Supabase) — faq/cms/broadcast/email templates/dashboard counts
};

export default USE_SUPABASE;
