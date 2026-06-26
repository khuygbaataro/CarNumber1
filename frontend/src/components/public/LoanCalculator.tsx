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

  const downAmount = useMemo(
    () => Math.max(0, (Math.max(0, price) * downPercent) / 100),
    [price, downPercent]
  );
  const loanAmount = useMemo(() => calcLoanAmount(price, downPercent), [price, downPercent]);
  const monthly = useMemo(
    () => calcMonthlyPayment(loanAmount, rate, term),
    [loanAmount, rate, term]
  );

  const onDownChange = (v: string) => {
    const n = v === '' ? minDown : Number(v);
    setDownPercent(Number.isFinite(n) ? Math.max(minDown, Math.min(100, n)) : minDown);
  };

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
      <h2 className="text-lg font-bold text-gray-900">{t.loan.title}</h2>

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
        <div className="grid grid-cols-3 gap-3">
          {terms.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTerm(m)}
              className={`rounded-lg border py-3 text-center text-lg font-bold transition ${
                m === term
                  ? 'border-brand bg-brand text-white shadow'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Highlighted result — the figures buyers care about most */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-6 text-center text-white shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-100">
            {t.loan.downAmount}
          </p>
          <p className="mt-2 text-3xl font-extrabold sm:text-4xl">
            {formatPrice(downAmount)}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-brand bg-blue-50 p-6 text-center shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand/70">
            {t.loan.monthlyPayment} · {term} {t.loan.months}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-brand sm:text-4xl">
            {formatPrice(monthly)}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">{t.loan.disclaimer}</p>
    </div>
  );
}
