import Link from 'next/link';
import Image from 'next/image';
import { Vehicle } from '@/types';
import { formatPrice, formatMileage } from '@/lib/format';
import { t } from '@/lib/labels';

export default function VehicleCard({
  vehicle,
  downPercent = 30,
}: {
  vehicle: Vehicle;
  downPercent?: number;
}) {
  const cover = vehicle.images?.[0];
  const downAmount = Math.max(0, (vehicle.price * downPercent) / 100);

  return (
    <Link
      href={`/vehicles/${vehicle._id}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-gray-100">
        {cover ? (
          <Image
            src={cover}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            {t.common.noImage}
          </div>
        )}

        {vehicle.status === 'sold' && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow">
            {t.status.sold}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="truncate text-base font-semibold text-gray-900">
          {vehicle.brand} {vehicle.model}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {vehicle.year} • {formatMileage(vehicle.mileage)}
        </p>
        <div className="mt-2">
          <p className="text-xs font-medium text-gray-400">
            {t.common.downPayment} ({downPercent}%)
          </p>
          <p className="text-lg font-bold text-brand">{formatPrice(downAmount)}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            {t.common.price}: {formatPrice(vehicle.price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
