import PageShell from '@/components/common/PageShell';

export const metadata = { title: 'L\'associació · AVV Can Gorgs II' };

const TIMELINE = [
  { year: '2009', text: 'Participa en el procés d\'informació sobre la planificació territorial metropolitana.' },
  { year: '2015', text: 'Festa de la Tardor a la Torre d\'en Gorgs, amb berenar, música i reconeixement als socis de més edat.' },
  { year: '2021', text: 'Hi ha representació de la nostra entitat en un grup supramunicipal de cocreació.' },
  { year: '2024', text: 'Festes de la Primavera a la Torre d\'en Gorgs (18 i 19 de maig): butifarrada, concurs de truita, ball i paella popular.' },
  { year: '2025', text: 'L\'Ajuntament de Barberà del Vallès cedeix la Torre d\'en Gorgs a l\'entitat per a la Festa de la Primavera.' },
];

export default function AboutPage() {
  return (
    <PageShell title="L'associació">
      <p>
        Som l&apos;Associació de Veïns de Can Gorgs II, a Barberà del Vallès. Defensem els interessos
        col·lectius del barri, portem les inquietuds veïnals davant de les administracions, fomentem
        la participació, la convivència i les activitats socials i culturals, i col·laborem amb altres
        entitats veïnals.
      </p>
      <p className="text-sm text-slate-500">
        Font: <a className="text-primary underline" href="https://xeu.cat/associacio-de-veins-de-can-gorcs-ii/">xeu.cat</a>
      </p>

      <h2 className="pt-6 font-serif text-2xl font-semibold text-slate-900">Trajectòria</h2>
      <ol className="space-y-3 border-l-2 border-primary/30 pl-5">
        {TIMELINE.map((item) => (
          <li key={item.year}>
            <span className="font-semibold text-primary">{item.year}</span> · {item.text}
          </li>
        ))}
      </ol>
      <p className="text-sm text-slate-500">
        Fonts: notes de l&apos;Ajuntament de Barberà del Vallès (<a className="text-primary underline" href="https://www.bdv.cat/es/agenda/fiestas-de-primavera-2024">agenda 2024</a>),
        decret municipal de 15 de maig de 2025 i memòries municipals.
      </p>
    </PageShell>
  );
}
