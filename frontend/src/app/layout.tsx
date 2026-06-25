import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getSettingsSafe } from '@/lib/api';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettingsSafe();
  return (
    <html lang="mn" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <Navbar settings={settings} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
      </body>
    </html>
  );
}
