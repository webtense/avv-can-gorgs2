import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';

export async function GET() {
  const admin = await getAdminMember();
  if (!admin) {
    return NextResponse.json({ error: 'No autoritzat.' }, { status: 403 });
  }
  const members = await prisma.members.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      admin: true,
      created_at: true,
    },
  });
  return NextResponse.json({ members });
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
  const action = String(body.action || '');
  if (!id || !['aprovar', 'rebutjar'].includes(action)) {
    return NextResponse.json({ error: 'Petició no vàlida.' }, { status: 400 });
  }

  const status = action === 'aprovar' ? 'actiu' : 'rebutjat';

  const member = await prisma.members.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json({ ok: true, member: { id: member.id, status: member.status } });
}
