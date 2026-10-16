// OTA Management — release notes, deployed bundles, native builds, audit.
// Same return shape as the rest of the panel ({status, message, result, count}).
//
// BACKED BY migration 20261014000001_ota_admin.sql (deploy bundle 82):
//   ota_release_notes  — What's New per release; written directly (RLS:
//                        active superadmin only), created through
//                        admin_ota_create_release_note so the slug is generated
//   bundles            — hot-updater's table; NO direct access. Read and
//                        toggled only through the admin_ota_* functions
//   ota_native_builds  — fingerprint → "iOS 1.0.5 (68)" labels
//   ota_audit_log      — every write, newest first
import { supabase } from "./supabase";

const fail = (err) => ({ status: false, message: err?.message || "Something went wrong!" });

export const OTA_MODES = [
  { value: "sheet", label: "Sheet", hint: "The full What's New. Users can close it." },
  { value: "banner", label: "Banner", hint: "One line across the top. Goes away by itself." },
  { value: "required", label: "Required", hint: "Must be acknowledged. No close button; back does nothing." },
  { value: "silent", label: "Silent", hint: "Nothing shown. For internal fixes." },
];

export const MAX_ITEMS = 8;

const noteRow = (n) => n && ({
  slug: n.slug,
  mode: n.mode,
  title: n.title,
  subtitle: n.subtitle || "",
  imageUrl: n.image_url || "",
  items: Array.isArray(n.items) ? n.items : [],
  ctaLabel: n.cta_label || "Got it",
  published: !!n.published,
  createdAt: n.created_at,
  updatedAt: n.updated_at,
});

const cleanItems = (items) =>
  (items || [])
    .map((it) => ({
      ...(it.icon ? { icon: it.icon } : {}),
      title: String(it.title || "").trim(),
      ...(String(it.body || "").trim() ? { body: String(it.body).trim() } : {}),
    }))
    .filter((it) => it.title)
    .slice(0, MAX_ITEMS);

// ── release notes ───────────────────────────────────────────────────────────
export async function listReleaseNotes() {
  try {
    const [{ data, error }, links] = await Promise.all([
      supabase.from("ota_release_notes").select("*").order("created_at", { ascending: false }),
      supabase.rpc("admin_ota_note_links"),
    ]);
    if (error) return fail(error);
    // slug → { android: {bundles, enabled}, ios: {...} }
    const bySlug = {};
    for (const l of links?.data || []) {
      bySlug[l.slug] = bySlug[l.slug] || {};
      bySlug[l.slug][l.platform] = { bundles: Number(l.bundles), enabled: Number(l.enabled_bundles) };
    }
    const result = (data || []).map((n) => ({ ...noteRow(n), links: bySlug[n.slug] || {} }));
    return { status: true, message: "", result, count: result.length };
  } catch (err) {
    return fail(err);
  }
}

export async function getReleaseNote(slug) {
  try {
    const { data, error } = await supabase.from("ota_release_notes").select("*").eq("slug", slug).maybeSingle();
    if (error) return fail(error);
    if (!data) return { status: false, message: "Those release notes no longer exist." };
    return { status: true, message: "", result: noteRow(data) };
  } catch (err) {
    return fail(err);
  }
}

export async function createReleaseNote(form) {
  try {
    const { data, error } = await supabase.rpc("admin_ota_create_release_note", {
      p_title: form.title.trim(),
      p_mode: form.mode,
      p_subtitle: form.subtitle,
      p_image_url: form.imageUrl,
      p_items: cleanItems(form.items),
      p_cta_label: form.ctaLabel,
      p_published: form.published,
    });
    if (error) return fail(error);
    return { status: true, message: "Release notes saved.", result: data };
  } catch (err) {
    return fail(err);
  }
}

