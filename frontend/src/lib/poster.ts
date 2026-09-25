// Figures and small helpers behind the downloadable vehicle poster.
//
// The site shows leasing as a falling range ("669,760 → 288,120₮") because
// that is what an equal-principal schedule actually does. A poster has room
// for one number, so it carries the AVERAGE of the two ends instead.

import { LoanConfig, Settings, Vehicle } from '@/types';
import {
  DEFAULT_LOAN_CONFIG,
  calcAnnuity,
  calcLoanAmount,
  pickDisplayTerm,
  rateForDownPercent,
} from './loan';

/** Poster money is shown to the nearest 1,000₮ — nobody prints 743,182₮. */
export const POSTER_ROUND_TO = 1000;

export const roundPosterAmount = (value: number): number =>
  Math.round((value || 0) / POSTER_ROUND_TO) * POSTER_ROUND_TO;

export interface PosterFigures {
  /** Down payment % actually used (per-vehicle override → global → default). */
  downPercent: number;
  /** Term the monthly figure is based on, in months. */
  term: number;
  /** Monthly rate the down payment earns. Shown as context, not on the poster. */
  rate: number;
  price: number;
  downAmount: number;
  /** The equal monthly instalment, rounded. The poster's "Сарын төлбөр". */
  monthly: number;
  /** Interest over the whole term. Context for the admin, not the poster. */
  totalInterest: number;
}

/**
 * Everything the poster needs to quote. Same maths as the card and the
 * detail-page calculator, so a poster never contradicts the website.
 */
export function posterFigures(
  vehicle: Pick<Vehicle, 'price' | 'downPercent'>,
  loan?: LoanConfig | null,
  override: { term?: number; downPercent?: number } = {}
): PosterFigures {
  const cfg = loan ?? DEFAULT_LOAN_CONFIG;
  const downPercent = Math.min(
    100,
    Math.max(
      0,
      override.downPercent ??
        vehicle.downPercent ??
        cfg.minDownPercent ??
        DEFAULT_LOAN_CONFIG.minDownPercent
    )
  );
  const term = override.term ?? pickDisplayTerm(cfg.termOptions);
  // The down payment decides the rate, exactly as it does on the site.
  const rate = rateForDownPercent(downPercent);
  const price = Math.max(0, vehicle.price || 0);

  const schedule = calcAnnuity(calcLoanAmount(price, downPercent), rate, term);

  return {
    downPercent,
    term,
    rate,
    price,
    downAmount: roundPosterAmount((price * downPercent) / 100),
    monthly: roundPosterAmount(schedule.monthly),
    totalInterest: schedule.totalInterest,
  };
}

/**
 * Default for the poster's web-address line. Taken from the domain the
 * admin panel is being served from, so it is right in production without
 * another setting to fill in. Comes back empty on localhost — the modal
 * lets the admin type it in for that case.
 */
export function posterWebsite(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname.replace(/^www\./i, '');
  if (!host || host === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return '';
  return `WWW.${host.toUpperCase()}`;
}

/**
 * Ask Cloudinary for the photo already cropped to the poster's frame at
 * the resolution it will be drawn at — its resampling beats upscaling a
 * thumbnail on the canvas. `ratio` is the frame's height over its width,
 * which differs between the feed and reel layouts. Non-Cloudinary URLs are
 * returned untouched, and the caller falls back to the original if this
 * variant fails to load.
 */
export function posterPhotoUrl(url: string, width: number, ratio: number): string {
  if (!url.includes('res.cloudinary.com/') || !url.includes('/upload/')) return url;
  const height = Math.round(width * ratio);
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto/`);
}

/** "toyota-aqua-2015-9x16.png" — the shape is in the name so the two
 *  downloads of one car never overwrite each other. */
export function posterFileName(
  vehicle: Pick<Vehicle, 'brand' | 'model' | 'year'>,
  suffix = ''
): string {
  const slug = `${vehicle.brand} ${vehicle.model} ${Math.trunc(vehicle.year) || ''} ${suffix}`
    .toLowerCase()
    .replace(/[^a-z0-9Ѐ-ӿ]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'poster'}.png`;
}

/**
 * The address line the posters carry.
 *
 * Deliberately its own constant rather than Тохиргоо → Холбоо барих: the
 * poster wants the short "how to find us" version with the emoji, while
 * the site's contact block wants the formal address. Edit this one line
 * to change the default on every poster; the modal can still override it
 * for a single one.
 */
export const POSTER_ADDRESS =
  '1-р хороолол Эрчим худалдааны төвөөс дээшээ 200 метр 🏢🚗';

/** Phone/logo/company for the poster footer, with safe fallbacks. */
export function posterBranding(settings?: Settings | null) {
  return {
    companyName: settings?.companyName?.trim() || '',
    logo: settings?.logo || '',
    phone: settings?.contact?.phone?.trim() || '',
  };
}
