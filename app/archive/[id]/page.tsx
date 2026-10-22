import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArchiveDetail from '@/components/archive/ArchiveDetail';
import { getArchiveDetail } from '@/lib/archive-detail';
import { validateId } from '@/app/api/archive/validators';
import { getLocale, getMessages } from '@/lib/i18n';

interface ArchiveDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArchiveDetailPage({
  params,
}: ArchiveDetailPageProps) {
  const { id } = await params;
  const item = validateId(id) ? await getArchiveDetail(id) : null;
  const locale = await getLocale();
  const messages = getMessages(locale);

  if (!item) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-8xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label={messages.common.breadcrumbAria} className="mb-6 text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-primary">
              {messages.common.nav.home}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/archive" className="hover:text-primary">
              {messages.archive.breadcrumbItem}
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
