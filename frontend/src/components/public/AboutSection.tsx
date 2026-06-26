import { Settings } from '@/types';
import { t } from '@/lib/labels';

export default function AboutSection({ settings }: { settings: Settings }) {
  if (!settings.about && !settings.workingHours) return null;

  return (
    <section className="bg-white py-12">
      <div className="container-page max-w-3xl text-center">
        {settings.about && (
          <>
            <h2 className="text-2xl font-bold text-gray-900">{t.home.about}</h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-gray-600">
              {settings.about}
            </p>
          </>
        )}
        {settings.workingHours && (
          <p className="mt-6 inline-block rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
            🕒 {t.home.workingHours}: {settings.workingHours}
          </p>
        )}
      </div>
    </section>
  );
}
