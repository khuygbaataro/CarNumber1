export interface LoanInput {
  price: number;
  downPaymentPercent: number; // 0–100
  interestRate: number; // annual %, e.g. 18
  termMonths: number;
}

export interface LoanResult {
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

/**
 * Standard amortizing loan formula:
 *   M = P · r(1+r)^n / ((1+r)^n − 1)
 * where P = loan principal, r = monthly rate, n = number of months.
 * Falls back to simple division when the rate is 0.
 */
export function calculateLoan({
  price,
  downPaymentPercent,
  interestRate,
  termMonths,
}: LoanInput): LoanResult {
  const safePrice = Math.max(0, price || 0);
  const down = Math.min(100, Math.max(0, downPaymentPercent || 0));
  const months = Math.max(0, Math.floor(termMonths || 0));

  const downPayment = (safePrice * down) / 100;
  const loanAmount = Math.max(0, safePrice - downPayment);
  const monthlyRate = (interestRate || 0) / 100 / 12;

  let monthlyPayment = 0;
  if (months > 0) {
    if (monthlyRate === 0) {
      monthlyPayment = loanAmount / months;
    } else {
      const factor = Math.pow(1 + monthlyRate, months);
      monthlyPayment = (loanAmount * monthlyRate * factor) / (factor - 1);
    }
  }

  const totalPayment = monthlyPayment * months;
  const totalInterest = Math.max(0, totalPayment - loanAmount);

  return { downPayment, loanAmount, monthlyPayment, totalPayment, totalInterest };
}
