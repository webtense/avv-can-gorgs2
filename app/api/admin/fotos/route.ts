import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';
import { deleteUploadedFile } from '@/lib/uploads';

export async function GET() {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  const photos = await prisma.event_photos.findMany({
    orderBy: { created_at: 'desc' },
    include: { members: { select: { name: true, email: true } } },
  });
  return NextResponse.json({ photos });
}

export async function PATCH(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }
  const body = await request.json().catch(() => null);
  const id = body && typeof body.id === 'string' ? body.id : '';
  if (!id) {
    return apiError('missingPhotoId', 400);
  }
  const photo = await prisma.event_photos.update({ where: { id }, data: { approved: true } });
  return NextResponse.json({ ok: true, photo: { id: photo.id, approved: photo.approved } });
}

export async function DELETE(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  if (!isSameOriginRequest(request)) {
    return apiError('invalidRequest', 403);
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  if (!id) {
    return apiError('missingPhotoId', 400);
  }
  const photo = await prisma.event_photos.findUnique({ where: { id } });
  if (!photo) {
    return apiError('photoNotFound', 404);
  }
  await prisma.event_photos.delete({ where: { id } });
  await deleteUploadedFile(photo.file_name);
  return NextResponse.json({ ok: true });
}
