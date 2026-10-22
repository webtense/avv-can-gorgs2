import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/i18n/api-error';
import { prisma } from '@/lib/db';
import { getAdminMember } from '@/lib/auth/session';
import {
  computeEventSessionReport,
  sumEventReports,
  computeProductEventReportRow,
  sumProductEventReportRows,
  formatCents,
  type ReportSale,
  type StockMovementForReport,
} from '@/lib/tpv';

/**
 * GET: informe final d'un acte de barra (admin): per cada torn de caixa i el
 * resum de l'acte sencer, unitats venudes/regalades per producte, recaptació
 * en efectiu, valor dels regals (a part, mai sumat a la recaptació), nombre
 * de tiquets, tiquet mitjà. Amb ?format=csv retorna un CSV descarregable.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminMember();
  if (!admin) {
    return apiError('notAuthorized', 403);
  }

  const { id } = await params;
  const event = await prisma.events.findUnique({ where: { id } });
  if (!event) {
    return apiError('tpvEventNotFound', 404);
  }

  const sessions = await prisma.cash_sessions.findMany({
    where: { event_id: id },
    orderBy: { opened_at: 'asc' },
    include: {
      opener: { select: { name: true } },
      tpv_sales: { include: { lines: true } },
    },
  });

  const sessionReports = sessions.map((session) => {
    const sales: ReportSale[] = session.tpv_sales.map((sale) => ({
      totalCents: sale.total_cents,
      voided: sale.voided,
      lines: sale.lines.map((l) => ({
        productKey: l.name,
        qty: l.qty,
        unitPriceCents: l.unit_price_cents,
        isFree: l.is_free,
      })),
    }));
    const report = computeEventSessionReport(sales);
    return {
      sessionId: session.id,
      operatorName: session.opener.name,
      openedAt: session.opened_at.toISOString(),
      closedAt: session.closed_at ? session.closed_at.toISOString() : null,
      ...report,
    };
  });

  const totalReport = sumEventReports(sessionReports);

  // Informe per producte: ingressos de les línies de venda no gratuïtes +
  // moviments d'estoc (sortides manuals, vendes i regals) d'aquest acte.
  const revenueByProduct = new Map<string, number>();
  for (const session of sessions) {
    for (const sale of session.tpv_sales) {
      if (sale.voided) continue;
      for (const line of sale.lines) {
        if (line.is_free || !line.product_id) continue;
        revenueByProduct.set(line.product_id, (revenueByProduct.get(line.product_id) ?? 0) + line.line_total_cents);
      }
    }
  }

  const stockMovements = await prisma.tpv_stock_movements.findMany({
    where: { event_id: id },
    include: { product: { select: { name: true } } },
  });

  const movementsByProduct = new Map<string, StockMovementForReport[]>();
  const productNameById = new Map<string, string>();
  for (const m of stockMovements) {
    productNameById.set(m.product_id, m.product.name);
    const list = movementsByProduct.get(m.product_id) ?? [];
    list.push({
      type: m.type as StockMovementForReport['type'],
      qty: m.qty,
      totalCostCents: m.total_cost_cents,
      totalValueCents: m.total_value_cents,
    });
    movementsByProduct.set(m.product_id, list);
  }

  const productIds = new Set([...movementsByProduct.keys(), ...revenueByProduct.keys()]);
  const productRows = Array.from(productIds).map((productId) =>
    computeProductEventReportRow(
      productNameById.get(productId) ?? productId,
      movementsByProduct.get(productId) ?? [],
      revenueByProduct.get(productId) ?? 0
    )
  );
  const productTotal = sumProductEventReportRows(productRows);

  const { searchParams } = new URL(request.url);
  if (searchParams.get('format') === 'csv') {
    const lines: string[] = [];
    lines.push('Operador;Obertura;Tancament;Tiquets;Recaptacio;Regals;Tiquet mitja');
    for (const s of sessionReports) {
      lines.push(
        [
          s.operatorName,
          s.openedAt,
          s.closedAt ?? '',
          String(s.ticketCount),
          formatCents(s.cashCents),
          formatCents(s.giftCents),
          formatCents(s.avgTicketCents),
        ].join(';')
      );
    }
    lines.push('');
    lines.push(
      [
        'TOTAL ACTE',
        '',
        '',
        String(totalReport.ticketCount),
        formatCents(totalReport.cashCents),
        formatCents(totalReport.giftCents),
        formatCents(totalReport.avgTicketCents),
      ].join(';')
    );
    lines.push('');
    lines.push('Producte;Unitats venudes;Unitats regalades');
    const productKeys = new Set([
      ...Object.keys(totalReport.unitsByProduct),
      ...Object.keys(totalReport.giftUnitsByProduct),
    ]);
    for (const key of productKeys) {
      lines.push(
        [key, String(totalReport.unitsByProduct[key] ?? 0), String(totalReport.giftUnitsByProduct[key] ?? 0)].join(
          ';'
        )
      );
    }

    lines.push('');
    lines.push(
      'Producte;Sortides;Venudes;Ingressos;Regalades;Cost regal;Valor regal;Cost venut;Marge'
    );
    for (const row of productRows) {
      lines.push(
        [
          row.productKey,
          String(row.unitsOut),
          String(row.unitsSold),
          formatCents(row.revenueCents),
          String(row.unitsGifted),
          formatCents(row.giftCostCents),
          formatCents(row.giftValueCents),
          formatCents(row.soldCostCents),
          formatCents(row.marginCents),
        ].join(';')
      );
    }
    lines.push(
      [
        'TOTAL PRODUCTES',
        String(productTotal.unitsOut),
        String(productTotal.unitsSold),
        formatCents(productTotal.revenueCents),
        String(productTotal.unitsGifted),
        formatCents(productTotal.giftCostCents),
        formatCents(productTotal.giftValueCents),
        formatCents(productTotal.soldCostCents),
        formatCents(productTotal.marginCents),
      ].join(';')
    );

    const csv = lines.join('\n');
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="informe-${event.title.replace(/[^a-z0-9]+/gi, '-')}.csv"`,
      },
    });
  }

  return NextResponse.json({
    event: { id: event.id, title: event.title, eventDate: event.event_date ? event.event_date.toISOString() : null },
    sessions: sessionReports,
    total: totalReport,
    products: productRows,
    productsTotal: productTotal,
  });
}
