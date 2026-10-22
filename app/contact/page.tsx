import PageShell from '@/components/common/PageShell';
import { siteConfig } from '@/lib/site-config';
import { getLocale, getMessages } from '@/lib/i18n';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.contact.title} · AVV Can Gorgs II` };
}

export default async function ContactPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.contact;

  return (
    <PageShell title={t.title}>
      <p>{siteConfig.fullName}</p>
      <p>{siteConfig.address}</p>
      {siteConfig.email && (
        <p>
          {t.email}{' '}
          <a href={`mailto:${siteConfig.email}`} className="text-primary underline">
            {siteConfig.email}
          </a>
        </p>
      )}
      {siteConfig.phone && <p>{t.phone} {siteConfig.phone}</p>}
    </PageShell>
  );
}
