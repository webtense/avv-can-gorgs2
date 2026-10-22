import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import { isSameOriginRequest } from '@/lib/csrf';
import { logAccountingAudit } from '@/lib/accounting/audit';
import { calculateVatCents } from '@/lib/accounting/money';

const UPLOAD_DIR = process.env.RECEIVED_INVOICES_DIR || '/data/invoices-received';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const SIGNATURES: { mime: string; ext: string; bytes: number[] }[] = [
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
];

function sniffFileType(buffer: Buffer): { mime: string; ext: string } | null {
  for (const sig of SIGNATURES) {
    if (buffer.length >= sig.bytes.length && sig.bytes.every((b, i) => buffer[i] === b)) {
      return sig;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const supplier = searchParams.get('supplier') || undefined;

  const invoices = await prisma.invoices_received.findMany({
    where: {
      status: status || undefined,
      supplier_name: supplier ? { contains: supplier, mode: 'insensitive' } : undefined,
    },
    orderBy: { issue_date: 'desc' },
    select: {
      id: true,
      supplier_name: true,
      supplier_nif: true,
      invoice_number: true,
      issue_date: true,
      due_date: true,
      total_cents: true,
      status: true,
    },
  });
  return NextResponse.json({ invoices });
}

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
    return apiError('invalidData', 400);
  }
  if (file.size > MAX_FILE_SIZE) {
    return apiError('fileTooLarge', 400, { name: file.name });
  }

  const supplierName = String(form.get('supplierName') || '').trim();
  const supplierNif = String(form.get('supplierNif') || '').trim() || null;
  const invoiceNumber = String(form.get('invoiceNumber') || '').trim();
  const issueDateRaw = String(form.get('issueDate') || '');
  const dueDateRaw = String(form.get('dueDate') || '');
  const baseCents = Number(form.get('baseCents'));
  const vatRatePercent = Number(form.get('vatRatePercent'));

  if (!supplierName || !invoiceNumber || !issueDateRaw) {
    return apiError('invalidData', 400);
  }
  if (!Number.isInteger(baseCents) || baseCents < 0) {
    return apiError('invalidData', 400);
  }
  if (!Number.isInteger(vatRatePercent) || vatRatePercent < 0) {
    return apiError('invalidData', 400);
  }
  // El IVA no se confía nunca del cliente: se recalcula siempre en el servidor
  // a partir de la base y el tipo, y el total se deriva de ambos (base + IVA).
  // Así el asiento cuadra por construcción, igual que exige la restricción de BD.
  const vatCents = calculateVatCents(baseCents, vatRatePercent);
  const totalCents = baseCents + vatCents;
  const issueDate = new Date(issueDateRaw);
  if (Number.isNaN(issueDate.getTime())) {
    return apiError('invalidData', 400);
  }
  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) {
    return apiError('invalidData', 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffFileType(buffer);
  if (!sniffed) {
    return apiError('invalidFileType', 400, { name: file.name });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `${randomUUID()}.${sniffed.ext}`;
  await writeFile(path.join(UPLOAD_DIR, fileName), buffer);

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoices_received.create({
      data: {
        supplier_name: supplierName,
        supplier_nif: supplierNif,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate,
        base_cents: baseCents,
        vat_rate_percent: vatRatePercent,
        vat_cents: vatCents,
        total_cents: totalCents,
        file_path: fileName,
      },
    });
    await logAccountingAudit(tx, {
      actorMemberId: admin.id,
      action: 'create_invoice_received',
      entity: 'invoices_received',
      entityId: created.id,
      detail: `supplier=${supplierName}`,
    });
    return created;
  });

  return NextResponse.json({ ok: true, invoice: { id: invoice.id } });
}
