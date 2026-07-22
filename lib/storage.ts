import { DEFAULT_DATES } from './default-dates';
import { DateIdea } from './types';

const STORAGE_KEY = 'our-dates-v2';
const MAX_IMAGE_DATA_URL_LENGTH = 2_000_000;

function normalizeDates(value: unknown): DateIdea[] {
  if (!Array.isArray(value)) return DEFAULT_DATES;

  const normalized = value
    .map((item): DateIdea | null => {
      if (!item || typeof item !== 'object') return null;
      const raw = item as Partial<DateIdea>;
      if (!raw.id || !raw.title || !raw.description || !raw.season || !raw.status) {
        return null;
      }

      const safeImage =
        typeof raw.imageDataUrl === 'string' &&
        ((raw.imageDataUrl.startsWith('data:image/') &&
          raw.imageDataUrl.length <= MAX_IMAGE_DATA_URL_LENGTH) ||
          raw.imageDataUrl.startsWith('https://') ||
          raw.imageDataUrl.startsWith('http://'))
          ? raw.imageDataUrl
          : undefined;

      return {
        id: String(raw.id),
        title: String(raw.title),
        description: String(raw.description),
        schedule: typeof raw.schedule === 'string' ? raw.schedule : undefined,
        season: raw.season,
        status: raw.status,
        eventType: raw.eventType ?? 'cozy',
        plannedFor: raw.plannedFor,
        startTime: raw.startTime,
        endTime: raw.endTime,
        timezone: raw.timezone,
        address: raw.address,
        livNote: raw.livNote,
        markoNote: raw.markoNote,
        imageDataUrl: safeImage,
        imageName: safeImage ? raw.imageName : undefined,
      };
    })
    .filter((item): item is DateIdea => Boolean(item));

  return normalized.length > 0 ? normalized : DEFAULT_DATES;
}

export function loadDates(): DateIdea[] {
  if (typeof window === 'undefined') return DEFAULT_DATES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATES;
    const parsed = JSON.parse(raw);
    return normalizeDates(parsed);
  } catch {
    return DEFAULT_DATES;
  }
}

export function saveDates(dates: DateIdea[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
}

export function exportDates(dates: DateIdea[]): string {
  return JSON.stringify(dates, null, 2);
}

export function importDates(json: string): DateIdea[] {
  const parsed = JSON.parse(json);
  const normalized = normalizeDates(parsed);
  if (!Array.isArray(parsed) || normalized.length === 0) {
    throw new Error('Invalid date list format');
  }
  return normalized;
}

export function resetToDefaults(): DateIdea[] {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_DATES;
}
