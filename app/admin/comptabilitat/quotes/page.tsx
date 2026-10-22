import { getLocale, getMessages } from '@/lib/i18n';
import QuotesManager from '@/components/admin/comptabilitat/QuotesManager';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.comptabilitat.quotes.title} · ${messages.admin.home.title}` };
}

export default function Page() {
  return <QuotesManager />;
}
