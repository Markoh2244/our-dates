import { timingSafeEqual } from 'crypto';

/** Long secret token — the URL path `/c/{token}` is the only key needed. */
export function getCalendarShareToken(): string | undefined {
  return process.env.CALENDAR_SHARE_TOKEN || process.env.CALENDAR_ACCESS_CODE;
}

export function isCalendarAuthConfigured(): boolean {
  return Boolean(getCalendarShareToken());
}

export function verifyCalendarToken(provided: string | null | undefined): boolean {
  const expected = getCalendarShareToken();
  if (!expected || !provided) return false;
  if (provided.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(provided, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  return request.headers.get('x-calendar-token') || request.headers.get('x-access-code');
}
