import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, isPasswordValid } from '@/lib/auth/password';
import { isValidEmail, isValidName, isValidPhone } from '@/lib/validators';
import { isSameOriginRequest } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Sol·licitud no vàlida.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dades no vàlides.' }, { status: 400 });
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '').trim();
  const gdprConsent = body.gdprConsent === true;

  if (!isValidName(name)) {
    return NextResponse.json({ error: 'El nom ha de tenir entre 2 i 150 caràcters.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'El correu electrònic no és vàlid.' }, { status: 400 });
  }
  if (!isPasswordValid(password)) {
    return NextResponse.json(
      { error: 'La contrasenya ha de tenir com a mínim 10 caràcters.' },
      { status: 400 }
    );
  }
  if (phone && !isValidPhone(phone)) {
    return NextResponse.json({ error: 'El telèfon no és vàlid.' }, { status: 400 });
  }
  if (!gdprConsent) {
    return NextResponse.json(
      { error: 'Cal acceptar el tractament de dades personals per registrar-se.' },
      { status: 400 }
    );
  }

  const existing = await prisma.members.findUnique({ where: { email } });
  if (existing) {
    // Missatge genèric: no revelem si el correu ja existeix.
    return NextResponse.json(
      { error: 'No s\'ha pogut completar el registre amb les dades proporcionades.' },
      { status: 400 }
    );
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

  return NextResponse.json({
    ok: true,
    message: 'Sol·licitud enviada. La junta revisarà la teva petició d\'alta properament.',
  });
}
