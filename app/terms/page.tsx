import PageShell from '@/components/common/PageShell';
import { siteConfig } from '@/lib/site-config';
import { getLocale, getMessages } from '@/lib/i18n';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.terms.title} · AVV Can Gorgs II` };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.terms;

  return (
    <PageShell title={t.title}>
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        {t.provisional}
      </p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">{t.ownerTitle}</h2>
      <p>
        {siteConfig.fullName}
        {siteConfig.taxId && <>, {t.taxIdLabel} {siteConfig.taxId}</>}.
        <br />
        {t.addressLabel} {siteConfig.address}.
        {siteConfig.email && (
          <>
            <br />
            {t.emailLabel}{' '}
            <a href={`mailto:${siteConfig.email}`} className="text-primary underline">
              {siteConfig.email}
            </a>
          </>
        )}
      </p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">{t.objectTitle}</h2>
      <p>{t.objectText}</p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">{t.ipTitle}</h2>
      <p>{t.ipText}</p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">{t.liabilityTitle}</h2>
      <p>{t.liabilityText}</p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">{t.linksTitle}</h2>
      <p>{t.linksText}</p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">{t.lawTitle}</h2>
      <p>{t.lawText}</p>
    </PageShell>
  );
}
