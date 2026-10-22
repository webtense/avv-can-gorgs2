import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';
import { logAccountingAudit } from '@/lib/accounting/audit';

export async function GET(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || undefined;
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || undefined;

  const fees = await prisma.member_fees.findMany({
    where: {
      period: period || undefined,
      status: status || undefined,
      members: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
    },
    orderBy: [{ period: 'desc' }, { created_at: 'desc' }],
    include: { members: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ fees });
}

/** Genera les quotes d'un període per a tots els socis actius que encara no en tinguin. */
export async function POST(request: NextRequest) {
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

  const period = typeof body.period === 'string' ? body.period.trim() : '';
  if (!/^\d{4}$/.test(period)) {
    return apiError('invalidData', 400);
  }

  const config = await prisma.accounting_config.findUnique({ where: { id: 1 } });
  const amountCents = config?.fee_amount_cents;
  if (amountCents === null || amountCents === undefined) {
    return apiError('invalidData', 400);
  }

  const activeMembers = await prisma.members.findMany({
    where: { status: 'actiu' },
    select: { id: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    let created = 0;
    for (const member of activeMembers) {
      const existing = await tx.member_fees.findUnique({
        where: { member_id_period: { member_id: member.id, period } },
      });
      if (existing) continue;
      await tx.member_fees.create({
        data: { member_id: member.id, period, amount_cents: amountCents },
      });
      created++;
    }
    await logAccountingAudit(tx, {
      actorMemberId: admin.id,
      action: 'generate_fees',
      entity: 'member_fees',
      detail: `period=${period} created=${created}`,
    });
    return created;
  });

  return NextResponse.json({ ok: true, created: result });
}
