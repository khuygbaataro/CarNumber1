'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Settings, Vehicle } from '@/types';
import { formatNumber, formatYearShort } from '@/lib/format';
import { groupByBrand, splitStockCode } from '@/lib/vehicle';
import { t } from '@/lib/labels';

/** Brand groups, brands A→Z and cars sorted by model then stock number. */
function groupForSheet(vehicles: Vehicle[]) {
  return groupByBrand(vehicles).map((group) => ({
    brand: group.brand,
    items: [...group.items].sort((a, b) => {
      const A = splitStockCode(a.model);
      const B = splitStockCode(b.model);
      return (
        A.name.localeCompare(B.name) ||
        A.code.localeCompare(B.code, undefined, { numeric: true })
      );
    }),
  }));
}

const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
};

export default function ChecklistPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [includeSold, setIncludeSold] = useState(false);
  const [blankRows, setBlankRows] = useState(10);

  useEffect(() => {
    Promise.all([
      adminApi.listVehicles().then((data) => setVehicles(data.items)),
      adminApi
        .getSettings()
        .then(setSettings)
        .catch(() => {
          /* the sheet only uses the company name — a heading is enough */
        }),
    ])
      .catch(() => setError(t.admin.checklist.loadError))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(
    () => groupForSheet(vehicles.filter((v) => includeSold || v.status === 'available')),
    [vehicles, includeSold]
  );
  const shownCount = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <div>
      {/* Controls — screen only. */}
      <div className="print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.admin.checklist.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {t.admin.checklist.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={loading || shownCount === 0}
            className="btn-primary"
          >
            {t.admin.checklist.print}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-6 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={includeSold}
              onChange={(e) => setIncludeSold(e.target.checked)}
              className="h-4 w-4 cursor-pointer accent-brand"
            />
            {t.admin.checklist.includeSold}
          </label>

          <div>
            <label className="label" htmlFor="blank-rows">
              {t.admin.checklist.blankRows}
            </label>
            <input
              id="blank-rows"
              type="number"
              min={0}
              max={40}
              value={blankRows}
              onChange={(e) =>
                setBlankRows(Math.max(0, Math.min(40, Number(e.target.value) || 0)))
              }
              className="input w-28"
            />
          </div>

          <p className="flex-1 text-xs text-gray-400">{t.admin.checklist.printHint}</p>
        </div>

        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      </div>

      {loading ? (
        <p className="mt-6 text-gray-500 print:hidden">{t.common.loading}</p>
      ) : (
        <div className="mt-6 rounded-xl bg-white p-6 text-gray-900 shadow-sm ring-1 ring-gray-200 print:mt-0 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          <header className="border-b-2 border-gray-900 pb-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold">
                {settings?.companyName ? `${settings.companyName} — ` : ''}
                {t.admin.checklist.title}
              </h2>
              <span className="text-xs text-gray-600">
                {t.admin.checklist.printedAt}: {today()}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-gray-700">
              {t.admin.checklist.summary(shownCount, groups.length)}
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
              {t.admin.checklist.intro}
            </p>
          </header>

          {groups.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {t.admin.checklist.empty}
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.brand} className="mt-5">
                <h3 className="break-after-avoid text-sm font-bold uppercase tracking-wide text-gray-900">
                  {group.brand}{' '}
                  <span className="font-normal text-gray-500">
                    ({t.admin.checklist.brandCount(group.items.length)})
                  </span>
                </h3>
                <table className="mt-1.5 w-full table-fixed border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-gray-100 text-left text-[10px] uppercase text-gray-600">
                      <Th className="w-8 text-center">{t.admin.checklist.colCheck}</Th>
                      <Th className="w-16">{t.admin.checklist.colCode}</Th>
                      <Th>{t.admin.checklist.colModel}</Th>
                      <Th className="w-16">{t.admin.checklist.colYear}</Th>
                      <Th className="w-24 text-right">{t.admin.checklist.colPrice}</Th>
                      <Th className="w-12 text-center">{t.admin.checklist.colPhotos}</Th>
                      <Th className="w-[38%]">{t.admin.checklist.colNote}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((v) => {
                      const { code, name } = splitStockCode(v.model);
                      const photos = v.images?.length ?? 0;
                      return (
                        <tr key={v._id} className="break-inside-avoid">
                          <Td className="text-center">
                            <Box />
                          </Td>
                          <Td className="font-bold tabular-nums">{code || '—'}</Td>
                          <Td>
                            {name || v.model}
                            {v.status === 'sold' && (
                              <span className="ml-1.5 rounded bg-gray-200 px-1 text-[9px] font-bold uppercase text-gray-700">
                                {t.admin.checklist.soldTag}
                              </span>
                            )}
                          </Td>
                          <Td className="whitespace-nowrap text-gray-700">
                            {formatYearShort(v.year, v.month)}
                          </Td>
                          <Td className="text-right tabular-nums">
                            {formatNumber(v.price)}
                          </Td>
                          {/* A listing with no photos is exactly what this walk
                              is meant to catch, so it is flagged, not just counted. */}
                          <Td
                            className={`text-center tabular-nums ${
                              photos === 0 ? 'font-bold text-accent' : 'text-gray-700'
                            }`}
                            title={photos === 0 ? t.admin.checklist.noPhotoWarning : undefined}
                          >
                            {photos}
                          </Td>
                          <Td />
                        </tr>
                      );
                    })}
                    {/* One writable line per brand, tinted so it reads as
                        blank on purpose — an extra Toyota found on the lot
                        gets written where its brand already is. */}
                    <tr className="break-inside-avoid bg-gray-50">
                      <Td className="h-7 text-center">
                        <Box />
                      </Td>
                      <Td />
                      <Td />
                      <Td />
                      <Td />
                      <Td />
                      <Td />
                    </tr>
                  </tbody>
                </table>
              </section>
            ))
          )}

          {blankRows > 0 && (
            <section className="mt-8 break-inside-avoid">
              <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                {t.admin.checklist.missingTitle}
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-600">
                {t.admin.checklist.missingHint}
              </p>
              <table className="mt-1.5 w-full table-fixed border-collapse text-[11px]">
                <thead>
                  <tr className="bg-gray-100 text-left text-[10px] uppercase text-gray-600">
                    <Th className="w-[18%]">{t.admin.checklist.colBrand}</Th>
                    <Th>{t.admin.checklist.colModel}</Th>
                    <Th className="w-16">{t.admin.checklist.colCode}</Th>
                    <Th className="w-16">{t.admin.checklist.colYear}</Th>
                    <Th className="w-24 text-right">{t.admin.checklist.colPrice}</Th>
                    <Th className="w-20 text-center">{t.admin.checklist.colPhotoTaken}</Th>
                    <Th className="w-[24%]">{t.admin.checklist.colNote}</Th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: blankRows }).map((_, i) => (
                    <tr key={i} className="break-inside-avoid">
                      <Td className="h-7" />
                      <Td />
                      <Td />
                      <Td />
                      <Td />
                      <Td className="text-center">
                        <Box />
                      </Td>
                      <Td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="mt-8 break-inside-avoid">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">
              {t.admin.checklist.notesTitle}
            </h3>
            <div className="mt-2 space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border-b border-gray-300" />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <th className={`border border-gray-300 px-1.5 py-1 font-semibold ${className}`}>{children}</th>;
}

function Td({
  children,
  className = '',
  colSpan,
  title,
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
  title?: string;
}) {
  return (
    <td colSpan={colSpan} title={title} className={`h-6 border border-gray-300 px-1.5 py-1 align-middle ${className}`}>
      {children}
    </td>
  );
}

/** Empty square to tick with a pen. */
function Box() {
  return <span className="inline-block h-3 w-3 border border-gray-500 align-middle" />;
}
