import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getActiveMember } from '@/lib/auth/session';
import {
  MAX_FILES_PER_UPLOAD,
  MAX_FILE_SIZE,
  saveUploadedFile,
  sniffImageType,
  stripImageMetadata,
} from '@/lib/uploads';
import { getLocale, getMessages } from '@/lib/i18n';

export async function GET() {
  const member = await getActiveMember();
  if (!member) {
    return apiError('notAuthorized', 403);
  }
  const photos = await prisma.event_photos.findMany({
    where: { uploaded_by: member.id },
    orderBy: { created_at: 'desc' },
    select: { id: true, file_name: true, caption: true, approved: true, created_at: true, event_id: true },
  });
  return NextResponse.json({ photos });
}

export async function POST(request: NextRequest) {
  const member = await getActiveMember();
  if (!member) {
    return apiError('mustBeActiveMember', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }

  const form = await request.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  const eventIdRaw = form.get('eventId');
  const eventId = typeof eventIdRaw === 'string' && eventIdRaw.length > 0 ? eventIdRaw : null;
  const captionRaw = form.get('caption');
  const caption = typeof captionRaw === 'string' ? captionRaw.slice(0, 500) : null;

  if (files.length === 0) {
    return apiError('noImageSelected', 400);
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return apiError('tooManyFiles', 400, { max: MAX_FILES_PER_UPLOAD });
  }

  if (eventId) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) {
      return apiError('eventNotFound', 404);
    }
  }

  const created: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return apiError('fileTooLarge', 400, { name: file.name });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      return apiError('invalidFileType', 400, { name: file.name });
    }

    let cleanBuffer: Buffer;
    try {
      cleanBuffer = await stripImageMetadata(buffer, sniffed.mime);
    } catch {
      return apiError('imageProcessingFailed', 400, { name: file.name });
    }

    const fileName = await saveUploadedFile(cleanBuffer, sniffed.ext);

    const photo = await prisma.event_photos.create({
      data: {
        event_id: eventId,
        uploaded_by: member.id,
        file_name: fileName,
        mime_type: sniffed.mime,
        size_bytes: cleanBuffer.length,
        caption,
        approved: false,
      },
    });
    created.push(photo.id);
  }

  const messages = getMessages(await getLocale());
  return NextResponse.json({
    ok: true,
    message: messages.apiErrors.photosUploaded,
    ids: created,
  });
}
