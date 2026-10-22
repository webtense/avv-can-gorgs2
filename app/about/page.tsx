import PageShell from '@/components/common/PageShell';
import { siteConfig } from '@/lib/site-config';

export const metadata = { title: 'L\'associació · Can Gorgs II' };

export default function AboutPage() {
  return (
    <PageShell title="L'associació">
      <p>
        L&apos;{siteConfig.name} és un espai de memòria col·lectiva del barri: aquí es conserven
        fotografies, documents, vídeos i esdeveniments perquè els veïns puguin consultar-los.
      </p>
      {siteConfig.foundedYear && <p>Fundada l&apos;any {siteConfig.foundedYear}.</p>}
    </PageShell>
  );
}
