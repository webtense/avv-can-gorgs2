import { NextRequest, NextResponse } from 'next/server';
import { LANG_COOKIE } from '@/lib/i18n';

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const locale = body?.locale;

  if (locale !== 'ca' && locale !== 'es') {
    return NextResponse.json({ error: 'Idioma no vàlid.' }, { status: 400 });
  }

  const response = NextResponse.json({ locale });
  response.cookies.set(LANG_COOKIE, locale, {
    maxAge: ONE_YEAR_SECONDS,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
