import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const photos = await prisma.event_photos.findMany({
    where: { approved: true },
    orderBy: { created_at: 'desc' },
    select: { id: true, caption: true, created_at: true, event_id: true, events: { select: { title: true } } },
  });
  return NextResponse.json({ photos });
}
