import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getLocale, getMessages } from '@/lib/i18n';
import { withBasePath } from '@/lib/basePath';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.tiquets.title} · ${messages.admin.home.title}` };
}

interface Props {
  searchParams: Promise<{ eventId?: string }>;
}

export default async function AdminTiquetsPage({ searchParams }: Props) {
  const { eventId: requestedEventId } = await searchParams;
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.admin.tiquets;
  const dateLocale = locale === 'es' ? 'es-ES' : 'ca-ES';

  const events = await prisma.events.findMany({
    where: { reservations: { some: {} } },
    orderBy: { event_date: 'desc' },
    select: { id: true, title: true, event_date: true },
  });

  const selectedEventId = requestedEventId || events[0]?.id || '';

  const reservations = selectedEventId
    ? await prisma.reservations.findMany({
        where: { event_id: selectedEventId, status: 'confirmada' },
        orderBy: { created_at: 'desc' },
      })
    : [];

  const sold = reservations.reduce((sum, r) => sum + r.quantity, 0);
  const used = reservations.filter((r) => r.checked_in_at).reduce((sum, r) => sum + r.quantity, 0);
  const pending = sold - used;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t.title}</h1>

      {events.length === 0 ? (
        <p>{t.noEvents}</p>
      ) : (
        <>
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div>
              <label htmlFor="eventId" className="block text-sm font-medium text-slate-700">
                {t.selectEvent}
              </label>
              <select
                id="eventId"
                name="eventId"
                defaultValue={selectedEventId}
                className="mt-1 rounded-md border border-slate-300 px-3 py-2"
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                    {ev.event_date
                      ? ` (${new Date(ev.event_date).toLocaleDateString(dateLocale)})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-white">
              {t.selectEvent}
            </button>
          </form>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{sold}</p>
              <p className="text-sm text-slate-500">{t.colSold}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{used}</p>
              <p className="text-sm text-slate-500">{t.colUsed}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{pending}</p>
              <p className="text-sm text-slate-500">{t.colPending}</p>
            </div>
          </div>

          <div>
            <a
              href={withBasePath(`/api/admin/tiquets/export?eventId=${selectedEventId}`)}
              className="inline-block rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
            >
              {t.exportCsv}
            </a>
          </div>

          <div>
            <h2 className="font-serif text-xl font-semibold text-slate-900">{t.listTitle}</h2>
            {reservations.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">{t.noReservations}</p>
            ) : (
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-1 pr-2">{t.colName}</th>
                    <th className="py-1 pr-2">{t.colEmail}</th>
                    <th className="py-1 pr-2">{t.colQuantity}</th>
                    <th className="py-1 pr-2">{t.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100">
                      <td className="py-1 pr-2">{r.name}</td>
                      <td className="py-1 pr-2">{r.email}</td>
                      <td className="py-1 pr-2">{r.quantity}</td>
                      <td className="py-1 pr-2">
                        {r.checked_in_at ? t.statusUsed : t.statusPending}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
      <p className="text-xs text-slate-400">
        <Link href="/admin" className="underline">
          {messages.admin.nav.home}
        </Link>
      </p>
    </div>
  );
}
