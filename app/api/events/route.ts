import { NextRequest, NextResponse } from 'next/server';
import { isCloudConfigured, verifyAccessCode } from '@/lib/supabase-server';
import { getTokenFromRequest } from '@/lib/calendar-auth';
import { listEvents, replaceAllEvents } from '@/lib/events-db';
import { DEFAULT_DATES } from '@/lib/default-dates';
import { withAssignedSlugs } from '@/lib/event-slug';
import { DateIdea } from '@/lib/types';

function unauthorized() {
  return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
}

function upgradeKnownEvents(events: DateIdea[]): { events: DateIdea[]; changed: boolean } {
  let changed = false;

  const withTimes = events.map((event) => {
    const seed = DEFAULT_DATES.find((item) => item.id === event.id);
    if (!seed) return event;

    const next = {
      ...event,
      startTime: event.startTime ?? seed.startTime,
      endTime: event.endTime ?? seed.endTime,
      timezone: event.timezone ?? seed.timezone,
    };

    if (
      next.startTime !== event.startTime ||
      next.endTime !== event.endTime ||
      next.timezone !== event.timezone
    ) {
      changed = true;
    }

    return next;
  });

  const withSlugs = withAssignedSlugs(withTimes);
  if (withSlugs.some((event, i) => event.slug !== withTimes[i]?.slug)) {
    changed = true;
  }

  return { events: withSlugs, changed };
}

export async function GET(request: NextRequest) {
  if (!isCloudConfigured()) {
    return NextResponse.json({
      cloudEnabled: false,
      events: [],
      message: 'Cloud storage is not configured yet.',
    });
  }

  const code = getTokenFromRequest(request);
  if (!verifyAccessCode(code)) return unauthorized();

  try {
    let events = await listEvents();

    // First-time setup: seed our hardcoded timeline once
    if (events.length === 0) {
      events = await replaceAllEvents(withAssignedSlugs(DEFAULT_DATES));
    } else {
      const upgraded = upgradeKnownEvents(events);
      if (upgraded.changed) {
        events = await replaceAllEvents(upgraded.events);
      } else {
        events = upgraded.events;
      }
    }

    return NextResponse.json({ cloudEnabled: true, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load events';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isCloudConfigured()) {
    return NextResponse.json({ error: 'Cloud storage is not configured' }, { status: 503 });
  }

  const code = getTokenFromRequest(request);
  if (!verifyAccessCode(code)) return unauthorized();

  try {
    const body = (await request.json()) as { events?: DateIdea[] };
    if (!Array.isArray(body.events)) {
      return NextResponse.json({ error: 'events array is required' }, { status: 400 });
    }

    const events = await replaceAllEvents(body.events);
    return NextResponse.json({ cloudEnabled: true, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save events';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
