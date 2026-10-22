import { prisma } from '@/lib/db';
import { getLocale, getMessages } from '@/lib/i18n';
import MailModule from '@/components/admin/MailModule';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.mail.title} · ${messages.admin.home.title}` };
}

export default async function AdminCorreuPage() {
  const [templates, members] = await Promise.all([
    prisma.mail_templates.findMany({ orderBy: [{ name: 'asc' }, { locale: 'asc' }] }),
    prisma.members.findMany({
      where: { status: 'actiu' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <MailModule
      initialTemplates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        locale: t.locale,
        subject: t.subject,
        body_text: t.body_text,
      }))}
      members={members}
    />
  );
}
