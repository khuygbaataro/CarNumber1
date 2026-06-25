import Image from 'next/image';
import Link from 'next/link';
import { Settings } from '@/types';
import { t } from '@/lib/labels';

export default function Banner({ settings }: { settings: Settings }) {
  return (
    <section className="relative h-[60vh] min-h-[360px] w-full overflow-hidden">
      {settings.banner ? (
        <Image
          src={settings.banner}
          alt={settings.companyName}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-brand to-gray-900" />
      )}

      <div className="absolute inset-0 bg-black/45" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-white">
        <h1 className="text-3xl font-bold drop-shadow sm:text-5xl">
          {settings.companyName}
        </h1>
        <p className="mt-3 max-w-xl text-base text-gray-100 sm:text-lg">
          {t.home.heroSubtitle}
        </p>
        <Link
          href="/vehicles"
          className="mt-6 rounded-lg bg-white px-6 py-3 font-semibold text-brand shadow transition hover:bg-gray-100"
        >
          {t.home.browseVehicles}
        </Link>
      </div>
    </section>
  );
}
