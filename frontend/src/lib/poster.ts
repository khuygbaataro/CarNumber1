// Figures and small helpers behind the downloadable vehicle poster.
//
// The site shows leasing as a falling range ("669,760 → 288,120₮") because
// that is what an equal-principal schedule actually does. A poster has room
// for one number, so it carries the AVERAGE of the two ends instead.

import { LoanConfig, Settings, Vehicle } from '@/types';
import {
  DEFAULT_LOAN_CONFIG,
  calcEqualPrincipal,
  calcLoanAmount,
  pickDisplayTerm,
} from './loan';

/**
 * Эхний сарын төлбөр + сүүлийн сарын төлбөр ÷ 2.
 *
 * With equal principal the instalment falls in a straight line from the
 * first month to the last, so the midpoint of those two ends is also the
 * true mean of every payment in between — the average is exact, not an
 * approximation.
 */
export const averageMonthly = (first: number, last: number): number =>
  ((first || 0) + (last || 0)) / 2;

/** Poster money is shown to the nearest 1,000₮ — nobody prints 743,182₮. */
export const POSTER_ROUND_TO = 1000;

export const roundPosterAmount = (value: number): number =>
  Math.round((value || 0) / POSTER_ROUND_TO) * POSTER_ROUND_TO;

export interface PosterFigures {
  /** Down payment % actually used (per-vehicle override → global → 30). */
  downPercent: number;
  /** Term the monthly figure is based on, in months. */
  term: number;
  price: number;
  downAmount: number;
  /** First month — the highest instalment. Shown as context, not on the poster. */
  first: number;
  /** Last month — the lowest instalment. */
  last: number;
  /** (first + last) / 2, rounded. This is the poster's "Сарын төлбөр". */
  monthly: number;
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
  const rate = cfg.monthlyInterestRate ?? DEFAULT_LOAN_CONFIG.monthlyInterestRate;
  const price = Math.max(0, vehicle.price || 0);

  const schedule = calcEqualPrincipal(calcLoanAmount(price, downPercent), rate, term);

  return {
    downPercent,
    term,
    price,
    downAmount: roundPosterAmount((price * downPercent) / 100),
    first: schedule.first,
    last: schedule.last,
    monthly: roundPosterAmount(averageMonthly(schedule.first, schedule.last)),
  };
}

/**
 * Compact year for the poster chip: "2015", or "2015/11" when the build
 * month is known. Handles the legacy 2015.11 encoding the same way
 * formatYear does.
 */
export function posterYear(year?: number, month?: number | null): string {
  const y = Number(year) || 0;
  const yr = Math.trunc(y);
  let mo = Number(month) || 0;
  if (!mo && !Number.isInteger(y)) mo = Math.round((y - yr) * 100);
  return mo >= 1 && mo <= 12 ? `${yr}/${String(mo).padStart(2, '0')}` : String(yr);
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
 * Ask Cloudinary for the photo already cropped to the poster's 4:3 frame at
 * the resolution it will be drawn at — its resampling beats upscaling a
 * thumbnail on the canvas. Non-Cloudinary URLs are returned untouched, and
 * the caller falls back to the original if this variant fails to load.
 */
export function posterPhotoUrl(url: string, width: number): string {
  if (!url.includes('res.cloudinary.com/') || !url.includes('/upload/')) return url;
  const height = Math.round((width * 3) / 4);
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto/`);
}

/** "toyota-aqua-2015.png" */
export function posterFileName(
  vehicle: Pick<Vehicle, 'brand' | 'model' | 'year'>
): string {
  const slug = `${vehicle.brand} ${vehicle.model} ${Math.trunc(vehicle.year) || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9Ѐ-ӿ]+/gi, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'poster'}.png`;
}

/** Phone/address/company for the poster footer, with safe fallbacks. */
export function posterBranding(settings?: Settings | null) {
  return {
    companyName: settings?.companyName?.trim() || '',
    logo: settings?.logo || '',
    phone: settings?.contact?.phone?.trim() || '',
    address: settings?.contact?.address?.trim() || '',
  };
}
