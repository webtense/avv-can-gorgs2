import { prisma } from '@/lib/db';
import PageShell from '@/components/common/PageShell';

export const metadata = { title: 'Fotos dels socis · AVV Can Gorgs II' };

export default async function FotosPage() {
  const photos = await prisma.event_photos.findMany({
    where: { approved: true },
    orderBy: { created_at: 'desc' },
    include: { events: { select: { title: true } } },
  });

  return (
    <PageShell title="Fotos dels socis">
      <p>Imatges d&apos;actes de l&apos;associació compartides pels socis.</p>
      {photos.length === 0 && <p>Encara no hi ha fotos publicades.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <figure key={photo.id} className="overflow-hidden rounded-md border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/fotos/${photo.id}`}
              alt={photo.caption || photo.events?.title || 'Foto d\'un acte de l\'associació'}
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
