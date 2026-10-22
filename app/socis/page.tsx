import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentMember } from '@/lib/auth/session';
import PageShell from '@/components/common/PageShell';
import ReservationForm from '@/components/socis/ReservationForm';
import { getLocale, getMessages } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.socis.restrictedTitle} · AVV Can Gorgs II` };
}

export default async function SocisPage() {
  const member = await getCurrentMember();
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.socis;
  const dateLocale = locale === 'es' ? 'es-ES' : 'ca-ES';

  if (!member || member.status !== 'actiu') {
    return (
      <PageShell title={t.restrictedTitle}>
        <p>{t.restrictedOnly}</p>
        <p>
          <Link href="/socis/login" className="text-primary underline">
            {t.login}
          </Link>{' '}
          {t.or}{' '}
          <Link href="/socis/registre" className="text-primary underline">
            {t.becomeMember}
          </Link>{' '}
          {t.toAccess}
        </p>
        <p>
          {t.meanwhile}{' '}
          <Link href="/agenda" className="text-primary underline">
            {t.publicAgenda}
          </Link>
          {t.period}
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
    <PageShell title={t.hello.replace('{name}', member.name)}>
      <p>
        {t.welcome}{' '}
        <Link href="/socis/fotos/pujar" className="text-primary underline">
          {t.uploadPhotos}
        </Link>
        .{' '}
        {member.admin && (
          <>
            {' '}
            <Link href="/admin" className="text-primary underline">
              {t.adminPanel}
            </Link>
          </>
        )}
      </p>

      <h2 className="pt-4 font-serif text-2xl font-semibold text-slate-900">{t.upcomingEventsTitle}</h2>
      {events.length === 0 && <p>{t.noUpcoming}</p>}
      <ul className="space-y-6">
        {events.map((event) => (
          <li key={event.id} className="rounded-md border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">
              {event.title}
              {event.members_only && (
                <span className="ml-2 rounded bg-secondary/20 px-2 py-0.5 text-xs text-secondary-dark">
                  {t.membersOnlyBadge}
                </span>
              )}
            </h3>
            {event.event_date && (
              <p className="text-sm text-slate-500">
                {new Date(event.event_date).toLocaleDateString(dateLocale, {
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
              <p className="mt-2 text-sm text-slate-500">{t.reservationsClosed}</p>
            )}
          </li>
        ))}
      </ul>

      <h2 className="pt-4 font-serif text-2xl font-semibold text-slate-900">{t.myReservationsTitle}</h2>
      {reservations.length === 0 && <p>{t.noReservations}</p>}
      <ul className="space-y-2">
        {reservations.map((r) => (
          <li key={r.id} className="text-sm">
            {r.events.title} — {r.quantity} {r.quantity === 1 ? t.personSingular : t.personPlural}
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
