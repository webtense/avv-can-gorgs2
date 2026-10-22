import PageShell from '@/components/common/PageShell';
import { siteConfig } from '@/lib/site-config';

export const metadata = { title: 'Contacte · AVV Can Gorgs II' };

export default function ContactPage() {
  return (
    <PageShell title="Contacte">
      <p>{siteConfig.fullName}</p>
      <p>{siteConfig.address}</p>
      {siteConfig.email && (
        <p>
          Correu electrònic:{' '}
          <a href={`mailto:${siteConfig.email}`} className="text-primary underline">
            {siteConfig.email}
          </a>
        </p>
      )}
      {siteConfig.phone && <p>Telèfon: {siteConfig.phone}</p>}
    </PageShell>
  );
}
