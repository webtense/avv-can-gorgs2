import { getLocale, getMessages } from '@/lib/i18n';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.home.title} · AVV Can Gorgs II` };
}

export default async function AdminHomePage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.admin.home;

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-primary">{t.title}</h1>
      <p className="mt-4 text-slate-700">{t.intro}</p>
    </div>
  );
}
