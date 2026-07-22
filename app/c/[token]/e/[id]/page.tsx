import { notFound, redirect } from 'next/navigation';
import { DEFAULT_DATES } from '@/lib/default-dates';
import { verifyCalendarToken } from '@/lib/calendar-auth';
import { eventSharePath, withAssignedSlugs } from '@/lib/event-slug';
import { getEventById } from '@/lib/events-db';
import { isCloudConfigured } from '@/lib/supabase-server';
import { DateIdea } from '@/lib/types';

type EventPageProps = {
  params: Promise<{ token: string; id: string }>;
};

async function loadEvent(id: string): Promise<DateIdea | null> {
  if (isCloudConfigured()) {
    try {
      const fromCloud = await getEventById(id);
      if (fromCloud) return fromCloud;
    } catch {
      // Fall through to seed data
    }
  }

  return DEFAULT_DATES.find((item) => item.id === id) ?? null;
}

export default async function EventSharePage({ params }: EventPageProps) {
  const { token, id } = await params;

  if (!verifyCalendarToken(token)) {
    notFound();
  }

  const raw = await loadEvent(id);
  if (!raw) {
    notFound();
  }

  const event = withAssignedSlugs([raw])[0];
  redirect(eventSharePath(event));
}
