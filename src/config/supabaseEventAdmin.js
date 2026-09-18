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
  // event_end_time is set on 315 of production's 327 events and was simply
  // never mapped, so the admin had no end time to show and fell back to
  // `duration` — a text column the app derives, which renders as "-47:00" when
  // an event crosses midnight. Start and End are what the Add Event form asks
  // for; duration stays mapped for the edit screen, which still writes it.
  endTime: e.event_end_time,
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
  const { sportId } = reqData;
  if (!sportId) return { status: false, message: 'No active sport selected', count: 0, result: [] };
  let q = supabase
    .from('events')
    .select(
      // !inner so the sport filter on the embedded team actually restricts the
      // rows. events has a `sport` text column but no sport_id FK, and the
      // team's sport is the authoritative answer anyway — an event belongs to
      // whatever sport its team plays.
      '*, team:teams!team_id!inner(name, sport_id), opponent:opponents(team_name), opponentTeam:teams!opponent_team_id(name)',
      { count: 'exact' },
    )
    .eq('team.sport_id', sportId)
    .order('starts_at', { ascending: false });
  // The Teams dropdown on the Events page has always passed a teamId and this
  // function never read it, so choosing a team narrowed nothing — the table
  // kept showing every team's events for the sport. listAllMember has had the
  // equivalent line all along, which is why Members filtered and Events did
  // not. Absent teamId (the "All Teams" default) leaves the query unfiltered.
  if (reqData.teamId) q = q.eq('team_id', reqData.teamId);
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

  // How many teams are currently ON each voice — the context an admin needs
  // before Pro-locking one (existing teams keep it either way, per the
  // grandfather rule in enforce_team_voice_change, but an admin should know
  // they're about to Pro-lock the voice 12 teams picked). RLS's
  // "teams: super_admin read" policy has no org restriction, so this sees
  // every team, not just the admin's own org.
  const { data: usage } = await supabase.from('teams').select('voice_id').not('voice_id', 'is', null);
  const countByVoice = (usage ?? []).reduce((m, t) => {
    m[t.voice_id] = (m[t.voice_id] ?? 0) + 1;
    return m;
  }, {});

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
      tier: v.tier,
      teamCount: countByVoice[v.id] ?? 0,
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
  const { sportId, categoryId, typeId } = data;
  if (!sportId) return { status: false, message: 'No active sport selected' };
  if (!categoryId) return { status: false, message: 'Category is required' };

  // The text columns stay authoritative for mobile (fetchAnnouncementChunks
  // groups by category/type strings) and for announcement-tts, which resolves
  // the type row by (category, type). Resolve them from the ids so the two
  // representations cannot drift.
  const [{ data: cat }, { data: ty }] = await Promise.all([
    supabase.from('announcement_categories').select('name').eq('id', categoryId).maybeSingle(),
    typeId
      ? supabase.from('announcement_types').select('type').eq('id', typeId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!cat) return { status: false, message: 'Category not found' };

  const { data: row, error } = await supabase.from('announcement_templates').insert({
    sport_id: sportId,
    category_id: categoryId,
    type_id: typeId || null,
    category: cat.name,
    type: ty?.type ?? data.type,
    phrase: data.phrase,
    parsed_chunks: parsePhrase(data.phrase),
    status: data.status || 'active',
  }).select('id').single();
  if (error) return { status: false, message: error.message };
  await syncTemplateAudios(row.id); // generate chunk audios for this sport's voices
  return { status: true, message: 'Announcement template added successfully' };
};

export const updateAnnouncementTemplate = async (data = {}) => {
  const id = data._id || data.id || data.templateId;
  if (!id) return { status: false, message: 'Template id missing' };
  const { data: existing } = await supabase
    .from('announcement_templates').select('phrase, parsed_chunks').eq('id', id).single();
  const update = { updated_at: new Date().toISOString() };
  if (data.status !== undefined) update.status = data.status;

  // Category/type move together with their ids so the FK and the text column
  // can never disagree — mobile groups on the text, announcement-tts resolves
  // the type row by it, and a mismatch would silently hide phrases.
  if (data.categoryId !== undefined) {
    const { data: cat } = await supabase
      .from('announcement_categories').select('name').eq('id', data.categoryId).maybeSingle();
    if (!cat) return { status: false, message: 'Category not found' };
    update.category_id = data.categoryId;
    update.category = cat.name;
  } else if (data.category !== undefined) {
    update.category = data.category;
  }

  if (data.typeId !== undefined) {
    const { data: ty } = await supabase
      .from('announcement_types').select('type').eq('id', data.typeId).maybeSingle();
    update.type_id = data.typeId || null;
    if (ty) update.type = ty.type;
  } else if (data.type !== undefined) {
    update.type = data.type;
  }
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
  const { sportId } = reqData;
  // Refuse rather than silently listing every sport's phrases. Callers pass the
  // active sport; a missing one is a bug in the caller, and returning unscoped
  // rows would be the exact cross-contamination this work exists to prevent.
  if (!sportId) return { status: false, message: 'No active sport selected', count: 0, result: [] };
  let q = supabase
    .from('announcement_templates')
    .select('*', { count: 'exact' })
    .eq('sport_id', sportId)
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
      // ids so the edit form can preselect the dropdowns without matching on text
      categoryId: t.category_id,
      typeId: t.type_id,
      sportId: t.sport_id,
      phrase: t.phrase,
      parsedChunks: t.parsed_chunks,
      status: t.status,
      createdAt: t.created_at,
    })),
  };
};

