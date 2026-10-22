import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { isValidEmail } from '@/lib/validators';
import { isSameOriginRequest } from '@/lib/csrf';
import { createSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { apiError } from '@/lib/i18n/api-error';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  const ip = getClientIp(request.headers);
  if (!checkRateLimit(`login:${ip}`)) {
    return apiError('tooManyAttempts', 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('invalidData', 400);
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!isValidEmail(email) || !password) {
    return apiError('loginGenericError', 400);
  }

  const member = await prisma.members.findUnique({ where: { email } });
  if (!member) {
    return apiError('loginGenericError', 401);
  }

  const valid = await verifyPassword(password, member.password_hash);
  if (!valid) {
    return apiError('loginGenericError', 401);
  }

  if (member.status !== 'actiu') {
    return apiError('accountNotActive', 403);
  }

  await createSessionCookie(member.id);

  return NextResponse.json({ ok: true, admin: member.admin });
}