export async function updateReleaseNote(slug, form) {
  try {
    const { error } = await supabase
      .from("ota_release_notes")
      .update({
        mode: form.mode,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        image_url: form.imageUrl.trim() || null,
        items: cleanItems(form.items),
        cta_label: form.ctaLabel.trim() || "Got it",
        published: form.published,
      })
      .eq("slug", slug);
    if (error) return fail(error);
    return { status: true, message: "Release notes updated." };
  } catch (err) {
    return fail(err);
  }
}

export async function setReleaseNotePublished(slug, published) {
  try {
    const { error } = await supabase.from("ota_release_notes").update({ published }).eq("slug", slug);
    if (error) return fail(error);
    return { status: true, message: published ? "Published." : "Unpublished." };
  } catch (err) {
    return fail(err);
  }
}

// ── bundles ─────────────────────────────────────────────────────────────────
const bundleRow = (b) => b && ({
  _id: b.id,
  id: b.id,
  platform: b.platform,
  channel: b.channel,
  enabled: !!b.enabled,
  forceUpdate: !!b.should_force_update,
  message: b.message || "",
  gitCommit: b.git_commit_hash || "",
  fingerprint: b.fingerprint_hash || "",
  targetAppVersion: b.target_app_version || "",
  rolloutPercent: b.rollout_cohort_count == null ? 100 : Math.round(b.rollout_cohort_count / 10),
  createdAt: b.created_at,
  notesSlug: b.notes_slug || "",
  nativeLabel: b.native_label || "",
  isLive: !!b.is_live,
  fallbackId: b.fallback_id || null,
  bundleBytes: b.bundle_bytes == null ? null : Number(b.bundle_bytes),
  sizeChange: b.size_change == null ? null : Number(b.size_change),
});

export async function listBundles({ platform, channel, enabled, search, page = 1, limit = 10 } = {}) {
  try {
    const { data, error } = await supabase.rpc("admin_ota_list_bundles", {
      p_platform: platform || null,
      p_channel: channel || null,
      p_enabled: enabled === "" || enabled == null ? null : enabled === "true",
      p_search: search || null,
      p_offset: (Math.max(page, 1) - 1) * limit,
      p_limit: limit,
    });
    if (error) return fail(error);
    const rows = data || [];
    return { status: true, message: "", result: rows.map(bundleRow), count: Number(rows[0]?.total_count || 0) };
  } catch (err) {
    return fail(err);
  }
}

export async function setBundleEnabled(id, enabled, reason) {
  try {
    const { data, error } = await supabase.rpc("admin_ota_set_bundle_enabled", {
      p_id: id,
      p_enabled: enabled,
      p_reason: reason || null,
    });
    if (error) return fail(error);
    return { status: true, message: enabled ? "Bundle switched on." : "Bundle switched off.", result: data };
  } catch (err) {
    return fail(err);
  }
}

export async function rollbackToBundle(id, reason) {
  try {
    const { data, error } = await supabase.rpc("admin_ota_rollback_to", { p_id: id, p_reason: reason || null });
    if (error) return fail(error);
    const n = (data?.disabled || []).length;
    return {
      status: true,
      message: n ? `Rolled back: ${n} newer bundle${n === 1 ? "" : "s"} switched off.` : "This bundle is already the live one.",
      result: data,
    };
  } catch (err) {
    return fail(err);
  }
}

// ── native builds ───────────────────────────────────────────────────────────
export async function listNativeBuilds() {
  try {
    const { data, error } = await supabase.from("ota_native_builds").select("*").order("created_at", { ascending: false });
    if (error) return fail(error);
    const result = (data || []).map((b) => ({ _id: b.id, platform: b.platform, fingerprint: b.fingerprint_hash, label: b.label, createdAt: b.created_at }));
    return { status: true, message: "", result, count: result.length };
  } catch (err) {
    return fail(err);
  }
}

