import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

export const MAIL_ATTACHMENT_DIR = process.env.MAIL_ATTACHMENT_DIR || '/data/mail-attachments';
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

/** Comprova que un fitxer és realment un PDF llegint-ne la capçalera de bytes. */
export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= PDF_SIGNATURE.length && PDF_SIGNATURE.every((b, i) => buffer[i] === b);
}

/** Desa un adjunt PDF fora de public/, amb nom aleatori (mai el nom original). */
export async function saveMailAttachment(buffer: Buffer): Promise<string> {
  await mkdir(MAIL_ATTACHMENT_DIR, { recursive: true });
  const fileName = `${randomUUID()}.pdf`;
  await writeFile(path.join(MAIL_ATTACHMENT_DIR, fileName), buffer);
  return fileName;
}

export async function readMailAttachment(fileName: string): Promise<Buffer> {
  const safeName = path.basename(fileName);
  return readFile(path.join(MAIL_ATTACHMENT_DIR, safeName));
}

export async function deleteMailAttachment(fileName: string): Promise<void> {
  const safeName = path.basename(fileName);
  try {
    await unlink(path.join(MAIL_ATTACHMENT_DIR, safeName));
  } catch {
    // Si el fitxer ja no existeix, no cal fer res més.
  }
}
