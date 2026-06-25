import { Settings } from '@/types';
import { t } from '@/lib/labels';

export default function ContactSection({ settings }: { settings: Settings }) {
  const { contact, social } = settings;
  const mapHref = contact.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`
    : '';

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
      </div>
    </section>
  );
}
