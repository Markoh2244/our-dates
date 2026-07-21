import { DateIdea } from './types';
import { loadDates as loadLocal, saveDates as saveLocal } from './storage';

export async function checkCloudEnabled(): Promise<boolean> {
  try {
    const res = await fetch('/api/cloud');
    const data = (await res.json()) as { cloudEnabled?: boolean };
    return Boolean(data.cloudEnabled);
  } catch {
    return false;
  }
}

function authHeaders(shareToken: string): HeadersInit {
  return { 'x-calendar-token': shareToken };
}

export async function fetchCloudEvents(shareToken: string): Promise<DateIdea[]> {
  const res = await fetch('/api/events', {
    headers: authHeaders(shareToken),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load cloud calendar');
  return data.events as DateIdea[];
}

export async function saveCloudEvents(
  shareToken: string,
  events: DateIdea[]
): Promise<DateIdea[]> {
  const payload = events.map((event) => ({
    ...event,
    imageDataUrl:
      event.imageDataUrl && event.imageDataUrl.startsWith('http')
        ? event.imageDataUrl
        : undefined,
  }));

  const res = await fetch('/api/events', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(shareToken),
    },
    body: JSON.stringify({ events: payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not save cloud calendar');
  return data.events as DateIdea[];
}

export async function uploadCloudPhoto(
  shareToken: string,
  eventId: string,
  file: File
): Promise<DateIdea> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`/api/events/${eventId}/photo`, {
    method: 'POST',
    headers: authHeaders(shareToken),
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Photo upload failed');
  return data.event as DateIdea;
}

/** Load calendar from cloud when visiting the secret link. */
export async function hydrateCalendar(shareToken: string): Promise<{
  events: DateIdea[];
  cloudEnabled: boolean;
  cloudUnlocked: boolean;
}> {
  const cloudEnabled = await checkCloudEnabled();

  if (cloudEnabled && shareToken) {
    try {
      const events = await fetchCloudEvents(shareToken);
      saveLocal(events);
      return { events, cloudEnabled, cloudUnlocked: true };
    } catch {
      return { events: loadLocal(), cloudEnabled, cloudUnlocked: false };
    }
  }

  return {
    events: loadLocal(),
    cloudEnabled,
    cloudUnlocked: false,
  };
}
