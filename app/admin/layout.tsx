import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminMember } from '@/lib/auth/session';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminMember();
  if (!admin) {
    redirect('/socis/login');
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Navegació d'administració" className="mb-6 flex flex-wrap gap-4 text-sm">
        <Link href="/admin" className="text-primary underline">
          Inici admin
        </Link>
        <Link href="/admin/socis" className="text-primary underline">
          Socis
        </Link>
        <Link href="/admin/events" className="text-primary underline">
          Actes
        </Link>
        <Link href="/admin/fotos" className="text-primary underline">
          Fotos
        </Link>
      </nav>
      {children}
    </div>
  );
}
