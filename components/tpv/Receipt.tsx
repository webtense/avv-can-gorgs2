'use client';

import { useI18n } from '@/components/i18n/I18nProvider';
import { formatCents } from '@/lib/tpv';

interface CompletedSale {
  id: string;
  createdAt: string;
  totalCents: number;
  paidCents: number;
  changeCents: number;
  operatorName: string;
  lines: Array<{ name: string; unitPriceCents: number; qty: number; lineTotalCents: number }>;
}

/** Tiquet en pantalla amb botó d'impressió (window.print, sense impressora física). */
export default function Receipt({
  sale,
  onNewSale,
}: {
  sale: CompletedSale;
  onNewSale: () => void;
}) {
  const { t } = useI18n();
  const date = new Date(sale.createdAt);

  return (
    <div className="mx-auto max-w-sm px-4 py-6">
      <div id="receipt-print" className="rounded-lg border border-slate-300 bg-white p-6 font-mono text-sm shadow-sm">
        <h1 className="text-center text-lg font-bold">{t('tpv.receipt.title')}</h1>
        <p className="mt-2 text-center text-xs text-slate-500">
          {t('tpv.receipt.ticketNumber')}: {sale.id.slice(0, 8)}
        </p>
        <p className="text-center text-xs text-slate-500">
          {t('tpv.receipt.date')}: {date.toLocaleString('ca-ES')}
        </p>
        <p className="text-center text-xs text-slate-500">
          {t('tpv.receipt.operator')}: {sale.operatorName}
        </p>

        <table className="mt-4 w-full">
          <thead>
            <tr className="border-b border-slate-300 text-left">
              <th className="pb-1">{t('tpv.receipt.qty')}</th>
              <th className="pb-1">{t('tpv.receipt.product')}</th>
              <th className="pb-1 text-right">{t('tpv.receipt.subtotal')}</th>
            </tr>
          </thead>
          <tbody>
            {sale.lines.map((line, idx) => (
              <tr key={idx}>
                <td className="py-1 align-top">{line.qty}</td>
                <td className="py-1 align-top">{line.name}</td>
                <td className="py-1 text-right align-top">{formatCents(line.lineTotalCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 space-y-1 border-t border-slate-300 pt-2">
          <div className="flex justify-between font-bold">
            <span>{t('tpv.receipt.total')}</span>
            <span>{formatCents(sale.totalCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('tpv.receipt.paid')}</span>
            <span>{formatCents(sale.paidCents)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('tpv.receipt.change')}</span>
            <span>{formatCents(sale.changeCents)}</span>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">{t('tpv.receipt.thanks')}</p>
      </div>

      <div className="mt-4 flex gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-md border border-slate-300 py-3 text-base font-medium"
          style={{ minHeight: 48 }}
        >
          {t('tpv.receipt.print')}
        </button>
        <button
          type="button"
          onClick={onNewSale}
          className="flex-1 rounded-md bg-primary py-3 text-base font-semibold text-white"
          style={{ minHeight: 48 }}
        >
          {t('tpv.receipt.newSale')}
        </button>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-print,
          #receipt-print * {
            visibility: visible;
          }
          #receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}
