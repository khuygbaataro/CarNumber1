import { Settings } from '@/types';
import { t } from '@/lib/labels';

export default function AboutSection({ settings }: { settings: Settings }) {
  if (!settings.about && !settings.workingHours) return null;

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container-page max-w-3xl text-center">
        {settings.about && (
          <>
            <p className="eyebrow">{t.home.about}</p>
            <h2 className="section-title mt-1.5">{settings.companyName}</h2>
            <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-gray-600">
              {settings.about}
            </p>
          </>
        )}
        {settings.workingHours && (
          <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand">
            <span aria-hidden>🕒</span>
            {t.home.workingHours}: {settings.workingHours}
          </p>
        )}
      </div>
    </section>
  );
}
