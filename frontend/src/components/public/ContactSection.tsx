import { Settings } from '@/types';
import { telHref, messengerHref, primaryPhone } from '@/lib/contact';
import { t } from '@/lib/labels';
import LeadForm from './LeadForm';

// Fallback location (VICTORY CAR) used when no map link is set in admin.
const DEFAULT_MAP_URL = 'https://maps.app.goo.gl/vRGZ3AAqY6DtDLNH8';
const DEFAULT_MAP_COORDS = { lat: '47.9194896', lng: '106.8303357' };

// Google-ийн place хуудасны HTML-ээс координат олно. Google серверийн бүснээс
// хамаарч Монголоос ГАДУУРХ (жишээ нь default) координат орж болзошгүй тул
// ЗӨВХӨН Монголын хүрээн доторх (өргөрөг 41–52, уртраг 87–120) утгыг авна.
const inMongolia = (lat: number, lng: number) =>
  lat >= 41 && lat <= 52 && lng >= 87 && lng <= 120;

function coordsFromHtml(html: string): { lat: string; lng: string } | null {
  // !3d<өргөрөг>!4d<уртраг> — байршлын ЯГ pin (хамгийн зөв)
  for (const m of html.matchAll(/3d(-?\d{1,3}\.\d{3,}).{0,4}4d(-?\d{1,3}\.\d{3,})/g)) {
    if (inMongolia(parseFloat(m[1]), parseFloat(m[2]))) return { lat: m[1], lng: m[2] };
  }
  // staticmap center=LAT,LNG (таслал ихэвчлэн %2C) — харагдацын төв
  for (const m of html.matchAll(
    /[?&]center=(-?\d{1,3}\.\d{3,})(?:,|%2C)(-?\d{1,3}\.\d{3,})/gi
  )) {
    if (inMongolia(parseFloat(m[1]), parseFloat(m[2]))) return { lat: m[1], lng: m[2] };
  }
  // !2d<уртраг>!3d<өргөрөг>
  for (const m of html.matchAll(/2d(-?\d{1,3}\.\d{3,}).{0,6}3d(-?\d{1,3}\.\d{3,})/g)) {
    if (inMongolia(parseFloat(m[2]), parseFloat(m[1]))) return { lat: m[2], lng: m[1] };
  }
  return null;
}

// Pull lat/lng out of a Google Maps URL so we can build an embeddable map.
function parseCoords(url: string): { lat: string; lng: string } | null {
  const m =
    url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m ? { lat: m[1], lng: m[2] } : null;
}

// Admin ихэвчлэн богино линк (maps.app.goo.gl) тавьдаг — тэнд координат
// байдаггүй. Богино линкийг задалж (redirect дагаад), координат эсвэл
// байршлын нэр/Plus Code-оор embed хийх боломжтой URL болгоно.
async function resolveMapEmbed(mapUrl: string): Promise<string> {
  const embed = (lat: string, lng: string) =>
    `https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`;

  let full = mapUrl || '';
  let html = '';
  const isShort = /(maps\.app\.goo\.gl|goo\.gl\/maps)/.test(full);
  if (isShort || /google\.[^/]+\/maps/.test(full)) {
    try {
      const res = await fetch(full, {
        redirect: 'follow',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en',
        },
        next: { revalidate: 86400 },
      });
      if (res?.url) full = res.url;
      html = await res.text();
    } catch {
      /* доор fallback */
    }
  }

  // 1) URL-д координат байвал (Монголын хүрээнд байвал л) шууд
  const c = parseCoords(full);
  if (c && inMongolia(parseFloat(c.lat), parseFloat(c.lng))) return embed(c.lat, c.lng);

  // 2) place хуудасны HTML-ээс координат гаргана
  const h = coordsFromHtml(html);
  if (h) return embed(h.lat, h.lng);

  // 3) fallback — VICTORY CAR-ийн координат
  return embed(DEFAULT_MAP_COORDS.lat, DEFAULT_MAP_COORDS.lng);
}

