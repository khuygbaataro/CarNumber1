// Figures for the A4 sheet that goes on a car's own window.
//
// The audience is someone standing in the yard reading through glass, and
// the salesperson talking them through it. Both want round numbers they
// can hold in their head — not 3,570,000₮.

import { calcAnnuity, rateForDownPercent } from './loan';

/** The headline down payment these sheets quote. */
export const WINDOW_DOWN_PERCENT = 15;

/**
 * Down payments are evened DOWN to the nearest 500,000₮ — "3 сая",
 * "3 сая 500 мянга", "5 сая". Down rather than nearest so the figure on
 * the glass is never more than the 15% it is advertised as; the monthly
 * payment is then worked out from what is actually left owing, so the two
 * numbers stay honest with each other.
 */
export const DOWN_STEP = 500_000;

/** Monthly figures are evened to the nearest 10,000₮. */
export const MONTHLY_STEP = 10_000;

/** The only term the sheet quotes. */
export const WINDOW_TERMS = [48];

export interface WindowTermFigure {
  months: number;
  monthly: number;
}

export interface WindowCardFigures {
  price: number;
  /** What the rounded down payment actually works out to, e.g. 14.7. */
  downPercent: number;
  downAmount: number;
  loanAmount: number;
  rate: number;
  terms: WindowTermFigure[];
}

const floorTo = (value: number, step: number) =>
  Math.max(0, Math.floor((value || 0) / step) * step);

const roundTo = (value: number, step: number) =>
  Math.max(0, Math.round((value || 0) / step) * step);

export function windowCardFigures(price: number): WindowCardFigures {
  const p = Math.max(0, price || 0);

  const downAmount = floorTo((p * WINDOW_DOWN_PERCENT) / 100, DOWN_STEP);
  const loanAmount = Math.max(0, p - downAmount);
  // The rate follows what is really being put down, not the headline 15%.
  const downPercent = p > 0 ? (downAmount / p) * 100 : 0;
  const rate = rateForDownPercent(downPercent);

  const terms = WINDOW_TERMS.map((months) => ({
    months,
    monthly: roundTo(calcAnnuity(loanAmount, rate, months).monthly, MONTHLY_STEP),
  }));

  return { price: p, downPercent, downAmount, loanAmount, rate, terms };
}
