'use client';

import { useState } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import MailTemplatesManager, { type MailTemplate } from '@/components/admin/MailTemplatesManager';
import MailSendForm, { type MailMemberOption } from '@/components/admin/MailSendForm';
import MailHistoryList from '@/components/admin/MailHistoryList';

type Tab = 'templates' | 'send' | 'history';

export default function MailModule({
  initialTemplates,
  members,
}: {
  initialTemplates: MailTemplate[];
  members: MailMemberOption[];
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>('send');
  const [templates, setTemplates] = useState<MailTemplate[]>(initialTemplates);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'send', label: t('admin.mail.tabSend') },
    { key: 'templates', label: t('admin.mail.tabTemplates') },
    { key: 'history', label: t('admin.mail.tabHistory') },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t('admin.mail.title')}</h1>

      <div className="mt-4 flex gap-2 border-b border-slate-200">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            type="button"
            onClick={() => setTab(tb.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === tb.key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'send' && <MailSendForm templates={templates} members={members} />}
        {tab === 'templates' && (
          <MailTemplatesManager templates={templates} onChange={setTemplates} />
        )}
        {tab === 'history' && <MailHistoryList members={members} />}
      </div>
    </div>
  );
}
