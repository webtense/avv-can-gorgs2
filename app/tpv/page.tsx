import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getTpvOperator } from '@/lib/auth/session';
import { getLocale, getMessages } from '@/lib/i18n';
import TpvClient from '@/components/tpv/TpvClient';
import OpenSessionForm from '@/components/tpv/OpenSessionForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.tpv.title} · AVV Can Gorgs II` };
}

export default async function TpvPage() {
  const operator = await getTpvOperator();
  if (!operator) {
    redirect('/socis/login');
  }

  const session = await prisma.cash_sessions.findFirst({
    where: { closed_at: null },
    orderBy: { opened_at: 'desc' },
  });

  if (!session) {
    return <OpenSessionForm />;
  }

  let products: Array<{ id: string; name: string; category: string | null; priceCents: number }>;
  let eventTitle: string | null = null;

  if (session.event_id) {
    const event = await prisma.events.findUnique({
      where: { id: session.event_id },
      include: { tpv_event_products: { include: { product: true } } },
    });
    eventTitle = event?.title ?? null;
    products = (event?.tpv_event_products ?? [])
      .map((ep) => ({
        id: ep.product.id,
        name: ep.product.name,
        category: ep.product.category,
        priceCents: ep.price_cents_override ?? ep.product.price_cents,
      }))
      .filter((p): p is { id: string; name: string; category: string | null; priceCents: number } => p.priceCents !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const catalog = await prisma.tpv_products.findMany({
      where: { active: true, price_cents: { not: null } },
      orderBy: [{ sort: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, category: true, price_cents: true },
    });
    products = catalog.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      priceCents: p.price_cents as number,
    }));
  }

  return <TpvClient operatorName={operator.name} products={products} eventTitle={eventTitle} />;
}
