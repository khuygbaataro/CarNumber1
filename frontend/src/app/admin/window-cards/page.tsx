'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Vehicle } from '@/types';
import {
  formatNumber,
  formatMileage,
  formatTimeAgo,
  formatYearShort,
} from '@/lib/format';
import { splitStockCode } from '@/lib/vehicle';
import { windowCardFigures } from '@/lib/windowCard';
import { t } from '@/lib/labels';

type Shape = 'full' | 'tent';

/** What "recently added" ticks, in days. */
const RECENT_DAYS = 7;

export default function WindowCardsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shape, setShape] = useState<Shape>('full');
  const [withPhoto, setWithPhoto] = useState(false);
  const [query, setQuery] = useState('');
  // Ticked cars survive the search being cleared — that is what lets a
  // couple of new arrivals be gathered one at a time before printing.
  const [picked, setPicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    adminApi
      .listVehicles()
      .then((data) => setVehicles(data.items))
      .catch(() => setError(t.admin.windowCards.loadError))
      .finally(() => setLoading(false));
  }, []);

  const available = useMemo(
    () => vehicles.filter((v) => v.status === 'available'),
    [vehicles]
  );

  // The search narrows the pick list only. What prints is the ticked set.
  const listed = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return available;
    return available.filter((v) => {
      const hay = `${v.brand} ${v.model} ${Math.trunc(v.year) || ''}`.toLowerCase();
      return terms.every((term) => hay.includes(term));
    });
  }, [available, query]);

  // Nothing ticked means "print the lot" — the old behaviour, kept so the
  // common case still needs no clicks.
  const cards = picked.size ? available.filter((v) => picked.has(v._id)) : available;

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const recentIds = useMemo(() => {
    const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    return available
      .filter((v) => new Date(v.createdAt).getTime() >= cutoff)
      .map((v) => v._id);
  }, [available]);

  return (
    <div>
      <div className="print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.admin.windowCards.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {shape === 'tent'
                ? t.admin.windowCards.tentHint
                : t.admin.windowCards.subtitle}
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

        <div className="mt-5 space-y-4 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
          <div>
            <span className="label">{t.admin.windowCards.shape}</span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { key: 'full' as const, label: t.admin.windowCards.shapeFull },
                  { key: 'tent' as const, label: t.admin.windowCards.shapeTent },
                ]
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setShape(option.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    shape === option.key
                      ? 'bg-brand text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {shape === 'full' && (
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={withPhoto}
                onChange={(e) => setWithPhoto(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-brand"
              />
              {t.admin.windowCards.withPhoto}
            </label>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="label mb-0">{t.admin.windowCards.selectTitle}</span>
              <span className="text-sm font-bold text-brand">
                {picked.size
                  ? t.admin.windowCards.willPrintSome(cards.length)
                  : t.admin.windowCards.willPrintAll(cards.length)}
              </span>
            </div>

            <input
              type="search"
              className="input mt-2"
              placeholder={t.admin.windowCards.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="mt-2 flex flex-wrap gap-2">
              {recentIds.length > 0 && (
                <QuickButton onClick={() => setPicked(new Set(recentIds))}>
                  {t.admin.windowCards.selectRecent(RECENT_DAYS)} ({recentIds.length})
                </QuickButton>
              )}
              <QuickButton
                onClick={() => setPicked(new Set(listed.map((v) => v._id)))}
              >
                {t.admin.windowCards.selectAll}
              </QuickButton>
              {picked.size > 0 && (
                <QuickButton onClick={() => setPicked(new Set())}>
                  {t.admin.windowCards.clearSelection} ({picked.size})
                </QuickButton>
              )}
            </div>

            <div className="mt-3 max-h-[300px] overflow-y-auto rounded-lg ring-1 ring-gray-200">
              {listed.length === 0 ? (
                <p className="p-4 text-center text-sm text-gray-500">
                  {t.admin.windowCards.noMatches}
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {listed.map((v) => {
                    const { code, name } = splitStockCode(v.model);
                    return (
                      <li key={v._id}>
                        <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={picked.has(v._id)}
                            onChange={() => toggle(v._id)}
                            className="h-4 w-4 cursor-pointer accent-brand"
                          />
                          <span className="w-14 shrink-0 font-bold tabular-nums">
                            {code || '—'}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-gray-900">
                            {v.brand} {name || v.model}
                          </span>
                          <span className="shrink-0 tabular-nums text-gray-600">
                            {formatNumber(v.price)}₮
                          </span>
                          <span className="hidden w-28 shrink-0 text-right text-xs text-gray-400 sm:block">
                            {formatTimeAgo(v.createdAt)}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {t.admin.windowCards.selectHint}
            </p>
          </div>
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
          {cards.map((v) =>
            shape === 'tent' ? (
              <TentCard key={v._id} vehicle={v} />
            ) : (
              <FullCard key={v._id} vehicle={v} withPhoto={withPhoto} />
            )
          )}
        </div>
      )}
    </div>
  );
}

function QuickButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
    >
      {children}
    </button>
  );
}

/** Name, stock number, build date and mileage — shared by both shapes. */
function useCardData(vehicle: Vehicle) {
  const { code, name } = splitStockCode(vehicle.model);
  const f = windowCardFigures(vehicle.price);
  const monthly = f.terms[0];
  return {
    code,
    title: `${vehicle.brand} ${name || vehicle.model}`,
    year: formatYearShort(vehicle.year, vehicle.month),
    mileage: vehicle.mileage > 0 ? formatMileage(vehicle.mileage) : '',
    rows: [
      { label: t.admin.windowCards.price, value: f.price, lead: true },
      { label: t.admin.windowCards.down, value: f.downAmount, lead: false },
      {
        label: `${t.admin.windowCards.monthly} · ${monthly.months} ${t.admin.windowCards.months}`,
        value: monthly.monthly,
        lead: false,
      },
    ],
  };
}

/**
 * One A4 page per car, taped flat inside the window.
 *
 * Printed in black and white, so there is no colour to lean on: the
 * hierarchy comes from type size and from rules between the sections.
 */
function FullCard({ vehicle, withPhoto }: { vehicle: Vehicle; withPhoto: boolean }) {
  const d = useCardData(vehicle);
  const photo = vehicle.images?.[0];

  return (
    <article className="window-card mx-auto flex h-[297mm] w-[210mm] break-after-page flex-col justify-center bg-white px-[18mm] py-[20mm] text-black shadow-sm ring-1 ring-gray-200 print:shadow-none print:ring-0">
      <div className="flex items-start justify-between gap-8 border-b-4 border-black pb-5">
        <div className="min-w-0">
          <h2 className="text-[46px] font-extrabold uppercase leading-[1.05] tracking-tight">
            {d.title}
          </h2>
          <dl className="mt-3 space-y-1 text-[21px] font-medium">
            <div className="flex gap-3">
              <dt className="text-gray-500">{t.admin.windowCards.year}</dt>
              <dd className="font-bold">{d.year}</dd>
            </div>
            {d.mileage && (
              <div className="flex gap-3">
                <dt className="text-gray-500">{t.admin.windowCards.mileage}</dt>
                <dd className="font-bold">{d.mileage}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[13px] font-bold uppercase tracking-[0.18em] text-gray-500">
            {t.admin.checklist.colCode}
          </span>
          <span className="block text-[56px] font-extrabold leading-none tabular-nums">
            {d.code || '—'}
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
        {d.rows.map((row) => (
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

/**
 * The same A4 sheet, but split across its length into two 148.5mm panels
 * and folded down the middle to stand on the dashboard like a tent.
 *
 * Both panels carry the same car and are printed on the ONE side of the
 * paper. The upper one is turned 180°, which is what makes it read the
 * right way up once the sheet is folded over: the half that ends up
 * facing the windscreen and the half facing the driver's seat both come
 * out upright.
 */
function TentCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="window-card mx-auto flex h-[297mm] w-[210mm] break-after-page flex-col bg-white text-black shadow-sm ring-1 ring-gray-200 print:shadow-none print:ring-0">
      <div className="h-[148.5mm] rotate-180">
        <TentPanel vehicle={vehicle} />
      </div>
      {/* The crease. Printed faintly so it guides the fold without
          showing up as a line across the finished card. */}
      <div className="h-[148.5mm] border-t border-dashed border-gray-400">
        <TentPanel vehicle={vehicle} />
      </div>
    </article>
  );
}

function TentPanel({ vehicle }: { vehicle: Vehicle }) {
  const d = useCardData(vehicle);

  return (
    <div className="flex h-full flex-col justify-center px-[16mm] py-[12mm]">
      <div className="flex items-start justify-between gap-6 border-b-4 border-black pb-3">
        <div className="min-w-0">
          <h2 className="text-[34px] font-extrabold uppercase leading-[1.05] tracking-tight">
            {d.title}
          </h2>
          <p className="mt-1.5 text-[17px] font-medium text-gray-600">
            {t.admin.windowCards.year} <b className="text-black">{d.year}</b>
            {d.mileage && (
              <>
                {'  ·  '}
                {t.admin.windowCards.mileage} <b className="text-black">{d.mileage}</b>
              </>
            )}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            {t.admin.checklist.colCode}
          </span>
          <span className="block text-[38px] font-extrabold leading-none tabular-nums">
            {d.code || '—'}
          </span>
        </div>
      </div>

      {/* Label left, figure right — half a page is too short for the
          stacked treatment the full sheet uses. */}
      <div className="mt-4 divide-y divide-black">
        {d.rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6 py-3">
            <span className="text-[15px] font-bold uppercase tracking-[0.16em] text-gray-600">
              {row.label}
            </span>
            <span
              className={`font-extrabold leading-none tabular-nums ${
                row.lead ? 'text-[44px]' : 'text-[34px]'
              }`}
            >
              {formatNumber(row.value)}₮
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
