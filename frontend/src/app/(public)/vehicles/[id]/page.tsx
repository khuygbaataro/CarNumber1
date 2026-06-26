import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ImageGallery from '@/components/public/ImageGallery';
import LoanCalculator from '@/components/public/LoanCalculator';
import { getVehicle, getSettingsSafe } from '@/lib/api';
import { DEFAULT_LOAN_CONFIG } from '@/lib/loan';
import { formatPrice, formatMileage } from '@/lib/format';
import { t } from '@/lib/labels';
import { Vehicle } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const vehicle = await getVehicle(id);
    return { title: `${vehicle.brand} ${vehicle.model}` };
  } catch {
    return { title: t.vehicles.title };
  }
}

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params;
  const [vehicle, settings] = await Promise.all([
    getVehicle(id).catch(() => null),
    getSettingsSafe(),
  ]);
  if (!vehicle) notFound();

  const title = `${vehicle.brand} ${vehicle.model}`;

  return (
    <div className="container-page py-8">
      <Link href="/vehicles" className="text-sm font-medium text-brand hover:underline">
        ← {t.common.back}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        {/* Media */}
        <div>
          <ImageGallery images={vehicle.images} alt={title} />
          {vehicle.video && (
            <div className="mt-4">
              <h2 className="mb-2 text-sm font-semibold text-gray-700">{t.detail.video}</h2>
              <video
                controls
                preload="metadata"
                className="w-full rounded-xl bg-black"
                src={vehicle.video}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
            <StatusBadge vehicle={vehicle} />
          </div>

          <p className="mt-3 text-3xl font-bold text-brand">
            {formatPrice(vehicle.price)}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Spec label={t.detail.year} value={String(vehicle.year)} />
            <Spec label={t.detail.mileage} value={formatMileage(vehicle.mileage)} />
            <Spec label={t.detail.engine} value={vehicle.engine} />
            <Spec label={t.detail.exteriorColor} value={vehicle.exteriorColor} />
            <Spec label={t.detail.interiorColor} value={vehicle.interiorColor} />
          </dl>

          {vehicle.description && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-700">{t.detail.description}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {vehicle.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loan calculator */}
      <div className="mt-10">
        <LoanCalculator price={vehicle.price} config={settings.loan ?? DEFAULT_LOAN_CONFIG} />
      </div>
    </div>
  );
}

function StatusBadge({ vehicle }: { vehicle: Vehicle }) {
  const sold = vehicle.status === 'sold';
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
        sold ? 'bg-accent text-white' : 'bg-green-100 text-green-800'
      }`}
    >
      {sold ? t.status.sold : t.status.available}
    </span>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="border-b border-gray-100 pb-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-gray-900">{value}</dd>
    </div>
  );
}
