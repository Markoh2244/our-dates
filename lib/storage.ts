import { DEFAULT_DATES } from './default-dates';
import { DateIdea } from './types';

const STORAGE_KEY = 'our-dates-v1';

export function loadDates(): DateIdea[] {
  if (typeof window === 'undefined') return DEFAULT_DATES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATES;
    const parsed = JSON.parse(raw) as DateIdea[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DATES;
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
  const parsed = JSON.parse(json) as DateIdea[];
  if (!Array.isArray(parsed)) {
    throw new Error('Invalid date list format');
  }
  return parsed;
}

export function resetToDefaults(): DateIdea[] {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_DATES;
}
