import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentMember } from '@/lib/auth/session';
import PageShell from '@/components/common/PageShell';
import ReservationForm from '@/components/socis/ReservationForm';

export const metadata = { title: 'Zona de socis · AVV Can Gorgs II' };

export default async function SocisPage() {
  const member = await getCurrentMember();

  if (!member || member.status !== 'actiu') {
    return (
      <PageShell title="Zona de socis">
        <p>Aquesta secció és només per a socis amb el compte actiu.</p>
        <p>
          <Link href="/socis/login" className="text-primary underline">
            Inicia sessió
          </Link>{' '}
          o{' '}
          <Link href="/socis/registre" className="text-primary underline">
            fes-te soci
          </Link>{' '}
          per accedir-hi.
        </p>
        <p>
          Mentrestant pots consultar l&apos;{' '}
          <Link href="/agenda" className="text-primary underline">
            agenda pública d&apos;actes
          </Link>
          .
        </p>
      </PageShell>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [events, reservations] = await Promise.all([
    prisma.events.findMany({
      where: { event_date: { gte: today } },
      orderBy: { event_date: 'asc' },
    }),
    prisma.reservations.findMany({
      where: { member_id: member.id, status: 'confirmada' },
      include: { events: { select: { title: true, event_date: true } } },
      orderBy: { created_at: 'desc' },
    }),
  ]);

  return (
    <PageShell title={`Hola, ${member.name}`}>
      <p>
        Benvingut/da a la zona de socis.{' '}
        <Link href="/socis/fotos/pujar" className="text-primary underline">
          Puja fotos d&apos;actes
        </Link>
        .{' '}
        {member.admin && (
          <>
            {' '}
            <Link href="/admin" className="text-primary underline">
              Panell d&apos;administració
            </Link>
          </>
        )}
      </p>

      <h2 className="pt-4 font-serif text-2xl font-semibold text-slate-900">Propers actes</h2>
      {events.length === 0 && <p>No hi ha actes programats properament.</p>}
      <ul className="space-y-6">
        {events.map((event) => (
          <li key={event.id} className="rounded-md border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">
              {event.title}
              {event.members_only && (
                <span className="ml-2 rounded bg-secondary/20 px-2 py-0.5 text-xs text-secondary-dark">
                  Només socis
                </span>
              )}
            </h3>
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
              <ReservationForm
                eventId={event.id}
                defaultName={member.name}
                defaultEmail={member.email}
              />
            ) : (
              <p className="mt-2 text-sm text-slate-500">Aquest acte no té reserves obertes.</p>
            )}
          </li>
        ))}
      </ul>

      <h2 className="pt-4 font-serif text-2xl font-semibold text-slate-900">Les meves reserves</h2>
      {reservations.length === 0 && <p>Encara no has fet cap reserva.</p>}
      <ul className="space-y-2">
        {reservations.map((r) => (
          <li key={r.id} className="text-sm">
            {r.events.title} — {r.quantity} {r.quantity === 1 ? 'persona' : 'persones'}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
