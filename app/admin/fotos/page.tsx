import { prisma } from '@/lib/db';
import PhotoModerationActions from '@/components/admin/PhotoModerationActions';
import { getLocale, getMessages } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.fotos.title} · Administració` };
}

export default async function AdminFotosPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.admin.fotos;

  const photos = await prisma.event_photos.findMany({
    orderBy: { created_at: 'desc' },
    include: { members: { select: { name: true, email: true } }, events: { select: { title: true } } },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t.title}</h1>
      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {photos.map((photo) => (
          <li key={photo.id} className="overflow-hidden rounded-md border border-slate-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/fotos/${photo.id}`} alt={photo.caption || ''} className="h-32 w-full object-cover" />
            <div className="p-2 text-xs text-slate-600">
              <p>{photo.members.name}</p>
              {photo.events?.title && <p>{photo.events.title}</p>}
              <p>{photo.approved ? t.approved : t.pending}</p>
              <PhotoModerationActions id={photo.id} approved={photo.approved} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
