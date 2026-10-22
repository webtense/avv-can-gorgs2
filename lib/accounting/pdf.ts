/**
 * Generador mínim de PDF sense dependències externes.
 *
 * Decisión: no se añade pdf-lib (ni ninguna otra librería) porque este
 * worktree no puede ejecutar `npm install` en local (compilación solo
 * remota) y el CI usa `npm ci`, que exige un package-lock.json
 * sincronizado con integridad de paquetes — no se puede generar a mano con
 * garantías. En su lugar se construye aquí un PDF válido (texto plano,
 * fuente estándar Helvetica, una página A4) mediante la sintaxis nativa
 * del formato, suficiente para un documento de una página con líneas de
 * texto. Si en el futuro se necesita maquetación compleja (logos, tablas
 * con saltos de página), valorar añadir pdf-lib en una PR donde sí se
 * pueda regenerar el lockfile.
 *
 * Este documento es un BORRADOR para revisión de gestoría: el formato
 * legal de factura (RD 1619/2012) debe validarlo un asesor fiscal antes
 * de usarse para facturación real.
 */

const PAGE_WIDTH = 595.28; // A4 en puntos
const PAGE_HEIGHT = 841.89;
const LEFT_MARGIN = 56;
const FONT_SIZE = 10;
const LINE_HEIGHT = 14;

function escapePdfText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // quita acentos: WinAnsi básico no los garantiza bien
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export interface PdfTextLine {
  text: string;
  bold?: boolean;
  size?: number;
}

/** Construye un PDF de una página a partir de líneas de texto, de arriba a abajo. */
export function buildSimplePdf(lines: PdfTextLine[]): Buffer {
  let y = PAGE_HEIGHT - 56;
  const contentParts: string[] = ['BT'];
  for (const line of lines) {
    const size = line.size ?? FONT_SIZE;
    const font = line.bold ? '/F2' : '/F1';
    contentParts.push(`${font} ${size} Tf`);
    contentParts.push(`1 0 0 1 ${LEFT_MARGIN} ${y.toFixed(2)} Tm`);
    contentParts.push(`(${escapePdfText(line.text)}) Tj`);
    y -= LINE_HEIGHT;
  }
  contentParts.push('ET');
  const content = contentParts.join('\n');
  const contentBytes = Buffer.from(content, 'latin1');

  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`
  );
  objects.push(`<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}
