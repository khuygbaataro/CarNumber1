'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CategoryInfo } from '@/lib/api';

const TOP = 8; // эхэнд харуулах ангиллын тоо

export default function CategoryBrowser({ categories }: { categories: CategoryInfo[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [showAll, setShowAll] = useState(false);

  const active = params.get('search') ?? '';
  const sort = params.get('sort');

  // "Бусад"-ыг энгийн хайлтаар шүүх боломжгүй тул одоохондоо алгасна.
  const list = categories.filter((c) => c.label !== 'Бусад');
  const visible = showAll ? list : list.slice(0, TOP);
  const hasMore = list.length > TOP;

  const go = (label: string) => {
    const q = new URLSearchParams();
    if (label) q.set('search', label);
    if (sort) q.set('sort', sort);
    router.push(`/vehicles${q.toString() ? `?${q.toString()}` : ''}`);
  };

  const chip = (isActive: boolean) =>
    `inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition ${
      isActive
        ? 'border-ink bg-ink text-white shadow-sm'
        : 'border-line bg-surface text-ink hover:border-brand'
    }`;

  // One line that scrolls sideways. Wrapping put four rows of brands above
  // the first car on a phone, which is the thing the page is for.
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <button type="button" onClick={() => go('')} className={chip(active === '')}>
        Бүгд
      </button>

      {visible.map((c) => {
        const isActive = active.toLowerCase() === c.label.toLowerCase();
        return (
          <button
            key={c.label}
            type="button"
            onClick={() => go(c.label)}
            className={chip(isActive)}
          >
            {c.label}
            <span
              className={`text-xs font-bold ${isActive ? 'text-white/70' : 'text-brand-text'}`}
            >
              {c.count}
            </span>
          </button>
        );
      })}

      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-brand-800 hover:underline"
        >
          {showAll ? 'Хураах' : 'Бүгдийг харах'}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={showAll ? 'rotate-180' : ''}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}
