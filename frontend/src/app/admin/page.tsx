'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/adminApi';
import { Vehicle } from '@/types';
import { t } from '@/lib/labels';

export default function AdminDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .listVehicles()
      .then((data) => {
        setVehicles(data.items);
        setTotal(data.pagination.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: t.admin.dashboard.total, value: total },
    {
      label: t.admin.dashboard.available,
      value: vehicles.filter((v) => v.status === 'available').length,
    },
    {
      label: t.admin.dashboard.sold,
      value: vehicles.filter((v) => v.status === 'sold').length,
    },
    {
      label: t.admin.dashboard.featured,
      value: vehicles.filter((v) => v.featured).length,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t.admin.dashboard.title}</h1>
        <Link href="/admin/vehicles/new" className="btn-primary">
          + {t.admin.dashboard.addVehicle}
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-brand">
              {loading ? '—' : s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Link href="/admin/vehicles" className="btn-outline">
          {t.admin.dashboard.manage} →
        </Link>
      </div>
    </div>
  );
}
