import Image from 'next/image';
import Link from 'next/link';
import { Settings } from '@/types';
import { telHref, primaryPhone } from '@/lib/contact';
import { t } from '@/lib/labels';

export default function Banner({
  settings,
  vehicleCount = 0,
}: {
  settings: Settings;
  /** Live number of cars in stock — a real figure, never hard-coded. */
  vehicleCount?: number;
}) {
  const tel = telHref(settings.contact?.phone);

  return (
    <section className="relative flex min-h-[440px] w-full items-end overflow-hidden sm:min-h-[520px]">
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
        <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-brand-900 to-gray-950" />
      )}

      {/* Gradient rather than a flat wash — keeps the photo readable while
          the text stays high-contrast at the bottom. */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/55 to-gray-950/20" />

      <div className="container-page relative w-full pb-12 pt-24 sm:pb-16">
        <div className="max-w-2xl">
          {vehicleCount > 0 && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {t.home.inventoryCount(vehicleCount)}
            </span>
          )}

          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-sm sm:text-5xl lg:text-6xl">
            {settings.companyName}
          </h1>

          <p className="mt-3 max-w-xl text-base leading-relaxed text-gray-200 sm:text-lg">
            {settings.about ? firstSentence(settings.about) : t.home.heroSubtitle}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/vehicles"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-bold text-brand shadow-lg transition hover:bg-gray-100 active:scale-[0.98]"
            >
              {t.cta.browse}
              <span aria-hidden>→</span>
            </Link>

            {tel && (
              <a
                href={tel}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white/10 px-7 text-base font-bold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20 active:scale-[0.98]"
              >
                <PhoneIcon />
                {primaryPhone(settings.contact.phone)}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// The About text is admin-written prose; the hero only needs its opening line.
function firstSentence(text: string): string {
  const line = text.trim().split(/\n/)[0];
  const stop = line.search(/[.!?]\s|[.!?]$/);
  const sentence = stop === -1 ? line : line.slice(0, stop + 1);
  return sentence.length > 160 ? `${sentence.slice(0, 157)}…` : sentence;
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.28-.28.7-.37 1.05-.25 1.15.38 2.39.59 3.65.59.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.85 21 3 13.15 3 3.9c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.27.2 2.5.59 3.65.12.35.03.77-.25 1.05l-2.24 2.2z" />
    </svg>
  );
}
