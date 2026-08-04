import Link from 'next/link';
import Image from 'next/image';
import { LoanConfig, Vehicle } from '@/types';
import {
  formatPriceShort,
  formatMileage,
  formatTimeAgo,
  formatPaymentRange,
} from '@/lib/format';
import {
  calcLoanAmount,
  calcEqualPrincipal,
  pickDisplayTerm,
  DEFAULT_LOAN_CONFIG,
} from '@/lib/loan';
import { isNewArrival } from '@/lib/vehicle';
import { t } from '@/lib/labels';

export default function VehicleCard({
  vehicle,
  downPercent = 30,
  loan,
}: {
  vehicle: Vehicle;
  downPercent?: number;
  /** Full loan config — enables the monthly-payment estimate on the card. */
  loan?: LoanConfig;
}) {
  const cover = vehicle.images?.[0];
  const photoCount = vehicle.images?.length ?? 0;
  const sold = vehicle.status === 'sold';

  // Per-vehicle % overrides the global default when set.
  const effectiveDown = vehicle.downPercent ?? downPercent;
  const downAmount = Math.max(0, (vehicle.price * effectiveDown) / 100);

  // Monthly figures use the exact same maths as the calculator on the detail
  // page, over the same term the calculator opens on, so they always agree.
  const rate = loan?.monthlyInterestRate ?? DEFAULT_LOAN_CONFIG.monthlyInterestRate;
  const term = pickDisplayTerm(loan?.termOptions);
  const schedule = calcEqualPrincipal(
    calcLoanAmount(vehicle.price, effectiveDown),
    rate,
    term
  );

  // "1.8 Hybrid · Автомат" — skip whatever the admin left blank.
  const specLine = [formatMileage(vehicle.mileage), vehicle.engine, vehicle.transmission]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={`/vehicles/${vehicle._id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-gray-200 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-brand/30"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {cover ? (
          <Image
            src={cover}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition duration-500 group-hover:scale-[1.04] ${
              sold ? 'grayscale' : ''
            }`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            {t.common.noImage}
          </div>
        )}

        {sold && <div className="absolute inset-0 bg-gray-900/35" />}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {sold ? (
            <span className="badge-sold">{t.status.sold}</span>
          ) : (
            isNewArrival(vehicle.createdAt) && (
              <span className="badge-new">✦ {t.common.new}</span>
            )
          )}
        </div>

        {/* Photo count doubles as a quality signal — more angles, more trust. */}
        {photoCount > 1 && (
          <span className="badge-muted absolute bottom-3 right-3 normal-case">
            <CameraIcon /> {photoCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-bold leading-snug text-gray-900">
            {vehicle.brand} {vehicle.model}
          </h3>
          <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-600">
            {vehicle.year}
          </span>
        </div>

        <p className="mt-1 truncate text-xs text-gray-500">{specLine}</p>

        <p className="mt-3 text-xl font-extrabold tracking-tight text-gray-900">
          {formatPriceShort(vehicle.price)}
        </p>

        {/* Leasing strip — in this market the down payment and the monthly
            figure are what decide whether someone calls at all. Rows rather
            than side-by-side tiles, so the falling payment range fits. */}
        <div className="mt-2.5 divide-y divide-brand-100 rounded-xl bg-brand-50 px-3">
          <div className="flex items-baseline justify-between gap-2 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-brand/60">
              {t.common.downPayment} {effectiveDown}%
            </span>
            <span className="text-sm font-bold text-brand">
              {formatPriceShort(downAmount)}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2 py-2">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-brand/60">
              {t.common.monthlyShort} · {term} {t.common.months}
            </span>
            <span className="text-[13px] font-bold text-brand">
              {formatPaymentRange(schedule.first, schedule.last)}
            </span>
          </div>
        </div>

        {(vehicle.updatedAt || vehicle.createdAt) && (
          <p className="mt-3 text-[11px] text-gray-400">
            {formatTimeAgo(vehicle.updatedAt || vehicle.createdAt)}
          </p>
        )}
      </div>
    </Link>
  );
}

function CameraIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 3.5 7.8 5.5H4.5A2.5 2.5 0 0 0 2 8v10a2.5 2.5 0 0 0 2.5 2.5h15A2.5 2.5 0 0 0 22 18V8a2.5 2.5 0 0 0-2.5-2.5h-3.3L15 3.5H9zm3 5.25A4.75 4.75 0 1 1 7.25 13.5 4.75 4.75 0 0 1 12 8.75zm0 2A2.75 2.75 0 1 0 14.75 13.5 2.75 2.75 0 0 0 12 10.75z" />
    </svg>
  );
}
