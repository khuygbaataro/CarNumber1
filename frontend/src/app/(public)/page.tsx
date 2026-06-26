import Link from 'next/link';
import Banner from '@/components/public/Banner';
import VehicleCard from '@/components/public/VehicleCard';
import ContactSection from '@/components/public/ContactSection';
import { getSettingsSafe, getVehiclesSafe } from '@/lib/api';
import { t } from '@/lib/labels';

export default async function HomePage() {
  const [settings, data] = await Promise.all([
    getSettingsSafe(),
    getVehiclesSafe({ status: 'available', sort: 'newest', limit: '50' }),
  ]);
  const vehicles = data.items;

  return (
    <>
      <Banner settings={settings} />

      <section className="container-page py-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">{t.home.forSale}</h2>
          <Link href="/vehicles" className="text-sm font-medium text-brand hover:underline">
            {t.common.viewAll}
          </Link>
        </div>

        {vehicles.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle._id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-gray-500">{t.home.noVehicles}</p>
        )}
      </section>

      <ContactSection settings={settings} />
    </>
  );
}
