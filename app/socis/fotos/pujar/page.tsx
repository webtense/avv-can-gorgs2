import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getActiveMember } from '@/lib/auth/session';
import PageShell from '@/components/common/PageShell';
import PhotoUploadForm from '@/components/socis/PhotoUploadForm';
import { getLocale, getMessages } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.pujarFotos.titleFull} · AVV Can Gorgs II` };
}

export default async function PujarFotosPage() {
  const member = await getActiveMember();
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.pujarFotos;

  if (!member) {
    return (
      <PageShell title={t.title}>
        <p>{t.restrictedOnly}</p>
        <p>
          <Link href="/socis/login" className="text-primary underline">
            {t.login}
          </Link>{' '}
          {t.toContinue}
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
    <PageShell title={t.titleFull}>
      <p>{t.intro}</p>
      <PhotoUploadForm events={events} />
    </PageShell>
  );
}
