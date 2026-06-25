'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VehicleForm from '@/components/admin/VehicleForm';
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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t.admin.form.editTitle}</h1>
      <VehicleForm initial={vehicle} onSubmit={handleSubmit} />
    </div>
  );
}
