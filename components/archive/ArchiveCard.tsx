import Image from 'next/image';
import Link from 'next/link';
import { ARCHIVE_TYPE_LABELS, ArchiveItem } from '@/lib/types';

type ArchiveCardProps = Pick<
  ArchiveItem,
  'id' | 'title' | 'date' | 'thumbnailUrl' | 'tags' | 'type'
>;

const TYPE_BADGE_STYLES: Record<ArchiveItem['type'], string> = {
  event: 'bg-amber-100 text-amber-700',
  photo: 'bg-emerald-100 text-emerald-700',
  document: 'bg-slate-200 text-slate-700',
  video: 'bg-primary/10 text-primary',
};

export default function ArchiveCard({
  id,
  title,
  date,
  thumbnailUrl,
  tags,
  type,
}: ArchiveCardProps) {
  return (
    <Link
      href={`/archive/${id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5 focus-visible:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center text-slate-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12"
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
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_BADGE_STYLES[type]}`}
        >
          {ARCHIVE_TYPE_LABELS[type]}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-base font-semibold text-slate-900 line-clamp-2">
          {title}
        </h3>
        {date && (
          <p className="mt-1 text-xs text-slate-500">
            {new Date(date).toLocaleDateString('ca-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        )}
        {tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Etiquetes">
            {tags.slice(0, 3).map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-secondary/20 px-2 py-0.5 text-[11px] font-medium text-secondary-dark"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
