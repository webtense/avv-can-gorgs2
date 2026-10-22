import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword, isPasswordValid } from '@/lib/auth/password';
import { isSameOriginRequest } from '@/lib/csrf';
import { getActiveMember } from '@/lib/auth/session';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { getLocale, getMessages } from '@/lib/i18n';

export async function POST(request: NextRequest) {
  const member = await getActiveMember();
  if (!member) {
    return apiError('notAuthorized', 403);
  }

  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  const ip = getClientIp(request.headers);
  if (!checkRateLimit(`contrasenya:${ip}`)) {
    return apiError('tooManyAttempts', 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('invalidData', 400);
  }

  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return apiError('invalidData', 400);
  }
  if (newPassword !== confirmPassword) {
    return apiError('passwordMismatch', 400);
  }
  if (!isPasswordValid(newPassword)) {
    return apiError('passwordLength', 400);
  }

  const current = await prisma.members.findUnique({ where: { id: member.id } });
  if (!current) {
    return apiError('notAuthorized', 403);
  }

  const valid = await verifyPassword(currentPassword, current.password_hash);
  if (!valid) {
    return apiError('currentPasswordIncorrect', 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.members.update({
    where: { id: member.id },
    data: { password_hash: passwordHash },
  });

  const messages = getMessages(await getLocale());
  return NextResponse.json({
    ok: true,
    message: messages.apiErrors.passwordChanged,
  });
}
