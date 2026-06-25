import { getSettingsSafe } from '@/lib/api';
import Navbar from '@/components/public/Navbar';
import Footer from '@/components/public/Footer';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettingsSafe();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
