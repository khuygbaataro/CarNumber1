import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getSettingsSafe } from '@/lib/api';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettingsSafe();
  return {
    title: {
      default: settings.companyName,
      template: `%s | ${settings.companyName}`,
    },
    description: 'Чанартай хэрэглээний машины каталог',
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
