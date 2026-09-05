import { Suspense } from 'react';
import Link from 'next/link';
import SearchFilters from '@/components/public/SearchFilters';
import CategoryBrowser from '@/components/public/CategoryBrowser';
import VehicleCard from '@/components/public/VehicleCard';
import Pagination from '@/components/public/Pagination';
import { getVehiclesSafe, getSettingsSafe, getCategoriesSafe } from '@/lib/api';
import { DEFAULT_LOAN_CONFIG } from '@/lib/loan';
import { t } from '@/lib/labels';
import { VehicleQuery } from '@/types';

export const metadata = { title: t.vehicles.title };

type SearchParams = { [key: string]: string | string[] | undefined };

function toQuery(sp: SearchParams): VehicleQuery {
  const pick = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };
  return {
    search: pick('search'),
    brand: pick('brand'),
    year: pick('year'),
    minPrice: pick('minPrice'),
    maxPrice: pick('maxPrice'),
    sort: pick('sort'),
    page: pick('page'),
  };
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = toQuery(await searchParams);
  // Default ordering: cheapest first.
  if (!query.sort) query.sort = 'price_asc';
  // Public site never shows sold vehicles — always restrict to available.
  // Show up to 50 cars per page, then paginate to the next page.
  const [{ items, pagination }, settings, cats] = await Promise.all([
    getVehiclesSafe({ ...query, status: 'available', limit: '50' }),
    getSettingsSafe(),
    getCategoriesSafe(),
  ]);
  const loan = settings.loan ?? DEFAULT_LOAN_CONFIG;
  const downPercent = loan.minDownPercent ?? 30;

  return (
    <div className="container-page py-8 sm:py-10">
      <p className="eyebrow">{t.home.catalog}</p>
      <h1 className="section-title mt-1.5">{t.vehicles.title}</h1>

      {cats.categories.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            Маркаар сонгох
          </p>
          <Suspense fallback={null}>
            <CategoryBrowser categories={cats.categories} />
          </Suspense>
        </div>
      )}

      <div className="mt-4 border-t border-gray-200 pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">
          Эрэмбэлэх
        </p>
        <Suspense fallback={null}>
          <SearchFilters />
        </Suspense>
      </div>

      <p className="mt-6 text-sm font-semibold text-gray-600">
        {t.vehicles.resultsCount(pagination.total)}
      </p>

      {items.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((vehicle) => (
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              downPercent={downPercent}
              loan={loan}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center ring-1 ring-gray-200">
          <p className="text-gray-500">{t.vehicles.noResults}</p>
          <Link href="/vehicles" className="btn-outline mt-5">
            {t.vehicles.filters.reset}
          </Link>
        </div>
      )}

      <Pagination page={pagination.page} pages={pagination.pages} query={query} />
    </div>
  );
}
