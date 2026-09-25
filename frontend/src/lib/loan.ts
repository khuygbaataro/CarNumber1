import { LoanConfig } from '@/types';

export const DEFAULT_LOAN_CONFIG: LoanConfig = {
  minDownPercent: 15,
  monthlyInterestRate: 2.9,
  termOptions: [12, 24, 36, 48, 60],
};

/**
 * How far the down payment may be dragged in the calculator. The buyer is
 * free inside this range — the rate simply follows them down the table.
 * 90% rather than 100% because a full-price "loan" has nothing to quote.
 */
export const MIN_DOWN_PERCENT = 0;
export const MAX_DOWN_PERCENT = 90;

/**
 * Monthly interest by down payment: the more a buyer puts down, the less
 * the money costs them. Bands are inclusive at the bottom, so exactly 50%
 * gets 2.6% and exactly 40% gets 2.7%.
 *
 * This is the dealership's price list — the one place to edit when the
 * rates move. It replaced the single admin-set rate, which could not
 * express a table like this.
 */
export const INTEREST_BANDS: { minDown: number; rate: number }[] = [
  { minDown: 50, rate: 2.6 },
  { minDown: 40, rate: 2.7 },
  { minDown: 20, rate: 2.8 },
  { minDown: 0, rate: 2.9 },
];

/** The monthly rate a given down payment earns. */
export function rateForDownPercent(downPercent: number): number {
  const down = Math.max(0, Number(downPercent) || 0);
  const band = INTEREST_BANDS.find((b) => down >= b.minDown);
  return band ? band.rate : INTEREST_BANDS[INTEREST_BANDS.length - 1].rate;
}

/**
 * The next band up, for nudging a buyer who is close to a cheaper rate:
 * at 17% down this returns { minDown: 20, rate: 2.8 }. Null once they are
 * already in the best band.
 */
export function nextInterestBand(
  downPercent: number
): { minDown: number; rate: number } | null {
  const down = Math.max(0, Number(downPercent) || 0);
  const better = [...INTEREST_BANDS]
    .filter((b) => b.minDown > down)
    .sort((a, b) => a.minDown - b.minDown);
  return better[0] ?? null;
}

/**
 * Term used for the headline monthly figure on cards, in the detail price
 * block, and as the calculator's starting selection. Most sales here run
 * 48 months, so that is the number worth advertising — not the longest
 * term on offer, which flatters the monthly payment, and not the shortest,
 * which scares people off. Change this one value to re-point all three.
 */
export const DISPLAY_TERM_MONTHS = 48;

/**
 * The configured term closest to DISPLAY_TERM_MONTHS. Falls back sensibly
 * when the admin has not offered a 48-month option.
 */
export function pickDisplayTerm(termOptions?: number[]): number {
  const terms = termOptions?.length ? termOptions : DEFAULT_LOAN_CONFIG.termOptions;
  if (terms.includes(DISPLAY_TERM_MONTHS)) return DISPLAY_TERM_MONTHS;
  return terms.reduce((best, term) =>
    Math.abs(term - DISPLAY_TERM_MONTHS) < Math.abs(best - DISPLAY_TERM_MONTHS) ? term : best
  );
}

/** Loan principal after the down payment. */
export function calcLoanAmount(price: number, downPercent: number): number {
  const p = Math.max(0, price || 0);
  const d = Math.min(100, Math.max(0, downPercent || 0));
  return Math.max(0, p - (p * d) / 100);
}

export interface AnnuityResult {
  /** The same amount every month for the whole term. */
  monthly: number;
  totalInterest: number;
  /** Everything repaid over the term — principal plus interest. */
  total: number;
}

/**
 * EQUAL-PAYMENT (annuity) schedule — the buyer pays the identical amount
 * every month from first to last.
 *
 *   payment = L · r / (1 − (1 + r)^−n)
 *
 * This is what the dealership actually writes into its contracts. An
 * earlier version modelled an equal-PRINCIPAL loan, where the instalment
 * starts high and falls; that quoted a first month far above what buyers
 * are really asked for, so it is gone rather than kept alongside — two
 * schedules in one codebase is how a card and a calculator start
 * disagreeing about the same car.
 */
export function calcAnnuity(
  loanAmount: number,
  monthlyRatePercent: number,
  months: number
): AnnuityResult {
  const L = Math.max(0, loanAmount || 0);
  const r = (monthlyRatePercent || 0) / 100;
  const n = Math.max(0, Math.trunc(months));
  if (n <= 0) return { monthly: 0, totalInterest: 0, total: L };
  // An interest-free loan is just the principal split evenly; the annuity
  // formula divides by zero there.
  const monthly = r === 0 ? L / n : (L * r) / (1 - Math.pow(1 + r, -n));
  const total = monthly * n;
  return { monthly, totalInterest: Math.max(0, total - L), total };
}
