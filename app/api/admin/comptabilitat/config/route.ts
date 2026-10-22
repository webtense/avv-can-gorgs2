import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';
import { logAccountingAudit } from '@/lib/accounting/audit';

export async function GET() {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  const config = await prisma.accounting_config.findUnique({ where: { id: 1 } });
  return NextResponse.json({
    feeAmountCents: config?.fee_amount_cents ?? null,
    feePeriodicity: config?.fee_periodicity ?? 'anual',
  });
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

  const amountRaw = body.feeAmountCents;
  if (amountRaw !== null && (!Number.isInteger(amountRaw) || (amountRaw as number) < 0)) {
    return apiError('invalidData', 400);
  }

  const config = await prisma.accounting_config.upsert({
    where: { id: 1 },
    create: { id: 1, fee_amount_cents: amountRaw as number | null },
    update: { fee_amount_cents: amountRaw as number | null },
  });

  await logAccountingAudit(prisma, {
    actorMemberId: admin.id,
    action: 'update_fee_config',
    entity: 'accounting_config',
    entityId: null,
  });

  return NextResponse.json({ ok: true, feeAmountCents: config.fee_amount_cents });
}
