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

interface ProductCostReportRow {
  productKey: string;
  outUnits: number;
  soldUnits: number;
  revenueCents: number;
  giftUnits: number;
  giftCostCents: number;
  giftValueCents: number;
  soldCostCents: number;
  marginCents: number;
}

interface ProductReport {
  rows: ProductCostReportRow[];
  total: ProductCostReportRow & { grossValueDeliveredCents: number };
}

interface ReportData {
  event: { id: string; title: string; eventDate: string | null };
  sessions: SessionReport[];
  total: Omit<SessionReport, 'sessionId' | 'operatorName' | 'openedAt' | 'closedAt'>;
  productReport: ProductReport;
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

          <div className="mt-6">
            <h4 className="font-medium text-slate-900">{t('admin.tpv.barEvents.productReportTitle')}</h4>
            <div className="mt-2 overflow-x-auto">
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
                  {data.productReport.rows.map((row) => (
                    <tr key={row.productKey}>
                      <td className="py-2 pr-2">{row.productKey}</td>
                      <td className="py-2 pr-2">{row.outUnits}</td>
                      <td className="py-2 pr-2">{row.soldUnits}</td>
                      <td className="py-2 pr-2">{formatCents(row.revenueCents)}</td>
                      <td className="py-2 pr-2">{row.giftUnits}</td>
                      <td className="py-2 pr-2 text-emerald-700">{formatCents(row.giftCostCents)}</td>
                      <td className="py-2 pr-2 text-emerald-700">{formatCents(row.giftValueCents)}</td>
                      <td className="py-2 pr-2">{formatCents(row.soldCostCents)}</td>
                      <td className="py-2 pr-2">{formatCents(row.marginCents)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="py-2 pr-2">{t('admin.tpv.barEvents.total')}</td>
                    <td className="py-2 pr-2">{data.productReport.total.outUnits}</td>
                    <td className="py-2 pr-2">{data.productReport.total.soldUnits}</td>
                    <td className="py-2 pr-2">{formatCents(data.productReport.total.revenueCents)}</td>
                    <td className="py-2 pr-2">{data.productReport.total.giftUnits}</td>
                    <td className="py-2 pr-2 text-emerald-700">{formatCents(data.productReport.total.giftCostCents)}</td>
                    <td className="py-2 pr-2 text-emerald-700">{formatCents(data.productReport.total.giftValueCents)}</td>
                    <td className="py-2 pr-2">{formatCents(data.productReport.total.soldCostCents)}</td>
                    <td className="py-2 pr-2">{formatCents(data.productReport.total.marginCents)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-medium text-slate-900">{t('admin.tpv.barEvents.summaryTitle')}</h4>
            <dl className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between">
                <dt className="text-slate-600">{t('admin.tpv.barEvents.summaryRevenue')}</dt>
                <dd className="font-medium">{formatCents(data.productReport.total.revenueCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">{t('admin.tpv.barEvents.summarySoldCost')}</dt>
                <dd className="font-medium">{formatCents(data.productReport.total.soldCostCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">{t('admin.tpv.barEvents.summaryGiftCost')}</dt>
                <dd className="font-medium text-emerald-700">{formatCents(data.productReport.total.giftCostCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">{t('admin.tpv.barEvents.summaryGiftValue')}</dt>
                <dd className="font-medium text-emerald-700">{formatCents(data.productReport.total.giftValueCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">{t('admin.tpv.barEvents.summaryMargin')}</dt>
                <dd className="font-bold">{formatCents(data.productReport.total.marginCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">{t('admin.tpv.barEvents.summaryGrossValue')}</dt>
                <dd className="font-bold">{formatCents(data.productReport.total.grossValueDeliveredCents)}</dd>
              </div>
            </dl>
          </div>
        </>
      )}
    </div>
  );
}