// A store build added by hand (builds made before the build hooks, or
// anything the hooks missed). Builds made since record themselves.
export async function addNativeBuild(b) {
  try {
    const n = b.buildNumber === "" || b.buildNumber == null ? null : Number(b.buildNumber);
    const label = String(b.label || "").trim() ||
      `${b.platform === "ios" ? "iOS" : "Android"} ${String(b.versionName || "").trim() || "?"} (${n ?? "?"})`;
    const { error } = await supabase.from("ota_native_builds").insert({
      platform: b.platform,
      fingerprint_hash: String(b.fingerprint || "").trim(),
      label,
      version_name: String(b.versionName || "").trim() || null,
      build_number: n,
      artifact_bytes: b.artifactMb ? Math.round(Number(b.artifactMb) * 1048576) : null,
      artifact_kind: b.artifactKind || null,
      distribution: b.distribution || "local",
      changelog: String(b.changelog || "").trim() || null,
      built_at: b.builtAt ? new Date(b.builtAt).toISOString() : null,
      recorded_by: "admin panel",
    });
    if (error) {
      if (error.code === "23505") return { status: false, message: "That build number is already recorded for this platform." };
      return fail(error);
    }
    return { status: true, message: "Store build added." };
  } catch (err) {
    return fail(err);
  }
}

export async function updateNativeBuild(id, b) {
  try {
    const { error } = await supabase.from("ota_native_builds").update({
      label: String(b.label || "").trim(),
      distribution: b.distribution,
      changelog: String(b.changelog || "").trim() || null,
    }).eq("id", id);
    if (error) return fail(error);
    return { status: true, message: "Store build updated." };
  } catch (err) {
    return fail(err);
  }
}

export async function getBuildTimeline(platform) {
  try {
    const { data, error } = await supabase.rpc("admin_ota_build_timeline", { p_platform: platform });
    if (error) return fail(error);
    return { status: true, message: "", result: { builds: data?.builds || [], unmatched: data?.unmatched || [] } };
  } catch (err) {
    return fail(err);
  }
}

export const formatBytes = (n) => {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1048576) return `${(n / 1048576).toFixed(abs >= 104857600 ? 0 : 1)} MB`;
  if (abs >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
};

export const formatChange = (n) => (n == null ? "" : n === 0 ? "no change" : `${n > 0 ? "▲" : "▼"} ${formatBytes(Math.abs(n))}`);

export async function deleteNativeBuild(id) {
  try {
    const { error } = await supabase.from("ota_native_builds").delete().eq("id", id);
    if (error) return fail(error);
    return { status: true, message: "Native build removed." };
  } catch (err) {
    return fail(err);
  }
}

// ── audit ───────────────────────────────────────────────────────────────────
export async function listAuditLog({ limit = 200 } = {}) {
  try {
    const { data, error } = await supabase
      .from("ota_audit_log")
      .select("*")
      .order("at", { ascending: false })
      .limit(limit);
    if (error) return fail(error);
    const actors = [...new Set((data || []).map((r) => r.actor).filter(Boolean))];
    let names = {};
    if (actors.length) {
      const { data: people } = await supabase.from("profiles").select("id, first_name, last_name").in("id", actors);
      names = Object.fromEntries((people || []).map((p) => [p.id, [p.first_name, p.last_name].filter(Boolean).join(" ") || p.id.slice(0, 8)]));
    }
    const result = (data || []).map((r) => ({
      _id: r.id,
      at: r.at,
      actor: names[r.actor] || (r.actor ? r.actor.slice(0, 8) : "system"),
      action: r.action,
      target: r.target,
      reason: r.reason || "",
      before: r.before,
      after: r.after,
    }));
    return { status: true, message: "", result, count: result.length };
  } catch (err) {
    return fail(err);
  }
}

// ── release emails (deploy bundle 83) ──────────────────────────────────────
export async function getNotificationStatus() {
  try {
    const { data, error } = await supabase.rpc("admin_ota_notification_status");
    if (error) return fail(error);
    return { status: true, message: "", result: data };
  } catch (err) {
    return fail(err);
  }
}

