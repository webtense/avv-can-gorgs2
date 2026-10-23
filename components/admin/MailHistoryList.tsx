'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import type { MailMemberOption } from '@/components/admin/MailSendForm';
import { withBasePath } from '@/lib/basePath';

interface LogEntry {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  members: { id: string; name: string; email: string };
  mail_templates: { id: string; name: string } | null;
}

export default function MailHistoryList({ members }: { members: MailMemberOption[] }) {
  const { t } = useI18n();
  const [memberId, setMemberId] = useState('');
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (memberId) params.set('memberId', memberId);
    if (status) params.set('status', status);
    setLoading(true);
    fetch(withBasePath(`/api/admin/mail/log?${params.toString()}`))
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .finally(() => setLoading(false));
  }, [memberId, status]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t('admin.mail.history.filterMember')}
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">{t('admin.mail.history.all')}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('admin.mail.history.filterStatus')}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">{t('admin.mail.history.all')}</option>
            <option value="enviat">{t('admin.mail.history.statusSent')}</option>
            <option value="error">{t('admin.mail.history.statusError')}</option>
          </select>
        </label>
      </div>

      {!loading && logs.length === 0 && <p className="text-sm text-slate-500">{t('admin.mail.history.empty')}</p>}

      {logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-4">{t('admin.mail.history.colDate')}</th>
                <th className="py-2 pr-4">{t('admin.mail.history.colMember')}</th>
                <th className="py-2 pr-4">{t('admin.mail.history.colSubject')}</th>
                <th className="py-2 pr-4">{t('admin.mail.history.colTemplate')}</th>
                <th className="py-2 pr-4">{t('admin.mail.history.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 pr-4">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-4">{log.members.name}</td>
                  <td className="py-2 pr-4">{log.subject}</td>
                  <td className="py-2 pr-4">{log.mail_templates?.name || '—'}</td>
                  <td className="py-2 pr-4">
                    {log.status === 'enviat'
                      ? t('admin.mail.history.statusSent')
                      : t('admin.mail.history.statusError')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
