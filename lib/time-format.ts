import { DateIdea } from './types';

export const DEFAULT_TIMEZONE = 'EST';

export function formatTimeRange(
  startTime?: string,
  endTime?: string,
  timezone: string = DEFAULT_TIMEZONE
): string | null {
  if (!startTime && !endTime) return null;
  if (startTime && endTime) return `${startTime} – ${endTime} ${timezone}`;
  if (startTime) return `${startTime} ${timezone}`;
  return `${endTime} ${timezone}`;
}

export function formatEventSchedule(event: Pick<DateIdea, 'plannedFor' | 'startTime' | 'endTime' | 'timezone'>): string | null {
  const datePart = event.plannedFor
    ? new Date(`${event.plannedFor}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;
  const timePart = formatTimeRange(event.startTime, event.endTime, event.timezone ?? DEFAULT_TIMEZONE);

  if (datePart && timePart) return `${datePart} · ${timePart}`;
  return datePart ?? timePart;
}

/** Sort events on the same day by start time when available. */
export function compareEventsBySchedule(a: DateIdea, b: DateIdea): number {
  const dateCompare = (a.plannedFor ?? '').localeCompare(b.plannedFor ?? '');
  if (dateCompare !== 0) return dateCompare;
  return (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99');
}
