import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId') || undefined;
  if (!eventId) {
    return apiError('missingEventId', 400);
  }

  const reservations = await prisma.reservations.findMany({
    where: { event_id: eventId, status: 'confirmada' },
    orderBy: { created_at: 'desc' },
  });

  const header = ['nom', 'email', 'quantitat', 'estat'];
  const rows = reservations.map((r) =>
    [r.name, r.email, String(r.quantity), r.checked_in_at ? 'usat' : 'pendent']
      .map(csvEscape)
      .join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="tiquets.csv"',
    },
  });
}
