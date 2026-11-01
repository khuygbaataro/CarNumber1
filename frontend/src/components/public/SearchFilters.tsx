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
    <>
      {/*
        A phone gets one control. Four chips put a second row of choices
        above the cars, and sorting is something you reach for once, not
        something to keep on screen. The native select is deliberate: it
        opens as the platform's own picker, which beats anything hand-built
        at that size.
      */}
      <div className="relative sm:hidden">
        <select
          aria-label={t.vehicles.sortLabel}
          value={sort}
          onChange={(e) => applySort(e.target.value)}
          className="min-h-[48px] w-full appearance-none rounded-xl border border-line bg-surface pl-4 pr-10 text-sm font-semibold text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
        >
          {SORT_KEYS.map((key) => (
            <option key={key} value={key}>
              {t.vehicles.sortLabel}: {t.vehicles.sortOptions[key]}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        >
          ▾
        </span>
      </div>

      <div className="no-scrollbar hidden items-center gap-2 overflow-x-auto pb-1 sm:flex">
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
    </>
  );
}
