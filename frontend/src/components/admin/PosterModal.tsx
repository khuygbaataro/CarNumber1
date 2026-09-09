'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { Settings, Vehicle } from '@/types';
import { t } from '@/lib/labels';
import { DEFAULT_LOAN_CONFIG } from '@/lib/loan';
import { formatMileage, formatPrice } from '@/lib/format';
import { primaryPhone } from '@/lib/contact';
import {
  POSTER_ADDRESS,
  posterBranding,
  posterFigures,
  posterFileName,
  posterPhotoUrl,
  posterWebsite,
  posterYear,
} from '@/lib/poster';
import { POSTER_H, POSTER_SCALE, POSTER_W, drawPoster } from '@/lib/posterCanvas';
import { POSTER_FONT_STACK, ensurePosterFont, posterFont } from '@/lib/posterFont';

// Settings barely change and the modal is opened over and over while the
// admin works through the list, so the fetch is shared across openings.
let settingsCache: Settings | null = null;

// Contact lines the admin retyped for a poster. Kept for as long as the
// panel stays open so a correction only has to be made once for a whole
// batch, but never written back — the lasting fix is Тохиргоо.
const contactOverrides: { phone?: string; address?: string; website?: string } = {};

/**
 * Loads an image ready for canvas export. `crossOrigin` is what keeps the
 * canvas exportable — without it a remote photo taints it and toBlob throws.
 * Cloudinary serves CORS headers; if a URL does not, the load simply fails
 * and the poster comes out without a photo rather than un-downloadable.
 */
function loadImage(url: string, fallbackUrl?: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (fallbackUrl && fallbackUrl !== url) {
        loadImage(fallbackUrl).then(resolve);
        return;
      }
      resolve(null);
    };
    img.src = url;
  });
}

