import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getActiveMember } from '@/lib/auth/session';
import PageShell from '@/components/common/PageShell';
import PhotoUploadForm from '@/components/socis/PhotoUploadForm';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Puja fotos · AVV Can Gorgs II' };

export default async function PujarFotosPage() {
  const member = await getActiveMember();

  if (!member) {
    return (
      <PageShell title="Puja fotos">
        <p>Aquesta secció és només per a socis amb el compte actiu.</p>
        <p>
          <Link href="/socis/login" className="text-primary underline">
            Inicia sessió
          </Link>{' '}
          per continuar.
        </p>
      </PageShell>
    );
  }

  const events = await prisma.events.findMany({
    orderBy: { event_date: 'desc' },
    select: { id: true, title: true },
    take: 100,
  });

  return (
    <PageShell title="Puja fotos d'actes">
      <p>
        Pots pujar fins a 10 imatges (JPEG, PNG o WebP, màxim 10 MB cadascuna). Quedaran
        pendents de revisió per la junta abans d&apos;aparèixer a la galeria pública.
      </p>
      <PhotoUploadForm events={events} />
    </PageShell>
  );
}
