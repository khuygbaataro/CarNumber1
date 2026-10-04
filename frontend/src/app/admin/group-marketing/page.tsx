'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Vehicle } from '@/types';
import { formatNumber, formatTimeAgo } from '@/lib/format';
import { splitStockCode } from '@/lib/vehicle';
import { originalImageUrl } from '@/lib/imageUrl';
import { GROUP_PHONE_DEFAULT, buildGroupPost, postImageName } from '@/lib/groupPost';
import { t } from '@/lib/labels';

/** What "recently added" ticks, in days. Matches the window-card sheet. */
const RECENT_DAYS = 7;
/** Retyped numbers survive the page, so a stint of posting keeps one number. */
const PHONE_KEY = 'groupMarketingPhone';

export default function GroupMarketingPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [phone, setPhone] = useState(GROUP_PHONE_DEFAULT);
  const [withPrice, setWithPrice] = useState(false);
  const [branded, setBranded] = useState(false);

  useEffect(() => {
    adminApi
      .listVehicles()
      .then((data) => setVehicles(data.items))
      .catch(() => setError(t.admin.groupMarketing.loadError))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PHONE_KEY);
      if (saved) setPhone(saved);
    } catch {
      /* private window, blocked storage — the default is fine */
    }
  }, []);

  const savePhone = (value: string) => {
    setPhone(value);
    try {
      localStorage.setItem(PHONE_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const available = useMemo(
    () => vehicles.filter((v) => v.status === 'available'),
    [vehicles]
  );

  // The search narrows the pick list only; the ticked set is what is posted,
  // so a car can be found by its chassis number, ticked, and the search
  // cleared to go and find the next one.
  const listed = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return available;
    return available.filter((v) => {
      const hay = `${v.brand} ${v.model} ${Math.trunc(v.year) || ''}`.toLowerCase();
      return terms.every((term) => hay.includes(term));
    });
  }, [available, query]);

  // Unlike the window sheets, an empty selection means nothing — a group
  // post goes up one car at a time, so "all of them" is never the intent.
  const chosen = useMemo(
    () => available.filter((v) => picked.has(v._id)),
    [available, picked]
  );

  const recentIds = useMemo(() => {
    const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    return available
      .filter((v) => new Date(v.createdAt).getTime() >= cutoff)
      .map((v) => v._id);
  }, [available]);

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t.admin.groupMarketing.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {t.admin.groupMarketing.subtitle}
        </p>
      </div>

      <div className="mt-5 space-y-4 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="group-phone">
              {t.admin.groupMarketing.phone}
            </label>
            <input
              id="group-phone"
              className="input"
              value={phone}
              onChange={(e) => savePhone(e.target.value)}
              placeholder={GROUP_PHONE_DEFAULT}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t.admin.groupMarketing.phoneHint}
            </p>
          </div>

          <div className="space-y-2 sm:pt-7">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={withPrice}
                onChange={(e) => setWithPrice(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-brand"
              />
              {t.admin.groupMarketing.withPrice}
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={branded}
                onChange={(e) => setBranded(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-brand"
              />
              {t.admin.groupMarketing.branded}
            </label>
            <p className="text-xs text-gray-400">
              {branded
                ? t.admin.groupMarketing.brandedHint
                : t.admin.groupMarketing.plainHint}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="label mb-0">{t.admin.groupMarketing.selectTitle}</span>
            <span className="text-sm font-bold text-brand">
              {t.admin.groupMarketing.chosenCount(chosen.length)}
            </span>
          </div>

          <input
            type="search"
            className="input mt-2"
            placeholder={t.admin.groupMarketing.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="mt-2 flex flex-wrap gap-2">
            {recentIds.length > 0 && (
              <QuickButton onClick={() => setPicked(new Set(recentIds))}>
                {t.admin.groupMarketing.selectRecent(RECENT_DAYS)} ({recentIds.length})
              </QuickButton>
            )}
            {picked.size > 0 && (
              <QuickButton onClick={() => setPicked(new Set())}>
                {t.admin.groupMarketing.clearSelection} ({picked.size})
              </QuickButton>
            )}
          </div>

          <div className="mt-3 max-h-[300px] overflow-y-auto rounded-lg ring-1 ring-gray-200">
            {listed.length === 0 ? (
              <p className="p-4 text-center text-sm text-gray-500">
                {t.admin.groupMarketing.noMatches}
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
            {t.admin.groupMarketing.selectHint}
          </p>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

      {loading ? (
        <p className="mt-6 text-gray-500">{t.common.loading}</p>
      ) : chosen.length === 0 ? (
        <p className="mt-6 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          {t.admin.groupMarketing.empty}
        </p>
      ) : (
        <div className="mt-6 space-y-6">
          {chosen.map((v) => (
            <CarBlock
              key={v._id}
              vehicle={v}
              phone={phone}
              withPrice={withPrice}
              branded={branded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CarBlock({
  vehicle,
  phone,
  withPrice,
  branded,
}: {
  vehicle: Vehicle;
  phone: string;
  withPrice: boolean;
  branded: boolean;
}) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [note, setNote] = useState('');

  // The post follows the car and the options until it is edited by hand;
  // once edited, retyping is not thrown away by a stray checkbox click.
  const [edited, setEdited] = useState(false);
  const generated = useMemo(
    () => buildGroupPost(vehicle, { phone, withPrice }),
    [vehicle, phone, withPrice]
  );
  useEffect(() => {
    if (!edited) setText(generated);
  }, [generated, edited]);

  const urls = useMemo(
    () => (branded ? vehicle.images : vehicle.images.map(originalImageUrl)),
    [vehicle.images, branded]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNote(t.admin.groupMarketing.copyFailed);
    }
  };

  const downloadAll = async () => {
    setDownloading(true);
    setNote('');
    let failed = 0;
    for (let i = 0; i < urls.length; i++) {
      try {
        const res = await fetch(urls[i]);
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = postImageName(vehicle, i, urls[i]);
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Revoked on the next tick: Chrome cancels a download whose blob
        // url is released in the same frame as the click.
        setTimeout(() => URL.revokeObjectURL(href), 10_000);
      } catch {
        failed++;
      }
    }
    setDownloading(false);
    if (failed) setNote(t.admin.groupMarketing.downloadFailed(failed));
  };

  const { code, name } = splitStockCode(vehicle.model);

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-900">
          {vehicle.brand} {name || vehicle.model}
          {code && <span className="ml-2 text-sm text-gray-400">#{code}</span>}
        </h2>
        <span className="text-sm tabular-nums text-gray-500">
          {formatNumber(vehicle.price)}₮
        </span>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="label mb-0">
              {t.admin.groupMarketing.photos(urls.length)}
            </span>
            <button
              type="button"
              onClick={downloadAll}
              disabled={downloading || urls.length === 0}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              {downloading
                ? t.admin.groupMarketing.downloading
                : t.admin.groupMarketing.downloadAll}
            </button>
          </div>
          {urls.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">{t.common.noImage}</p>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {urls.map((url, i) => (
                <a
                  key={url + i}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg ring-1 ring-gray-200"
                  title={t.admin.groupMarketing.openImage}
                >
                  {/* Plain img: these are full-size Cloudinary originals and
                      the optimiser would hand back a transformed copy, which
                      is the one thing this page must not do. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="label mb-0">{t.admin.groupMarketing.description}</span>
            <div className="flex gap-2">
              {edited && (
                <button
                  type="button"
                  onClick={() => {
                    setEdited(false);
                    setText(generated);
                  }}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                >
                  {t.admin.groupMarketing.reset}
                </button>
              )}
              <button
                type="button"
                onClick={copy}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                {copied ? t.admin.groupMarketing.copied : t.admin.groupMarketing.copy}
              </button>
            </div>
          </div>
          <textarea
            className="input mt-2 h-56 font-mono text-sm leading-relaxed"
            value={text}
            onChange={(e) => {
              setEdited(true);
              setText(e.target.value);
            }}
          />
        </div>
      </div>

      {note && <p className="mt-3 text-sm text-accent">{note}</p>}
    </section>
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
      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
    >
      {children}
    </button>
  );
}
