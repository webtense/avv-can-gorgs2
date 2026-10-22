import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { stripImageMetadata } from '../lib/uploads';

/**
 * Genera un JPEG mínim amb metadades EXIF, incloent-hi GPS, per verificar que
 * stripImageMetadata() les elimina. No depèn de cap fitxer de mostra: es crea
 * la imatge en memòria amb sharp.
 */
async function buildJpegWithGpsExif(): Promise<Buffer> {
  return sharp({
    create: {
      width: 20,
      height: 20,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg()
    .withExif({
      IFD0: {
        Make: 'TestCam',
      },
      GPS: {
        GPSLatitudeRef: 'N',
        GPSLatitude: '41/1 23/1 0/1',
        GPSLongitudeRef: 'E',
        GPSLongitude: '2/1 10/1 0/1',
      },
    })
    .toBuffer();
}

test('stripImageMetadata elimina l\'EXIF (incloent GPS) d\'un JPEG', async () => {
  const original = await buildJpegWithGpsExif();
  const originalMeta = await sharp(original).metadata();
  assert.ok(originalMeta.exif, 'la imatge de prova ha de tenir EXIF per validar el test');

  const cleaned = await stripImageMetadata(original, 'image/jpeg');
  const cleanedMeta = await sharp(cleaned).metadata();

  assert.strictEqual(cleanedMeta.exif, undefined, 'la imatge resultant no ha de tenir bloc EXIF');
  assert.strictEqual(cleanedMeta.format, 'jpeg');
});

test('stripImageMetadata limita el costat més gran a 2400px', async () => {
  const big = await sharp({
    create: { width: 3000, height: 1500, channels: 3, background: { r: 0, g: 0, b: 0 } },
  })
    .jpeg()
    .toBuffer();

  const resized = await stripImageMetadata(big, 'image/jpeg');
  const meta = await sharp(resized).metadata();

  assert.ok((meta.width ?? 0) <= 2400);
  assert.ok((meta.height ?? 0) <= 2400);
});
