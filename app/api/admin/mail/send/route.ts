import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';
import { substituteVariables, sampleVariables } from '@/lib/mail/template';
import { filterRecipients, chunkIntoBatches, type RecipientCandidate } from '@/lib/mail/recipients';
import { isMailSendingConfigured, sendMail } from '@/lib/mail/brevo';
import { readMailAttachment, deleteMailAttachment } from '@/lib/mail/attachments';

interface SendRequestBody {
  mode: 'preview' | 'confirm';
  templateId?: string;
  subject?: string;
  body_text?: string;
  target: 'member' | 'all';
  memberId?: string;
  attachmentFileName?: string;
}

const RECIPIENT_SELECT = {
  id: true,
  name: true,
  email: true,
  status: true,
  gdpr_consent_at: true,
  mail_opt_out: true,
} as const;

async function resolveSubjectAndBody(body: SendRequestBody) {
  if (body.templateId) {
    const template = await prisma.mail_templates.findUnique({ where: { id: body.templateId } });
    if (!template) return null;
    return { subject: template.subject, bodyText: template.body_text, templateId: template.id };
  }
  if (body.subject && body.body_text) {
    return { subject: body.subject, bodyText: body.body_text, templateId: null };
  }
  return null;
}

async function resolveRecipients(body: SendRequestBody): Promise<RecipientCandidate[]> {
  if (body.target === 'member') {
    if (!body.memberId) return [];
    const member = await prisma.members.findUnique({ where: { id: body.memberId }, select: RECIPIENT_SELECT });
    return member ? [member] : [];
  }
  return prisma.members.findMany({ where: { status: 'actiu' }, select: RECIPIENT_SELECT });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  let body: SendRequestBody;
  try {
    body = await request.json();
  } catch {
    return apiError('invalidData', 400);
  }

  if (body.mode !== 'preview' && body.mode !== 'confirm') {
    return apiError('invalidQuery', 400);
  }
  if (body.target !== 'member' && body.target !== 'all') {
    return apiError('invalidQuery', 400);
  }

  const resolved = await resolveSubjectAndBody(body);
  if (!resolved) {
    return apiError('templateNotFound', 404);
  }

  const candidates = await resolveRecipients(body);
  const recipients = filterRecipients(candidates);

  if (body.mode === 'preview') {
    const sampleMember = recipients[0] || candidates[0] || null;
    const sampleName = sampleMember?.name || 'Soci/a';
    return NextResponse.json({
      ok: true,
      recipientCount: recipients.length,
      candidateCount: candidates.length,
      preview: {
        subject: substituteVariables(resolved.subject, sampleVariables(sampleName)),
        body: substituteVariables(resolved.bodyText, sampleVariables(sampleName)),
      },
    });
  }

  // mode === 'confirm'
  if (recipients.length === 0) {
    return apiError('noRecipients', 400);
  }
  if (!isMailSendingConfigured()) {
    return apiError('mailNotConfigured', 503);
  }

  let attachmentContent: string | undefined;
  if (body.attachmentFileName) {
    try {
      const buffer = await readMailAttachment(body.attachmentFileName);
      attachmentContent = buffer.toString('base64');
    } catch {
      return apiError('fileNotAvailable', 404);
    }
  }

  const campaignId = randomUUID();
  const batches = chunkIntoBatches(recipients);
  let sent = 0;
  let failed = 0;

  for (const batch of batches) {
    for (const member of batch) {
      const vars = { nom: member.name } as Record<string, string>;
      const subject = substituteVariables(resolved.subject, vars);
      const text = substituteVariables(resolved.bodyText, vars);

      const result = await sendMail({
        toEmail: member.email,
        toName: member.name,
        subject,
        text,
        attachments: attachmentContent
          ? [{ name: 'adjunt.pdf', content: attachmentContent }]
          : undefined,
      });

      if (result.ok) {
        sent += 1;
        await prisma.mail_log.create({
          data: {
            member_id: member.id,
            template_id: resolved.templateId,
            campaign_id: campaignId,
            subject,
            status: 'enviat',
            provider_message_id: result.messageId || null,
          },
        });
      } else {
        failed += 1;
        await prisma.mail_log.create({
          data: {
            member_id: member.id,
            template_id: resolved.templateId,
            campaign_id: campaignId,
            subject,
            status: 'error',
            error_code: result.errorCode,
          },
        });
      }
    }
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  if (body.attachmentFileName) {
    await deleteMailAttachment(body.attachmentFileName);
  }

  return NextResponse.json({ ok: true, campaignId, sent, failed, total: recipients.length });
}
