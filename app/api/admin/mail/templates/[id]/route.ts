import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('invalidData', 400);
  }

  const data: Record<string, string> = {};
  if (typeof body.name === 'string' && body.name.trim()) data.name = body.name.trim();
  if (body.locale === 'es' || body.locale === 'ca') data.locale = body.locale;
  if (typeof body.subject === 'string' && body.subject.trim()) data.subject = body.subject.trim();
  if (typeof body.body_text === 'string' && body.body_text.trim()) data.body_text = body.body_text.trim();

  if (Object.keys(data).length === 0) {
    return apiError('invalidData', 400);
  }

  try {
    const template = await prisma.mail_templates.update({ where: { id }, data });
    return NextResponse.json({ ok: true, template });
  } catch {
    return apiError('invalidQuery', 404);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }
  const { id } = await params;

  try {
    await prisma.mail_templates.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return apiError('invalidQuery', 404);
  }
}
