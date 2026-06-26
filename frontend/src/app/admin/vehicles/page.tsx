'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import { Vehicle } from '@/types';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/labels';

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'sold'>('all');

  const load = () => {
    setLoading(true);
    adminApi
      .listVehicles()
      .then((data) => setVehicles(data.items))
      .catch(() => setError(t.admin.vehicles.loadError))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const counts = {
    all: vehicles.length,
    available: vehicles.filter((v) => v.status === 'available').length,
    sold: vehicles.filter((v) => v.status === 'sold').length,
  };
  const shown = filter === 'all' ? vehicles : vehicles.filter((v) => v.status === filter);

  const toggleStatus = async (v: Vehicle) => {
    setBusyId(v._id);
    const next = v.status === 'available' ? 'sold' : 'available';
    try {
      const updated = await adminApi.setStatus(v._id, next);
      setVehicles((list) => list.map((x) => (x._id === v._id ? updated : x)));
    } catch {
      /* ignore — keep current state */
    } finally {
      setBusyId('');
    }
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

      {/* Status filter — keeps sold vehicles separate from the active ones */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            { key: 'all', label: t.admin.vehicles.filterAll },
            { key: 'available', label: t.status.available },
            { key: 'sold', label: t.status.sold },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
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

      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        {loading ? (
          <p className="p-6 text-center text-gray-500">{t.common.loading}</p>
        ) : shown.length === 0 ? (
          <p className="p-6 text-center text-gray-500">{t.admin.vehicles.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t.admin.vehicles.colVehicle}</th>
                  <th className="px-4 py-3">{t.admin.vehicles.colYear}</th>
                  <th className="px-4 py-3">{t.admin.vehicles.colPrice}</th>
                  <th className="px-4 py-3">{t.admin.vehicles.colStatus}</th>
                  <th className="px-4 py-3 text-right">{t.admin.vehicles.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shown.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50">
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
                        <span className="font-medium text-gray-900">
                          {v.brand} {v.model}
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
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
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
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
