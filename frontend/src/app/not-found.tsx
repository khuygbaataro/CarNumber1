import Link from 'next/link';
import { t } from '@/lib/labels';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <p className="mt-3 text-gray-600">Хуудас олдсонгүй</p>
      <Link href="/" className="btn-primary mt-6">
        {t.nav.home}
      </Link>
    </div>
  );
}