export default async function ContactSection({ settings }: { settings: Settings }) {
  const { contact, social } = settings;
  const mapHref = contact.mapUrl || DEFAULT_MAP_URL;
  const mapEmbedSrc = await resolveMapEmbed(mapHref);

  const tel = telHref(contact?.phone);
  const messenger = messengerHref(social?.facebook);

  const socialLinks = [
    { href: social.facebook, label: 'Facebook' },
    { href: social.instagram, label: 'Instagram' },
    { href: social.youtube, label: 'YouTube' },
  ].filter((s) => s.href);

  return (
    <section id="contact" className="scroll-mt-20 bg-white py-14 sm:py-20">
      <div className="container-page">
        <div className="text-center">
          <p className="eyebrow">{t.contact.followUs}</p>
          <h2 className="section-title mt-1.5">{t.contact.title}</h2>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tel && (
            <a href={tel} className="group rounded-2xl bg-gray-50 p-5 text-center ring-1 ring-gray-200 transition hover:bg-white hover:shadow-card hover:ring-brand">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <PhoneIcon />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t.contact.phone}
              </p>
              <p className="mt-1 font-bold text-gray-900">{primaryPhone(contact.phone)}</p>
            </a>
          )}

          {messenger && (
            <a
              href={messenger}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl bg-gray-50 p-5 text-center ring-1 ring-gray-200 transition hover:bg-white hover:shadow-card hover:ring-brand"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-[#0084FF]">
                <ChatIcon />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t.cta.messenger}
              </p>
              <p className="mt-1 font-bold text-gray-900">{t.cta.messengerLong}</p>
            </a>
          )}

          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="group rounded-2xl bg-gray-50 p-5 text-center ring-1 ring-gray-200 transition hover:bg-white hover:shadow-card hover:ring-brand"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gray-200 text-gray-700">
                <MailIcon />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t.contact.email}
              </p>
              <p className="mt-1 break-all font-bold text-gray-900">{contact.email}</p>
            </a>
          )}

          {contact.address && (
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl bg-gray-50 p-5 text-center ring-1 ring-gray-200 transition hover:bg-white hover:shadow-card hover:ring-brand"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand">
                <PinIcon />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t.contact.address}
              </p>
              <p className="mt-1 font-bold text-gray-900">{contact.address}</p>
              <p className="mt-1 text-xs font-medium text-brand">{t.contact.viewMap}</p>
            </a>
          )}
        </div>

        {socialLinks.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="chip"
              >
                {s.label}
              </a>
            ))}
          </div>
        )}

        <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl shadow-card ring-1 ring-gray-200">
          <iframe
            title="map"
            src={mapEmbedSrc}
            className="h-72 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <p className="mt-3 text-center">
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-brand hover:underline"
          >
            {t.contact.viewMap}
          </a>
        </p>

        <div className="mx-auto mt-12 max-w-2xl">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.28-.28.7-.37 1.05-.25 1.15.38 2.39.59 3.65.59.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.85 21 3 13.15 3 3.9c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.27.2 2.5.59 3.65.12.35.03.77-.25 1.05l-2.24 2.2z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.4c-5.3 0-9.6 3.9-9.6 8.7 0 2.6 1.26 4.94 3.25 6.52v3.34a.6.6 0 0 0 .9.52l3.06-1.74c.76.16 1.56.25 2.39.25 5.3 0 9.6-3.9 9.6-8.7S17.3 2.4 12 2.4z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.5 5.5h17A1.5 1.5 0 0 1 22 7v10a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 17V7a1.5 1.5 0 0 1 1.5-1.5zm.9 2L12 12.35 19.6 7.5H4.4z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.5A6.5 6.5 0 0 0 5.5 9c0 4.6 5.6 11.3 5.84 11.58a.86.86 0 0 0 1.32 0C12.9 20.3 18.5 13.6 18.5 9A6.5 6.5 0 0 0 12 2.5zm0 9a2.5 2.5 0 1 1 2.5-2.5A2.5 2.5 0 0 1 12 11.5z" />
    </svg>
  );
}
