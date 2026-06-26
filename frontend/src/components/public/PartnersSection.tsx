import Image from 'next/image';
import { t } from '@/lib/labels';

export default function PartnersSection({ partners }: { partners: string[] }) {
  if (!partners || partners.length === 0) return null;

  return (
    <section className="bg-white py-10">
      <div className="container-page">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          {t.home.partners}
        </h2>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
          {partners.map((url, i) => (
            <div key={url + i} className="relative h-12 w-28 grayscale transition hover:grayscale-0">
              <Image
                src={url}
                alt={`partner-${i + 1}`}
                fill
                sizes="112px"
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
