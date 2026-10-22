import PageShell from '@/components/common/PageShell';
import { getLocale, getMessages } from '@/lib/i18n';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.about.title} · AVV Can Gorgs II` };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.about;

  return (
    <PageShell title={t.title}>
      <p>{t.intro}</p>
      <p className="text-sm text-slate-500">
        {t.sourcePrefix}{' '}
        <a className="text-primary underline" href="https://xeu.cat/associacio-de-veins-de-can-gorcs-ii/">xeu.cat</a>
      </p>

      <h2 className="pt-6 font-serif text-2xl font-semibold text-slate-900">{t.trajectoryTitle}</h2>
      <ol className="space-y-3 border-l-2 border-primary/30 pl-5">
        {t.timeline.map((item) => (
          <li key={item.year}>
            <span className="font-semibold text-primary">{item.year}</span> · {item.text}
          </li>
        ))}
      </ol>
      <p className="text-sm text-slate-500">
        {t.sourcesPrefix}
        <a className="text-primary underline" href="https://www.bdv.cat/es/agenda/fiestas-de-primavera-2024">{t.sourcesAgenda}</a>
        {t.sourcesSuffix}
      </p>
    </PageShell>
  );
}
