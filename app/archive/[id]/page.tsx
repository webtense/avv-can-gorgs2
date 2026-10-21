import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArchiveDetail from '@/components/archive/ArchiveDetail';
import { ArchiveItemDetail } from '@/lib/types';

interface ArchiveDetailPageProps {
  params: Promise<{ id: string }>;
}

// Fins que l'Oleada 5 connecti aquesta pàgina a /api/archive/[id], es
// renderitza amb dades buides en lloc de fer servir un mock desactualitzat.
async function getItem(_id: string): Promise<ArchiveItemDetail | null> {
  return null;
}

export default async function ArchiveDetailPage({
  params,
}: ArchiveDetailPageProps) {
  const { id } = await params;
  const item = await getItem(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-primary">
              Inici
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/archive" className="hover:text-primary">
              Arxiu
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-700" aria-current="page">
            {item.title}
          </li>
        </ol>
      </nav>

      <ArchiveDetail
        id={item.id}
        title={item.title}
        description={item.description}
        content={item.content}
        location={item.location}
        date={item.date}
        thumbnailUrl={item.thumbnailUrl}
        type={item.type}
        tags={item.tags}
        relatedItems={item.relatedItems}
      />
    </div>
  );
}
