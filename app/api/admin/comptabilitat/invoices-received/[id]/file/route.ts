import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';

const UPLOAD_DIR = process.env.RECEIVED_INVOICES_DIR || '/data/invoices-received';

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  png: 'image/png',
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  const { id } = await params;
  const invoice = await prisma.invoices_received.findUnique({ where: { id } });
  if (!invoice) {
    return apiError('invalidData', 404);
  }

  const safeName = path.basename(invoice.file_path);
  const ext = safeName.split('.').pop() || '';
  let buffer: Buffer;
  try {
    buffer = await readFile(path.join(UPLOAD_DIR, safeName));
  } catch {
    return apiError('fileNotAvailable', 404);
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': MIME_BY_EXT[ext] || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${safeName}"`,
    },
  });
}
