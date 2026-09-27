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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withPhoto, setWithPhoto] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    adminApi
      .listVehicles()
      .then((data) => setVehicles(data.items))
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

        <ol className="mt-3 space-y-1 rounded-xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-800">
          <li className="font-semibold">{t.admin.windowCards.pdfSteps}</li>
          <li>1. {t.admin.windowCards.pdfStep1}</li>
          <li>2. {t.admin.windowCards.pdfStep2}</li>
        </ol>
        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      </div>

      {loading ? (
        <p className="mt-6 text-gray-500 print:hidden">{t.common.loading}</p>
      ) : cards.length === 0 ? (
        <p className="mt-6 text-gray-500 print:hidden">{t.admin.windowCards.empty}</p>
      ) : (
        <div className="mt-6 space-y-6 print:mt-0 print:space-y-0">
          {cards.map((v) => (
            <Card key={v._id} vehicle={v} withPhoto={withPhoto} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * One A4 page per car.
 *
 * Printed in black and white, so there is no colour to lean on: the
 * hierarchy comes from type size and from rules between the sections. A
 * solid dark panel would only drink toner across thirty sheets.
 *
 * No masthead and no small print — the reader is already standing at the
 * car. What is left is grouped towards the middle of the page inside a
 * margin, rather than stretched corner to corner.
 */
function Card({ vehicle, withPhoto }: { vehicle: Vehicle; withPhoto: boolean }) {
  const { code, name } = splitStockCode(vehicle.model);
  const f = windowCardFigures(vehicle.price);
  const monthly = f.terms[0];
  const photo = vehicle.images?.[0];

  const rows = [
    { label: t.admin.windowCards.price, value: f.price, lead: true },
    { label: t.admin.windowCards.down, value: f.downAmount, lead: false },
    {
      label: `${t.admin.windowCards.monthly} · ${monthly.months} ${t.admin.windowCards.months}`,
      value: monthly.monthly,
      lead: false,
    },
  ];

  return (
    <article className="window-card mx-auto flex h-[297mm] w-[210mm] break-after-page flex-col justify-center bg-white px-[18mm] py-[20mm] text-black shadow-sm ring-1 ring-gray-200 print:shadow-none print:ring-0">
      <div className="flex items-start justify-between gap-8 border-b-4 border-black pb-5">
        <div className="min-w-0">
          <h2 className="text-[46px] font-extrabold uppercase leading-[1.05] tracking-tight">
            {vehicle.brand} {name || vehicle.model}
          </h2>
          <dl className="mt-3 space-y-1 text-[21px] font-medium">
            <div className="flex gap-3">
              <dt className="text-gray-500">{t.admin.windowCards.year}</dt>
              <dd className="font-bold">{formatYearShort(vehicle.year, vehicle.month)}</dd>
            </div>
            {vehicle.mileage > 0 && (
              <div className="flex gap-3">
                <dt className="text-gray-500">{t.admin.windowCards.mileage}</dt>
                <dd className="font-bold">{formatMileage(vehicle.mileage)}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[13px] font-bold uppercase tracking-[0.18em] text-gray-500">
            {t.admin.checklist.colCode}
          </span>
          <span className="block text-[56px] font-extrabold leading-none tabular-nums">
            {code || '—'}
          </span>
        </div>
      </div>

      {withPhoto && photo && (
        <div className="mt-7 h-[58mm] w-full overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mt-9 divide-y-2 divide-black border-b-2 border-black">
        {rows.map((row) => (
          <div key={row.label} className="py-6">
            <span className="block text-[17px] font-bold uppercase tracking-[0.2em] text-gray-600">
              {row.label}
            </span>
            <span
              className={`mt-1 block font-extrabold leading-none tabular-nums ${
                row.lead ? 'text-[74px]' : 'text-[58px]'
              }`}
            >
              {formatNumber(row.value)}₮
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}
