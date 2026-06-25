'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';
import { t } from '@/lib/labels';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === '/admin/login';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    if (!getToken()) {
      router.replace('/admin/login');
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-500">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
      </div>
    );
  }

  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
