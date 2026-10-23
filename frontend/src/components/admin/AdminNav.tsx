'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';
import { t } from '@/lib/labels';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  // The four below are each used now and then rather than every day, and
  // spelling them all out pushed the bar onto a second line. They sit behind
  // one item; the three that are opened constantly stay in reach.
  const links = [
    { href: '/admin', label: t.admin.nav.dashboard },
    { href: '/admin/vehicles', label: t.admin.nav.vehicles },
    { href: '/admin/settings', label: t.admin.nav.settings },
    { href: '/admin/help', label: t.admin.nav.help },
  ];

  const tools = [
    { href: '/admin/checklist', label: t.admin.nav.checklist },
    { href: '/admin/window-cards', label: t.admin.nav.windowCards },
    { href: '/admin/group-marketing', label: t.admin.nav.groupMarketing },
    { href: '/admin/leads', label: t.admin.nav.leads },
  ];

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const inTools = tools.some((link) => isActive(link.href));

  // A menu that stays open after you click past it is a menu in the way.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (menu.current && !menu.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const logout = () => {
    clearToken();
    router.replace('/admin/login');
  };

  return (
    <header className="border-b border-gray-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="text-lg font-bold text-brand">Админ</span>

        <nav className="flex flex-1 flex-wrap gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                isActive(link.href)
                  ? 'bg-brand text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="relative" ref={menu}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-haspopup="menu"
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                inTools ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t.admin.nav.tools}
              <span aria-hidden className={`text-[10px] transition ${open ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute left-0 z-30 mt-1 w-52 overflow-hidden rounded-lg bg-white py-1 shadow-lg ring-1 ring-gray-200"
              >
                {tools.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className={`block px-4 py-2 text-sm transition ${
                      isActive(link.href)
                        ? 'bg-brand-50 font-semibold text-brand'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <Link
          href="/"
          target="_blank"
          className="text-sm font-medium text-gray-500 hover:text-brand"
        >
          {t.admin.nav.viewSite} ↗
        </Link>
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {t.admin.nav.logout}
        </button>
      </div>
    </header>
  );
}
