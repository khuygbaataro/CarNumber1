import Link from 'next/link';
import { Settings } from '@/types';
import { t } from '@/lib/labels';

export default function Footer({ settings }: { settings: Settings }) {
  const { contact, social } = settings;
  const year = new Date().getFullYear();

  const socialLinks = [
    { href: social.facebook, label: 'Facebook' },
    { href: social.instagram, label: 'Instagram' },
    { href: social.youtube, label: 'YouTube' },
  ].filter((s) => s.href);

  return (
    <footer className="mt-16 bg-gray-900 text-gray-300">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-3">
        <div>
          <h3 className="text-lg font-bold text-white">{settings.companyName}</h3>
          <p className="mt-2 text-sm text-gray-400">{t.home.heroSubtitle}</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t.footer.quickLinks}
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white">{t.nav.home}</Link>
            </li>
            <li>
              <Link href="/vehicles" className="hover:text-white">{t.nav.vehicles}</Link>
            </li>
            <li>
              <Link href="/#contact" className="hover:text-white">{t.nav.contact}</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
            {t.contact.title}
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            {contact.phone && (
              <li>
                <a href={`tel:${contact.phone}`} className="hover:text-white">
                  {contact.phone}
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="hover:text-white">
                  {contact.email}
                </a>
              </li>
            )}
            {contact.address && <li className="text-gray-400">{contact.address}</li>}
          </ul>

          {socialLinks.length > 0 && (
            <div className="mt-4 flex gap-4 text-sm">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-800 py-4">
        <p className="container-page text-center text-xs text-gray-500">
          © {year} {settings.companyName}. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
