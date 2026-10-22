import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';

export async function GET() {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  const templates = await prisma.mail_templates.findMany({
    orderBy: [{ name: 'asc' }, { locale: 'asc' }],
  });
  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
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
  const locale = body.locale === 'es' ? 'es' : 'ca';
  const subject = String(body.subject || '').trim();
  const bodyText = String(body.body_text || '').trim();

  if (!name || !subject || !bodyText) {
    return apiError('invalidData', 400);
  }

  const template = await prisma.mail_templates.create({
    data: { name, locale, subject, body_text: bodyText },
  });

  return NextResponse.json({ ok: true, template });
}
