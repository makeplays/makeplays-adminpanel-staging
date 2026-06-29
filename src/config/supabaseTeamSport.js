// Supabase implementations of the admin sport/team APIs (Wave 2).
// Wired into src/api/sportApi.js + teamApi.js behind USE_SUPABASE.team.
// Returns legacy-shaped (Mongo) rows so the admin screens stay unchanged.
import { supabase } from "./supabase";
import crypto from "./crypto";
import { Customdecryptdata } from "../lib/CustomData";

const secretKey = crypto.cryptoSecretKey;

// Admin write pages post FormData { token: <crypto-js encrypted fields>, image?: File }.
// Decrypt the token (we're dropping crypto-js, but the screens still encrypt) and
// pull out any uploaded image file.
function parseAdminPayload(data) {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const token = data.get("token");
    const image = data.get("image");
    const fields = token ? Customdecryptdata(token, secretKey) : {};
    return { fields: fields || {}, image: image && image.name ? image : null };
  }
  return { fields: data || {}, image: null };
}

// Upload a sport logo to the public team-logos bucket under the admin's uid folder
// (satisfies the owner-folder storage policy). Returns a public URL or undefined.
async function uploadSportImage(image) {
  if (!image) return undefined;
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return undefined;
  const path = `${u.user.id}/sport-${Date.now()}-${image.name}`;
  const { error } = await supabase.storage.from("team-logos").upload(path, image, {
    contentType: image.type || "image/jpeg",
    upsert: true,
  });
  if (error) return undefined;
  return supabase.storage.from("team-logos").getPublicUrl(path).data.publicUrl;
}

const sportRow = (s) =>
  s && {
    _id: s.id, name: s.name, image: s.image, description: s.description,
    rulesAndRegulations: s.rules_and_regulations, activate: s.activate,
    createdAt: s.created_at, updatedAt: s.updated_at,
  };

const teamRow = (t) =>
  t && {
    _id: t.id, teamName: t.name, teamLogo: t.logo_url ?? "",
    coachName: t.coach_name, coachEmail: t.coach_email,
    ageCriteria: t.age_criteria, leagueOrClubName: t.league_or_club_name,
    location: t.location, country: t.country, state: t.state, city: t.city,
    inviteCode: t.invite_code, teamStatus: t.team_status,
    sportId: t.sports ? sportRow(t.sports) : t.sport_id,
    organization: t.organizations ? { _id: t.organizations.id, name: t.organizations.name } : null,
    creatorId: t.creator_id, coachId: t.coach_id,
    createdAt: t.created_at, updatedAt: t.updated_at,
  };

const idOf = (d) => d?.id || d?._id || d?.teamId || d?.sportId || d?.sportsId;

// ─── Sports ────────────────────────────────────────────────────────────────
export const AddSports = async (data) => {
  const { fields, image } = parseAdminPayload(data);
  const imageUrl = await uploadSportImage(image);
  const { error } = await supabase.from("sports").insert({
    name: fields.name ?? "",
    image: imageUrl ?? fields.image ?? "",
    description: fields.description ?? "",
    rules_and_regulations: fields.rulesAndRegulations ?? fields.rules_and_regulations ?? "",
    activate: fields.activate ?? true,
  });
  if (error) return { status: false, message: error.message };
  return { status: true, message: "Sport added successfully" };
};

export const listAllSports = async (reqData = {}) => {
  const page = Number(reqData.page) || 1;
  const limit = Number(reqData.limit) || 10;
  let q = supabase.from("sports").select("*", { count: "exact" }).order("name");
  if (reqData.search) q = q.ilike("name", `%${reqData.search}%`);
  q = q.range((page - 1) * limit, page * limit - 1);
  const { data, count, error } = await q;
  if (error) return { status: false, message: error.message };
  return { status: true, count: count ?? 0, message: "Listed successfully", result: (data ?? []).map(sportRow) };
};

export const EditSports = async (data) => {
  const { fields, image } = parseAdminPayload(data);
  const id = idOf(fields);
  if (!id) return { status: false, message: "Sport id missing" };
  const update = { updated_at: new Date().toISOString() };
  if (fields.name !== undefined) update.name = fields.name;
  if (fields.description !== undefined) update.description = fields.description;
  if (fields.rulesAndRegulations !== undefined) update.rules_and_regulations = fields.rulesAndRegulations;
  const imageUrl = await uploadSportImage(image);
  if (imageUrl) update.image = imageUrl;
  else if (fields.image !== undefined) update.image = fields.image;
  const { error } = await supabase.from("sports").update(update).eq("id", id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: "Sport updated successfully" };
};

export const DeleteSports = async (data) => {
  const { error } = await supabase.from("sports").delete().eq("id", idOf(data));
  if (error) return { status: false, message: error.message };
  return { status: true, message: "Sport deleted successfully" };
};

export const ActivateSports = async (data) => {
  const id = idOf(data);
  const { data: cur } = await supabase.from("sports").select("activate").eq("id", id).single();
  const next = !cur?.activate;
  const { error } = await supabase.from("sports").update({ activate: next }).eq("id", id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: next ? "Sport activated successfully" : "Sport deactivated successfully" };
};

// ─── Teams ───────────────────────────────────────────────────────────────────
const teamSelect = "*, sports(*), organizations(id,name)";

export const listAllTeam = async (reqData = {}) => {
  const page = Number(reqData.page) || 1;
  const limit = Number(reqData.limit) || 10;
  let q = supabase.from("teams").select(teamSelect, { count: "exact" }).order("created_at", { ascending: false });
  if (reqData.search) q = q.ilike("name", `%${reqData.search}%`);
  q = q.range((page - 1) * limit, page * limit - 1);
  const { data, count, error } = await q;
  if (error) return { status: false, message: error.message };
  return { status: true, count: count ?? 0, message: "Listed successfully", result: (data ?? []).map(teamRow) };
};

export const listAllTeams = async () => {
  const { data, error } = await supabase.from("teams").select(teamSelect).order("name");
  if (error) return { status: false, message: error.message };
  return { status: true, count: data?.length ?? 0, message: "Listed successfully", result: (data ?? []).map(teamRow) };
};

export const EditTeams = async (data) => {
  const { fields } = parseAdminPayload(data);
  const id = idOf(fields);
  if (!id) return { status: false, message: "Team id missing" };
  const update = { updated_at: new Date().toISOString() };
  const map = {
    teamName: "name", ageCriteria: "age_criteria", leagueOrClubName: "league_or_club_name",
    location: "location", country: "country", state: "state", city: "city",
    coachName: "coach_name", coachEmail: "coach_email", sportId: "sport_id",
  };
  for (const [src, col] of Object.entries(map)) if (fields[src] !== undefined) update[col] = fields[src];
  const { error } = await supabase.from("teams").update(update).eq("id", id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: "Team updated successfully" };
};

export const getSports = async () => {
  const { data, error } = await supabase.from("sports").select("*").order("name");
  if (error) return { status: false, message: error.message };
  return { status: true, message: "Listed successfully", result: (data ?? []).map(sportRow) };
};

export const DeleteTeam = async (data) => {
  // soft delete (parity with mobile team_status)
  const { error } = await supabase.from("teams").update({ team_status: false }).eq("id", idOf(data));
  if (error) return { status: false, message: error.message };
  return { status: true, message: "Team deleted successfully" };
};
