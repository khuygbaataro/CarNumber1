'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import { Vehicle, VehicleStatus } from '@/types';
import { formatPrice, formatTimeAgo } from '@/lib/format';
import { brandKey, groupByBrand } from '@/lib/vehicle';
import { t } from '@/lib/labels';
import PosterModal from '@/components/admin/PosterModal';

const ALL = '__all__';

/** How long the undo bar stays up after a status change, in ms. */
const UNDO_MS = 8000;

/**
 * Every typed word has to appear somewhere in the car's brand, model or
 * year — so "prius 41" finds "Toyota Prius 41 Winter package #4191" and
 * "6531" finds it by the stock number staff actually call it by.
 */
function matches(v: Vehicle, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = `${v.brand} ${v.model} ${Math.trunc(v.year) || ''}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  // Most of the catalogue is sold stock nobody will touch again, so the
  // page opens on what is actually for sale.
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('available');
  const [brand, setBrand] = useState(ALL);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  // Vehicle whose poster is open, or null.
  const [poster, setPoster] = useState<Vehicle | null>(null);
  // Last status change, offered back for a few seconds. Marking a car sold
  // makes it vanish from the default view, so a misclick needs a way back.
  const [undo, setUndo] = useState<{ id: string; name: string; from: VehicleStatus } | null>(
    null
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .listVehicles()
      .then((data) => setVehicles(data.items))
      .catch(() => setError(t.admin.vehicles.loadError))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // "/" jumps to the search box, Esc clears it — the whole point is to get
  // from "this one just sold" to the right row without reaching for a mouse.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_MS);
    return () => clearTimeout(timer);
  }, [undo]);

  // Search runs before the status tabs, so their counts say how many
  // matches sit behind each tab — no match under "Зарагдана" but three
  // under "Бүгд" tells you at a glance where the car went.
  const found = query ? vehicles.filter((v) => matches(v, query)) : vehicles;
  const counts = {
    available: found.filter((v) => v.status === 'available').length,
    all: found.length,
    sold: found.filter((v) => v.status === 'sold').length,
  };
  const byStatus = filter === 'all' ? found : found.filter((v) => v.status === filter);

  // Brand tabs are built from whatever the status filter left, so their
  // counts always match what clicking one would actually show.
  const brandGroups = groupByBrand(byStatus);
  // A brand can empty out when the status filter changes under it — fall
  // back to all rather than leaving the page blank with no way back.
  const activeBrand = brandGroups.some((g) => g.brand === brand) ? brand : ALL;
  const groups =
    activeBrand === ALL ? brandGroups : brandGroups.filter((g) => g.brand === activeBrand);
  const shown = groups.flatMap((g) => g.items);

  // Only available vehicles can be bulk-marked as sold.
  const selectableIds = shown.filter((v) => v.status === 'available').map((v) => v._id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelected(allSelected ? new Set() : new Set(selectableIds));

  const changeFilter = (key: 'all' | 'available' | 'sold') => {
    setFilter(key);
    setSelected(new Set());
  };

  const changeBrand = (key: string) => {
    setBrand(key);
    setSelected(new Set());
  };

  const bulkMarkSold = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      const updates = await Promise.all(
        ids.map((id) => adminApi.setStatus(id, 'sold').catch(() => null))
      );
      setVehicles((list) =>
        list.map((v) => {
          const u = updates.find((x) => x && x._id === v._id);
          return u || v;
        })
      );
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  const setStatus = async (v: Vehicle, next: VehicleStatus, offerUndo = true) => {
    setBusyId(v._id);
    try {
      const updated = await adminApi.setStatus(v._id, next);
      setVehicles((list) => list.map((x) => (x._id === v._id ? updated : x)));
      setUndo(
        offerUndo ? { id: v._id, name: `${v.brand} ${v.model}`, from: v.status } : null
      );
    } catch {
      /* ignore — keep current state */
    } finally {
      setBusyId('');
    }
  };

  const toggleStatus = (v: Vehicle) =>
    setStatus(v, v.status === 'available' ? 'sold' : 'available');

  const undoStatus = () => {
    const target = undo && vehicles.find((v) => v._id === undo.id);
    if (!target) return;
    setStatus(target, undo.from, false);
  };

  const remove = async (v: Vehicle) => {
    if (!window.confirm(t.admin.vehicles.confirmDelete)) return;
    setBusyId(v._id);
    try {
      await adminApi.deleteVehicle(v._id);
      setVehicles((list) => list.filter((x) => x._id !== v._id));
    } catch {
      /* ignore */
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.admin.vehicles.title}</h1>
        <Link href="/admin/vehicles/new" className="btn-primary">
          + {t.admin.vehicles.add}
        </Link>
      </div>

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

      {/* Search first: the usual errand here is "this one just sold, find
          it" — a stock number should reach the row in one keystroke. */}
      <div className="relative mt-5">
        <SearchIcon />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(new Set());
          }}
          placeholder={t.admin.vehicles.searchPlaceholder}
          className="input pl-10 pr-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t.admin.vehicles.searchClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Status filter — keeps sold vehicles separate from the active ones */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            { key: 'available', label: t.status.available },
            { key: 'all', label: t.admin.vehicles.filterAll },
            { key: 'sold', label: t.status.sold },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => changeFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === tab.key
                ? 'bg-brand text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      {/* Brand tabs — the catalogue is mostly one or two makes, so jumping
          straight to a brand beats scrolling the whole list. */}
      {brandGroups.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeBrand(ALL)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeBrand === ALL
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.admin.vehicles.allBrands} ({byStatus.length})
          </button>
          {brandGroups.map((group) => (
            <button
              key={group.brand}
              type="button"
              onClick={() => changeBrand(group.brand)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                activeBrand === group.brand
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
              }`}
            >
              {group.brand} ({group.items.length})
            </button>
          ))}
        </div>
      )}

      {/* Bulk action bar — appears when vehicles are selected */}
      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand/5 px-4 py-3 ring-1 ring-brand/20">
          <span className="text-sm font-medium text-gray-700">
            {selected.size} {t.admin.vehicles.selectedCount}
          </span>
          <button
            type="button"
            disabled={bulkBusy}
            onClick={bulkMarkSold}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:opacity-50"
          >
            {bulkBusy ? t.admin.vehicles.working : t.admin.vehicles.markSoldSelected}
          </button>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {loading ? (
          <p className="p-6 text-center text-gray-500">{t.common.loading}</p>
        ) : shown.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              {query ? t.admin.vehicles.noSearchResults(query) : t.admin.vehicles.empty}
            </p>
            {/* The car is usually just behind another tab — say so rather
                than leaving a dead end. */}
            {query && counts.all > 0 && filter !== 'all' && (
              <button
                type="button"
                onClick={() => changeFilter('all')}
                className="mt-3 text-sm font-semibold text-brand hover:underline"
              >
                {t.admin.vehicles.searchInAll(counts.all)}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="select all"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      disabled={selectableIds.length === 0}
                      className="h-4 w-4 cursor-pointer accent-brand"
                    />
                  </th>
                  <th className="px-4 py-3">{t.admin.vehicles.colVehicle}</th>
                  <th className="px-4 py-3">{t.admin.vehicles.colYear}</th>
                  <th className="px-4 py-3">{t.admin.vehicles.colPrice}</th>
                  <th className="px-4 py-3">{t.admin.vehicles.colStatus}</th>
                  <th className="px-4 py-3">{t.admin.vehicles.colAdded}</th>
                  <th className="px-4 py-3 text-right">{t.admin.vehicles.colActions}</th>
                </tr>
              </thead>
              {groups.map((group) => (
              <tbody key={group.brand} className="divide-y divide-gray-100">
                <tr className="bg-gray-50">
                  <td
                    colSpan={7}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-500"
                  >
                    {group.brand}
                    <span className="ml-1.5 font-medium normal-case text-gray-400">
                      · {group.items.length}
                    </span>
                  </td>
                </tr>
                {group.items.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`select ${v.model}`}
                        checked={selected.has(v._id)}
                        onChange={() => toggleSelect(v._id)}
                        disabled={v.status !== 'available'}
                        className="h-4 w-4 cursor-pointer accent-brand disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
                          {v.images?.[0] && (
                            <Image
                              src={v.images[0]}
                              alt={v.model}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        {/* The brand heads the group, so the row carries
                            only what distinguishes one car from the next. */}
                        <span className="font-medium text-gray-900">
                          {brandKey(v.brand) === group.brand ? v.model : `${v.brand} ${v.model}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.year}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatPrice(v.price)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busyId === v._id}
                        onClick={() => toggleStatus(v)}
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                          v.status === 'sold'
                            ? 'bg-accent/10 text-accent hover:bg-accent/20'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                        title={
                          v.status === 'available'
                            ? t.admin.vehicles.markSold
                            : t.admin.vehicles.markAvailable
                        }
                      >
                        {v.status === 'sold' ? t.status.sold : t.status.available}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                      {formatTimeAgo(v.updatedAt || v.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPoster(v)}
                          className="rounded-md border border-brand/30 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/5"
                        >
                          {t.admin.vehicles.poster}
                        </button>
                        <Link
                          href={`/admin/vehicles/${v._id}`}
                          className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {t.admin.vehicles.edit}
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === v._id}
                          onClick={() => remove(v)}
                          className="rounded-md border border-accent/30 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
                        >
                          {t.admin.vehicles.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              ))}
            </table>
          </div>
        )}
      </div>

      {poster && <PosterModal vehicle={poster} onClose={() => setPoster(null)} />}

      {/* Undo bar. A car marked sold drops out of the default view at once,
          so the only sign a misclick happened is this. */}
      {undo && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex max-w-full items-center gap-4 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
            <span className="truncate">
              {undo.from === 'available'
                ? t.admin.vehicles.markedSold(undo.name)
                : t.admin.vehicles.markedAvailable(undo.name)}
            </span>
            <button
              type="button"
              onClick={undoStatus}
              className="shrink-0 font-bold text-brand-300 transition hover:text-white"
            >
              {t.admin.vehicles.undo}
            </button>
            <button
              type="button"
              onClick={() => setUndo(null)}
              aria-label={t.admin.poster.close}
              className="shrink-0 text-gray-400 transition hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
