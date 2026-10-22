import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || '/data/uploads';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_FILES_PER_UPLOAD = 10;
const MAX_DIMENSION = 2400;

const SIGNATURES: { mime: string; ext: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', ext: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', ext: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WebP: "RIFF" .... "WEBP" — es comprova per parts, veure sniffImageType.
];

/**
 * Determina el tipus real d'una imatge llegint la capçalera de bytes (magic numbers),
 * ignorant el nom de fitxer o el Content-Type declarat pel navegador.
 */
export function sniffImageType(buffer: Buffer): { mime: string; ext: string } | null {
  for (const sig of SIGNATURES) {
    if (buffer.length >= sig.bytes.length && sig.bytes.every((b, i) => buffer[i] === b)) {
      return { mime: sig.mime, ext: sig.ext };
    }
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

/**
 * Reprocessa una imatge amb sharp: aplica l'orientació EXIF i la descarta
 * (per defecte sharp no conserva metadades a la sortida si no es crida
 * `.withMetadata()`, així que GPS i la resta de EXIF s'eliminen), limita el
 * costat més gran a MAX_DIMENSION px i recodifica en el mateix format
 * d'entrada. Si sharp no pot processar el fitxer, es llança una excepció i
 * la pujada s'ha de rebutjar sense desar l'original.
 */
export async function stripImageMetadata(buffer: Buffer, mime: string): Promise<Buffer> {
  let pipeline = sharp(buffer).rotate().resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: 'inside',
    withoutEnlargement: true,
  });

  if (mime === 'image/jpeg') {
    pipeline = pipeline.jpeg({ quality: 85 });
  } else if (mime === 'image/png') {
    pipeline = pipeline.png();
  } else if (mime === 'image/webp') {
    pipeline = pipeline.webp();
  }

  return pipeline.toBuffer();
}

/** Desa un fitxer al directori d'uploads amb nom aleatori (UUID), mai el nom original. */
export async function saveUploadedFile(buffer: Buffer, ext: string): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, fileName), buffer);
  return fileName;
}

export async function readUploadedFile(fileName: string): Promise<Buffer> {
  const safeName = path.basename(fileName);
  return readFile(path.join(UPLOAD_DIR, safeName));
}

export async function deleteUploadedFile(fileName: string): Promise<void> {
  const safeName = path.basename(fileName);
  try {
    await unlink(path.join(UPLOAD_DIR, safeName));
  } catch {
    // Si el fitxer ja no existeix, continuem: l'important és esborrar el registre a BD.
  }
}
