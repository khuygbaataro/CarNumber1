import Image from 'next/image';
import { t } from '@/lib/labels';

export default function PartnersSection({ partners }: { partners: string[] }) {
  if (!partners || partners.length === 0) return null;

  return (
    <section className="border-y border-gray-200 bg-white py-12">
      <div className="container-page">
        <h2 className="text-center text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
          {t.home.partners}
        </h2>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {partners.map((url, i) => (
            <div
              key={url + i}
              className="relative h-12 w-28 opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0"
            >
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
