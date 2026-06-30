import { Suspense } from 'react';
import SearchFilters from '@/components/public/SearchFilters';
import VehicleCard from '@/components/public/VehicleCard';
import Pagination from '@/components/public/Pagination';
import { getVehiclesSafe, getSettingsSafe } from '@/lib/api';
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
  const [{ items, pagination }, settings] = await Promise.all([
    getVehiclesSafe({ ...query, status: 'available', limit: '50' }),
    getSettingsSafe(),
  ]);
  const downPercent = settings.loan?.minDownPercent ?? 30;

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
        {t.vehicles.title}
      </h1>

      <div className="mt-6">
        <Suspense fallback={null}>
          <SearchFilters />
        </Suspense>
      </div>

      <p className="mt-6 text-sm text-gray-500">
        {t.vehicles.resultsCount(pagination.total)}
      </p>

      {items.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((vehicle) => (
            <VehicleCard key={vehicle._id} vehicle={vehicle} downPercent={downPercent} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-center text-gray-500">{t.vehicles.noResults}</p>
      )}

      <Pagination page={pagination.page} pages={pagination.pages} query={query} />
    </div>
  );
}
