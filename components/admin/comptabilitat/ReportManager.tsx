'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import { withBasePath } from '@/lib/basePath';

interface Report {
  year: number;
  quarter: number;
  fees: { countPaid: number; totalCents: number };
  invoicesIssued: { count: number; totalCents: number };
  invoicesReceivedPaid: { count: number; totalCents: number };
  tpv: { count: number; totalCents: number } | null;
  balanceCents: number;
}

const now = new Date();
const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

export default function ReportManager() {
  const { t } = useI18n();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [quarter, setQuarter] = useState(String(currentQuarter));
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const res = await fetch(withBasePath(`/api/admin/comptabilitat/report?year=${year}&quarter=${quarter}`));
    if (!res.ok) {
      setError(t('admin.comptabilitat.report.loadError'));
      return;
    }
    setReport(await res.json());
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t('admin.comptabilitat.report.title')}</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm">
          {t('admin.comptabilitat.report.year')}
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="mt-1 w-28 rounded-md border border-slate-300 px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          {t('admin.comptabilitat.report.quarter')}
          <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="mt-1 rounded-md border border-slate-300 px-2 py-1">
            <option value="1">T1</option>
            <option value="2">T2</option>
            <option value="3">T3</option>
            <option value="4">T4</option>
          </select>
        </label>
        <button type="button" onClick={load} className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white">
          {t('admin.comptabilitat.report.load')}
        </button>
        <a
          href={withBasePath(`/api/admin/comptabilitat/report?year=${year}&quarter=${quarter}&format=csv`)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          {t('admin.comptabilitat.report.exportCsv')}
        </a>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {report && (
        <table className="mt-4 min-w-full divide-y divide-slate-200 text-sm">
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2 pr-4">{t('admin.comptabilitat.report.fees')}</td>
              <td className="py-2 pr-4">{(report.fees.totalCents / 100).toFixed(2)} €</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">{t('admin.comptabilitat.report.invoicesIssued')}</td>
              <td className="py-2 pr-4">{(report.invoicesIssued.totalCents / 100).toFixed(2)} €</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">{t('admin.comptabilitat.report.invoicesReceivedPaid')}</td>
              <td className="py-2 pr-4">{(report.invoicesReceivedPaid.totalCents / 100).toFixed(2)} €</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">{t('admin.comptabilitat.report.tpv')}</td>
              <td className="py-2 pr-4">
                {report.tpv ? `${(report.tpv.totalCents / 100).toFixed(2)} €` : t('admin.comptabilitat.report.tpvUnavailable')}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2 pr-4">{t('admin.comptabilitat.report.balance')}</td>
              <td className="py-2 pr-4">{(report.balanceCents / 100).toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
