import { NextRequest, NextResponse } from 'next/server';
import { isCloudConfigured, verifyAccessCode } from '@/lib/supabase-server';

export async function GET() {
  return NextResponse.json({
    cloudEnabled: isCloudConfigured(),
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
