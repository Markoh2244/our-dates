import { notFound } from 'next/navigation';
import { DateBoard } from '@/components/DateBoard';
import { verifyCalendarToken } from '@/lib/calendar-auth';
import { isReservedSlug } from '@/lib/event-slug';

type CalendarEventPageProps = {
  params: Promise<{ token: string; slug: string }>;
};

export default async function CalendarEventEditPage({ params }: CalendarEventPageProps) {
  const { token, slug } = await params;

  if (!verifyCalendarToken(token) || isReservedSlug(slug)) {
    notFound();
  }

  return <DateBoard shareToken={token} openSlug={slug} />;
}