export default function PosterModal({
  vehicle,
  onClose,
}: {
  vehicle: Vehicle;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [settings, setSettings] = useState<Settings | null>(settingsCache);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [fontReady, setFontReady] = useState(false);
  const [phone, setPhone] = useState(contactOverrides.phone ?? '');
  const [address, setAddress] = useState(contactOverrides.address ?? POSTER_ADDRESS);
  const [website, setWebsite] = useState(
    () => contactOverrides.website ?? posterWebsite()
  );
  const [term, setTerm] = useState<number | null>(null);
  const [downPercent, setDownPercent] = useState<number | null>(null);
  const [error, setError] = useState('');

  const photos = vehicle.images ?? [];
  const photoSrc = photos[photoIndex] || '';
  const loan = settings?.loan ?? DEFAULT_LOAN_CONFIG;
  const terms = loan.termOptions?.length ? loan.termOptions : DEFAULT_LOAN_CONFIG.termOptions;
  const figures = posterFigures(vehicle, loan, {
    term: term ?? undefined,
    downPercent: downPercent ?? undefined,
  });
  const branding = posterBranding(settings);

  // Esc closes; the page behind must not scroll while the modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  useEffect(() => {
    ensurePosterFont().then(() => setFontReady(true));
  }, []);

  // Phone comes from settings once they arrive, unless the admin already
  // retyped it for an earlier poster in this sitting. (The address does
  // not — the poster has its own line, see POSTER_ADDRESS.)
  useEffect(() => {
    if (!settings || contactOverrides.phone !== undefined) return;
    setPhone(primaryPhone(posterBranding(settings).phone));
  }, [settings]);

  const editContact =
    (key: 'phone' | 'address' | 'website', set: (v: string) => void) => (value: string) => {
      contactOverrides[key] = value;
      set(value);
    };

  useEffect(() => {
    if (settingsCache) return;
    let alive = true;
    adminApi
      .getSettings()
      .then((data) => {
        settingsCache = data;
        if (alive) setSettings(data);
      })
      .catch(() => {
        /* poster still renders with the defaults */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Vehicle photo — asked for at the resolution it will be drawn at.
  useEffect(() => {
    if (!photoSrc) {
      setPhoto(null);
      setPhotoFailed(false);
      return;
    }
    let alive = true;
    loadImage(posterPhotoUrl(photoSrc, POSTER_W * POSTER_SCALE), photoSrc).then((img) => {
      if (!alive) return;
      setPhoto(img);
      setPhotoFailed(!img);
    });
    return () => {
      alive = false;
    };
  }, [photoSrc]);

  useEffect(() => {
    if (!branding.logo) {
      setLogo(null);
      return;
    }
    let alive = true;
    loadImage(branding.logo).then((img) => {
      if (alive) setLogo(img);
    });
    return () => {
      alive = false;
    };
  }, [branding.logo]);

  // Repaint whenever anything the poster shows changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !fontReady) return;
    drawPoster(canvas, {
      title: `${vehicle.brand} ${vehicle.model}`,
      yearLabel: posterYear(vehicle.year, vehicle.month),
      mileageLabel: vehicle.mileage ? formatMileage(vehicle.mileage) : '',
      priceLabel: formatPrice(figures.price),
      downLabel: formatPrice(figures.downAmount),
      monthlyLabel: formatPrice(figures.monthly),
      termLabel: `${figures.term} ${t.common.months}`,
      termNote: t.admin.poster.termNote(figures.term),
      phone: phone.trim(),
      website: website.trim().toUpperCase(),
      address: address.trim(),
      badge: t.admin.poster.badge,
      companyName: branding.companyName,
      photo,
      logo,
      fontStack: POSTER_FONT_STACK,
    });
  }, [
    fontReady,
    photo,
    logo,
    phone,
    address,
    website,
    vehicle.brand,
    vehicle.model,
    vehicle.year,
    vehicle.month,
    vehicle.mileage,
    figures.price,
    figures.downAmount,
    figures.monthly,
    figures.term,
    branding.companyName,
  ]);

  const download = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setError('');
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          setError(t.admin.poster.error);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = posterFileName(vehicle);
        link.click();
        // Give the browser a tick to start the download before revoking.
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, 'image/png');
    } catch {
      setError(t.admin.poster.error);
    }
  }, [vehicle]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-gray-900/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Forces the webfont to load even before the canvas asks for it. */}
      <span aria-hidden className={`${posterFont.className} absolute opacity-0`}>
        ҮНЭ
      </span>

      <div
        className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t.admin.poster.title}</h2>
            <p className="mt-0.5 text-xs text-gray-500">{t.admin.poster.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label={t.admin.poster.close}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,300px)_1fr]">
          {/* Preview — the very canvas that gets exported, just scaled down. */}
          <div className="mx-auto w-full max-w-[300px]">
            <canvas
              ref={canvasRef}
              width={POSTER_W * POSTER_SCALE}
              height={POSTER_H * POSTER_SCALE}
              className="block w-full rounded-xl bg-black shadow-md ring-1 ring-gray-200"
            />
            <p className="mt-2 text-center text-[11px] text-gray-400">
              {POSTER_W * POSTER_SCALE} × {POSTER_H * POSTER_SCALE} px
            </p>
          </div>

          <div className="space-y-4">
            {photos.length > 1 && (
              <div>
                <span className="label">{t.admin.poster.photo}</span>
                <div className="flex flex-wrap gap-2">
                  {photos.map((src, i) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setPhotoIndex(i)}
                      className={`h-14 w-20 overflow-hidden rounded-lg ring-2 transition ${
                        i === photoIndex ? 'ring-brand' : 'ring-transparent hover:ring-gray-300'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="poster-term">
                  {t.admin.poster.term}
                </label>
                <select
                  id="poster-term"
                  className="input"
                  value={figures.term}
                  onChange={(e) => setTerm(Number(e.target.value))}
                >
                  {[...new Set([...terms, figures.term])]
                    .sort((a, b) => a - b)
                    .map((months) => (
                      <option key={months} value={months}>
                        {months} {t.common.months}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="poster-down">
                  {t.admin.poster.downPercent}
                </label>
                <input
                  id="poster-down"
                  type="number"
                  min={0}
                  max={100}
                  className="input"
                  value={figures.downPercent}
                  onChange={(e) => setDownPercent(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Footer lines. Prefilled from settings, editable per poster. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="poster-phone">
                  {t.admin.poster.phone}
                </label>
                <input
                  id="poster-phone"
                  type="text"
                  className="input"
                  value={phone}
                  placeholder="+976 8000-4020"
                  onChange={(e) => editContact('phone', setPhone)(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="poster-website">
                  {t.admin.poster.website}
                </label>
                <input
                  id="poster-website"
                  type="text"
                  className="input"
                  value={website}
                  placeholder="WWW.VICTORYCAR.MN"
                  onChange={(e) => editContact('website', setWebsite)(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="poster-address">
                {t.admin.poster.address}
              </label>
              <input
                id="poster-address"
                type="text"
                className="input"
                value={address}
                onChange={(e) => editContact('address', setAddress)(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">{t.admin.poster.contactHint}</p>
            </div>

            {/* Where the single monthly figure on the poster comes from. */}
            <div className="rounded-xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-800">
              <p>
                {t.admin.poster.averageNote(
                  formatPrice(figures.first),
                  formatPrice(figures.last)
                )}
              </p>
              <p className="mt-1 text-brand-600">{t.admin.poster.roundingNote}</p>
            </div>

            {photos.length === 0 && (
              <p className="text-xs text-amber-600">{t.admin.poster.noPhoto}</p>
            )}
            {photoFailed && photos.length > 0 && (
              <p className="text-xs text-amber-600">{t.admin.poster.noPhoto}</p>
            )}
            {error && <p className="text-sm text-accent">{error}</p>}

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={download}
                disabled={!fontReady}
                className="btn-primary"
              >
                {fontReady ? t.admin.poster.download : t.admin.poster.preparing}
              </button>
              <button type="button" onClick={onClose} className="btn-outline">
                {t.admin.poster.close}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
