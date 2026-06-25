'use client';

import { useRouter } from 'next/navigation';
import VehicleForm from '@/components/admin/VehicleForm';
import { adminApi } from '@/lib/adminApi';
import { VehicleFormData } from '@/types';
import { t } from '@/lib/labels';

export default function NewVehiclePage() {
  const router = useRouter();

  const handleSubmit = async (data: VehicleFormData) => {
    await adminApi.createVehicle(data);
    router.push('/admin/vehicles');
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{t.admin.form.addTitle}</h1>
      <VehicleForm onSubmit={handleSubmit} />
    </div>
  );
}
