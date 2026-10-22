import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';
import { MAX_ATTACHMENT_SIZE, isPdfBuffer, saveMailAttachment } from '@/lib/mail/attachments';

export async function POST(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return apiError('noAttachmentSelected', 400);
  }
  if (file.size > MAX_ATTACHMENT_SIZE) {
    return apiError('attachmentTooLarge', 400, { name: file.name });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isPdfBuffer(buffer)) {
    return apiError('invalidAttachmentType', 400, { name: file.name });
  }

  const fileName = await saveMailAttachment(buffer);
  return NextResponse.json({ ok: true, fileName, originalName: file.name });
}
