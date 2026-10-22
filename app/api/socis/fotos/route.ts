import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isSameOriginRequest } from '@/lib/csrf';
import { getActiveMember } from '@/lib/auth/session';
import { MAX_FILES_PER_UPLOAD, MAX_FILE_SIZE, saveUploadedFile, sniffImageType } from '@/lib/uploads';

export async function GET() {
  const member = await getActiveMember();
  if (!member) {
    return NextResponse.json({ error: 'No autoritzat.' }, { status: 403 });
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
    return NextResponse.json({ error: 'Cal ser soci actiu per pujar fotos.' }, { status: 403 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Sol·licitud no vàlida.' }, { status: 403 });
  }

  const form = await request.formData();
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  const eventIdRaw = form.get('eventId');
  const eventId = typeof eventIdRaw === 'string' && eventIdRaw.length > 0 ? eventIdRaw : null;
  const captionRaw = form.get('caption');
  const caption = typeof captionRaw === 'string' ? captionRaw.slice(0, 500) : null;

  if (files.length === 0) {
    return NextResponse.json({ error: 'Cal seleccionar com a mínim una imatge.' }, { status: 400 });
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return NextResponse.json(
      { error: `Només es poden pujar ${MAX_FILES_PER_UPLOAD} imatges per enviament.` },
      { status: 400 }
    );
  }

  if (eventId) {
    const event = await prisma.events.findUnique({ where: { id: eventId } });
    if (!event) {
      return NextResponse.json({ error: 'Acte no trobat.' }, { status: 404 });
    }
  }

  const created: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `La imatge "${file.name}" supera els 10 MB.` },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImageType(buffer);
    if (!sniffed) {
      return NextResponse.json(
        { error: `"${file.name}" no és una imatge JPEG, PNG o WebP vàlida.` },
        { status: 400 }
      );
    }

    const fileName = await saveUploadedFile(buffer, sniffed.ext);

    const photo = await prisma.event_photos.create({
      data: {
        event_id: eventId,
        uploaded_by: member.id,
        file_name: fileName,
        mime_type: sniffed.mime,
        size_bytes: buffer.length,
        caption,
        approved: false,
      },
    });
    created.push(photo.id);
  }

  return NextResponse.json({
    ok: true,
    message: 'Fotos pujades. Quedaran pendents de revisió per la junta abans de ser públiques.',
    ids: created,
  });
}
