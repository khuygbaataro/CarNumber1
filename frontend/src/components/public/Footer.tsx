import Link from 'next/link';
import { Settings } from '@/types';
import { telHref, messengerHref } from '@/lib/contact';
import { t } from '@/lib/labels';

export default function Footer({ settings }: { settings: Settings }) {
  const { contact, social } = settings;
  const year = new Date().getFullYear();
  const tel = telHref(contact?.phone);
  const messenger = messengerHref(social?.facebook);

  const socialLinks = [
    { href: social.facebook, label: 'Facebook' },
    { href: social.instagram, label: 'Instagram' },
    { href: social.youtube, label: 'YouTube' },
  ].filter((s) => s.href);

  return (
    // pb-action-bar leaves room for the fixed mobile Call/Messenger bar.
    <footer className="mt-20 bg-gray-900 pb-action-bar text-gray-300">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <h3 className="text-lg font-bold tracking-tight text-white">
            {settings.companyName}
          </h3>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
            {t.home.heroSubtitle}
          </p>

          {socialLinks.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-white/20 hover:text-white"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
            {t.footer.quickLinks}
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link href="/" className="transition hover:text-white">
                {t.nav.home}
              </Link>
            </li>
            <li>
              <Link href="/vehicles" className="transition hover:text-white">
                {t.nav.vehicles}
              </Link>
            </li>
            <li>
              <Link href="/#contact" className="transition hover:text-white">
                {t.nav.contact}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition hover:text-white">
                Нууцлалын бодлого
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
            {t.contact.title}
          </h4>
          <ul className="mt-4 space-y-3 text-sm">
            {contact.phone && (
              <li>
                <a href={tel ?? undefined} className="font-semibold text-white hover:underline">
                  {contact.phone}
                </a>
              </li>
            )}
            {messenger && (
              <li>
                <a
                  href={messenger}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  {t.cta.messengerLong}
                </a>
              </li>
            )}
            {contact.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="break-all transition hover:text-white">
                  {contact.email}
                </a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
            {t.home.workingHours}
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-gray-400">
            {settings.workingHours && <li className="text-gray-300">{settings.workingHours}</li>}
            {contact.address && <li>{contact.address}</li>}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <p className="container-page text-center text-xs text-gray-500">
          © {year} {settings.companyName}. {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
