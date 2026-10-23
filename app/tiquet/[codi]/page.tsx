import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { prisma } from '@/lib/db';
import { isValidTicketCode } from '@/lib/tickets';
import { getLocale, getMessages } from '@/lib/i18n';
import PageShell from '@/components/common/PageShell';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ codi: string }>;
}

export async function generateMetadata(_props: Props) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return {
    title: `${messages.tiquet.pageTitle} · AVV Can Gorgs II`,
    robots: { index: false, follow: false },
  };
}

export default async function TiquetPage({ params }: Props) {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.tiquet;
  const dateLocale = locale === 'es' ? 'es-ES' : 'ca-ES';

  const { codi } = await params;
  const code = (codi || '').trim().toUpperCase();
  if (!isValidTicketCode(code)) {
    notFound();
  }

  const reservation = await prisma.reservations.findUnique({
    where: { ticket_code: code },
    include: { events: { select: { title: true, event_date: true } } },
  });

  if (!reservation) {
    return (
      <PageShell title={t.notFoundTitle}>
        <p>{t.notFound}</p>
      </PageShell>
    );
  }

  // El QR codifica la mateixa URL pública del tiquet, perquè un escàner
  // genèric (o la càmera del mòbil) porti directament a aquesta pàgina; el
  // control d'accés després hi introdueix el codi (escrit o copiat) al
  // formulari de /tpv/control.
  const ticketPath = `/tiquet/${reservation.ticket_code}`;
  const qrDataUrl = await QRCode.toDataURL(ticketPath, { width: 320, margin: 2 });

  return (
    <PageShell title={t.title}>
      <div className="rounded-lg border border-slate-200 p-6 text-center">
        <p className="text-sm text-slate-500">{t.nameLabel}</p>
        <p className="text-lg font-semibold text-slate-900">{reservation.name}</p>

        <p className="mt-4 text-sm text-slate-500">{t.eventLabel}</p>
        <p className="text-lg font-semibold text-slate-900">{reservation.events.title}</p>

        {reservation.events.event_date && (
          <>
            <p className="mt-4 text-sm text-slate-500">{t.dateLabel}</p>
            <p className="text-slate-900">
              {new Date(reservation.events.event_date).toLocaleDateString(dateLocale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </>
        )}

        <p className="mt-4 text-sm text-slate-500">{t.quantityLabel}</p>
        <p className="text-slate-900">{reservation.quantity}</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt={t.qrAlt}
          width={320}
          height={320}
          className="mx-auto mt-6 h-auto w-64 max-w-full"
        />
      </div>
    </PageShell>
  );
}
