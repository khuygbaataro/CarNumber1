'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { t } from '@/lib/labels';

const SORT_KEYS = [
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
  'year_desc',
  'year_asc',
] as const;

const DEFAULT_SORT = 'price_asc';

// Эрэмбэлэх (үнэ ↑↓, он ↑↓) ба он шүүлт. Марк сонголт CategoryBrowser дээр.
// Гараар бичдэг доод/дээд үнийн талбарыг зориуд хассан.
export default function SearchFilters({ years = [] }: { years?: number[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const search = params.get('search') ?? '';
  const sort = params.get('sort') ?? DEFAULT_SORT;
  const year = params.get('year') ?? '';

  // Марк (search) сонголтыг хадгалж, зөвхөн эрэмбэ/оныг солино.
  const push = (next: { sort?: string; year?: string }) => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    const s = next.sort ?? sort;
    if (s && s !== DEFAULT_SORT) q.set('sort', s);
    const y = next.year ?? year;
    if (y) q.set('year', y);
    router.push(`/vehicles${q.toString() ? `?${q.toString()}` : ''}`);
  };

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      {SORT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => push({ sort: key })}
          className={`chip shrink-0 ${sort === key ? 'chip-active' : ''}`}
        >
          {t.vehicles.sortOptions[key]}
        </button>
      ))}

      {years.length > 0 && (
        <select
          value={year}
          onChange={(e) => push({ year: e.target.value })}
          className={`chip shrink-0 cursor-pointer appearance-none pr-3 ${
            year ? 'chip-active' : ''
          }`}
        >
          <option value="">Бүх он</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y} он
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
