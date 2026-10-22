import { redirect } from 'next/navigation';
import { getActiveMember } from '@/lib/auth/session';
import PageShell from '@/components/common/PageShell';
import ChangePasswordForm from '@/components/socis/ChangePasswordForm';
import { getLocale, getMessages } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.canviaContrasenya.title} · AVV Can Gorgs II` };
}

export default async function ContrasenyaPage() {
  const member = await getActiveMember();
  if (!member) {
    redirect('/socis/login');
  }

  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.canviaContrasenya;

  return (
    <PageShell title={t.title}>
      <ChangePasswordForm />
    </PageShell>
  );
}
