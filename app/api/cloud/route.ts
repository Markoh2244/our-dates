import { NextRequest, NextResponse } from 'next/server';
import { isCloudConfigured, verifyAccessCode } from '@/lib/supabase-server';

function getConfigStatus() {
  const url = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  );
  const serviceKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SECRET_KEY
  );
  const accessCode = Boolean(process.env.CALENDAR_ACCESS_CODE);

  return { url, serviceKey, accessCode };
}

export async function GET() {
  const configured = getConfigStatus();

  return NextResponse.json({
    cloudEnabled: isCloudConfigured(),
    configured,
    missing: [
      !configured.url && 'NEXT_PUBLIC_SUPABASE_URL',
      !configured.serviceKey && 'SUPABASE_SERVICE_ROLE_KEY',
      !configured.accessCode && 'CALENDAR_ACCESS_CODE',
    ].filter(Boolean),
  });
}

export async function POST(request: NextRequest) {
  if (!isCloudConfigured()) {
    return NextResponse.json({ ok: false, cloudEnabled: false }, { status: 503 });
  }

  const body = (await request.json()) as { accessCode?: string };
  const ok = verifyAccessCode(body.accessCode);
  return NextResponse.json({ ok, cloudEnabled: true }, { status: ok ? 200 : 401 });
}
