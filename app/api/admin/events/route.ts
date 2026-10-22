import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';

export async function GET() {
  const admin = await getAdminMember();
  if (!admin) {
    return NextResponse.json({ error: 'No autoritzat.' }, { status: 403 });
  }
  const events = await prisma.events.findMany({
    orderBy: { event_date: 'desc' },
    select: {
      id: true,
      title: true,
      event_date: true,
      members_only: true,
      reservations_open: true,
      capacity: true,
    },
  });
  return NextResponse.json({ events });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return NextResponse.json({ error: 'No autoritzat.' }, { status: 403 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Sol·licitud no vàlida.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dades no vàlides.' }, { status: 400 });
  }

  const id = String(body.id || '');
  if (!id) {
    return NextResponse.json({ error: 'Falta l\'identificador de l\'acte.' }, { status: 400 });
  }

  const data: { members_only?: boolean; reservations_open?: boolean; capacity?: number | null } = {};
  if (typeof body.membersOnly === 'boolean') data.members_only = body.membersOnly;
  if (typeof body.reservationsOpen === 'boolean') data.reservations_open = body.reservationsOpen;
  if (body.capacity === null || body.capacity === '') {
    data.capacity = null;
  } else if (typeof body.capacity === 'number' && Number.isInteger(body.capacity) && body.capacity > 0) {
    data.capacity = body.capacity;
  }

  const event = await prisma.events.update({ where: { id }, data });

  return NextResponse.json({
    ok: true,
    event: {
      id: event.id,
      members_only: event.members_only,
      reservations_open: event.reservations_open,
      capacity: event.capacity,
    },
  });
}
