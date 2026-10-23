import { prisma } from '@/lib/db';
import { withBasePath } from '@/lib/basePath';
import PageShell from '@/components/common/PageShell';
import { getLocale, getMessages } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.fotos.title} · AVV Can Gorgs II` };
}

export default async function FotosPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.fotos;

  const photos = await prisma.event_photos.findMany({
    where: { approved: true },
    orderBy: { created_at: 'desc' },
    include: { events: { select: { title: true } } },
  });

  return (
    <PageShell title={t.title}>
      <p>{t.intro}</p>
      {photos.length === 0 && <p>{t.empty}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <figure key={photo.id} className="overflow-hidden rounded-md border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={withBasePath(`/api/fotos/${photo.id}`)}
              alt={photo.caption || photo.events?.title || t.altFallback}
              className="h-40 w-full object-cover"
              loading="lazy"
            />
            {(photo.caption || photo.events?.title) && (
              <figcaption className="px-2 py-1 text-xs text-slate-600">
                {photo.caption || photo.events?.title}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </PageShell>
  );
}
