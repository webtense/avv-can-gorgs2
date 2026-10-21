import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import ArchiveDetail from '@/components/archive/ArchiveDetail';
import type { ArchiveDetailResponse } from '@/app/api/archive/types';

interface ArchiveDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getItem(id: string): Promise<ArchiveDetailResponse | null> {
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : '';

  const res = await fetch(`${baseUrl}/api/archive/${id}`, { cache: 'no-store' });

  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Error ${res.status} al cargar el elemento del archivo`);
  }
  return (await res.json()) as ArchiveDetailResponse;
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
