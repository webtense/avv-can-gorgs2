import { mailConfig } from '@/lib/site-config';

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const REQUEST_TIMEOUT_MS = 15000;

export interface BrevoAttachment {
  name: string;
  content: string; // base64
}

export interface SendMailInput {
  toEmail: string;
  toName: string;
  subject: string;
  text: string;
  attachments?: BrevoAttachment[];
}

export type SendMailResult =
  | { ok: true; messageId: string }
  | { ok: false; errorCode: string };

/** Indica si l'enviament de correu està configurat (hi ha clau de Brevo). */
export function isMailSendingConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY);
}

async function postToBrevo(input: SendMailInput, apiKey: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: mailConfig.fromEmail, name: mailConfig.fromName },
        to: [{ email: input.toEmail, name: input.toName }],
        subject: input.subject,
        textContent: input.text,
        attachment: input.attachments?.map((a) => ({ name: a.name, content: a.content })),
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Envia un correu transaccional via l'API REST de Brevo (no SMTP). Si
 * BREVO_API_KEY no està definida, no s'intenta cap enviament. Fa un reintent
 * senzill (una vegada) davant d'errors de xarxa o de resposta no-2xx. No es
 * registra mai el cos del correu ni la clau de l'API, només el codi d'error.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { ok: false, errorCode: 'not_configured' };
  }

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await postToBrevo(input, apiKey);
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { messageId?: string };
        return { ok: true, messageId: data.messageId || '' };
      }
      if (attempt === 2) {
        return { ok: false, errorCode: `http_${res.status}` };
      }
    } catch {
      if (attempt === 2) {
        return { ok: false, errorCode: 'network_error' };
      }
    }
  }
  return { ok: false, errorCode: 'unknown' };
}
