import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';

interface QuarterRange {
  start: Date;
  end: Date;
}

function quarterRange(year: number, quarter: number): QuarterRange {
  const startMonth = (quarter - 1) * 3;
  // Les dates es tracten en Europe/Madrid però es guarden com a DATE/TIMESTAMPTZ;
  // construïm els límits en UTC a partir del primer i últim dia del trimestre.
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 1));
  return { start, end };
}

/** Comprova si una taula existeix a la BD actual (per llegir tpv_* només si l'altre mòdul ja l'ha creada). */
async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ${name}
    ) AS exists
  `;
  return rows[0]?.exists ?? false;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get('year'));
  const quarter = Number(searchParams.get('quarter'));
  const format = searchParams.get('format');

  if (!Number.isInteger(year) || year < 2000 || !Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
    return apiError('invalidQuery', 400);
  }

  const { start, end } = quarterRange(year, quarter);

  const feesAgg = await prisma.member_fees.aggregate({
    where: { status: 'pagada', paid_at: { gte: start, lt: end } },
    _sum: { amount_cents: true },
    _count: true,
  });

  const issuedAgg = await prisma.invoices_issued.aggregate({
    where: { status: 'emesa', issue_date: { gte: start, lt: end } },
    _sum: { total_cents: true },
    _count: true,
  });

  const receivedPaidAgg = await prisma.invoices_received.aggregate({
    where: { status: 'pagada', paid_at: { gte: start, lt: end } },
    _sum: { total_cents: true },
    _count: true,
  });

  let tpvTotalCents: number | null = null;
  let tpvCount: number | null = null;
  if (await tableExists('tpv_sales')) {
    try {
      // No es compten les vendes anul·lades (voided = true) en el total del TPV.
      const rows = await prisma.$queryRaw<{ total: bigint | null; count: bigint }[]>`
        SELECT SUM(total_cents)::bigint AS total, COUNT(*)::bigint AS count
        FROM tpv_sales
        WHERE created_at >= ${start} AND created_at < ${end} AND voided = false
      `;
      tpvTotalCents = rows[0]?.total != null ? Number(rows[0].total) : 0;
      tpvCount = rows[0]?.count != null ? Number(rows[0].count) : 0;
    } catch {
      // Si la taula existeix amb un esquema diferent al previst, s'omet el bloc TPV sense trencar l'informe.
      tpvTotalCents = null;
      tpvCount = null;
    }
  }

  const income = (feesAgg._sum.amount_cents || 0) + (issuedAgg._sum.total_cents || 0) + (tpvTotalCents || 0);
  const expenses = receivedPaidAgg._sum.total_cents || 0;
  const balanceCents = income - expenses;

  const report = {
    year,
    quarter,
    fees: { countPaid: feesAgg._count, totalCents: feesAgg._sum.amount_cents || 0 },
    invoicesIssued: { count: issuedAgg._count, totalCents: issuedAgg._sum.total_cents || 0 },
    invoicesReceivedPaid: { count: receivedPaidAgg._count, totalCents: receivedPaidAgg._sum.total_cents || 0 },
    tpv: tpvTotalCents === null ? null : { count: tpvCount, totalCents: tpvTotalCents },
    balanceCents,
  };

  if (format === 'csv') {
    const lines = [
      'concepte,import_cents',
      `quotes_cobrades,${report.fees.totalCents}`,
      `factures_emeses,${report.invoicesIssued.totalCents}`,
      `factures_rebudes_pagades,${report.invoicesReceivedPaid.totalCents}`,
      `tpv,${report.tpv ? report.tpv.totalCents : 'n/a'}`,
      `saldo,${report.balanceCents}`,
    ];
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="informe-${year}-T${quarter}.csv"`,
      },
    });
  }

  return NextResponse.json(report);
}
