import { Suspense } from 'react';
import Link from 'next/link';
import Banner from '@/components/public/Banner';
import TrustStrip from '@/components/public/TrustStrip';
import VehicleCard from '@/components/public/VehicleCard';
import CategoryBrowser from '@/components/public/CategoryBrowser';
import ContactSection from '@/components/public/ContactSection';
import AboutSection from '@/components/public/AboutSection';
import TestimonialsSection from '@/components/public/TestimonialsSection';
import PartnersSection from '@/components/public/PartnersSection';
import { getSettingsSafe, getVehiclesSafe, getCategoriesSafe } from '@/lib/api';
import { DEFAULT_LOAN_CONFIG } from '@/lib/loan';
import { t } from '@/lib/labels';

// How many cars the home page renders. The full catalogue lives on
// /vehicles; keeping this small is what makes the page load fast on a
// phone. Raise the number to show more cards up front.
const HOME_VEHICLE_LIMIT = 12;

export default async function HomePage() {
  const [settings, data, cats] = await Promise.all([
    getSettingsSafe(),
    getVehiclesSafe({
      status: 'available',
      sort: 'newest',
      limit: String(HOME_VEHICLE_LIMIT),
    }),
    getCategoriesSafe(),
  ]);

  const vehicles = data.items;
  // Total in stock, not just the page we rendered — this is the live figure
  // shown in the hero and the trust strip.
  const totalAvailable = data.pagination.total;
  const loan = settings.loan ?? DEFAULT_LOAN_CONFIG;
  const downPercent = loan.minDownPercent ?? 30;

  return (
    <>
      <Banner settings={settings} vehicleCount={totalAvailable} />
      <TrustStrip settings={settings} vehicleCount={totalAvailable} />

      <section className="container-page py-12 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">{t.home.catalog}</p>
            <h2 className="section-title mt-1.5">{t.home.forSale}</h2>
            <p className="mt-1.5 text-sm text-gray-500">{t.home.sortedNewestNote}</p>
          </div>
          <Link href="/vehicles" className="btn-outline">
            {t.common.viewAll}
            <span aria-hidden>→</span>
          </Link>
        </div>

        {cats.categories.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-gray-600">Маркаар сонгох</p>
            <Suspense fallback={null}>
              <CategoryBrowser categories={cats.categories} />
            </Suspense>
          </div>
        )}

        {vehicles.length > 0 ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle._id}
                  vehicle={vehicle}
                  downPercent={downPercent}
                  loan={loan}
                />
              ))}
            </div>

            {totalAvailable > vehicles.length && (
              <div className="mt-10 text-center">
                <Link href="/vehicles" className="btn-primary px-8 text-base">
                  {t.home.viewAllCount(totalAvailable)}
                  <span aria-hidden>→</span>
                </Link>
              </div>
            )}
          </>
        ) : (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-gray-500 ring-1 ring-gray-200">
            {t.home.noVehicles}
          </p>
        )}
      </section>

      <AboutSection settings={settings} />
      <TestimonialsSection testimonials={settings.testimonials} />
      <PartnersSection partners={settings.partners} />
      <ContactSection settings={settings} />
    </>
  );
}
