import { LoanConfig } from '@/types';

export const DEFAULT_LOAN_CONFIG: LoanConfig = {
  minDownPercent: 30,
  monthlyInterestRate: 2.8,
  termOptions: [12, 24, 36],
};

/** Loan principal after the down payment. */
export function calcLoanAmount(price: number, downPercent: number): number {
  const p = Math.max(0, price || 0);
  const d = Math.min(100, Math.max(0, downPercent || 0));
  return Math.max(0, p - (p * d) / 100);
}

/**
 * Equal-payment (annuity) monthly payment using a MONTHLY interest rate.
 *   M = P · r(1+r)^n / ((1+r)^n − 1)
 * where r = monthly rate, n = months. Interest is computed on the
 * declining balance, so the payment stays constant while the interest
 * portion shrinks over time. Falls back to simple division at 0%.
 */
export function calcMonthlyPayment(
  loanAmount: number,
  monthlyRatePercent: number,
  months: number
): number {
  if (months <= 0) return 0;
  const r = (monthlyRatePercent || 0) / 100;
  if (r === 0) return loanAmount / months;
  const factor = Math.pow(1 + r, months);
  return (loanAmount * r * factor) / (factor - 1);
}
