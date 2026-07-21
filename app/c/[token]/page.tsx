import { notFound } from 'next/navigation';
import { DateBoard } from '@/components/DateBoard';
import { verifyCalendarToken } from '@/lib/calendar-auth';

type CalendarPageProps = {
  params: Promise<{ token: string }>;
};

export default async function CalendarPage({ params }: CalendarPageProps) {
  const { token } = await params;

  if (!verifyCalendarToken(token)) {
    notFound();
  }

  return <DateBoard shareToken={token} />;
}
