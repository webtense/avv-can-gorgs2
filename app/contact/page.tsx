import PageShell from '@/components/common/PageShell';
import { siteConfig } from '@/lib/site-config';

export const metadata = { title: 'Contacte · Can Gorgs II' };

export default function ContactPage() {
  const hasAny = siteConfig.email || siteConfig.phone || siteConfig.address;
  return (
    <PageShell title="Contacte">
      {siteConfig.address && <p>{siteConfig.address}</p>}
      {siteConfig.phone && <p>Telèfon: {siteConfig.phone}</p>}
      {siteConfig.email && (
        <p>
          Correu electrònic:{' '}
          <a href={`mailto:${siteConfig.email}`} className="text-primary underline">
            {siteConfig.email}
          </a>
        </p>
      )}
      {!hasAny && <p>Les dades de contacte es publicaran properament.</p>}
    </PageShell>
  );
}
