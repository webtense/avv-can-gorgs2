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

  const id = String(body.id || '');
  if (!id) {
    return apiError('missingEventId', 400);
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