// ─── Announcement categories & types (admin-managed, per sport) ──────────────
// Categories and their types used to live in a hardcoded CATEGORY_TYPE_MAP in
// AddAnnouncementTemplatePage.jsx. That map mixed hockey and soccer concepts
// and could not be extended without a release — and production data had already
// outgrown it (Lineup carries Goalie/Intro/Outro/Player/Forwards/Defense, while
// the map allowed only lineup:['General']). These read/write the rows added by
// 20260916000001_announcement_sport_scope.sql instead.

const categoryRow = (c) => ({
  _id: c.id,
  sportId: c.sport_id,
  name: c.name,
  label: c.label || c.name,
  variables: Array.isArray(c.variables) ? c.variables : [],
  sortOrder: c.sort_order,
  status: c.status,
  createdAt: c.created_at,
});

const typeRow = (t) => ({
  _id: t.id,
  sportId: t.sport_id,
  categoryId: t.category_id,
  category: t.category,
  type: t.type,
  audioUrl: t.audio_url || {},
  status: t.status,
  createdAt: t.created_at,
});

export const listAnnouncementCategories = async (reqData = {}) => {
  const { sportId } = reqData;
  if (!sportId) return { status: false, message: 'No active sport selected' };
  const { data, error } = await supabase
    .from('announcement_categories')
    .select('*')
    .eq('sport_id', sportId)
    .order('sort_order')
    .order('name');
  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Listed successfully', result: (data ?? []).map(categoryRow) };
};

export const addAnnouncementCategory = async (data = {}) => {
  const { sportId, name, label, variables } = data;
  if (!sportId) return { status: false, message: 'No active sport selected' };
  if (!name) return { status: false, message: 'Category name is required' };
  const { error } = await supabase.from('announcement_categories').insert({
    sport_id: sportId,
    // stored lowercase to match announcement_templates.category, which mobile
    // still groups by (fetchAnnouncementChunks)
    name: String(name).trim().toLowerCase(),
    label: (label || name).trim(),
    variables: variables ?? [],
  });
  if (error) {
    // 23505 = the (sport_id, lower(name)) unique index
    if (error.code === '23505') return { status: false, message: 'That category already exists for this sport' };
    return { status: false, message: error.message };
  }
  return { status: true, message: 'Category added successfully' };
};

