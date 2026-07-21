import { DateIdea } from './types';
import { loadDates as loadLocal, saveDates as saveLocal } from './storage';

const ACCESS_KEY = 'our-dates-access-code';

export function getStoredAccessCode(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(ACCESS_KEY) || '';
}

export function setStoredAccessCode(code: string): void {
  localStorage.setItem(ACCESS_KEY, code);
}

export function clearStoredAccessCode(): void {
  localStorage.removeItem(ACCESS_KEY);
}

export async function checkCloudEnabled(): Promise<boolean> {
  try {
    const res = await fetch('/api/cloud');
    const data = (await res.json()) as { cloudEnabled?: boolean };
    return Boolean(data.cloudEnabled);
  } catch {
    return false;
  }
}

export async function unlockCloud(accessCode: string): Promise<boolean> {
  const res = await fetch('/api/cloud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessCode }),
  });
  if (!res.ok) return false;
  setStoredAccessCode(accessCode);
  return true;
}

export async function fetchCloudEvents(accessCode: string): Promise<DateIdea[]> {
  const res = await fetch('/api/events', {
    headers: { 'x-access-code': accessCode },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not load cloud calendar');
  return data.events as DateIdea[];
}

export async function saveCloudEvents(
  accessCode: string,
  events: DateIdea[]
): Promise<DateIdea[]> {
  // Keep https image URLs; strip local base64 so we stay under free-tier limits.
  // New photos should be uploaded through uploadCloudPhoto().
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
      'x-access-code': accessCode,
    },
    body: JSON.stringify({ events: payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Could not save cloud calendar');
  return data.events as DateIdea[];
}

export async function uploadCloudPhoto(
  accessCode: string,
  eventId: string,
  file: File
): Promise<DateIdea> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`/api/events/${eventId}/photo`, {
    method: 'POST',
    headers: { 'x-access-code': accessCode },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Photo upload failed');
  return data.event as DateIdea;
}

/** Prefer cloud when unlocked; otherwise fall back to local browser storage. */
export async function hydrateCalendar(): Promise<{
  events: DateIdea[];
  cloudEnabled: boolean;
  cloudUnlocked: boolean;
}> {
  const cloudEnabled = await checkCloudEnabled();
  const accessCode = getStoredAccessCode();

  if (cloudEnabled && accessCode) {
    try {
      const events = await fetchCloudEvents(accessCode);
      saveLocal(events);
      return { events, cloudEnabled, cloudUnlocked: true };
    } catch {
      clearStoredAccessCode();
    }
  }

  return {
    events: loadLocal(),
    cloudEnabled,
    cloudUnlocked: false,
  };
}
