import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getAdminMember } from '@/lib/auth/session';

/** Anul·la una venda (només admin, i només si pertany al torn de caixa obert). No esborra files. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  const { id } = await params;
  const sale = await prisma.tpv_sales.findUnique({
    where: { id },
    include: { session: true },
  });
  if (!sale) {
    return apiError('tpvSaleNotFound', 404);
  }
  if (sale.voided) {
    return apiError('tpvSaleAlreadyVoided', 409);
  }
  if (sale.session.closed_at !== null) {
    return apiError('tpvSaleWrongSession', 409);
  }

  const updated = await prisma.tpv_sales.update({
    where: { id },
    data: { voided: true },
  });

  return NextResponse.json({ sale: updated });
}
