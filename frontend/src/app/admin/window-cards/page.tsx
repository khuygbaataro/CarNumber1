'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Vehicle } from '@/types';
import { formatNumber, formatMileage, formatYearShort } from '@/lib/format';
import { splitStockCode } from '@/lib/vehicle';
import { windowCardFigures } from '@/lib/windowCard';
import { t } from '@/lib/labels';

export default function WindowCardsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withPhoto, setWithPhoto] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.listVehicles().then((data) => setVehicles(data.items)),
      adminApi
        .getSettings()
        .then((s) => setCompanyName(s.companyName || ''))
        .catch(() => {}),
    ])
      .catch(() => setError(t.admin.windowCards.loadError))
      .finally(() => setLoading(false));
  }, []);

  const cards = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return vehicles
      .filter((v) => v.status === 'available')
      .filter((v) => {
        if (!terms.length) return true;
        const hay = `${v.brand} ${v.model} ${Math.trunc(v.year) || ''}`.toLowerCase();
        return terms.every((term) => hay.includes(term));
      });
  }, [vehicles, query]);

  return (
    <div>
      <div className="print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.admin.windowCards.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {t.admin.windowCards.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading || cards.length === 0}
            className="btn-primary"
          >
            {t.admin.windowCards.print}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-6 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
          <div className="min-w-[260px] flex-1">
            <label className="label" htmlFor="wc-search">
              {t.admin.windowCards.search}
            </label>
            <input
              id="wc-search"
              type="search"
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={withPhoto}
              onChange={(e) => setWithPhoto(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-brand"
            />
            {t.admin.windowCards.withPhoto}
          </label>
          <p className="pb-2.5 text-sm font-semibold text-gray-700">
            {t.admin.windowCards.count(cards.length)}
          </p>
        </div>
        <p className="mt-2 text-xs text-gray-400">{t.admin.windowCards.printHint}</p>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      </div>

      {loading ? (
        <p className="mt-6 text-gray-500 print:hidden">{t.common.loading}</p>
      ) : cards.length === 0 ? (
        <p className="mt-6 text-gray-500 print:hidden">{t.admin.windowCards.empty}</p>
      ) : (
        <div className="mt-6 space-y-6 print:mt-0 print:space-y-0">
          {cards.map((v) => (
            <Card
              key={v._id}
              vehicle={v}
              companyName={companyName}
              withPhoto={withPhoto}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One A4 page per car.
 *
 * Everything on it is something a person standing at the car wants: which
 * car it is, how old, how far it has run, and the three numbers. No phone,
 * no web address, no directions — they are already in the showroom, and a
 * contact strip would only steal room from figures read through glass.
 */
function Card({
  vehicle,
  companyName,
  withPhoto,
}: {
  vehicle: Vehicle;
  companyName: string;
  withPhoto: boolean;
}) {
  const { code, name } = splitStockCode(vehicle.model);
  const f = windowCardFigures(vehicle.price);
  const monthly = f.terms[0];
  const photo = vehicle.images?.[0];

  return (
    <article className="mx-auto flex h-[273mm] w-[186mm] break-after-page flex-col bg-white text-gray-900 shadow-sm ring-1 ring-gray-200 print:shadow-none print:ring-0">
      <header className="flex items-center justify-between border-b-4 border-gray-900 pb-3">
        <span className="text-2xl font-extrabold tracking-tight">
          {companyName || 'VICTORY CAR'}
        </span>
        <span className="rounded bg-[#e11b22] px-4 py-1.5 text-sm font-bold uppercase tracking-[0.18em] text-white">
          {t.admin.windowCards.badge}
        </span>
      </header>

      <div className="mt-7 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-[50px] font-extrabold uppercase leading-[1.03] tracking-tight">
            {vehicle.brand} {name || vehicle.model}
          </h2>
          <dl className="mt-4 space-y-1.5 text-[22px] font-medium text-gray-600">
            <div className="flex gap-3">
              <dt className="text-gray-400">{t.admin.windowCards.year}</dt>
              <dd className="font-bold text-gray-900">
                {formatYearShort(vehicle.year, vehicle.month)}
              </dd>
            </div>
            {vehicle.mileage > 0 && (
              <div className="flex gap-3">
                <dt className="text-gray-400">{t.admin.windowCards.mileage}</dt>
                <dd className="font-bold text-gray-900">
                  {formatMileage(vehicle.mileage)}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[13px] font-bold uppercase tracking-[0.18em] text-gray-400">
            {t.admin.checklist.colCode}
          </span>
          <span className="block text-[58px] font-extrabold leading-none tabular-nums">
            {code || '—'}
          </span>
        </div>
      </div>

      {withPhoto && photo && (
        <div className="mt-6 h-[62mm] w-full overflow-hidden rounded-lg bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Three numbers, sharing whatever height is left so the page reads
          the same with the photo on or off. */}
      <div className="flex flex-1 flex-col justify-between gap-6 py-7">
        <div className="rounded-xl bg-[#e11b22] px-8 py-7 text-white">
          <span className="block text-base font-bold uppercase tracking-[0.2em] text-white/80">
            {t.admin.windowCards.price}
          </span>
          <span className="mt-1 block text-[76px] font-extrabold leading-none tabular-nums">
            {formatNumber(f.price)}₮
          </span>
        </div>

        <div className="rounded-xl bg-gray-100 px-8 py-6">
          <span className="block text-base font-bold uppercase tracking-[0.2em] text-gray-500">
            {t.admin.windowCards.down}
          </span>
          <span className="mt-1 block text-[62px] font-extrabold leading-none tabular-nums">
            {formatNumber(f.downAmount)}₮
          </span>
        </div>

        <div className="rounded-xl border-[3px] border-gray-900 px-8 py-6">
          <span className="block text-base font-bold uppercase tracking-[0.2em] text-gray-500">
            {t.admin.windowCards.monthly} · {monthly.months}{' '}
            {t.admin.windowCards.months}
          </span>
          <span className="mt-1 block text-[62px] font-extrabold leading-none tabular-nums">
            {formatNumber(monthly.monthly)}₮
          </span>
          <span className="mt-2 block text-base font-medium text-gray-500">
            {t.admin.windowCards.equalNote}
          </span>
        </div>
      </div>

      <footer className="mt-auto border-t-2 border-gray-200 pt-3">
        <p className="text-[11px] text-gray-400">{t.admin.windowCards.rounded}</p>
      </footer>
    </article>
  );
}
