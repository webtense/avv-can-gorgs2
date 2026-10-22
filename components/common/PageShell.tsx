import type { ReactNode } from 'react';

export default function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-bold text-primary sm:text-4xl">{title}</h1>
      <div className="mt-6 space-y-4 text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}
