import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { hashPassword, isPasswordValid } from '@/lib/auth/password';
import { isValidEmail, isValidName, isValidPhone } from '@/lib/validators';
import { isSameOriginRequest } from '@/lib/csrf';
import { getLocale, getMessages } from '@/lib/i18n';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('invalidData', 400);
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '').trim();
  const gdprConsent = body.gdprConsent === true;

  if (!isValidName(name)) {
    return apiError('nameLength', 400);
  }
  if (!isValidEmail(email)) {
    return apiError('invalidEmail', 400);
  }
  if (!isPasswordValid(password)) {
    return apiError('passwordLength', 400);
  }
  if (phone && !isValidPhone(phone)) {
    return apiError('invalidPhone', 400);
  }
  if (!gdprConsent) {
    return apiError('gdprRequired', 400);
  }

  const existing = await prisma.members.findUnique({ where: { email } });
  if (existing) {
    // Missatge genèric: no revelem si el correu ja existeix.
    return apiError('registrationFailed', 400);
  }

  const passwordHash = await hashPassword(password);

  await prisma.members.create({
    data: {
      name,
      email,
      phone: phone || null,
      password_hash: passwordHash,
      status: 'pendent',
      gdpr_consent_at: new Date(),
    },
  });

  const messages = getMessages(await getLocale());
  return NextResponse.json({
    ok: true,
    message: messages.apiErrors.registrationSent,
  });
}
