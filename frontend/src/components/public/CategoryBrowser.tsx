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
    `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
      isActive
        ? 'border-brand bg-brand text-white shadow-sm'
        : 'border-gray-200 bg-white text-gray-700 hover:border-brand hover:text-brand'
    }`;

  return (
    <div className="flex flex-wrap gap-2">
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
              className={`rounded-full px-1.5 text-xs font-bold ${
                isActive ? 'bg-white/25' : 'bg-gray-100 text-gray-500'
              }`}
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
          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-brand hover:underline"
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
