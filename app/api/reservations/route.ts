import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getCurrentMember } from '@/lib/auth/session';
import { isValidEmail, isValidName, isValidQuantity } from '@/lib/validators';

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

  const eventId = String(body.eventId || '');
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const quantity = Number(body.quantity);

  if (!eventId) {
    return NextResponse.json({ error: 'Falta l\'acte a reservar.' }, { status: 400 });
  }
  if (!isValidName(name)) {
    return NextResponse.json({ error: 'El nom ha de tenir entre 2 i 150 caràcters.' }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'El correu electrònic no és vàlid.' }, { status: 400 });
  }
  if (!isValidQuantity(quantity)) {
    return NextResponse.json({ error: 'La quantitat ha de ser entre 1 i 4 persones.' }, { status: 400 });
  }

  const event = await prisma.events.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: 'Acte no trobat.' }, { status: 404 });
  }
  if (!event.reservations_open) {
    return NextResponse.json({ error: 'Aquest acte no admet reserves.' }, { status: 400 });
  }

  const currentMember = await getCurrentMember();
  const isActiveMember = currentMember?.status === 'actiu';

  if (event.members_only && !isActiveMember) {
    return NextResponse.json(
      { error: 'Aquest acte és només per a socis. Inicia sessió per reservar.' },
      { status: 403 }
    );
  }

  if (event.capacity != null) {
    const confirmed = await prisma.reservations.aggregate({
      where: { event_id: eventId, status: 'confirmada' },
      _sum: { quantity: true },
    });
    const reserved = confirmed._sum.quantity || 0;
    if (reserved + quantity > event.capacity) {
      return NextResponse.json(
        { error: 'No queden places suficients per a aquest acte.' },
        { status: 409 }
      );
    }
  }

  const reservation = await prisma.reservations.create({
    data: {
      event_id: eventId,
      member_id: isActiveMember ? currentMember!.id : null,
      name,
      email,
      quantity,
      status: 'confirmada',
    },
  });

  return NextResponse.json({ ok: true, reservationId: reservation.id });
}
