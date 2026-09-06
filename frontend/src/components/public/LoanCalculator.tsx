'use client';

import { useMemo, useState } from 'react';
import {
  calcLoanAmount,
  calcEqualPrincipal,
  pickDisplayTerm,
  DEFAULT_LOAN_CONFIG,
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
  const minDown = cfg.minDownPercent ?? 30;
  const rate = cfg.monthlyInterestRate ?? 2.8;
  const terms = cfg.termOptions?.length ? cfg.termOptions : [12, 24, 36];

  const [downPercent, setDownPercent] = useState(minDown);
  // Opens on the same term the cards advertise, so the buyer sees the figure
  // they clicked through for instead of the shortest, scariest one.
  const [term, setTerm] = useState(() => pickDisplayTerm(cfg.termOptions));

  const downAmount = useMemo(
    () => Math.max(0, (Math.max(0, price) * downPercent) / 100),
    [price, downPercent]
  );
  const loanAmount = useMemo(() => calcLoanAmount(price, downPercent), [price, downPercent]);
  const schedule = useMemo(
    () => calcEqualPrincipal(loanAmount, rate, term),
    [loanAmount, rate, term]
  );

  const onDownChange = (v: string) => {
    const n = v === '' ? minDown : Number(v);
    setDownPercent(Number.isFinite(n) ? Math.max(minDown, Math.min(100, n)) : minDown);
  };

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
          <label className="label">{t.loan.downPayment}</label>
          <input
            type="number"
            className="input"
            value={downPercent}
            min={minDown}
            max={100}
            onChange={(e) => onDownChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-400">
            {t.loan.minDownNote}: {minDown}%
          </p>
        </div>
        <div>
          <label className="label">{t.loan.monthlyRate}</label>
          <div className="input bg-gray-50 font-semibold">{rate}%</div>
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
            {t.loan.firstMonth} · {term} {t.loan.months}
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-brand sm:text-4xl">
            {formatPrice(schedule.first)}
          </p>
          <p className="mt-2 text-xs font-medium text-brand/70">{t.loan.lastMonthNote}</p>
          <p className="text-sm font-semibold text-brand">
            {t.loan.lastMonth}: {formatPrice(schedule.last)}
          </p>
        </div>
      </div>

      <div className="mt-5 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600">
          {t.loan.totalInterest}:
          <b className="text-sm text-gray-900">{formatPrice(schedule.totalInterest)}</b>
        </span>
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">{t.loan.disclaimer}</p>
    </div>
  );
}
