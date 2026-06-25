'use client';

import { useMemo, useState } from 'react';
import { calculateLoan } from '@/lib/loan';
import { formatPrice } from '@/lib/format';
import { t } from '@/lib/labels';

export default function LoanCalculator({ price }: { price: number }) {
  const [vehiclePrice, setVehiclePrice] = useState(price);
  const [downPaymentPercent, setDownPaymentPercent] = useState(30);
  const [interestRate, setInterestRate] = useState(18);
  const [termMonths, setTermMonths] = useState(24);

  const result = useMemo(
    () =>
      calculateLoan({ price: vehiclePrice, downPaymentPercent, interestRate, termMonths }),
    [vehiclePrice, downPaymentPercent, interestRate, termMonths]
  );

  const num = (v: string) => (v === '' ? 0 : Number(v));

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
      <h2 className="text-lg font-bold text-gray-900">{t.loan.title}</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.loan.price}</label>
          <input
            type="number"
            className="input"
            value={vehiclePrice}
            min={0}
            onChange={(e) => setVehiclePrice(num(e.target.value))}
          />
        </div>
        <div>
          <label className="label">{t.loan.downPayment}</label>
          <input
            type="number"
            className="input"
            value={downPaymentPercent}
            min={0}
            max={100}
            onChange={(e) => setDownPaymentPercent(num(e.target.value))}
          />
        </div>
        <div>
          <label className="label">{t.loan.interestRate}</label>
          <input
            type="number"
            className="input"
            value={interestRate}
            min={0}
            step={0.1}
            onChange={(e) => setInterestRate(num(e.target.value))}
          />
        </div>
        <div>
          <label className="label">{t.loan.term}</label>
          <input
            type="number"
            className="input"
            value={termMonths}
            min={1}
            onChange={(e) => setTermMonths(num(e.target.value))}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Output label={t.loan.loanAmount} value={formatPrice(result.loanAmount)} />
        <Output
          label={t.loan.monthlyPayment}
          value={formatPrice(result.monthlyPayment)}
          highlight
        />
        <Output label={t.loan.totalInterest} value={formatPrice(result.totalInterest)} />
        <Output label={t.loan.totalPayment} value={formatPrice(result.totalPayment)} />
      </div>

      <p className="mt-4 text-xs text-gray-400">{t.loan.disclaimer}</p>
    </div>
  );
}

function Output({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 ${
        highlight ? 'bg-brand text-white' : 'bg-gray-50 text-gray-900'
      }`}
    >
      <p className={`text-xs ${highlight ? 'text-blue-100' : 'text-gray-500'}`}>
        {label}
      </p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
