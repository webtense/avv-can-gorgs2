import { NextRequest, NextResponse } from 'next/server';
import { destroySessionCookie } from '@/lib/auth/session';

async function logoutAndRedirect(request: NextRequest) {
  await destroySessionCookie();
  return NextResponse.redirect(new URL('/', request.url));
}

export async function GET(request: NextRequest) {
  return logoutAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return logoutAndRedirect(request);
}
