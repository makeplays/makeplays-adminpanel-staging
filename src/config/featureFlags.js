// Per-module migration flags (Backend→Supabase) for the admin panel.
// Flip a module to `true` once its Supabase path is verified; flip back to
// `false` to fall back to the legacy backend instantly.
// Keep ALL flags false until the owning wave's test break passes.
// Mirrors makeplays-IOS/frontend/App/Actions/Constatnt/featureFlags.ts.
export const USE_SUPABASE = {
  auth: true, // Wave 1 (Supabase) — flip to false to fall back to legacy backend
  team: false, // Wave 2
  member: false, // Wave 3
  event: false, // Wave 4
  volunteer: false, // Wave 5
  announcement: false, // Wave 6 (voices, voice templates, announcement templates)
  playlist: false, // Wave 7
  admin: false, // Wave 9 (plans, versions, faq, broadcast, cms, email templates)
};

export default USE_SUPABASE;
