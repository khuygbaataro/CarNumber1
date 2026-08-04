import Link from 'next/link';
import { VehicleQuery } from '@/types';

interface Props {
  page: number;
  pages: number;
  query: VehicleQuery;
}

export default function Pagination({ page, pages, query }: Props) {
  if (pages <= 1) return null;

  const hrefForPage = (target: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value && key !== 'page') params.set(key, String(value));
    });
    params.set('page', String(target));
    return `/vehicles?${params.toString()}`;
  };

  return (
    <nav className="mt-10 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)} aria-label="Prev" className="btn-outline px-4">
          <span aria-hidden>←</span>
        </Link>
      ) : (
        <span className="btn-outline pointer-events-none px-4 opacity-40" aria-hidden>
          ←
        </span>
      )}

      <span className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-200">
        {page} / {pages}
      </span>

      {page < pages ? (
        <Link href={hrefForPage(page + 1)} aria-label="Next" className="btn-outline px-4">
          <span aria-hidden>→</span>
        </Link>
      ) : (
        <span className="btn-outline pointer-events-none px-4 opacity-40" aria-hidden>
          →
        </span>
      )}
    </nav>
  );
}
