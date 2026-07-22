import { notFound } from 'next/navigation';
import { EventShareView } from '@/components/EventShareView';
import { DEFAULT_DATES } from '@/lib/default-dates';
import { buildEventSlug, isReservedSlug, withAssignedSlugs } from '@/lib/event-slug';
import { getEventBySlug, listEvents } from '@/lib/events-db';
import { isCloudConfigured } from '@/lib/supabase-server';
import { DateIdea } from '@/lib/types';

type SlugPageProps = {
  params: Promise<{ slug: string }>;
};

async function loadEventBySlug(slug: string): Promise<DateIdea | null> {
  if (isReservedSlug(slug)) return null;

  if (isCloudConfigured()) {
    try {
      const fromCloud = await getEventBySlug(slug);
      if (fromCloud) return fromCloud;

      // Backfill: older rows may not have slug stored yet
      const all = withAssignedSlugs(await listEvents());
      return all.find((item) => item.slug === slug) ?? null;
    } catch {
      // Fall through to seed data
    }
  }

  return (
    withAssignedSlugs(DEFAULT_DATES).find((item) => item.slug === slug) ??
    DEFAULT_DATES.find((item) => buildEventSlug(item.title, item.plannedFor) === slug) ??
    null
  );
}

export async function generateMetadata({ params }: SlugPageProps) {
  const { slug } = await params;
  const event = await loadEventBySlug(slug);
  if (!event) {
    return { title: 'Event | Liv & Marko' };
  }

  const snippet = event.description || event.schedule || 'A moment from our memory calendar.';
  return {
    title: `${event.title} | Liv & Marko`,
    description: snippet.slice(0, 160),
  };
}

export default async function EventSlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const event = await loadEventBySlug(slug);
  if (!event) {
    notFound();
  }

  return <EventShareView event={event} />;
}
