'use client';

import { useState, ChangeEvent } from 'react';
import { useI18n } from '@/components/i18n/I18nProvider';
import type { MailTemplate } from '@/components/admin/MailTemplatesManager';
import { withBasePath } from '@/lib/basePath';

export interface MailMemberOption {
  id: string;
  name: string;
  email: string;
}

type Target = 'member' | 'all';

interface PreviewResult {
  recipientCount: number;
  subject: string;
  body: string;
}

interface SendResult {
  sent: number;
  failed: number;
}

export default function MailSendForm({
  templates,
  members,
}: {
  templates: MailTemplate[];
  members: MailMemberOption[];
}) {
  const { t } = useI18n();
  const [templateId, setTemplateId] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [target, setTarget] = useState<Target>('all');
  const [memberId, setMemberId] = useState('');
  const [attachmentFileName, setAttachmentFileName] = useState<string | null>(null);
  const [attachmentOriginalName, setAttachmentOriginalName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SendResult | null>(null);

  function buildPayload(mode: 'preview' | 'confirm') {
    const base: Record<string, unknown> = { mode, target };
    if (templateId) {
      base.templateId = templateId;
    } else {
      base.subject = customSubject;
      base.body_text = customBody;
    }
    if (target === 'member') base.memberId = memberId;
    if (mode === 'confirm' && attachmentFileName) base.attachmentFileName = attachmentFileName;
    return base;
  }

  function hasContent() {
    return Boolean(templateId) || Boolean(customSubject.trim() && customBody.trim());
  }

  async function handlePreview() {
    setError(null);
    setResult(null);
    if (!hasContent()) {
      setError(t('admin.mail.send.missingTemplateOrText'));
      return;
    }
    if (target === 'member' && !memberId) {
      setError(t('admin.mail.send.missingTemplateOrText'));
      return;
    }
    setPreviewLoading(true);
    try {
      const res = await fetch(withBasePath('/api/admin/mail/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('preview')),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('admin.mail.send.sendError'));
        setPreview(null);
        return;
      }
      setPreview({
        recipientCount: data.recipientCount,
        subject: data.preview.subject,
        body: data.preview.body,
      });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleAttachmentChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(withBasePath('/api/admin/mail/attachments'), { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('admin.mail.send.sendError'));
        return;
      }
      setAttachmentFileName(data.fileName);
      setAttachmentOriginalName(data.originalName);
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmSend() {
    if (!preview) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(withBasePath('/api/admin/mail/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload('confirm')),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t('admin.mail.send.sendError'));
        return;
      }
      setResult({ sent: data.sent, failed: data.failed });
      setPreview(null);
      setAttachmentFileName(null);
      setAttachmentOriginalName(null);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('admin.mail.send.template')}
          <select
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setPreview(null);
            }}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="">{t('admin.mail.send.chooseTemplate')}</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name} ({tpl.locale})
              </option>
            ))}
          </select>
        </label>

        {!templateId && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              {t('admin.mail.send.customSubject')}
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              {t('admin.mail.send.customBody')}
              <textarea
                rows={6}
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-2"
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1 text-sm">
          {t('admin.mail.send.target')}
          <select
            value={target}
            onChange={(e) => {
              setTarget(e.target.value as Target);
              setPreview(null);
            }}
            className="rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="all">{t('admin.mail.send.targetAll')}</option>
            <option value="member">{t('admin.mail.send.targetMember')}</option>
          </select>
        </label>

        {target === 'member' && (
          <label className="flex flex-col gap-1 text-sm">
            {t('admin.mail.send.chooseMember')}
            <select
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                setPreview(null);
              }}
              className="rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">{t('admin.mail.send.chooseMember')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm">
          {t('admin.mail.send.attachment')}
          <input type="file" accept="application/pdf" onChange={handleAttachmentChange} />
          {uploading && <span className="text-xs text-slate-500">{t('admin.mail.send.uploading')}</span>}
          {attachmentOriginalName && (
            <span className="text-xs text-slate-500">{attachmentOriginalName}</span>
          )}
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handlePreview}
          disabled={previewLoading}
          className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary disabled:opacity-60"
        >
          {previewLoading ? t('admin.mail.send.previewing') : t('admin.mail.send.preview')}
        </button>

        {preview && (
          <div className="rounded-md border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700">{t('admin.mail.send.previewTitle')}</h2>
            <p className="mt-2 text-sm font-medium">{preview.subject}</p>
            <pre className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{preview.body}</pre>
            <p className="mt-3 text-sm text-slate-600">
              {t('admin.mail.send.recipientCountSimple', { count: preview.recipientCount })}
            </p>
            {preview.recipientCount === 0 ? (
              <p className="mt-2 text-sm text-amber-700">{t('admin.mail.send.noRecipients')}</p>
            ) : (
              <button
                type="button"
                onClick={handleConfirmSend}
                disabled={sending}
                className="mt-3 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {sending
                  ? t('admin.mail.send.sending')
                  : t('admin.mail.send.confirmSend', { count: preview.recipientCount })}
              </button>
            )}
          </div>
        )}

        {result && (
          <p className="text-sm text-emerald-700">
            {t('admin.mail.send.sendResult', { sent: result.sent, failed: result.failed })}
          </p>
        )}
      </div>
    </div>
  );
}
