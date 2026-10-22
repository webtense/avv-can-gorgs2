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
  const period = searchParams.get('period') || undefined;
  const status = searchParams.get('status') || undefined;

  const fees = await prisma.member_fees.findMany({
    where: { period: period || undefined, status: status || undefined },
    orderBy: [{ period: 'desc' }, { created_at: 'desc' }],
    include: { members: { select: { name: true, email: true } } },
  });

  const header = ['soci', 'correu', 'periode', 'import_cents', 'estat', 'data_pagament', 'metode', 'num_rebut'];
  const rows = fees.map((f) =>
    [
      f.members.name,
      f.members.email,
      f.period,
      String(f.amount_cents),
      f.status,
      f.paid_at ? f.paid_at.toISOString() : '',
      f.method || '',
      f.receipt_number || '',
    ].map(csvEscape).join(',')
  );
  const csv = [header.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="quotes.csv"',
    },
  });
}
