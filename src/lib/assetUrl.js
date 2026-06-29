// Resolve an image/asset value to a renderable URL.
// During the Supabase migration a value may be either:
//   • a full Supabase Storage URL (https://...supabase.co/...)  → use as-is
//   • a legacy backend filename                                 → prepend the backend prefix
// This avoids the double-prefix bug (e.g. localhost:2005/Sports/https://...).
export const assetUrl = (value, legacyPrefix = "") => {
  if (!value || value === "undefined") return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `${legacyPrefix}${value}`;
};

export default assetUrl;
