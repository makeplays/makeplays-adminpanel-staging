// Supabase reads for the admin panel's Events + Announcement Template pages
// (Wave 4). super_admin RLS lets the admin see every org's events. Wired into
// src/api/eventApi.js + src/api/adminApi.js behind USE_SUPABASE.event.
import { supabase } from './supabase';

const eventAdminRow = (e) => ({
  _id: e.id,
  name: e.title,
  eventType: e.event_type,
  date: e.starts_at,
  time: e.event_time,
  duration: e.duration,
  location: e.location,
  homeOrAway: e.home_or_away,
  maxPlayers: e.max_players,
  notes: e.notes,
  uniform: e.uniform,
  teamId: e.team ? { teamName: e.team.name, name: e.team.name } : null,
  opponent: e.opponentTeam
    ? { teamName: e.opponentTeam.name, name: e.opponentTeam.name }
    : e.opponent
    ? { teamName: e.opponent.team_name, name: e.opponent.team_name }
    : { teamName: 'TBD', name: 'TBD' },
  isFinished: e.is_finished,
  teamScore: e.team_score,
  opponentTeamScore: e.opponent_team_score,
  createdAt: e.created_at,
});

export const listAllEvent = async (reqData = {}) => {
  const page = Number(reqData.page) || 1;
  const limit = Number(reqData.limit) || 10;
  let q = supabase
    .from('events')
    .select(
      '*, team:teams!team_id(name), opponent:opponents(team_name), opponentTeam:teams!opponent_team_id(name)',
      { count: 'exact' },
    )
    .order('starts_at', { ascending: false });
  const search = reqData.search || reqData.title || reqData.name;
  if (search) q = q.ilike('title', `%${search}%`);
  q = q.range((page - 1) * limit, page * limit - 1);
  const { data, count, error } = await q;
  if (error) return { status: false, message: error.message };
  return { status: true, count: count ?? 0, message: 'Listed successfully', result: (data ?? []).map(eventAdminRow) };
};

export const DeleteEvent = async (data) => {
  const id = data?._id || data?.eventId || data?.id;
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Event deleted successfully.' };
};

export const listAllVoices = async (reqData = {}) => {
  const page = Number(reqData.page) || 1;
  const limit = Number(reqData.limit) || 10;
  let q = supabase.from('voices').select('*', { count: 'exact' }).order('name');
  const search = reqData.search || reqData.name;
  if (search) q = q.ilike('name', `%${search}%`);
  q = q.range((page - 1) * limit, page * limit - 1);
  const { data, count, error } = await q;
  if (error) return { status: false, message: error.message };
  return {
    status: true,
    count: count ?? 0,
    message: 'Listed successfully',
    result: (data ?? []).map((v) => ({
      _id: v.id,
      voice_id: v.voice_id,
      name: v.name,
      description: v.description,
      preview_url: v.preview_url,
      image: v.image,
      preference: v.preference,
    })),
  };
};

// Parse a phrase into text/variable chunks (parity with the backend). Text
// chunks carry an empty audioUrl map — regenerated per voice by the live screen.
const parsePhrase = (phrase = '') =>
  String(phrase)
    .split(/(\{[^}]+\})/g)
    .map((p) => {
      const t = (p || '').trim();
      if (!t) return null;
      if (/^\{[^}]+\}$/.test(t)) return { type: 'variable', value: t.slice(1, -1) };
      return { type: 'text', value: t, audioUrl: {} };
    })
    .filter(Boolean);

export const addAnnouncementTemplate = async (data = {}) => {
  const { error } = await supabase.from('announcement_templates').insert({
    category: data.category,
    type: data.type,
    phrase: data.phrase,
    parsed_chunks: parsePhrase(data.phrase),
    status: data.status || 'active',
  });
  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Announcement template added successfully' };
};

export const updateAnnouncementTemplate = async (data = {}) => {
  const id = data._id || data.id || data.templateId;
  if (!id) return { status: false, message: 'Template id missing' };
  const update = { updated_at: new Date().toISOString() };
  if (data.category !== undefined) update.category = data.category;
  if (data.type !== undefined) update.type = data.type;
  if (data.status !== undefined) update.status = data.status;
  if (data.phrase !== undefined) {
    update.phrase = data.phrase;
    update.parsed_chunks = parsePhrase(data.phrase); // re-parse; audios regen lazily
  }
  const { error } = await supabase.from('announcement_templates').update(update).eq('id', id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Announcement template updated successfully' };
};

export const deleteAnnouncementTemplate = async (data = {}) => {
  const id = data._id || data.id;
  const { error } = await supabase.from('announcement_templates').delete().eq('id', id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Announcement template deleted successfully' };
};

export const getAnnouncementTemplates = async (reqData = {}) => {
  const page = Number(reqData.page) || 1;
  const limit = Number(reqData.limit) || 10;
  let q = supabase
    .from('announcement_templates')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  const search = reqData.search || reqData.phrase;
  if (search) q = q.ilike('phrase', `%${search}%`);
  q = q.range((page - 1) * limit, page * limit - 1);
  const { data, count, error } = await q;
  if (error) return { status: false, message: error.message };
  return {
    status: true,
    count: count ?? 0,
    message: 'Listed successfully',
    result: (data ?? []).map((t) => ({
      _id: t.id,
      category: t.category,
      type: t.type,
      phrase: t.phrase,
      parsedChunks: t.parsed_chunks,
      status: t.status,
      createdAt: t.created_at,
    })),
  };
};
