import PageShell from '@/components/common/PageShell';
import { getLocale, getMessages } from '@/lib/i18n';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.cookies.title} · Can Gorgs II` };
}

export default async function Page() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.cookies;

  return (
    <PageShell title={t.title}>
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        {t.provisional}
      </p>
    </PageShell>
  );
}
