import { getLocale, getMessages } from '@/lib/i18n';
import InvoicesReceivedManager from '@/components/admin/comptabilitat/InvoicesReceivedManager';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.comptabilitat.invoicesReceived.title} · ${messages.admin.home.title}` };
}

export default function Page() {
  return <InvoicesReceivedManager />;
}
