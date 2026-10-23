import { redirect } from 'next/navigation';
import { getTpvOperator } from '@/lib/auth/session';
import { getLocale, getMessages } from '@/lib/i18n';
import TicketControlClient from '@/components/tpv/TicketControlClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.tpvControl.title} · AVV Can Gorgs II` };
}

export default async function TpvControlPage() {
  const operator = await getTpvOperator();
  if (!operator) {
    redirect('/socis/login');
  }

  return <TicketControlClient />;
}
