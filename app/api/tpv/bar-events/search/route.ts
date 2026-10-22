import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';

/**
 * GET: cerca actes de l'agenda (taula `events`) per títol, per poder triar-ne
 * un d'existent en donar d'alta un acte de barra (admin).
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  const events = await prisma.events.findMany({
    where: q ? { title: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { event_date: 'desc' },
    take: 20,
    select: { id: true, title: true, event_date: true },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      eventDate: e.event_date ? e.event_date.toISOString() : null,
    })),
  });
}
