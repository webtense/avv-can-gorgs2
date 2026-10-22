import PageShell from '@/components/common/PageShell';

export const metadata = { title: 'Avís legal · Can Gorgs II' };

export default function Page() {
  return (
    <PageShell title="Avís legal">
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
        Text provisional, pendent de validació per la Junta de l&apos;associació.
      </p>
    </PageShell>
  );
}
