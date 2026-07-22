import { DateIdea } from './types';

const RESERVED_SLUGS = new Set(['c', 'api', 'e', '_next', 'favicon.ico']);

/** e.g. 2026-07-25 → 07252026 */
export function dateToSlugPart(plannedFor?: string): string {
  if (!plannedFor || !/^\d{4}-\d{2}-\d{2}$/.test(plannedFor)) return '';
  const [year, month, day] = plannedFor.split('-');
  return `${month}${day}${year}`;
}

/** e.g. "Day @ The Met" → themet */
export function titleToSlugPart(title: string): string {
  const cleaned = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(day|a|an|at|and|with|for|our|to)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, '');
  // Keep a short readable title; fall back if fillers removed everything
  return cleaned.slice(0, 48) || title.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 48) || 'event';
}

/** e.g. Day @ The Met on 2026-07-25 → 07252026themet */
export function buildEventSlug(title: string, plannedFor?: string): string {
  return `${dateToSlugPart(plannedFor)}${titleToSlugPart(title)}`;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function eventSharePath(event: Pick<DateIdea, 'slug' | 'id' | 'title' | 'plannedFor'>): string {
  const slug = event.slug || buildEventSlug(event.title, event.plannedFor);
  return `/${slug}`;
}

/** Assign a unique slug for this event among the full list. */
export function assignUniqueSlug(
  event: Pick<DateIdea, 'id' | 'title' | 'plannedFor' | 'slug'>,
  siblings: DateIdea[]
): string {
  const preferred = event.slug?.trim() || buildEventSlug(event.title, event.plannedFor);
  const taken = new Set(
    siblings
      .filter((item) => item.id !== event.id && item.slug)
      .map((item) => item.slug as string)
  );

  let candidate = preferred;
  if (isReservedSlug(candidate) || taken.has(candidate)) {
    const suffix = event.id.replace(/-/g, '').slice(0, 6);
    candidate = `${preferred}${suffix}`;
  }

  let n = 2;
  while (isReservedSlug(candidate) || taken.has(candidate)) {
    candidate = `${preferred}${n}`;
    n += 1;
  }

  return candidate;
}

export function withAssignedSlugs(events: DateIdea[]): DateIdea[] {
  const result: DateIdea[] = [];
  for (const event of events) {
    const slug = assignUniqueSlug(event, result);
    result.push({ ...event, slug });
  }
  return result;
}