export const updateAnnouncementCategory = async (data = {}) => {
  const id = data._id || data.id;
  if (!id) return { status: false, message: 'Category id missing' };
  const update = {};
  if (data.label !== undefined) update.label = String(data.label).trim();
  if (data.variables !== undefined) update.variables = data.variables ?? [];
  if (data.status !== undefined) update.status = data.status;
  // `name` is deliberately NOT editable here: announcement_templates.category
  // and announcement_types.category still carry it as text, and mobile groups
  // on those values. Renaming would need a transaction across three tables;
  // the display `label` covers the actual need.
  if (!Object.keys(update).length) return { status: true, message: 'Nothing to update' };
  const { error } = await supabase.from('announcement_categories').update(update).eq('id', id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Category updated successfully' };
};

// Blocks rather than cascades. The FK is ON DELETE CASCADE, which is right for
// a category created by mistake and wrong for one with a phrase library behind
// it — so count first and refuse if anything would be taken with it.
export const deleteAnnouncementCategory = async (data = {}) => {
  const id = data._id || data.id;
  if (!id) return { status: false, message: 'Category id missing' };

  const [{ count: phraseCount }, { count: typeCount }] = await Promise.all([
    supabase.from('announcement_templates').select('id', { count: 'exact', head: true }).eq('category_id', id),
    supabase.from('announcement_types').select('id', { count: 'exact', head: true }).eq('category_id', id),
  ]);
  if (phraseCount > 0) {
    return {
      status: false,
      message: `This category has ${phraseCount} phrase${phraseCount === 1 ? '' : 's'}. Delete or move them first.`,
    };
  }
  if (typeCount > 0) {
    return {
      status: false,
      message: `This category has ${typeCount} type${typeCount === 1 ? '' : 's'}. Delete them first.`,
    };
  }

  const { error } = await supabase.from('announcement_categories').delete().eq('id', id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Category deleted successfully' };
};

export const listAnnouncementTypes = async (reqData = {}) => {
  const { sportId, categoryId } = reqData;
  if (!sportId) return { status: false, message: 'No active sport selected' };
  let q = supabase.from('announcement_types').select('*').eq('sport_id', sportId);
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q.order('type');
  if (error) return { status: false, message: error.message };

  // phrase counts per type, so the UI can show usage and block deletes
  const rows = (data ?? []).map(typeRow);
  if (rows.length) {
    const { data: phrases } = await supabase
      .from('announcement_templates')
      .select('type_id')
      .eq('sport_id', sportId)
      .not('type_id', 'is', null);
    const counts = {};
    for (const p of phrases ?? []) counts[p.type_id] = (counts[p.type_id] ?? 0) + 1;
    for (const r of rows) r.phraseCount = counts[r._id] ?? 0;
  }
  return { status: true, message: 'Listed successfully', result: rows };
};

export const addAnnouncementType = async (data = {}) => {
  const { sportId, categoryId, type } = data;
  if (!sportId || !categoryId) return { status: false, message: 'Sport and category are required' };
  if (!type) return { status: false, message: 'Type name is required' };

  const { data: cat } = await supabase
    .from('announcement_categories').select('name').eq('id', categoryId).maybeSingle();
  if (!cat) return { status: false, message: 'Category not found' };

  const { error } = await supabase.from('announcement_types').insert({
    sport_id: sportId,
    category_id: categoryId,
    // the text column stays in step with the FK — announcement-tts and mobile
    // both still read (category, type) as text
    category: cat.name,
    type: String(type).trim(),
    audio_url: {},
  });
  if (error) {
    if (error.code === '23505') return { status: false, message: 'That type already exists in this category' };
    return { status: false, message: error.message };
  }
  return { status: true, message: 'Type added successfully' };
};

export const deleteAnnouncementType = async (data = {}) => {
  const id = data._id || data.id;
  if (!id) return { status: false, message: 'Type id missing' };
  const { count } = await supabase
    .from('announcement_templates').select('id', { count: 'exact', head: true }).eq('type_id', id);
  if (count > 0) {
    return {
      status: false,
      message: `This type has ${count} phrase${count === 1 ? '' : 's'}. Delete or move them first.`,
    };
  }
  const { error } = await supabase.from('announcement_types').delete().eq('id', id);
  if (error) return { status: false, message: error.message };
  return { status: true, message: 'Type deleted successfully' };
};
