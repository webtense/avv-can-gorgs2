import { getLocale, getMessages } from '@/lib/i18n';
import ReportManager from '@/components/admin/comptabilitat/ReportManager';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.comptabilitat.report.title} · ${messages.admin.home.title}` };
}

export default function Page() {
  return <ReportManager />;
}
