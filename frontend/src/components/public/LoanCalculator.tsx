'use client';

import { useMemo, useState } from 'react';
import {
  calcLoanAmount,
  calcAnnuity,
  pickDisplayTerm,
  rateForDownPercent,
  nextInterestBand,
  DEFAULT_LOAN_CONFIG,
  MIN_DOWN_PERCENT,
  MAX_DOWN_PERCENT,
} from '@/lib/loan';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/labels';
import { LoanConfig } from '@/types';

export default function LoanCalculator({
  price,
  config,
}: {
  price: number;
  config?: LoanConfig;
}) {
  const cfg = config ?? DEFAULT_LOAN_CONFIG;
  const startDown = cfg.minDownPercent ?? DEFAULT_LOAN_CONFIG.minDownPercent;
  const terms = cfg.termOptions?.length ? cfg.termOptions : DEFAULT_LOAN_CONFIG.termOptions;

  // Kept as text so the field can be emptied mid-edit — forcing a number
  // back in on every keystroke makes "15" impossible to turn into "50".
  const [downText, setDownText] = useState(String(startDown));
  const downPercent = clamp(Number(downText));
  // Opens on the same term the cards advertise, so the buyer sees the figure
  // they clicked through for instead of the shortest, scariest one.
  const [term, setTerm] = useState(() => pickDisplayTerm(cfg.termOptions));

  // The rate is not a setting any more — it follows the down payment.
  const rate = rateForDownPercent(downPercent);
  const nextBand = nextInterestBand(downPercent);

  const downAmount = useMemo(
    () => Math.max(0, (Math.max(0, price) * downPercent) / 100),
    [price, downPercent]
  );
  const loanAmount = useMemo(
    () => calcLoanAmount(price, downPercent),
    [price, downPercent]
  );
  const schedule = useMemo(
    () => calcAnnuity(loanAmount, rate, term),
    [loanAmount, rate, term]
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-gray-200 sm:p-7">
      <p className="eyebrow">{t.common.monthly}</p>
      <h2 className="mt-1.5 text-xl font-bold tracking-tight text-gray-900">
        {t.loan.title}
      </h2>

      {/* Inputs */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="label">{t.loan.price}</label>
          <div className="input bg-gray-50 font-semibold">{formatPrice(price)}</div>
        </div>
        <div>
          <label className="label" htmlFor="loan-down">
            {t.loan.downPayment}
          </label>
          <input
            id="loan-down"
            type="number"
            inputMode="numeric"
            className="input"
            value={downText}
            min={MIN_DOWN_PERCENT}
            max={MAX_DOWN_PERCENT}
            onChange={(e) => setDownText(e.target.value)}
            onBlur={() => setDownText(String(downPercent))}
          />
          <p className="mt-1 text-xs text-gray-400">
            {t.loan.downRange(MIN_DOWN_PERCENT, MAX_DOWN_PERCENT)}
          </p>
        </div>
        <div>
          <label className="label">{t.loan.monthlyRate}</label>
          <div className="input bg-gray-50 font-semibold">{rate}%</div>
          {/* A buyer three points short of a cheaper band should be told. */}
          <p className="mt-1 text-xs text-gray-400">
            {nextBand
              ? t.loan.betterRateHint(nextBand.minDown, nextBand.rate)
              : t.loan.bestRateHint}
          </p>
        </div>
      </div>

      {/* Term — minimal: just the month numbers */}
      <div className="mt-5">
        <p className="label">
          {t.loan.term} ({t.loan.months})
        </p>
        {/* Wrapping flex rather than a fixed grid, so any number of term
            options fills the row evenly instead of leaving empty cells. */}
        <div className="flex flex-wrap gap-3">
          {terms.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTerm(m)}
              className={`min-h-[52px] min-w-[88px] flex-1 rounded-xl border text-center text-lg font-bold transition active:scale-[0.98] ${
                m === term
                  ? 'border-brand bg-brand text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand hover:bg-brand-50'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Highlighted result — the figures buyers care about most */}
      <div className="mt-6 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 via-brand to-brand-dark p-6 text-center text-white shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-100">
            {t.loan.downAmount}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {formatPrice(downAmount)}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-brand bg-brand-50 p-6 text-center shadow-lg">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand/70">
            {t.loan.monthlyPayment} · {term} {t.loan.months}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
            {formatPrice(schedule.monthly)}
          </p>
          <p className="mt-2 text-xs font-medium text-brand/70">{t.loan.equalNote}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600">
          {t.loan.loanAmount}:
          <b className="text-sm text-gray-900">{formatPrice(loanAmount)}</b>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600">
          {t.loan.totalInterest}:
          <b className="text-sm text-gray-900">{formatPrice(schedule.totalInterest)}</b>
        </span>
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">{t.loan.disclaimer}</p>
    </div>
  );
}

function clamp(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_LOAN_CONFIG.minDownPercent;
  return Math.min(MAX_DOWN_PERCENT, Math.max(MIN_DOWN_PERCENT, n));
}
