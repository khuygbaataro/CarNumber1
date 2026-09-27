'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Settings, Vehicle } from '@/types';
import { formatNumber, formatMileage, formatYearShort } from '@/lib/format';
import { primaryPhone } from '@/lib/contact';
import { splitStockCode } from '@/lib/vehicle';
import { POSTER_ADDRESS, posterWebsite } from '@/lib/poster';
import { WINDOW_DOWN_PERCENT, windowCardFigures } from '@/lib/windowCard';
import { t } from '@/lib/labels';

export default function WindowCardsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withPhoto, setWithPhoto] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.listVehicles().then((data) => setVehicles(data.items)),
      adminApi.getSettings().then(setSettings).catch(() => {}),
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

  const phone = primaryPhone(settings?.contact?.phone ?? '');
  const website = posterWebsite();

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
              settings={settings}
              phone={phone}
              website={website}
              withPhoto={withPhoto}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Card({
  vehicle,
  settings,
  phone,
  website,
  withPhoto,
}: {
  vehicle: Vehicle;
  settings: Settings | null;
  phone: string;
  website: string;
  withPhoto: boolean;
}) {
  const { code, name } = splitStockCode(vehicle.model);
  const f = windowCardFigures(vehicle.price, settings?.loan);
  const specs = [
    formatYearShort(vehicle.year, vehicle.month),
    vehicle.mileage ? formatMileage(vehicle.mileage) : '',
    vehicle.engine,
    vehicle.transmission,
  ].filter(Boolean);
  const photo = vehicle.images?.[0];

  return (
    // One A4 page each. Mostly white: a full-bleed dark sheet would drink
    // a cartridge over thirty cars, and this is printed in quantity.
    <article className="mx-auto flex h-[273mm] w-[186mm] break-after-page flex-col bg-white p-0 text-gray-900 shadow-sm ring-1 ring-gray-200 print:shadow-none print:ring-0">
      <header className="flex items-center justify-between border-b-4 border-gray-900 pb-3">
        <span className="text-2xl font-extrabold tracking-tight">
          {settings?.companyName || 'VICTORY CAR'}
        </span>
        <span className="rounded bg-[#e11b22] px-4 py-1.5 text-sm font-bold uppercase tracking-[0.18em] text-white">
          {t.admin.windowCards.badge}
        </span>
      </header>

      {/* Name and stock number — the number is what staff match to the car. */}
      <div className="mt-6 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h2 className="text-[42px] font-extrabold uppercase leading-[1.05] tracking-tight">
            {vehicle.brand} {name || vehicle.model}
          </h2>
          <p className="mt-2 text-lg font-medium text-gray-600">{specs.join(' · ')}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[13px] font-bold uppercase tracking-[0.18em] text-gray-400">
            {t.admin.checklist.colCode}
          </span>
          <span className="block text-[44px] font-extrabold leading-none tabular-nums">
            {code || '—'}
          </span>
        </div>
      </div>

      {withPhoto && photo && (
        <div className="mt-5 h-[62mm] w-full overflow-hidden rounded-lg bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      {/* The money blocks take whatever height is left and centre in
          it, so the sheet reads the same with the photo on or off. */}
      <div className="flex flex-1 flex-col justify-center gap-6 py-6">
      {/* Price — the one figure readable from outside the glass. */}
      <div className="rounded-xl bg-[#e11b22] px-7 py-6 text-white">
        <span className="block text-sm font-bold uppercase tracking-[0.2em] text-white/80">
          {t.admin.windowCards.price}
        </span>
        <span className="mt-1 block text-[66px] font-extrabold leading-none tabular-nums">
          {formatNumber(f.price)}₮
        </span>
      </div>

      <div className="flex items-baseline justify-between rounded-xl bg-gray-100 px-7 py-5">
        <span className="text-base font-bold uppercase tracking-[0.14em] text-gray-500">
          {t.admin.windowCards.down(WINDOW_DOWN_PERCENT)}
        </span>
        <span className="text-[44px] font-extrabold leading-none tabular-nums">
          {formatNumber(f.downAmount)}₮
        </span>
      </div>

      <div>
        <span className="block text-base font-bold uppercase tracking-[0.14em] text-gray-500">
          {t.admin.windowCards.monthly}
        </span>
        <div className="mt-2 grid grid-cols-2 gap-4">
          {f.terms.map((term) => (
            <div
              key={term.months}
              className="rounded-xl border-2 border-gray-900 px-6 py-7 text-center"
            >
              <span className="block text-lg font-bold uppercase tracking-[0.14em] text-gray-500">
                {term.months} {t.admin.windowCards.months}
              </span>
              <span className="mt-1 block text-[52px] font-extrabold leading-none tabular-nums">
                {formatNumber(term.monthly)}₮
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-base font-medium text-gray-500">
          {t.admin.windowCards.equalNote(f.rate)}
        </p>
      </div>
      </div>

      {/* mt-auto pins the contact strip to the foot of the page whatever
          sits above it — photo on or off, long model name or short. */}
      <footer className="mt-auto border-t-4 border-[#e11b22] pt-4">
        <div className="flex items-baseline justify-between gap-4">
          {phone && (
            <span className="text-[30px] font-extrabold leading-none tabular-nums">
              {phone}
            </span>
          )}
          {website && (
            <span className="text-lg font-bold tracking-wide text-gray-700">{website}</span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {settings?.contact?.address?.trim() || POSTER_ADDRESS}
        </p>
        <p className="mt-1 text-[11px] text-gray-400">{t.admin.windowCards.rounded}</p>
      </footer>
    </article>
  );
}
