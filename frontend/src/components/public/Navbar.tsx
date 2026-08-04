'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Settings } from '@/types';
import { telHref, messengerHref, primaryPhone } from '@/lib/contact';
import { t } from '@/lib/labels';

export default function Navbar({ settings }: { settings: Settings }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/', label: t.nav.home },
    { href: '/vehicles', label: t.nav.vehicles },
    { href: '/#contact', label: t.nav.contact },
  ];

  // Anchor links (/#contact) never match a pathname, so they stay inactive.
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : !href.includes('#') && pathname.startsWith(href);

  const tel = telHref(settings.contact?.phone);
  const messenger = messengerHref(settings.social?.facebook);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          onClick={() => setOpen(false)}
        >
          {settings.logo ? (
            <Image
              src={settings.logo}
              alt={settings.companyName}
              width={160}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          ) : (
            <span className="text-lg font-bold tracking-tight text-brand">
              {settings.companyName}
            </span>
          )}
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(link.href)
                  ? 'bg-brand-50 text-brand'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop contact actions */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {messenger && (
            <a
              href={messenger}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.cta.messengerLong}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#0084FF] transition hover:bg-blue-50"
            >
              <ChatIcon />
            </a>
          )}
          {tel && (
            <a href={tel} className="btn-primary px-4">
              <PhoneIcon />
              <span>{primaryPhone(settings.contact.phone)}</span>
            </a>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="animate-fade-up border-t border-gray-200 bg-white md:hidden">
          <div className="container-page flex flex-col py-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-3.5 text-sm font-semibold transition ${
                  isActive(link.href)
                    ? 'bg-brand-50 text-brand'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.28-.28.7-.37 1.05-.25 1.15.38 2.39.59 3.65.59.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.85 21 3 13.15 3 3.9c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.27.2 2.5.59 3.65.12.35.03.77-.25 1.05l-2.24 2.2z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.4c-5.3 0-9.6 3.9-9.6 8.7 0 2.6 1.26 4.94 3.25 6.52v3.34a.6.6 0 0 0 .9.52l3.06-1.74c.76.16 1.56.25 2.39.25 5.3 0 9.6-3.9 9.6-8.7S17.3 2.4 12 2.4z" />
    </svg>
  );
}
