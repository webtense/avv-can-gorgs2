export const metadata = { title: 'Administració · AVV Can Gorgs II' };

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-primary">Administració</h1>
      <p className="mt-4 text-slate-700">
        Des d&apos;aquí pots aprovar o rebutjar sol·licituds de socis, gestionar quins actes són
        només per a socis o tenen reserves obertes, i revisar les fotos pujades pendents de
        publicació.
      </p>
    </div>
  );
}
