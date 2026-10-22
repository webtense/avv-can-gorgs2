import PageShell from '@/components/common/PageShell';
import { siteConfig } from '@/lib/site-config';

export const metadata = { title: 'Avís legal · AVV Can Gorgs II' };

export default function TermsPage() {
  return (
    <PageShell title="Avís legal">
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Text provisional, pendent de validació per la Junta de l&apos;associació.
      </p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">Titular del lloc web</h2>
      <p>
        {siteConfig.fullName}
        {siteConfig.taxId && <>, amb NIF {siteConfig.taxId}</>}.
        <br />
        Domicili: {siteConfig.address}.
        {siteConfig.email && (
          <>
            <br />
            Correu electrònic:{' '}
            <a href={`mailto:${siteConfig.email}`} className="text-primary underline">
              {siteConfig.email}
            </a>
          </>
        )}
      </p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">Objecte i acceptació</h2>
      <p>
        Aquest lloc web té per objecte donar a conèixer l&apos;associació, les seves activitats i el seu
        arxiu històric. L&apos;accés i l&apos;ús del lloc implica l&apos;acceptació d&apos;aquest avís legal.
      </p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">Propietat intel·lectual</h2>
      <p>
        Els continguts del lloc (textos, disseny i logotip de l&apos;associació) són de l&apos;associació o
        tenen els drets cedits. Les fotografies de la Torre d&apos;en Gorgs són de Wikimedia Commons i es
        reprodueixen sota llicència CC BY-SA 4.0, amb l&apos;autoria indicada. Les fotografies i
        documents de l&apos;arxiu es publiquen amb autorització de les persones que els han cedit; la
        reproducció total o parcial requereix l&apos;autorització prèvia de l&apos;associació.
      </p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">Responsabilitat</h2>
      <p>
        L&apos;associació es esforça per mantenir la informació del lloc actualitzada i exacta, però no
        garanteix l&apos;absència d&apos;errors ni de interrupcions del servei. No es responsabilitza de
        l&apos;ús que es faci de la informació publicada ni dels continguts de les pàgines enllaçades
        des del lloc.
      </p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">Enllaços</h2>
      <p>
        Aquest lloc pot incloure enllaços a webs de tercers, sobre els quals l&apos;associació no té control
        ni assumeix responsabilitat.
      </p>

      <h2 className="pt-4 font-serif text-xl font-semibold text-slate-900">Legislació i jurisdicció</h2>
      <p>
        Aquest avís legal es regeix per la legislació espanyola. Per a qualsevol controvèrsia, les parts
        se sotmeten als jutjats i tribunals de Barcelona, sense perjudici de la normativa de protecció de
        persones consumidores que sigui aplicable.
      </p>
    </PageShell>
  );
}
