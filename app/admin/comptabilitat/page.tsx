import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getLocale, getMessages } from '@/lib/i18n';
import FeeConfigForm from '@/components/admin/comptabilitat/FeeConfigForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.comptabilitat.title} · ${messages.admin.home.title}` };
}

export default async function AdminComptabilitatPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.admin.comptabilitat;
  const config = await prisma.accounting_config.findUnique({ where: { id: 1 } });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{t.intro}</p>

      <div className="mt-6">
        <FeeConfigForm initialAmountCents={config?.fee_amount_cents ?? null} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/comptabilitat/quotes" className="rounded-md border border-slate-200 p-4 hover:bg-slate-50">
          {t.nav.quotes}
        </Link>
        <Link
          href="/admin/comptabilitat/invoices-issued"
          className="rounded-md border border-slate-200 p-4 hover:bg-slate-50"
        >
          {t.nav.invoicesIssued}
        </Link>
        <Link
          href="/admin/comptabilitat/invoices-received"
          className="rounded-md border border-slate-200 p-4 hover:bg-slate-50"
        >
          {t.nav.invoicesReceived}
        </Link>
        <Link href="/admin/comptabilitat/report" className="rounded-md border border-slate-200 p-4 hover:bg-slate-50">
          {t.nav.report}
        </Link>
      </div>
    </div>
  );
}
