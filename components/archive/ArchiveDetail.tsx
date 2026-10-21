import Image from 'next/image';
import { ARCHIVE_TYPE_LABELS, ArchiveItem } from '@/lib/types';
import ArchiveCard from './ArchiveCard';

interface ArchiveDetailProps {
  id: string;
  title: string;
  description?: string;
  content: string;
  location?: string;
  date?: string;
  thumbnailUrl?: string;
  type: ArchiveItem['type'];
  tags: string[];
  relatedItems: ArchiveItem[];
}

export default function ArchiveDetail({
  title,
  description,
  content,
  location,
  date,
  thumbnailUrl,
  type,
  tags,
  relatedItems,
}: ArchiveDetailProps) {
  return (
    <article className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
      <div>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center text-slate-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 8h16M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="mt-6">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {ARCHIVE_TYPE_LABELS[type]}
          </span>
          <h1 className="mt-3 font-serif text-2xl font-bold text-slate-900 sm:text-3xl">
            {title}
          </h1>

          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
            {date && (
              <div className="flex gap-1">
                <dt className="font-medium">Data:</dt>
                <dd>
                  {new Date(date).toLocaleDateString('ca-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            )}
            {location && (
              <div className="flex gap-1">
                <dt className="font-medium">Ubicació:</dt>
                <dd>{location}</dd>
              </div>
            )}
          </dl>

          {description && (
            <p className="mt-4 text-base text-slate-700">{description}</p>
          )}

          <div className="prose prose-slate mt-6 max-w-none text-slate-700">
            <p>{content}</p>
          </div>

          {tags.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Etiquetes">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-medium text-secondary-dark"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
            <span className="text-sm font-medium text-slate-600">Comparteix:</span>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              aria-label="Compartir per correu"
            >
              Correu
            </button>
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              aria-label="Copiar enllaç"
            >
              Copiar enllaç
            </button>
          </div>
        </div>
      </div>

      {relatedItems.length > 0 && (
        <aside aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="font-serif text-lg font-semibold text-slate-900"
          >
            Relacionats
          </h2>
          <ul className="mt-4 space-y-4">
            {relatedItems.map((item) => (
              <li key={item.id}>
                <ArchiveCard
                  id={item.id}
                  title={item.title}
                  date={item.date}
                  thumbnailUrl={item.thumbnailUrl}
                  tags={item.tags}
                  type={item.type}
                />
              </li>
            ))}
          </ul>
        </aside>
      )}
    </article>
  );
}
