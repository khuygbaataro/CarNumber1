'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VehicleForm from '@/components/admin/VehicleForm';
import PosterModal from '@/components/admin/PosterModal';
import { adminApi } from '@/lib/adminApi';
import { Vehicle, VehicleFormData } from '@/types';
import { t } from '@/lib/labels';

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posterOpen, setPosterOpen] = useState(false);

  useEffect(() => {
    adminApi
      .getVehicle(id)
      .then(setVehicle)
      .catch(() => setError(t.admin.vehicles.loadError))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (data: VehicleFormData) => {
    await adminApi.updateVehicle(id, data);
    router.push('/admin/vehicles');
  };

  if (loading) return <p className="text-gray-500">{t.common.loading}</p>;
  if (error || !vehicle) return <p className="text-accent">{error || t.admin.vehicles.loadError}</p>;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{t.admin.form.editTitle}</h1>
        <button type="button" onClick={() => setPosterOpen(true)} className="btn-outline">
          {t.admin.vehicles.poster}
        </button>
      </div>
      <VehicleForm initial={vehicle} onSubmit={handleSubmit} />

      {posterOpen && (
        <PosterModal vehicle={vehicle} onClose={() => setPosterOpen(false)} />
      )}
    </div>
  );
}
