import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getSettingsSafe } from '@/lib/api';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

// Turn the (possibly wide) logo into a small square favicon via Cloudinary.
function faviconFromLogo(logo: string): string | undefined {
  if (!logo) return undefined;
  return logo.includes('/upload/')
    ? logo.replace('/upload/', '/upload/w_64,h_64,c_fit/')
    : logo;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsSafe();
  const favicon = faviconFromLogo(settings.logo);
  return {
    title: {
      default: settings.companyName,
      template: `%s | ${settings.companyName}`,
    },
    description: 'Чанартай хэрэглээний машины каталог',
    icons: favicon ? { icon: favicon, shortcut: favicon, apple: favicon } : undefined,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
