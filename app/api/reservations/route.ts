import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getCurrentMember } from '@/lib/auth/session';
import { isValidEmail, isValidName, isValidQuantity } from '@/lib/validators';
import { apiError } from '@/lib/i18n/api-error';
import { generateTicketCode } from '@/lib/tickets';
import { withBasePath } from '@/lib/basePath';
import { isMailSendingConfigured, sendMail } from '@/lib/mail/brevo';
import { getLocale, getMessages } from '@/lib/i18n';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError('invalidData', 400);
  }

  const eventId = String(body.eventId || '');
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const quantity = Number(body.quantity);

  if (!eventId) {
    return apiError('missingEvent', 400);
  }
  if (!isValidName(name)) {
    return apiError('nameLength', 400);
  }
  if (!isValidEmail(email)) {
    return apiError('invalidEmail', 400);
  }
  if (!isValidQuantity(quantity)) {
    return apiError('quantityRange', 400);
  }

  const event = await prisma.events.findUnique({ where: { id: eventId } });
  if (!event) {
    return apiError('eventNotFound', 404);
  }
  if (!event.reservations_open) {
    return apiError('reservationsClosed', 400);
  }

  const currentMember = await getCurrentMember();
  const isActiveMember = currentMember?.status === 'actiu';

  if (event.members_only && !isActiveMember) {
    return apiError('membersOnlyReservation', 403);
  }

  if (event.capacity != null) {
    const confirmed = await prisma.reservations.aggregate({
      where: { event_id: eventId, status: 'confirmada' },
      _sum: { quantity: true },
    });
    const reserved = confirmed._sum.quantity || 0;
    if (reserved + quantity > event.capacity) {
      return apiError('noSeatsLeft', 409);
    }
  }

  let reservation;
  // Col·lisió de ticket_code pràcticament impossible (12 caràcters, alfabet
  // de 30 símbols), però es reintenta per seguretat davant la restricció UNIQUE.
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      reservation = await prisma.reservations.create({
        data: {
          event_id: eventId,
          member_id: isActiveMember ? currentMember!.id : null,
          name,
          email,
          quantity,
          status: 'confirmada',
          ticket_code: generateTicketCode(),
        },
      });
      break;
    } catch (err) {
      if (attempt === 5) throw err;
    }
  }
  if (!reservation) {
    return apiError('invalidData', 500);
  }

  const ticketUrl = withBasePath(`/tiquet/${reservation.ticket_code}`);
  let mailSent = false;

  if (isMailSendingConfigured()) {
    try {
      const locale = await getLocale();
      const messages = getMessages(locale);
      const t = messages.tiquet.mail;
      const origin = request.nextUrl.origin;
      const absoluteUrl = `${origin}${ticketUrl}`;
      const result = await sendMail({
        toEmail: email,
        toName: name,
        subject: t.subject.replace('{event}', event.title),
        text: `${t.greeting.replace('{name}', name)}\n\n${t.body.replace('{event}', event.title)}\n\n${absoluteUrl}\n\n${t.signature}`,
      });
      mailSent = result.ok;
    } catch {
      // L'enviament de correu mai ha de bloquejar ni fer fallar la reserva.
      mailSent = false;
    }
  }

  return NextResponse.json({
    ok: true,
    reservationId: reservation.id,
    ticketCode: reservation.ticket_code,
    ticketUrl,
    mailConfigured: isMailSendingConfigured(),
    mailSent,
  });
}
