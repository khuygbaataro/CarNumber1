'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { t } from '@/lib/labels';

// Toggle to `true` to restore the full filter set (search / brand / year / sort).
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

export default function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const [form, setForm] = useState({
    search: params.get('search') ?? '',
    brand: params.get('brand') ?? '',
    year: params.get('year') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    sort: params.get('sort') ?? 'newest',
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    Object.entries(form).forEach(([key, value]) => {
      if (value && !(key === 'sort' && value === 'newest')) q.set(key, value);
    });
    router.push(`/vehicles${q.toString() ? `?${q.toString()}` : ''}`);
  };

  const reset = () => {
    setForm({ search: '', brand: '', year: '', minPrice: '', maxPrice: '', sort: 'newest' });
    router.push('/vehicles');
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SHOW_ALL_FILTERS && (
          <>
            <div className="sm:col-span-2 lg:col-span-3">
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

            <div>
              <label className="label">{t.vehicles.filters.sort}</label>
              <select
                className="input"
                value={form.sort}
                onChange={(e) => update('sort', e.target.value)}
              >
                {SORT_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {t.vehicles.sortOptions[key]}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="label">{t.vehicles.filters.minPrice}</label>
          <input
            type="number"
            className="input"
            value={form.minPrice}
            onChange={(e) => update('minPrice', e.target.value)}
          />
        </div>

        <div>
          <label className="label">{t.vehicles.filters.maxPrice}</label>
          <input
            type="number"
            className="input"
            value={form.maxPrice}
            onChange={(e) => update('maxPrice', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button type="submit" className="btn-primary">
          {t.vehicles.filters.apply}
        </button>
        <button type="button" onClick={reset} className="btn-outline">
          {t.vehicles.filters.reset}
        </button>
      </div>
    </form>
  );
}
