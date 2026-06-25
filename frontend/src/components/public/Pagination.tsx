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
    <nav className="mt-8 flex items-center justify-center gap-3">
      {page > 1 ? (
        <Link href={hrefForPage(page - 1)} className="btn-outline">
          ←
        </Link>
      ) : (
        <span className="btn-outline cursor-not-allowed opacity-50">←</span>
      )}

      <span className="text-sm font-medium text-gray-700">
        {page} / {pages}
      </span>

      {page < pages ? (
        <Link href={hrefForPage(page + 1)} className="btn-outline">
          →
        </Link>
      ) : (
        <span className="btn-outline cursor-not-allowed opacity-50">→</span>
      )}
    </nav>
  );
}
