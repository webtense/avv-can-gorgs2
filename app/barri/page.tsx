import Image from 'next/image';
import PageShell from '@/components/common/PageShell';

export const metadata = { title: 'El barri · AVV Can Gorgs II' };

export default function BarriPage() {
  return (
    <PageShell title="El barri i la Torre d'en Gorgs">
      <p>
        La Torre d&apos;en Gorgs és una antiga masia fortificada, un dels edificis més antics de
        Barberà del Vallès, documentada des de finals del segle X. És patrimoni del seu entorn i avui
        és propietat municipal. La nostra entitat hi té la seu i hi organitza les seves activitats.
      </p>
      <p>
        Fer memòria del barri és també conèixer la Torre: els seus usos públics i culturals, i les
        persones que han viscut i construït el barri al llarg dels anys.
      </p>

      <div className="grid gap-6 pt-4 sm:grid-cols-2">
        <figure>
          <Image src="/images/torre-den-gorgs-1.jpg" alt="Fotografia de la Torre d'en Gorgs" width={1600} height={1200} className="rounded-lg" />
          <figcaption className="mt-2 text-xs text-slate-500">
            Toniher · <a className="underline" href="https://commons.wikimedia.org/wiki/File:La_Torre_d%27en_Gorgs_-_20230120_-_1.jpg">Wikimedia Commons</a> · CC BY-SA 4.0
          </figcaption>
        </figure>
        <figure>
          <Image src="/images/torre-den-gorgs-2.jpg" alt="Fotografia de la Torre d'en Gorgs" width={1600} height={1200} className="rounded-lg" />
          <figcaption className="mt-2 text-xs text-slate-500">
            Toniher · <a className="underline" href="https://commons.wikimedia.org/wiki/File:La_Torre_d%27en_Gorgs_-_20230120_-_2.jpg">Wikimedia Commons</a> · CC BY-SA 4.0
          </figcaption>
        </figure>
      </div>

      <p className="text-sm text-slate-500">
        Més informació: <a className="text-primary underline" href="https://www.amb.cat/es/web/territori/espai-public/parcs/punts-interes/detall/-/puntinteres/torre-d-en-gorgs/6886878/11656">AMB</a>.
      </p>
    </PageShell>
  );
}
