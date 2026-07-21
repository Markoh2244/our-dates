import { NextRequest, NextResponse } from 'next/server';
import { isCloudConfigured, verifyAccessCode } from '@/lib/supabase-server';
import { isCalendarAuthConfigured } from '@/lib/calendar-auth';

function getConfigStatus() {
  const url = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );
  const serviceKey = Boolean(
    process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY
  );
  const shareToken = isCalendarAuthConfigured();

  return { url, serviceKey, shareToken };
}

export async function GET() {
  const configured = getConfigStatus();

  return NextResponse.json({
    cloudEnabled: isCloudConfigured(),
    configured,
    missing: [
      !configured.url && 'NEXT_PUBLIC_SUPABASE_URL',
      !configured.serviceKey && 'SUPABASE_SECRET_KEY',
      !configured.shareToken && 'CALENDAR_SHARE_TOKEN',
    ].filter(Boolean),
    sharePathConfigured: configured.shareToken,
  });
}

export async function POST(request: NextRequest) {
  if (!isCloudConfigured()) {
    return NextResponse.json({ ok: false, cloudEnabled: false }, { status: 503 });
  }

  const body = (await request.json()) as { accessCode?: string; shareToken?: string };
  const token = body.shareToken ?? body.accessCode ?? null;
  const ok = verifyAccessCode(token);
  return NextResponse.json({ ok, cloudEnabled: true }, { status: ok ? 200 : 401 });
}
