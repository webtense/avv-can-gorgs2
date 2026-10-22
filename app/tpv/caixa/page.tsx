import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getTpvOperator } from '@/lib/auth/session';
import { getLocale, getMessages } from '@/lib/i18n';
import CashClosingClient from '@/components/tpv/CashClosingClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.tpv.closing.title} · AVV Can Gorgs II` };
}

export default async function TpvCaixaPage() {
  const operator = await getTpvOperator();
  if (!operator) {
    redirect('/socis/login');
  }

  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.tpv.closing;

  const session = await prisma.cash_sessions.findFirst({
    where: { closed_at: null },
    orderBy: { opened_at: 'desc' },
  });

  if (!session) {
    return (
      <div className="mx-auto max-w-sm px-4 py-10 text-center">
        <h1 className="font-serif text-2xl font-bold text-slate-900">{t.title}</h1>
        <p className="mt-4 text-slate-700">{t.alreadyClosed}</p>
        <Link href="/tpv" className="mt-4 inline-block text-primary underline">
          {t.goToSale}
        </Link>
      </div>
    );
  }

  const salesAgg = await prisma.tpv_sales.aggregate({
    where: { session_id: session.id, voided: false },
    _sum: { total_cents: true },
  });
  const salesTotalCents = salesAgg._sum.total_cents ?? 0;
  const expectedCents = session.opening_float_cents + salesTotalCents;

  return (
    <CashClosingClient
      openedAt={session.opened_at.toISOString()}
      openingFloatCents={session.opening_float_cents}
      expectedCents={expectedCents}
    />
  );
}
