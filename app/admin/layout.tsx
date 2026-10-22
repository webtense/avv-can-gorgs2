import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminMember } from '@/lib/auth/session';
import { getLocale, getMessages } from '@/lib/i18n';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminMember();
  if (!admin) {
    redirect('/socis/login');
  }

  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.admin.nav;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label={t.aria} className="mb-6 flex flex-wrap gap-4 text-sm">
        <Link href="/admin" className="text-primary underline">
          {t.home}
        </Link>
        <Link href="/admin/socis" className="text-primary underline">
          {t.members}
        </Link>
        <Link href="/admin/events" className="text-primary underline">
          {t.events}
        </Link>
        <Link href="/admin/fotos" className="text-primary underline">
          {t.fotos}
        </Link>
        <Link href="/admin/tpv" className="text-primary underline">
          {messages.admin.tpv.title}
        </Link>
        <Link href="/admin/correu" className="text-primary underline">
          {t.correu}
        </Link>
        <Link href="/admin/comptabilitat" className="text-primary underline">
          {t.comptabilitat}
        </Link>
      </nav>
      {children}
    </div>
  );
}
