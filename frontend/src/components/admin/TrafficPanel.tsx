'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import { TrafficStats, TrafficWindow } from '@/types';
import { formatNumber } from '@/lib/format';
import { splitStockCode } from '@/lib/vehicle';
import { t } from '@/lib/labels';

const WINDOWS: { key: TrafficWindow; label: string }[] = [
  { key: 'day', label: t.admin.dashboard.windowDay },
  { key: 'week', label: t.admin.dashboard.windowWeek },
  { key: 'month', label: t.admin.dashboard.windowMonth },
];

export default function TrafficPanel() {
  const [range, setRange] = useState<TrafficWindow>('week');
  const [data, setData] = useState<TrafficStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    adminApi
      .getTraffic(range)
      .then((d) => live && setData(d))
      .catch(() => live && setError(t.admin.dashboard.trafficError))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [range]);

  const points = data?.points ?? [];
  // One shared ceiling, so a quiet hour reads as quiet rather than being
  // stretched to the same height as a busy one.
  const peak = Math.max(1, ...points.map((p) => p.visitors));

  const tick = (at: string) => {
    const d = new Date(at);
    return data?.bucket === 'hour'
      ? `${String(d.getHours()).padStart(2, '0')}:00`
      : `${d.getMonth() + 1}/${d.getDate()}`;
  };

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">{t.admin.dashboard.traffic}</h2>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {WINDOWS.map((w) => (
            <button
              key={w.key}
              type="button"
              onClick={() => setRange(w.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                range === w.key
                  ? 'bg-white text-brand shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { label: t.admin.dashboard.visitors, value: data?.totals.visitors },
          { label: t.admin.dashboard.carViews, value: data?.totals.carViews },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-gray-50 px-3 py-3">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="mt-0.5 text-2xl font-bold text-brand">
              {loading || s.value === undefined ? '—' : formatNumber(s.value)}
            </p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-accent">{error}</p>
      ) : (
        <>
          <div className="mt-5 flex h-36 items-end gap-[3px]">
            {points.map((p, i) => {
              const h = Math.round((p.visitors / peak) * 100);
              return (
                <div
                  key={p.at}
                  className="group relative flex-1"
                  title={`${tick(p.at)} · ${p.visitors} ${t.admin.dashboard.visitors.toLowerCase()}`}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      p.visitors ? 'bg-brand' : 'bg-gray-200'
                    }`}
                    // Empty buckets still get a sliver, so the axis reads as a
                    // continuous run of time rather than a gap in the data.
                    style={{ height: `${Math.max(h, p.visitors ? 6 : 2)}%` }}
                  />
                  {i % Math.ceil(points.length / 6) === 0 && (
                    <span className="absolute left-0 top-full mt-1 whitespace-nowrap text-[10px] text-gray-400">
                      {tick(p.at)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="h-5" />

          {!loading && data?.totals.visitors === 0 && (
            <p className="mt-2 rounded-lg bg-gray-50 px-3 py-3 text-center text-sm text-gray-500">
              {t.admin.dashboard.noTraffic}
            </p>
          )}

          {!!data?.topVehicles.length && (
            <div className="mt-5 border-t border-gray-200 pt-4">
              <p className="label mb-2">{t.admin.dashboard.topCars}</p>
              <ul className="divide-y divide-gray-100">
                {data.topVehicles.map((v) => {
                  const { code, name } = splitStockCode(v.model);
                  return (
                    <li key={v._id}>
                      <Link
                        href={`/admin/vehicles/${v._id}`}
                        className="flex items-center gap-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <span className="w-14 shrink-0 font-bold tabular-nums text-gray-500">
                          {code || '—'}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-gray-900">
                          {v.brand} {name || v.model}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums text-brand">
                          {formatNumber(v.views)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}

    </section>
  );
}
