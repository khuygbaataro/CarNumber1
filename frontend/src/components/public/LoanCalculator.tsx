'use client';

import { useMemo, useState } from 'react';
import { calcLoanAmount, calcMonthlyPayment, DEFAULT_LOAN_CONFIG } from '@/lib/loan';
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
  const [term, setTerm] = useState(terms[0]);

  const loanAmount = useMemo(
    () => calcLoanAmount(price, downPercent),
    [price, downPercent]
  );

  // Monthly payment for every term option (so all choices are visible).
  const perTerm = useMemo(
    () => terms.map((m) => ({ months: m, monthly: calcMonthlyPayment(loanAmount, rate, m) })),
    [terms, loanAmount, rate]
  );

  const selected = perTerm.find((x) => x.months === term) ?? perTerm[0];

  const onDownChange = (v: string) => {
    const n = v === '' ? minDown : Number(v);
    setDownPercent(Number.isFinite(n) ? Math.max(minDown, Math.min(100, n)) : minDown);
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
      <h2 className="text-lg font-bold text-gray-900">{t.loan.title}</h2>

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

      {/* Term options — each shows its monthly payment; tap to select */}
      <div className="mt-5">
        <p className="label">{t.loan.selectTerm}</p>
        <div className="grid grid-cols-3 gap-3">
          {perTerm.map((opt) => {
            const active = opt.months === selected.months;
            return (
              <button
                key={opt.months}
                type="button"
                onClick={() => setTerm(opt.months)}
                className={`rounded-lg border p-3 text-center transition ${
                  active
                    ? 'border-brand bg-brand text-white shadow'
                    : 'border-gray-200 bg-white hover:border-brand'
                }`}
              >
                <div className="text-sm font-semibold">
                  {opt.months} {t.loan.months}
                </div>
                <div className={`mt-1 text-sm font-bold ${active ? 'text-white' : 'text-brand'}`}>
                  {formatPrice(opt.monthly)}
                </div>
                <div className={`text-[11px] ${active ? 'text-blue-100' : 'text-gray-400'}`}>
                  {t.loan.perMonth}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500">{t.loan.loanAmount}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatPrice(loanAmount)}</p>
        </div>
        <div className="rounded-lg bg-brand p-4 text-white">
          <p className="text-xs text-blue-100">
            {t.loan.monthlyPayment} ({selected.months} {t.loan.months})
          </p>
          <p className="mt-1 text-xl font-bold">{formatPrice(selected.monthly)}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">{t.loan.disclaimer}</p>
    </div>
  );
}
