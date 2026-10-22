import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentMember } from '@/lib/auth/session';
import PageShell from '@/components/common/PageShell';
import ReservationForm from '@/components/socis/ReservationForm';

export const metadata = { title: 'Agenda · AVV Can Gorgs II' };

export default async function AgendaPage() {
  const member = await getCurrentMember();
  const isActiveMember = member?.status === 'actiu';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events = await prisma.events.findMany({
    where: {
      event_date: { gte: today },
      ...(isActiveMember ? {} : { members_only: false }),
    },
    orderBy: { event_date: 'asc' },
  });

  return (
    <PageShell title="Agenda d'actes">
      {!isActiveMember && (
        <p className="rounded-md bg-secondary/10 px-3 py-2 text-sm text-slate-700">
          <Link href="/socis/registre" className="font-medium text-primary underline">
            Fes-te soci
          </Link>{' '}
          per veure també els actes exclusius per a socis.
        </p>
      )}

      {events.length === 0 && <p>No hi ha actes programats properament.</p>}

      <ul className="space-y-6">
        {events.map((event) => (
          <li key={event.id} className="rounded-md border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-900">
              {event.title}
              {event.members_only && (
                <span className="ml-2 rounded bg-secondary/20 px-2 py-0.5 text-xs text-secondary-dark">
                  Només socis
                </span>
              )}
            </h2>
            {event.event_date && (
              <p className="text-sm text-slate-500">
                {new Date(event.event_date).toLocaleDateString('ca-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
            {event.description && <p className="mt-1 text-sm">{event.description}</p>}
            {event.reservations_open ? (
              <ReservationForm eventId={event.id} />
            ) : (
              <p className="mt-2 text-sm text-slate-500">Aquest acte no té reserves obertes.</p>
            )}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
