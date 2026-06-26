'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';
import { t } from '@/lib/labels';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: '/admin', label: t.admin.nav.dashboard },
    { href: '/admin/vehicles', label: t.admin.nav.vehicles },
    { href: '/admin/leads', label: t.admin.nav.leads },
    { href: '/admin/settings', label: t.admin.nav.settings },
    { href: '/admin/help', label: t.admin.nav.help },
  ];

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const logout = () => {
    clearToken();
    router.replace('/admin/login');
  };

  return (
    <header className="border-b border-gray-200 bg-white">
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
