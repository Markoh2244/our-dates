import { NextRequest, NextResponse } from 'next/server';
import { isCloudConfigured, verifyAccessCode } from '@/lib/supabase-server';
import { getTokenFromRequest } from '@/lib/calendar-auth';
import { listEvents, replaceAllEvents } from '@/lib/events-db';
import { DEFAULT_DATES } from '@/lib/default-dates';
import { DateIdea } from '@/lib/types';

function unauthorized() {
  return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
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
      events = await replaceAllEvents(DEFAULT_DATES);
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
