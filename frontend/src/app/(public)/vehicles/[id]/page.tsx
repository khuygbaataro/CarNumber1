import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ImageGallery from '@/components/public/ImageGallery';
import LoanCalculator from '@/components/public/LoanCalculator';
import LeadForm from '@/components/public/LeadForm';
import VehicleCard from '@/components/public/VehicleCard';
import { getVehicle, getSettingsSafe, getVehiclesSafe } from '@/lib/api';
import {
  DEFAULT_LOAN_CONFIG,
  calcLoanAmount,
  calcEqualPrincipal,
  pickDisplayTerm,
} from '@/lib/loan';
import {
  formatPrice,
  formatPriceShort,
  formatMileage,
  formatTimeAgo,
  formatPaymentRange,
  formatYear,
} from '@/lib/format';
import { telHref, messengerHref, primaryPhone } from '@/lib/contact';
import { isNewArrival } from '@/lib/vehicle';
import { t } from '@/lib/labels';
import { Settings } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const vehicle = await getVehicle(id);
    const title = `${vehicle.brand} ${vehicle.model}`;
    // Give Facebook a proper link preview — most traffic arrives from there.
    const description = `${formatYear(vehicle.year, vehicle.month)} · ${formatMileage(
      vehicle.mileage
    )} · ${formatPrice(vehicle.price)}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: vehicle.images?.[0] ? [vehicle.images[0]] : undefined,
      },
    };
  } catch {
    return { title: t.vehicles.title };
  }
}

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params;
  const [vehicle, settings, others] = await Promise.all([
    getVehicle(id).catch(() => null),
    getSettingsSafe(),
    getVehiclesSafe({ status: 'available', sort: 'newest', limit: '5' }),
  ]);
  if (!vehicle) notFound();

  const otherCars = others.items.filter((v) => v._id !== id).slice(0, 4);
  const title = `${vehicle.brand} ${vehicle.model}`;
  const sold = vehicle.status === 'sold';

  // Per-vehicle down payment % overrides the global default in the calculator.
  const baseLoan = settings.loan ?? DEFAULT_LOAN_CONFIG;
  const loanConfig = {
    ...baseLoan,
    minDownPercent: vehicle.downPercent ?? baseLoan.minDownPercent,
  };

  const effectiveDown = loanConfig.minDownPercent ?? 30;
  const downAmount = Math.max(0, (vehicle.price * effectiveDown) / 100);
  // Same term the calculator below opens on, so the two never disagree.
  const term = pickDisplayTerm(loanConfig.termOptions);
  const schedule = calcEqualPrincipal(
    calcLoanAmount(vehicle.price, effectiveDown),
    loanConfig.monthlyInterestRate ?? DEFAULT_LOAN_CONFIG.monthlyInterestRate,
    term
  );

  return (
    <div className="container-page py-6 sm:py-8">
      <Link
        href="/vehicles"
        className="group inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-brand hover:text-brand hover:shadow-md"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:-translate-x-0.5"
          aria-hidden
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
        {t.common.back}
      </Link>

      <div className="mt-4 grid items-start gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        {/* Media — min-w-0 so the scrollable gallery cannot widen the column */}
        <div className="min-w-0">
          <ImageGallery images={vehicle.images} alt={title} />

          {vehicle.video && (
            <div className="mt-5">
              <h2 className="mb-2 text-sm font-bold text-gray-700">{t.detail.video}</h2>
              <video
                controls
                preload="metadata"
                playsInline
                className="w-full rounded-2xl bg-black"
                src={vehicle.video}
              />
            </div>
          )}
        </div>

        {/* Info — sticks alongside the gallery on desktop */}
        <div className="min-w-0 lg:sticky lg:top-24">
          <div className="flex flex-wrap items-center gap-2">
            {sold ? (
              <span className="badge-sold">{t.status.sold}</span>
            ) : (
              <>
                <span className="badge inline-flex bg-fresh-50 text-fresh-700">
                  {t.status.available}
                </span>
                {isNewArrival(vehicle.createdAt) && (
                  <span className="badge-new">✦ {t.common.new}</span>
                )}
              </>
            )}
            {(vehicle.updatedAt || vehicle.createdAt) && (
              <span className="text-xs text-gray-400">
                {formatTimeAgo(vehicle.updatedAt || vehicle.createdAt)}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {[formatYear(vehicle.year, vehicle.month), formatMileage(vehicle.mileage), vehicle.engine]
              .filter(Boolean)
              .join(' · ')}
          </p>

          {/* Price + leasing — the two figures that decide whether they call */}
          <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-gray-200">
            <div className="bg-white px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t.detail.price}
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                {formatPrice(vehicle.price)}
              </p>
            </div>
            <div className="divide-y divide-brand-100 border-t border-brand-100 bg-brand-50 px-5">
              <div className="flex items-baseline justify-between gap-3 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-brand/60">
                  {t.common.downPayment} {effectiveDown}%
                </span>
                <span className="text-lg font-bold text-brand">
                  {formatPriceShort(downAmount)}
                </span>
              </div>
              <div className="py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-brand/60">
                    {t.common.monthlyShort} · {term} {t.common.months}
                  </span>
                  <span className="text-base font-bold text-brand">
                    {formatPaymentRange(schedule.first, schedule.last)}
                  </span>
                </div>
                {/* The instalment falls every month — say so, or the two
                    numbers look like a mistake. */}
                <p className="mt-1 text-right text-[11px] text-brand/60">
                  {t.loan.lastMonthNote}
                </p>
              </div>
            </div>
          </div>

          {sold ? (
            <div className="mt-5 rounded-2xl bg-accent-50 p-5 text-center ring-1 ring-accent-100">
              <p className="font-bold text-accent-700">{t.detail.soldTitle}</p>
              <p className="mt-1 text-sm text-gray-600">{t.detail.soldNote}</p>
              <Link href="/vehicles" className="btn-primary mt-4">
                {t.cta.browse}
              </Link>
            </div>
          ) : (
            <ContactActions settings={settings} />
          )}

          <dl className="mt-7 grid grid-cols-2 gap-x-5 gap-y-0 rounded-2xl bg-white px-5 py-2 ring-1 ring-gray-200">
            <Spec label={t.detail.year} value={formatYear(vehicle.year, vehicle.month)} />
            <Spec label={t.detail.mileage} value={formatMileage(vehicle.mileage)} />
            <Spec label={t.detail.engine} value={vehicle.engine} />
            <Spec label={t.detail.transmission} value={vehicle.transmission || ''} />
            <Spec label={t.detail.steering} value={vehicle.steering || ''} />
            <Spec label={t.detail.fuel} value={vehicle.fuel || ''} />
            <Spec label={t.detail.exteriorColor} value={vehicle.exteriorColor} />
            <Spec label={t.detail.interiorColor} value={vehicle.interiorColor} />
          </dl>

          {vehicle.description && (
            <div className="mt-5 rounded-2xl bg-white p-5 ring-1 ring-gray-200">
              <h2 className="text-sm font-bold text-gray-900">{t.detail.description}</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {vehicle.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Loan calculator */}
      <div className="mt-10">
        <LoanCalculator price={vehicle.price} config={loanConfig} />
      </div>

      {/* Inquiry form — captures the lead for this vehicle */}
      <div id="lead" className="mt-6 scroll-mt-24">
        <LeadForm vehicleId={vehicle._id} vehicleName={title} />
      </div>

      {/* Other available vehicles — keep the buyer browsing */}
      {otherCars.length > 0 && (
        <div className="mt-14">
          <p className="eyebrow">{t.detail.otherCarsNote}</p>
          <h2 className="section-title mt-1.5">{t.detail.otherCars}</h2>
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {otherCars.map((v) => (
              <VehicleCard
                key={v._id}
                vehicle={v}
                downPercent={baseLoan.minDownPercent}
                loan={baseLoan}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Call / Messenger / book-a-viewing. The first two mirror the sticky mobile
 * bar; the third is a plain anchor down to the inquiry form, so it needs no
 * JavaScript.
 */
function ContactActions({ settings }: { settings: Settings }) {
  const tel = telHref(settings.contact?.phone);
  const messenger = messengerHref(settings.social?.facebook);

  return (
    <div className="mt-5 space-y-2.5">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {tel && (
          <a href={tel} className="btn-call">
            <PhoneIcon />
            {t.cta.call} — {primaryPhone(settings.contact.phone)}
          </a>
        )}
        {messenger && (
          <a
            href={messenger}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-messenger"
          >
            <ChatIcon />
            {t.cta.messenger}
          </a>
        )}
      </div>
      <a href="#lead" className="btn-outline w-full">
        {t.cta.bookViewing}
      </a>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="border-b border-gray-100 py-3 last:border-0">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.28-.28.7-.37 1.05-.25 1.15.38 2.39.59 3.65.59.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.85 21 3 13.15 3 3.9c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.27.2 2.5.59 3.65.12.35.03.77-.25 1.05l-2.24 2.2z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.4c-5.3 0-9.6 3.9-9.6 8.7 0 2.6 1.26 4.94 3.25 6.52v3.34a.6.6 0 0 0 .9.52l3.06-1.74c.76.16 1.56.25 2.39.25 5.3 0 9.6-3.9 9.6-8.7S17.3 2.4 12 2.4z" />
    </svg>
  );
}
