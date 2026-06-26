'use client';

import { FormEvent, useState } from 'react';
import { createLead } from '@/lib/api';
import { t } from '@/lib/labels';

export default function LeadForm({
  vehicleId,
  vehicleName,
}: {
  vehicleId?: string;
  vehicleName?: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError(t.lead.required);
      return;
    }
    setError('');
    setState('sending');
    try {
      await createLead({ name, phone, message, vehicleId, vehicleName });
      setState('done');
      setName('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.lead.error);
      setState('idle');
    }
  };

  if (state === 'done') {
    return (
      <div className="rounded-xl bg-green-50 p-6 text-center text-green-700 ring-1 ring-green-200">
        {t.lead.success}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6"
    >
      <h2 className="text-lg font-bold text-gray-900">
        {vehicleName ? t.lead.titleVehicle : t.lead.title}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{t.lead.subtitle}</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">{t.lead.name}</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label">{t.lead.phone}</label>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="label">{t.lead.message}</label>
        <textarea
          className="input min-h-[80px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      {error && <p className="mt-3 text-sm font-medium text-accent">{error}</p>}

      <button type="submit" disabled={state === 'sending'} className="btn-primary mt-4">
        {state === 'sending' ? t.lead.submitting : t.lead.submit}
      </button>
    </form>
  );
}
