import { getLocale, getMessages } from '@/lib/i18n';
import InvoicesIssuedManager from '@/components/admin/comptabilitat/InvoicesIssuedManager';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.comptabilitat.invoicesIssued.title} · ${messages.admin.home.title}` };
}

export default function Page() {
  return <InvoicesIssuedManager />;
}
