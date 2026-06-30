import { Settings } from '@/types';
import { t } from '@/lib/labels';
import LeadForm from './LeadForm';

// Fallback location (VICTORY CAR) used when no map link is set in admin.
const DEFAULT_MAP_URL = 'https://maps.app.goo.gl/HUBdEAkvM99RbFxn7';
const DEFAULT_MAP_COORDS = { lat: '47.9387587', lng: '106.8651526' };

// Pull lat/lng out of a Google Maps URL so we can build an embeddable map.
// Short links (maps.app.goo.gl) carry no coords → caller falls back.
function parseCoords(url: string): { lat: string; lng: string } | null {
  const m =
    url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) ||
    url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
    url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  return m ? { lat: m[1], lng: m[2] } : null;
}

export default function ContactSection({ settings }: { settings: Settings }) {
  const { contact, social } = settings;
  const mapHref = contact.mapUrl || DEFAULT_MAP_URL;
  const coords = parseCoords(contact.mapUrl) || DEFAULT_MAP_COORDS;
  const mapEmbedSrc = `https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=16&output=embed`;

  const socialLinks = [
    { href: social.facebook, label: 'Facebook' },
    { href: social.instagram, label: 'Instagram' },
    { href: social.youtube, label: 'YouTube' },
  ].filter((s) => s.href);

  return (
    <section id="contact" className="bg-white py-14">
      <div className="container-page">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          {t.contact.title}
        </h2>

        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="rounded-xl bg-gray-50 p-5 text-center ring-1 ring-gray-200 transition hover:ring-brand"
            >
              <p className="text-sm font-medium text-gray-500">{t.contact.phone}</p>
              <p className="mt-1 font-semibold text-gray-900">{contact.phone}</p>
            </a>
          )}

          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="rounded-xl bg-gray-50 p-5 text-center ring-1 ring-gray-200 transition hover:ring-brand"
            >
              <p className="text-sm font-medium text-gray-500">{t.contact.email}</p>
              <p className="mt-1 break-all font-semibold text-gray-900">{contact.email}</p>
            </a>
          )}

          {contact.address && (
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-gray-50 p-5 text-center ring-1 ring-gray-200 transition hover:ring-brand"
            >
              <p className="text-sm font-medium text-gray-500">{t.contact.address}</p>
              <p className="mt-1 font-semibold text-gray-900">{contact.address}</p>
              <p className="mt-1 text-xs text-brand">{t.contact.viewMap}</p>
            </a>
          )}
        </div>

        {socialLinks.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm font-medium text-gray-500">{t.contact.followUs}</p>
            <div className="mt-3 flex justify-center gap-4">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-brand hover:text-brand"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-xl ring-1 ring-gray-200">
          <iframe
            title="map"
            src={mapEmbedSrc}
            className="h-64 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <p className="mt-2 text-center">
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand hover:underline"
          >
            {t.contact.viewMap}
          </a>
        </p>

        <div className="mx-auto mt-10 max-w-2xl">
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
