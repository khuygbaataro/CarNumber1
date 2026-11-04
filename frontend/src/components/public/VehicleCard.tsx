import Link from 'next/link';
import Image from 'next/image';
import { LoanConfig, Vehicle } from '@/types';
import {
  formatPriceShort,
  formatMileage,
  formatAdded,
  formatYear,
} from '@/lib/format';
import {
  calcLoanAmount,
  calcAnnuity,
  rateForDownPercent,
  pickDisplayTerm,
} from '@/lib/loan';
import { isNewArrival } from '@/lib/vehicle';
import { fillRatioUrl } from '@/lib/imageUrl';
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
  const coverSrc = cover ? fillRatioUrl(cover, '4:3', 800) : '';
  const photoCount = vehicle.images?.length ?? 0;
  const sold = vehicle.status === 'sold';

  // Per-vehicle % overrides the global default when set.
  const effectiveDown = vehicle.downPercent ?? downPercent;
  const downAmount = Math.max(0, (vehicle.price * effectiveDown) / 100);

  // Monthly figures use the exact same maths as the calculator on the detail
  // page, over the same term the calculator opens on, so they always agree —
  // including the rate, which the down payment decides rather than a setting.
  const rate = rateForDownPercent(effectiveDown);
  const term = pickDisplayTerm(loan?.termOptions);
  const schedule = calcAnnuity(
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
      className="group flex flex-col overflow-hidden rounded-[18px] bg-surface shadow-card ring-1 ring-line transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover hover:ring-brand/40"
    >
      {/* 4:3, which is what the photos are. A wider box crops the top and
          bottom under object-cover, and that is exactly where the website
          pill, the logo and the phone sit — the card quietly lost all three
          while the full photo still carried them. */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        {cover ? (
          <Image
            src={coverSrc}
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
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            <CameraIcon /> {photoCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-bold leading-snug text-ink">
            {vehicle.brand} {vehicle.model}
          </h3>
          <span className="pill-year shrink-0">{formatYear(vehicle.year, vehicle.month)}</span>
        </div>

        <p className="mt-1 truncate text-xs text-muted">{specLine}</p>

        <p className="mt-3 text-[26px] font-extrabold leading-none tracking-tight text-ink">
          {formatPriceShort(vehicle.price)}
        </p>

        {/* In this market the down payment and the monthly figure are what
            decide whether anyone calls, so they sit together under the price
            rather than being left for the detail page to explain. */}
        <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-xl border border-brand-soft bg-brand-tint">
          <div className="px-3 py-2">
            <p className="figure-label">
              {t.common.downPayment} {effectiveDown}%
            </p>
            <p className="figure-value">{formatPriceShort(downAmount)}</p>
          </div>
          <div className="border-l border-brand-soft px-3 py-2">
            <p className="figure-label">
              {t.common.monthlyShort} · {term} {t.common.months}
            </p>
            <p className="figure-value">{formatPriceShort(schedule.monthly)}</p>
          </div>
        </div>

        {(vehicle.updatedAt || vehicle.createdAt) && (
          <p className="mt-3 text-[11px] text-muted/70">
            {formatAdded(vehicle.createdAt)}
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
