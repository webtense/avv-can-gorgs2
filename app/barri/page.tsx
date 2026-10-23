import Image from 'next/image';
import PageShell from '@/components/common/PageShell';
import { getLocale, getMessages } from '@/lib/i18n';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.barri.title} · AVV Can Gorgs II` };
}

export default async function BarriPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.barri;

  return (
    <PageShell title={t.title}>
      <p>{t.p1}</p>
      <p>{t.p2}</p>

      <div className="grid gap-6 pt-4 sm:grid-cols-2">
        <figure>
          <Image src="/images/torre-den-gorgs-1.jpg" alt={t.imageAlt} width={1600} height={1200} className="rounded-lg" />
          <figcaption className="mt-2 text-xs text-slate-500">
            Toniher · <a className="underline" href="https://commons.wikimedia.org/wiki/File:La_Torre_d%27en_Gorgs_-_20230120_-_1.jpg">Wikimedia Commons</a> · CC BY-SA 4.0
          </figcaption>
        </figure>
        <figure>
          <Image src="/images/torre-den-gorgs-2.jpg" alt={t.imageAlt} width={1600} height={1200} className="rounded-lg" />
          <figcaption className="mt-2 text-xs text-slate-500">
            Toniher · <a className="underline" href="https://commons.wikimedia.org/wiki/File:La_Torre_d%27en_Gorgs_-_20230120_-_2.jpg">Wikimedia Commons</a> · CC BY-SA 4.0
          </figcaption>
        </figure>
      </div>

      <p className="text-sm text-slate-500">
        {t.moreInfo} <a className="text-primary underline" href="https://www.amb.cat/es/web/territori/espai-public/parcs/punts-interes/detall/-/puntinteres/torre-d-en-gorgs/6886878/11656">AMB</a>.
      </p>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <iframe
          src="https://www.google.com/maps?q=Carrer+de+la+Torre+d%27en+Gorgs+40,+08210+Barbera+del+Valles&output=embed"
          title={t.mapTitle}
          loading="lazy"
          className="h-80 w-full border-0 sm:h-96"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </PageShell>
  );
}
