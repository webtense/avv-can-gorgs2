'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { formatCents } from '@/lib/tpv';

interface SessionReport {
  sessionId: string;
  operatorName: string;
  openedAt: string;
  closedAt: string | null;
  ticketCount: number;
  cashCents: number;
  giftCents: number;
  avgTicketCents: number;
  unitsByProduct: Record<string, number>;
  giftUnitsByProduct: Record<string, number>;
}

interface ProductReportRow {
  productKey: string;
  unitsOut: number;
  unitsSold: number;
  unitsGifted: number;
  revenueCents: number;
  giftCostCents: number;
  giftValueCents: number;
  soldCostCents: number;
  marginCents: number;
}

interface ReportData {
  event: { id: string; title: string; eventDate: string | null };
  sessions: SessionReport[];
  total: Omit<SessionReport, 'sessionId' | 'operatorName' | 'openedAt' | 'closedAt'>;
  products: ProductReportRow[];
  productsTotal: Omit<ProductReportRow, 'productKey'>;
}

/**
 * Informe final d'un acte de barra: per torn i resum de l'acte sencer.
 * La recaptació NOMÉS inclou vendes no anul·lades; els regals es mostren a
 * part i mai sumen a la recaptació.
 */
export default function BarEventReport({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const { t } = useI18n();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tpv/bar-events/${eventId}/report`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [eventId]);

  const productKeys = data
    ? Array.from(new Set([...Object.keys(data.total.unitsByProduct), ...Object.keys(data.total.giftUnitsByProduct)]))
    : [];

  return (
    <div className="mt-6 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-900">
          {t('admin.tpv.barEvents.reportTitle')} {data ? `· ${data.event.title}` : ''}
        </h3>
        <div className="flex items-center gap-2">
          {data && (
            <a
              href={`/api/tpv/bar-events/${eventId}/report?format=csv`}
              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium"
            >
              {t('admin.tpv.barEvents.exportCsv')}
            </a>
          )}
          <button type="button" onClick={onClose} className="text-xs text-slate-500 underline">
            {t('admin.tpv.barEvents.closeReport')}
          </button>
        </div>
      </div>

      {loading && <p className="mt-2 text-sm text-slate-400">…</p>}

      {data && (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-2">{t('admin.tpv.colOperator')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.colOpenedAt')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.colTickets')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colCash')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colGifts')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colAvgTicket')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sessions.map((s) => (
                  <tr key={s.sessionId}>
                    <td className="py-2 pr-2">{s.operatorName}</td>
                    <td className="py-2 pr-2">{new Date(s.openedAt).toLocaleString('ca-ES')}</td>
                    <td className="py-2 pr-2">{s.ticketCount}</td>
                    <td className="py-2 pr-2">{formatCents(s.cashCents)}</td>
                    <td className="py-2 pr-2 text-emerald-700">{formatCents(s.giftCents)}</td>
                    <td className="py-2 pr-2">{formatCents(s.avgTicketCents)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-2 pr-2" colSpan={2}>
                    {t('admin.tpv.barEvents.total')}
                  </td>
                  <td className="py-2 pr-2">{data.total.ticketCount}</td>
                  <td className="py-2 pr-2">{formatCents(data.total.cashCents)}</td>
                  <td className="py-2 pr-2 text-emerald-700">{formatCents(data.total.giftCents)}</td>
                  <td className="py-2 pr-2">{formatCents(data.total.avgTicketCents)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-2">{t('admin.tpv.colName')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colUnitsSold')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colUnitsGifted')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productKeys.map((key) => (
                  <tr key={key}>
                    <td className="py-2 pr-2">{key}</td>
                    <td className="py-2 pr-2">{data.total.unitsByProduct[key] ?? 0}</td>
                    <td className="py-2 pr-2">{data.total.giftUnitsByProduct[key] ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 overflow-x-auto">
            <h4 className="mb-2 text-sm font-semibold text-slate-700">
              {t('admin.tpv.barEvents.productReportTitle')}
            </h4>
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-2">{t('admin.tpv.colName')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colUnitsOut')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colUnitsSold')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colRevenue')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colUnitsGifted')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colGiftCost')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colGiftValue')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colSoldCost')}</th>
                  <th className="py-2 pr-2">{t('admin.tpv.barEvents.colMargin')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.products.map((row) => (
                  <tr key={row.productKey}>
                    <td className="py-2 pr-2">{row.productKey}</td>
                    <td className="py-2 pr-2">{row.unitsOut}</td>
                    <td className="py-2 pr-2">{row.unitsSold}</td>
                    <td className="py-2 pr-2">{formatCents(row.revenueCents)}</td>
                    <td className="py-2 pr-2">{row.unitsGifted}</td>
                    <td className="py-2 pr-2 text-emerald-700">{formatCents(row.giftCostCents)}</td>
                    <td className="py-2 pr-2 text-emerald-700">{formatCents(row.giftValueCents)}</td>
                    <td className="py-2 pr-2">{formatCents(row.soldCostCents)}</td>
                    <td className="py-2 pr-2 font-medium">{formatCents(row.marginCents)}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-2 pr-2">{t('admin.tpv.barEvents.total')}</td>
                  <td className="py-2 pr-2">{data.productsTotal.unitsOut}</td>
                  <td className="py-2 pr-2">{data.productsTotal.unitsSold}</td>
                  <td className="py-2 pr-2">{formatCents(data.productsTotal.revenueCents)}</td>
                  <td className="py-2 pr-2">{data.productsTotal.unitsGifted}</td>
                  <td className="py-2 pr-2 text-emerald-700">{formatCents(data.productsTotal.giftCostCents)}</td>
                  <td className="py-2 pr-2 text-emerald-700">{formatCents(data.productsTotal.giftValueCents)}</td>
                  <td className="py-2 pr-2">{formatCents(data.productsTotal.soldCostCents)}</td>
                  <td className="py-2 pr-2">{formatCents(data.productsTotal.marginCents)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 rounded-md bg-slate-50 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-slate-500">{t('admin.tpv.barEvents.summaryRevenue')}</p>
              <p className="font-bold text-slate-900">{formatCents(data.productsTotal.revenueCents)}</p>
            </div>
            <div>
              <p className="text-slate-500">{t('admin.tpv.barEvents.summaryCost')}</p>
              <p className="font-bold text-slate-900">{formatCents(data.productsTotal.soldCostCents)}</p>
            </div>
            <div>
              <p className="text-slate-500">{t('admin.tpv.barEvents.summaryGiftCost')}</p>
              <p className="font-bold text-emerald-700">{formatCents(data.productsTotal.giftCostCents)}</p>
            </div>
            <div>
              <p className="text-slate-500">{t('admin.tpv.barEvents.summaryGiftValue')}</p>
              <p className="font-bold text-emerald-700">{formatCents(data.productsTotal.giftValueCents)}</p>
            </div>
            <div>
              <p className="text-slate-500">{t('admin.tpv.barEvents.summaryMargin')}</p>
              <p className="font-bold text-slate-900">{formatCents(data.productsTotal.marginCents)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