export async function setEmailsEnabled(enabled) {
  try {
    const { error } = await supabase.rpc("admin_ota_set_emails_enabled", { p_enabled: enabled });
    if (error) return fail(error);
    return { status: true, message: enabled ? "Release emails are on." : "Release emails are off." };
  } catch (err) {
    return fail(err);
  }
}

export async function listRecipients() {
  try {
    const { data, error } = await supabase.from("ota_notify_recipients").select("*").order("created_at", { ascending: true });
    if (error) return fail(error);
    const result = (data || []).map((r) => ({ _id: r.id, email: r.email, name: r.name || "", platforms: r.platforms || [], active: !!r.active, createdAt: r.created_at }));
    return { status: true, message: "", result, count: result.length };
  } catch (err) {
    return fail(err);
  }
}

export async function addRecipient({ email, name, platforms }) {
  try {
    const { error } = await supabase.from("ota_notify_recipients").insert({
      email: String(email || "").trim().toLowerCase(),
      name: String(name || "").trim() || null,
      platforms,
    });
    if (error) {
      if (error.code === "23505") return { status: false, message: "That address is already on the list." };
      if (error.code === "23514") return { status: false, message: "Enter a valid email and pick at least one platform." };
      return fail(error);
    }
    return { status: true, message: "Recipient added." };
  } catch (err) {
    return fail(err);
  }
}

export async function updateRecipient(id, patch) {
  try {
    const { error } = await supabase.from("ota_notify_recipients").update(patch).eq("id", id);
    if (error) return fail(error);
    return { status: true, message: "Recipient updated." };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteRecipient(id) {
  try {
    const { error } = await supabase.from("ota_notify_recipients").delete().eq("id", id);
    if (error) return fail(error);
    return { status: true, message: "Recipient removed." };
  } catch (err) {
    return fail(err);
  }
}

export async function listNotifications({ limit = 50 } = {}) {
  try {
    const { data, error } = await supabase.from("ota_notifications").select("*").order("started_at", { ascending: false }).limit(limit);
    if (error) return fail(error);
    const result = (data || []).map((n) => ({
      _id: n.bundle_id,
      bundleId: n.bundle_id,
      startedAt: n.started_at,
      sentAt: n.sent_at,
      recipients: n.recipients,
      sent: n.sent,
      errors: Array.isArray(n.errors) ? n.errors : [],
    }));
    return { status: true, message: "", result, count: result.length };
  } catch (err) {
    return fail(err);
  }
}

// Emails the newest bundle's report to `to` (or every active recipient).
export async function sendTestEmail(to) {
  try {
    const { data, error } = await supabase.functions.invoke("ota-deployed", { body: { test: true, ...(to ? { to } : {}) } });
    if (error) {
      let message = error.message;
      try {
        message = (await error.context?.json())?.message || message;
      } catch {
        // keep the generic message
      }
      return { status: false, message };
    }
    return { status: !!data?.status, message: data?.message || "Sent." };
  } catch (err) {
    return fail(err);
  }
}

// ── deploy commands ─────────────────────────────────────────────────────────
// The project the panel talks to: production gets the guarded npm script,
// anything else (dev) the direct CLI, which deploy:ota refuses by design.
const PROD_REF = "spctbvwrxwxbqqenvmha";
export const isProductionProject = () =>
  String(process.env.REACT_APP_SUPABASE_URL || "").includes(PROD_REF);

export function deployCommands({ slug, force = false, channel = "" }) {
  const extra = `${force ? " -f" : ""}${channel && channel !== "production" ? ` -c ${channel}` : ""}`;
  const msg = `-m "notes:${slug}"`;
  const line = (p) =>
    isProductionProject()
      ? `npm run deploy:ota -- -p ${p} ${msg}${extra}`
      : `npx hot-updater deploy -p ${p} ${msg}${extra}`;
  return { android: line("android"), ios: line("ios") };
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the textarea copy
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
