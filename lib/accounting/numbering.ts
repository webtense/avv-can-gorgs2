import { Prisma, PrismaClient } from '@prisma/client';
import { formatInvoiceNumber } from './money';

/**
 * Reserva el siguiente número correlativo de factura emitida para la serie
 * indicada (normalmente el año en curso) dentro de una transacción, para
 * garantizar que no queden huecos ni duplicados bajo concurrencia.
 */
export async function reserveNextInvoiceNumber(
  tx: Prisma.TransactionClient | PrismaClient,
  series: string
): Promise<string> {
  const row = await tx.invoice_number_sequences.upsert({
    where: { series },
    create: { series, last_value: 1 },
    update: { last_value: { increment: 1 } },
  });
  return formatInvoiceNumber(series, row.last_value);
}
