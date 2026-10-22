import { NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';

/** Llista les vendes d'un torn de caixa (admin), per poder-les anul·lar des de l'informe. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }

  const { id } = await params;
  const sales = await prisma.tpv_sales.findMany({
    where: { session_id: id },
    orderBy: { created_at: 'desc' },
    include: { lines: true },
  });

  return NextResponse.json({ sales });
}
