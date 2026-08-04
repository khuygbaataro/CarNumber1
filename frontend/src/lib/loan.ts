import { LoanConfig } from '@/types';

export const DEFAULT_LOAN_CONFIG: LoanConfig = {
  minDownPercent: 30,
  monthlyInterestRate: 2.8,
  termOptions: [12, 24, 36],
};

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

export interface EqualPrincipalResult {
  principalPerMonth: number; // equal principal slice paid each month
  first: number; // 1st month payment (highest)
  last: number; // final month payment (lowest)
  totalInterest: number; // total interest over the term
  total: number; // loanAmount + totalInterest
}

/**
 * Reducing-balance, EQUAL-PRINCIPAL schedule (Mongolian banks' "тэнцүү
 * үндсэн төлбөрт зээл"). Each month you repay the same principal slice
 * (L / n) plus interest on the OUTSTANDING balance. Because the balance
 * shrinks every month, the interest — and so the total monthly payment —
 * decreases over time.
 *
 *   principal/month = L / n
 *   payment_k       = L/n + (L − (k−1)·L/n) · r
 *   first (k=1)     = L/n + L·r           (highest)
 *   last  (k=n)     = L/n + (L/n)·r        (lowest)
 *   total interest  = r · L · (n + 1) / 2
 */
export function calcEqualPrincipal(
  loanAmount: number,
  monthlyRatePercent: number,
  months: number
): EqualPrincipalResult {
  const L = Math.max(0, loanAmount || 0);
  const r = (monthlyRatePercent || 0) / 100;
  if (months <= 0) {
    return { principalPerMonth: 0, first: 0, last: 0, totalInterest: 0, total: L };
  }
  const principalPerMonth = L / months;
  const first = principalPerMonth + L * r;
  const last = principalPerMonth + principalPerMonth * r;
  const totalInterest = (r * L * (months + 1)) / 2;
  return {
    principalPerMonth,
    first,
    last,
    totalInterest,
    total: L + totalInterest,
  };
}
