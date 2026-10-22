import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getCurrentMember } from '@/lib/auth/session';
import { readUploadedFile } from '@/lib/uploads';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await prisma.event_photos.findUnique({ where: { id } });
  if (!photo) {
    return apiError('photoNotFound', 404);
  }

  if (!photo.approved) {
    const member = await getCurrentMember();
    const isOwner = member && member.id === photo.uploaded_by;
    const isAdmin = member && member.admin && member.status === 'actiu';
    if (!isOwner && !isAdmin) {
      return apiError('photoNotAvailable', 404);
    }
  }

  let buffer: Buffer;
  try {
    buffer = await readUploadedFile(photo.file_name);
  } catch {
    return apiError('fileNotAvailable', 404);
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': photo.mime_type,
      'Cache-Control': photo.approved ? 'public, max-age=86400' : 'private, no-store',
    },
  });
}
