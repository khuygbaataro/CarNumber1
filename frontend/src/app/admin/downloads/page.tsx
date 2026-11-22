import { t } from '@/lib/labels';

/**
 * Where staff pick up the customs helper — a Windows program that lives
 * outside this site.
 *
 * The installer is a plain static file under /public, so the download is an
 * ordinary link: nothing to upload, nothing left running, and no way for it
 * to fail while the rest of the admin area works.
 */

const FILE = 'GaaliSetup.exe';

/**
 * Both are facts about the file sitting in public/downloads, so both change
 * when it is replaced. The version is the AppVer define at the top of the
 * installer's own installer.iss.
 *
 * Read off the file rather than measured here on purpose: on Vercel the
 * /public folder is served by the CDN and is not on the renderer's disk, so
 * a stat() at request time would quietly come back empty in production.
 */
const VERSION = '1.0.0';
const SIZE = '14.3 МБ';

export default function AdminDownloadsPage() {
  const L = t.admin.downloads;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">{L.title}</h1>
      <p className="mt-1 text-sm text-gray-500">{L.subtitle}</p>

      <div className="mt-6 space-y-4">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900">{L.gaaliName}</h2>
              <p className="mt-1.5 text-sm text-gray-600">{L.gaaliWhat}</p>
              <p className="mt-3 text-xs text-gray-500">
                Windows · {L.version} {VERSION} · {SIZE}
              </p>
            </div>

            {/* `download` rather than a bare link, so the browser saves the
                file instead of trying to make sense of it. */}
            <a href={`/downloads/${FILE}`} download className="btn-primary shrink-0">
              ↓ {L.download}
            </a>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="font-semibold text-gray-900">{L.installTitle}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-600">
            {L.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl bg-brand-tint p-5 ring-1 ring-brand/20">
          <h2 className="font-semibold text-brand-800">{L.warnTitle}</h2>
          <p className="mt-2 text-sm text-gray-700">{L.warnBody}</p>
        </div>
      </div>
    </div>
  );
}
