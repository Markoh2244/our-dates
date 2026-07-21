import { DateIdea, EventType, Season, DateStatus } from './types';
import { getServiceSupabase } from './supabase-server';

type EventRow = {
  id: string;
  title: string;
  description: string;
  season: Season;
  status: DateStatus;
  event_type: EventType;
  address: string | null;
  liv_note: string | null;
  marko_note: string | null;
  image_url: string | null;
  image_name: string | null;
  planned_for: string | null;
};

function toIdea(row: EventRow): DateIdea {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    season: row.season,
    status: row.status,
    eventType: row.event_type ?? 'cozy',
    address: row.address ?? undefined,
    livNote: row.liv_note ?? undefined,
    markoNote: row.marko_note ?? undefined,
    imageDataUrl: row.image_url ?? undefined,
    imageName: row.image_name ?? undefined,
    plannedFor: row.planned_for ?? undefined,
  };
}

function toRow(idea: DateIdea): EventRow {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    season: idea.season,
    status: idea.status,
    event_type: idea.eventType,
    address: idea.address ?? null,
    liv_note: idea.livNote ?? null,
    marko_note: idea.markoNote ?? null,
    image_url: idea.imageDataUrl ?? null,
    image_name: idea.imageName ?? null,
    planned_for: idea.plannedFor ?? null,
  };
}

export async function listEvents(): Promise<DateIdea[]> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('planned_for', { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return (data as EventRow[]).map(toIdea);
}

export async function replaceAllEvents(ideas: DateIdea[]): Promise<DateIdea[]> {
  const supabase = getServiceSupabase();

  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .not('id', 'is', null);

  if (deleteError) throw new Error(deleteError.message);

  if (ideas.length === 0) return [];

  const rows = ideas.map(toRow);
  const { data, error } = await supabase.from('events').insert(rows).select('*');
  if (error) throw new Error(error.message);
  return (data as EventRow[]).map(toIdea);
}

export async function upsertEvent(idea: DateIdea): Promise<DateIdea> {
  const supabase = getServiceSupabase();
  const row = toRow(idea);
  const { data, error } = await supabase
    .from('events')
    .upsert({ ...row, updated_at: new Date().toISOString() })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return toIdea(data as EventRow);
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadEventPhoto(
  eventId: string,
  fileBuffer: Buffer,
  contentType: string,
  fileName: string
): Promise<{ imageUrl: string; imageName: string }> {
  const supabase = getServiceSupabase();
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${eventId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('event-photos')
    .upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) throw new Error(uploadError.message);

  // Private bucket: create a long-lived signed URL (1 year)
  const { data: signed, error: signError } = await supabase.storage
    .from('event-photos')
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  if (signError || !signed?.signedUrl) {
    throw new Error(signError?.message || 'Could not create signed photo URL');
  }

  return { imageUrl: signed.signedUrl, imageName: fileName };
}
