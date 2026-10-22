import { prisma } from '@/lib/db';
import { getLocale, getMessages } from '@/lib/i18n';
import ProductsAdmin from '@/components/admin/tpv/ProductsAdmin';
import SessionsReport from '@/components/admin/tpv/SessionsReport';
import BarEventsAdmin from '@/components/admin/tpv/BarEventsAdmin';
import StockMovementsAdmin from '@/components/admin/tpv/StockMovementsAdmin';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.tpv.title} · ${messages.admin.home.title}` };
}

export default async function AdminTpvPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.admin.tpv;

  const products = await prisma.tpv_products.findMany({
    orderBy: [{ sort: 'asc' }, { name: 'asc' }],
  });

  const sessions = await prisma.cash_sessions.findMany({
    orderBy: { opened_at: 'desc' },
    take: 50,
    include: {
      opener: { select: { name: true } },
      tpv_sales: { select: { total_cents: true, voided: true } },
    },
  });

  const sessionRows = sessions.map((s) => {
    const validSales = s.tpv_sales.filter((sale) => !sale.voided);
    const totalCents = validSales.reduce((sum, sale) => sum + sale.total_cents, 0);
    return {
      id: s.id,
      operatorName: s.opener.name,
      openedAt: s.opened_at.toISOString(),
      closedAt: s.closed_at ? s.closed_at.toISOString() : null,
      ticketCount: validSales.length,
      totalCents,
      differenceCents: s.difference_cents,
    };
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">{t.title}</h1>
      </div>

      <ProductsAdmin
        initialProducts={products.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          priceCents: p.price_cents,
          costCents: p.cost_cents,
          active: p.active,
          sort: p.sort,
        }))}
      />

      <StockMovementsAdmin products={products.map((p) => ({ id: p.id, name: p.name }))} />

      <BarEventsAdmin
        products={products
          .filter((p) => p.active)
          .map((p) => ({ id: p.id, name: p.name, category: p.category, priceCents: p.price_cents }))}
      />

      <SessionsReport sessions={sessionRows} />
    </div>
  );
}
