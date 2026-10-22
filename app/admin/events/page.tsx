import { prisma } from '@/lib/db';
import EventFlagsForm from '@/components/admin/EventFlagsForm';
import { getLocale, getMessages } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.events.title} · Administració` };
}

export default async function AdminEventsPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.admin.events;
  const dateLocale = locale === 'es' ? 'es-ES' : 'ca-ES';

  const events = await prisma.events.findMany({
    orderBy: { event_date: 'desc' },
    select: { id: true, title: true, event_date: true, members_only: true, reservations_open: true, capacity: true },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t.title}</h1>
      <ul className="mt-4 space-y-3">
        {events.map((event) => (
          <li key={event.id} className="rounded-md border border-slate-200 p-3">
            <p className="font-medium text-slate-900">{event.title}</p>
            {event.event_date && (
              <p className="text-xs text-slate-500">
                {new Date(event.event_date).toLocaleDateString(dateLocale)}
              </p>
            )}
            <EventFlagsForm
              id={event.id}
              membersOnly={event.members_only}
              reservationsOpen={event.reservations_open}
              capacity={event.capacity}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
