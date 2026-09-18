// Supabase implementations of the Wave 9 admin-panel endpoints (adminApi.js):
// FAQ / CMS / Broadcast / Email templates / Dashboard counts. Same exported
// return shapes ({status, message, result, count}) so the screens don't change.
// Writes are gated by the super_admin RLS policies from 20260703000007.
import { supabase } from "./supabase";
import crypto from "./crypto";
import { Customdecryptdata } from "../lib/CustomData";

const secretKey = crypto.cryptoSecretKey;

// FormData w/ encrypted `token` part (+ optional image/video files) → fields+files
function parsePayload(data) {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const token = data.get("token");
    const image = data.get("image");
    const video = data.get("video");
    const fields = token ? Customdecryptdata(token, secretKey) : {};
    return {
      fields: fields || {},
      image: image && image.name ? image : null,
      video: video && video.name ? video : null,
    };
  }
  return { fields: data || {}, image: null, video: null };
}

// Public asset upload (FAQ/broadcast images, FAQ videos) → public URL
async function uploadAsset(file, prefix) {
  if (!file) return undefined;
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return undefined;
  const path = `${u.user.id}/${prefix}-${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("team-logos").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });
  if (error) return undefined;
  return supabase.storage.from("team-logos").getPublicUrl(path).data.publicUrl;
}

const fail = (err) => ({ status: false, message: err?.message || "Something went wrong!" });

// ─── FAQ ─────────────────────────────────────────────────────────
const faqRow = (f) => f && ({
  _id: f.id, question: f.question, answer: f.answer, image: f.image, video: f.video,
  // null = All Sports; the UI badges on this
  sportId: f.sport_id ?? null,
  sportName: f.sports?.name ?? null,
  createdAt: f.created_at, updatedAt: f.updated_at,
});

export const listAllFaq = async (reqData = {}) => {
  const { sportId } = reqData;
  // A LIST, not a lookup: the admin sees this sport's FAQs PLUS the shared ones
  // (sport_id null = All Sports), never another sport's.
  let q = supabase.from("faqs").select("*, sports(name)", { count: "exact" });
  if (sportId) q = q.or(`sport_id.eq.${sportId},sport_id.is.null`);
  const { data, error, count } = await q.order("created_at", { ascending: false });
  if (error) return fail(error);
  return { status: true, message: "Faq listed successfully", result: (data ?? []).map(faqRow), count: count ?? 0 };
};

export const AddFaq = async (data) => {
  const { fields, image, video } = parsePayload(data);
  const [imageUrl, videoUrl] = await Promise.all([uploadAsset(image, "faq"), uploadAsset(video, "faq")]);
  const { error } = await supabase.from("faqs").insert({
    question: fields.question ?? "", answer: fields.answer ?? "",
    image: imageUrl ?? "", video: videoUrl ?? "",
    // "All Sports" is stored as null. The form sends allSports explicitly so a
    // missing sportId can never be mistaken for a deliberate shared row.
    sport_id: fields.allSports ? null : fields.sportId ?? null,
  });
  if (error) return fail(error);
  return { status: true, message: "Faq added successfully" };
};

export const EditFaq = async (data) => {
  const { fields, image, video } = parsePayload(data);
  const update = {
    question: fields.question ?? "", answer: fields.answer ?? "",
    updated_at: new Date().toISOString(),
  };
  // Scope IS editable here, unlike email templates. An FAQ is a standalone list
  // entry: moving one between All Sports and a single sport only changes who
  // sees that row. Nothing resolves against it and nothing falls back to it, so
  // there is no equivalent of an email template's 404.
  if (fields.allSports !== undefined) {
    update.sport_id = fields.allSports === true || fields.allSports === "true"
      ? null
      : fields.sportId ?? null;
  }
  const [imageUrl, videoUrl] = await Promise.all([uploadAsset(image, "faq"), uploadAsset(video, "faq")]);
  if (imageUrl) update.image = imageUrl;
  if (videoUrl) update.video = videoUrl;
  const { error } = await supabase.from("faqs").update(update).eq("id", fields.faqId ?? fields._id);
  if (error) return fail(error);
  return { status: true, message: "Faq updated successfully" };
};

export const DeleteFaq = async (data) => {
  const id = data?.faqId ?? data?._id;
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) return fail(error);
  return { status: true, message: "Faq deleted successfully" };
};

// ─── CMS ─────────────────────────────────────────────────────────
export const getCmsList = async () => {
  const { data, error, count } = await supabase
    .from("cms").select("*", { count: "exact" }).order("created_at");
  if (error) return fail(error);
  const result = (data ?? []).map((c) => ({
    _id: c.id, identifier: c.identifier, title: c.title, content: c.content,
    createdAt: c.created_at, updatedAt: c.updated_at,
  }));
  return { status: true, message: "Cms listed successfully", result, count: count ?? 0 };
};

export const EditCms = async (data) => {
  const { fields } = parsePayload(data);
  const { error } = await supabase.from("cms").update({
    identifier: fields.identifier ?? "", title: fields.title ?? "",
    content: fields.content ?? "", updated_at: new Date().toISOString(),
  }).eq("id", fields.cmsId ?? fields._id);
  if (error) return fail(error);
  return { status: true, message: "Cms updated successfully" };
};

// ─── Broadcast (row + FCM broadcast via the push edge fn) ────────
const pushBroadcast = (title, content) =>
  supabase.functions.invoke("push", { body: { broadcast: true, title, body: content } })
    .then(({ error }) => error && console.log("BROADCAST-PUSH-ERR", error.message))
    .catch((e) => console.log("BROADCAST-PUSH-EXC", e?.message || e));

export const AddBroadcast = async (data) => {
  const { fields, image } = parsePayload(data);
  const imageUrl = await uploadAsset(image, "broadcast");
  const { error } = await supabase.from("broadcasts").insert({
    title: fields.title ?? "", content: fields.content ?? "", image: imageUrl ?? "",
  });
  if (error) return fail(error);
  pushBroadcast(fields.title ?? "", fields.content ?? ""); // fire-and-forget
  return { status: true, message: "Broadcast sent successfully" };
};

export const listAllBroadCast = async () => {
  const { data, error, count } = await supabase
    .from("broadcasts").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (error) return fail(error);
  const result = (data ?? []).map((b) => ({
    _id: b.id, title: b.title, content: b.content, image: b.image,
    createdAt: b.created_at, updatedAt: b.updated_at,
  }));
  return { status: true, message: "Broadcast listed successfully", result, count: count ?? 0 };
};

export const DeleteBroadCastNotify = async (data) => {
  const id = data?.broadcastId ?? data?._id;
  const { error } = await supabase.from("broadcasts").delete().eq("id", id);
  if (error) return fail(error);
  return { status: true, message: "Broadcast deleted successfully" };
};

export const ResendBroadCastNotify = async (data) => {
  const id = data?.broadcastId ?? data?._id;
  const { data: row, error } = await supabase.from("broadcasts").select("*").eq("id", id).maybeSingle();
  if (error || !row) return fail(error || { message: "Broadcast not found" });
  pushBroadcast(row.title, row.content);
  return { status: true, message: "Broadcast resent successfully" };
};

// ─── Email templates ─────────────────────────────────────────────
export const getEmailTemplate = async (reqData = {}) => {
  const { sportId } = reqData;
  // Same shape as FAQ: this sport's overrides plus the shared rows every sport
  // falls back to. send-email picks the winner at send time.
  // Embed the sport so the row can be labelled with ITS OWN sport rather than
  // whichever one happens to be active — otherwise a row belonging to another
  // sport would be mislabelled if it ever appeared in this list.
  let q = supabase.from("email_templates").select("*, sports(name)");
  if (sportId) q = q.or(`sport_id.eq.${sportId},sport_id.is.null`);
  const { data, error } = await q.order("identifier");
  if (error) return fail(error);
  const result = (data ?? []).map((t) => ({
    _id: t.id, identifier: t.identifier, subject: t.subject, content: t.content,
    sportId: t.sport_id ?? null,
    sportName: t.sports?.name ?? null,
    createdAt: t.created_at, updatedAt: t.updated_at,
  }));
  return { status: true, message: "Email templates listed successfully", result };
};

export const AddTemplate = async (data) => {
  const { fields } = parsePayload(data);
  const identifier = String(fields.identifier ?? "").trim();
  if (!identifier) return { status: false, message: "Identifier is required" };
  // Developers reference templates by this string from code, so keep it to a
  // predictable shape rather than free text with spaces or punctuation.
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    return { status: false, message: "Identifier may only contain letters, numbers and underscores" };
  }
  if (!fields.subject) return { status: false, message: "Subject is required" };

  // null = All Sports. allSports is sent explicitly so a missing sportId is
  // never mistaken for a deliberate shared row.
  const sport_id = fields.allSports ? null : fields.sportId ?? null;
  if (!fields.allSports && !sport_id) {
    return { status: false, message: "No active sport selected" };
  }

  // Pre-check the (identifier, sport) pair so the admin gets a sentence rather
  // than a raw 23505 from email_templates_identifier_sport_uq.
  let dupQ = supabase.from("email_templates").select("id").eq("identifier", identifier);
  dupQ = sport_id ? dupQ.eq("sport_id", sport_id) : dupQ.is("sport_id", null);
  const { data: dup } = await dupQ.limit(1);
  if (dup?.length) {
    return {
      status: false,
      message: sport_id
        ? "This sport already has a template with that identifier"
        : "An All Sports template with that identifier already exists",
    };
  }

  const { error } = await supabase.from("email_templates").insert({
    identifier,
    subject: fields.subject ?? "",
    content: fields.content ?? "",
    sport_id,
  });
  if (error) {
    if (error.code === "23505") return { status: false, message: "That identifier already exists for this scope" };
    return fail(error);
  }
  return { status: true, message: "Email template added successfully" };
};

export const EditTemplate = async (data) => {
  const { fields } = parsePayload(data);
  const { error } = await supabase.from("email_templates").update({
    subject: fields.subject ?? "", content: fields.content ?? "",
    updated_at: new Date().toISOString(),
  }).eq("id", fields.templateId ?? fields._id);
  if (error) return fail(error);
  return { status: true, message: "Email template updated successfully" };
};

// ─── Contact-us reply (SEND_REPLAY_FOR_CONTACT_MAIL via send-email) ──
export const ReplyContactUs = async (data) => {
  const id = data?._id ?? data?.id;
  if (!id) return { status: false, message: "Contact request not found!" };
  const { data: row, error } = await supabase
    .from("contact_us").select("name, email").eq("id", id).maybeSingle();
  if (error || !row) return fail(error || { message: "Contact request not found!" });
  const { data: res, error: fnErr } = await supabase.functions.invoke("send-email", {
    body: {
      identifier: "SEND_REPLAY_FOR_CONTACT_MAIL",
      toEmail: row.email,
      content: { name: row.name, replayContent: data?.content ?? "" },
    },
  });
  if (fnErr) return fail(fnErr);
  if (res?.sent === false) return { status: false, message: res?.error ?? "Email not sent" };
  return { status: true, message: "Reply sent successfully" };
};

// ─── Voice curation (2026-08 rewrite — replaces UpdateSelectedVoices) ──────
// UpdateSelectedVoices had two bugs, one masking the other:
//  1. It filtered on "id" (the uuid PK) but the screen collected
//     record.voice_id (the ElevenLabs string id) — zero overlap between
//     those columns, so the update could never match a row. The Submit
//     button for preference has never actually worked.
//  2. It used full-replace semantics: everything NOT in the selected set got
//     preference=false. Fixing bug #1 alone would have activated this one —
//     the screen's selection only accumulates voices from pages the admin
//     has actually visited, so submitting from page 1 would have silently
//     wiped preference on every voice living on page 2+.
//
// This version takes an explicit per-voice diff and writes ONLY what
// changed, keyed by the real uuid PK. Also used for the tier (free/pro)
// toggle — same mechanism, same safety property.
//
// changes: { [voiceUuid]: { preference?: boolean, tier?: 'free' | 'pro' } }
export const UpdateVoiceCuration = async (changes) => {
  const entries = Object.entries(changes || {});
  if (!entries.length) return { status: true, message: "Nothing to update" };

  const idsWhere = (pred) => entries.filter(([, c]) => pred(c)).map(([id]) => id);
  const groups = [
    { ids: idsWhere((c) => c.preference === true), patch: { preference: true } },
    { ids: idsWhere((c) => c.preference === false), patch: { preference: false } },
    { ids: idsWhere((c) => c.tier === "free"), patch: { tier: "free" } },
    { ids: idsWhere((c) => c.tier === "pro"), patch: { tier: "pro" } },
  ].filter((g) => g.ids.length);

  // Sequential, not Promise.all — the old code raced two updates whose
  // predicates overlapped (undefined ordering). These groups are disjoint by
  // construction (a voice contributes preference=true XOR =false, same for
  // tier), so sequencing here is about not repeating that mistake, not about
  // correctness of THIS particular set.
  for (const { ids, patch } of groups) {
    const { error } = await supabase.from("voices").update(patch).in("id", ids);
    if (error) return fail(error);
  }
  return { status: true, message: "Voice settings updated successfully" };
};

export const UploadImage = async (data) => {
  const { fields, image } = parsePayload(data);
  const id = fields._id || fields.id;
  if (!id) return { status: false, message: "Voice not found!" };
  if (!image) return { status: false, message: "No image provided" };
  const path = `${id}-${Date.now()}-${image.name}`;
  const { error: upErr } = await supabase.storage.from("voice-images").upload(path, image, {
    contentType: image.type || "application/octet-stream", upsert: true,
  });
  if (upErr) return fail(upErr);
  const url = supabase.storage.from("voice-images").getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("voices").update({ image: url, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return fail(error);
  return { status: true, message: "Voice image updated successfully" };
};

// Sync Voices — refresh the catalog from ElevenLabs via the sync-voices edge
// fn (needs the ELEVENLABS_API_KEY secret; runs server-side, admin-only).
export const syncVoices = async () => {
  const { data, error } = await supabase.functions.invoke("sync-voices", { body: {} });
  if (error) return fail(error);
  if (data?.status === false) return { status: false, message: data?.message };
  return { status: true, message: data?.message ?? "Voices synced successfully" };
};

// ─── Dashboard counts ────────────────────────────────────────────
export const listCounts = async () => {
  // profiles RLS is self/org-scoped (no super_admin bypass) — a raw
  // count(*) here only ever sees the admin's own row. Reuse the same
  // SECURITY DEFINER RPC the Users page lists from (admin_list_users) so
  // this tile always agrees with what that page actually shows.
  const [users, teams] = await Promise.all([
    supabase.rpc("admin_list_users", { p_page: 1, p_limit: 1, p_search: "" }),
    supabase.from("teams").select("id", { count: "exact", head: true }).eq("team_status", true),
  ]);
  if (users.error || teams.error) return fail(users.error || teams.error);
  return {
    status: true,
    message: "Dashboard data",
    result: { UserCount: users.data?.count ?? 0, TeamCount: teams.count ?? 0 },
  };
};
