'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { t } from '@/lib/labels';

// Дараалал: он шинэ→хуучин, он хуучин→шинэ, дараа нь үнэ бага→их, их→бага.
const SORT_KEYS = ['year_desc', 'year_asc', 'price_asc', 'price_desc'] as const;

const DEFAULT_SORT = 'year_desc';

export default function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const search = params.get('search') ?? '';
  const sort = params.get('sort') ?? DEFAULT_SORT;

  // Марк (search) сонголтыг хадгалж, зөвхөн эрэмбийг солино.
  const applySort = (next: string) => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (next && next !== DEFAULT_SORT) q.set('sort', next);
    router.push(`/vehicles${q.toString() ? `?${q.toString()}` : ''}`);
  };

  return (
    <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
      {SORT_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => applySort(key)}
          className={`chip shrink-0 ${sort === key ? 'chip-active' : ''}`}
        >
          {t.vehicles.sortOptions[key]}
        </button>
      ))}
    </div>
  );
}
