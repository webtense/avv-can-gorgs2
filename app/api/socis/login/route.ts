import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { isValidEmail } from '@/lib/validators';
import { isSameOriginRequest } from '@/lib/csrf';
import { createSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';

const GENERIC_ERROR = 'Correu electrònic o contrasenya incorrectes.';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Sol·licitud no vàlida.' }, { status: 403 });
  }

  const ip = getClientIp(request.headers);
  if (!checkRateLimit(`login:${ip}`)) {
    return NextResponse.json(
      { error: 'Massa intents. Torna-ho a provar d\'aquí a uns minuts.' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dades no vàlides.' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!isValidEmail(email) || !password) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const member = await prisma.members.findUnique({ where: { email } });
  if (!member) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const valid = await verifyPassword(password, member.password_hash);
  if (!valid) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (member.status !== 'actiu') {
    return NextResponse.json(
      { error: 'El teu compte encara no està actiu. Contacta amb la junta si creus que és un error.' },
      { status: 403 }
    );
  }

  await createSessionCookie(member.id);

  return NextResponse.json({ ok: true, admin: member.admin });
}
