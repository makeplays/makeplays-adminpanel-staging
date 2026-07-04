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
  createdAt: f.created_at, updatedAt: f.updated_at,
});

export const listAllFaq = async () => {
  const { data, error, count } = await supabase
    .from("faqs").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (error) return fail(error);
  return { status: true, message: "Faq listed successfully", result: (data ?? []).map(faqRow), count: count ?? 0 };
};

export const AddFaq = async (data) => {
  const { fields, image, video } = parsePayload(data);
  const [imageUrl, videoUrl] = await Promise.all([uploadAsset(image, "faq"), uploadAsset(video, "faq")]);
  const { error } = await supabase.from("faqs").insert({
    question: fields.question ?? "", answer: fields.answer ?? "",
    image: imageUrl ?? "", video: videoUrl ?? "",
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
export const getEmailTemplate = async () => {
  const { data, error } = await supabase.from("email_templates").select("*").order("identifier");
  if (error) return fail(error);
  const result = (data ?? []).map((t) => ({
    _id: t.id, identifier: t.identifier, subject: t.subject, content: t.content,
    createdAt: t.created_at, updatedAt: t.updated_at,
  }));
  return { status: true, message: "Email templates listed successfully", result };
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

// ─── Dashboard counts ────────────────────────────────────────────
export const listCounts = async () => {
  const [users, teams] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("teams").select("id", { count: "exact", head: true }).eq("team_status", true),
  ]);
  if (users.error || teams.error) return fail(users.error || teams.error);
  return {
    status: true,
    message: "Dashboard data",
    result: { UserCount: users.count ?? 0, TeamCount: teams.count ?? 0 },
  };
};
