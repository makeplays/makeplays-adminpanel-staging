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
  // _id added (Wave 10 audit fix) — EditEventsPage needs teamId._id to look up
  // opponent teams; previously undefined so that lookup silently did nothing.
  teamId: e.team_id ? { _id: e.team_id, teamName: e.team?.name, name: e.team?.name } : null,
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

// EditEvent (Wave 10 audit fix — was 100% legacy despite event=true).
// Field map mirrors the backend's updateEvents; `title` is deliberately left
// untouched (EditEventsPage's form has no title field, same as legacy, where
// Reqdata.title was always undefined and a no-op under Mongoose $set).
export const EditEvent = async (data) => {
  const id = data?._id || data?.eventId || data?.id;
  if (!id) return { status: false, message: 'Event does not exists!' };
  const update = { updated_at: new Date().toISOString() };
  const map = {
    eventType: 'event_type', maxPlayers: 'max_players', date: 'starts_at',
    duration: 'duration', location: 'location', homeOrAway: 'home_or_away',
    time: 'event_time', arrive: 'arrive', uniform: 'uniform', notes: 'notes',
    notifyTeam: 'notify_team',
  };
  for (const [src, col] of Object.entries(map)) if (data?.[src] !== undefined) update[col] = data[src];
  if (data?.opponent !== undefined) {
    // admin's opponent Select always picks a registered TEAM (getOpponetTeams
    // below only lists teams), so it always resolves to opponent_team_id.
    update.opponent_team_id = data.opponent || null;
    update.opponent_id = null;
  }
  const { error } = await supabase.from('events').update(update).eq('id', id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Event updated successfully.' };
};

// getOpponetTeams (Wave 10 audit fix): other teams with the SAME sport,
// excluding the current team — mirrors the backend's teamSchema.find({sportId, _id:{$ne}}).
export const getOpponetTeams = async (data) => {
  const teamId = data?.teamId;
  if (!teamId) return { status: false, message: 'Team does not exists!' };
  const { data: team } = await supabase.from('teams').select('id, sport_id').eq('id', teamId).maybeSingle();
  if (!team) return { status: false, message: 'Team does not exists!' };
  let q = supabase.from('teams').select('id, name').neq('id', teamId);
  q = team.sport_id ? q.eq('sport_id', team.sport_id) : q.is('sport_id', null);
  const { data: teams, error } = await q;
  if (error) return { status: false, message: error.message };
  return {
    status: true, message: 'Listed successfully',
    result: (teams ?? []).map((t) => ({ _id: t.id, teamName: t.name, name: t.name })),
  };
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

// Fire the template-audio sync (all voices, storage-verified) — best-effort so a
// slow/failed generation never blocks the save from reporting success.
const syncTemplateAudios = async (templateId) => {
  try { await supabase.functions.invoke('announcement-tts', { body: { templateId } }); }
  catch (e) { console.log('announcement-tts sync err', e?.message || e); }
};

export const addAnnouncementTemplate = async (data = {}) => {
  const { data: row, error } = await supabase.from('announcement_templates').insert({
    category: data.category,
    type: data.type,
    phrase: data.phrase,
    parsed_chunks: parsePhrase(data.phrase),
    status: data.status || 'active',
  }).select('id').single();
  if (error) return { status: false, message: error.message };
  await syncTemplateAudios(row.id); // generate chunk audios for all voices
  return { status: true, message: 'Announcement template added successfully' };
};

export const updateAnnouncementTemplate = async (data = {}) => {
  const id = data._id || data.id || data.templateId;
  if (!id) return { status: false, message: 'Template id missing' };
  const { data: existing } = await supabase
    .from('announcement_templates').select('phrase, parsed_chunks').eq('id', id).single();
  const update = { updated_at: new Date().toISOString() };
  if (data.category !== undefined) update.category = data.category;
  if (data.type !== undefined) update.type = data.type;
  if (data.status !== undefined) update.status = data.status;
  const phraseChanged = data.phrase !== undefined && data.phrase !== existing?.phrase;
  if (phraseChanged) {
    update.phrase = data.phrase;
    // re-parse, carrying over existing audioUrl for unchanged text values
    const prevAudio = {};
    for (const c of existing?.parsed_chunks || []) if (c.type === 'text') prevAudio[c.value] = c.audioUrl || {};
    update.parsed_chunks = parsePhrase(data.phrase).map((c) =>
      c.type === 'text' ? { ...c, audioUrl: prevAudio[c.value] || {} } : c,
    );
  }
  const { error } = await supabase.from('announcement_templates').update(update).eq('id', id);
  if (error) return { status: false, message: error.message };
  await syncTemplateAudios(id); // verify storage + generate any missing chunk/voice audios
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
