'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { t } from '@/lib/labels';

// Toggle to `true` to restore the full filter set (search / brand / year).
// Kept here so the change is easy to revert.
const SHOW_ALL_FILTERS = false;

const SORT_KEYS = [
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
  'year_desc',
  'year_asc',
] as const;

const DEFAULT_SORT = 'price_asc';

type FormState = {
  search: string;
  brand: string;
  year: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
};

const EMPTY: FormState = {
  search: '',
  brand: '',
  year: '',
  minPrice: '',
  maxPrice: '',
  sort: DEFAULT_SORT,
};

export default function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();

  // Filter panel is collapsed on phones and always open from `lg` up.
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<FormState>({
    search: params.get('search') ?? '',
    brand: params.get('brand') ?? '',
    year: params.get('year') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    sort: params.get('sort') ?? DEFAULT_SORT,
  });

  const update = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Single place that turns state into a URL. Query-param names are exactly
  // what the vehicles page and the backend already expect.
  const push = (state: FormState) => {
    const q = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
      if (value && !(key === 'sort' && value === DEFAULT_SORT)) q.set(key, value);
    });
    router.push(`/vehicles${q.toString() ? `?${q.toString()}` : ''}`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setOpen(false);
    push(form);
  };

  const applySort = (sort: string) => {
    const next = { ...form, sort };
    setForm(next);
    push(next);
  };

  const reset = () => {
    setForm(EMPTY);
    setOpen(false);
    router.push('/vehicles');
  };

  // Sort is not a "filter" — it always has a value, so it never counts here.
  const activeCount = (['search', 'brand', 'year', 'minPrice', 'maxPrice'] as const).filter(
    (key) => form[key]
  ).length;

  return (
    <div className="space-y-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`chip lg:hidden ${activeCount > 0 ? 'chip-active' : ''}`}
        >
          <FilterIcon />
          <span className="ml-1.5">{t.vehicles.filters.open}</span>
          {activeCount > 0 && (
            <span className="ml-1.5 rounded-full bg-white/25 px-1.5 text-xs font-bold">
              {activeCount}
            </span>
          )}
        </button>

        {SORT_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => applySort(key)}
            className={`chip ${form.sort === key ? 'chip-active' : ''}`}
          >
            {t.vehicles.sortOptions[key]}
          </button>
        ))}
      </div>

      <form
        onSubmit={submit}
        className={`rounded-2xl bg-white p-4 shadow-card ring-1 ring-gray-200 sm:p-5 ${
          open ? 'animate-fade-up block' : 'hidden'
        } lg:block`}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHOW_ALL_FILTERS && (
            <>
              <div className="sm:col-span-2">
                <label className="label">{t.vehicles.filters.search}</label>
                <input
                  className="input"
                  placeholder={t.vehicles.filters.searchPlaceholder}
                  value={form.search}
                  onChange={(e) => update('search', e.target.value)}
                />
              </div>

              <div>
                <label className="label">{t.vehicles.filters.brand}</label>
                <input
                  className="input"
                  value={form.brand}
                  onChange={(e) => update('brand', e.target.value)}
                />
              </div>

              <div>
                <label className="label">{t.vehicles.filters.year}</label>
                <input
                  type="number"
                  className="input"
                  value={form.year}
                  onChange={(e) => update('year', e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="label">{t.vehicles.filters.minPrice}</label>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              value={form.minPrice}
              onChange={(e) => update('minPrice', e.target.value)}
            />
          </div>

          <div>
            <label className="label">{t.vehicles.filters.maxPrice}</label>
            <input
              type="number"
              inputMode="numeric"
              className="input"
              value={form.maxPrice}
              onChange={(e) => update('maxPrice', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button type="submit" className="btn-primary flex-1 sm:flex-none">
            {t.vehicles.filters.apply}
          </button>
          <button type="button" onClick={reset} className="btn-outline flex-1 sm:flex-none">
            {t.vehicles.filters.reset}
          </button>
        </div>
      </form>
    </div>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5.5h16a1 1 0 0 1 .78 1.63L14.5 14.4V19a1 1 0 0 1-1.45.9l-3-1.5a1 1 0 0 1-.55-.9v-3.1L3.22 7.13A1 1 0 0 1 4 5.5z" />
    </svg>
  );
}
