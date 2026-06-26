'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageUploader from './ImageUploader';
import VideoUploader from './VideoUploader';
import { VehicleFormData, Vehicle } from '@/types';
import { t } from '@/lib/labels';

const TRANSMISSIONS = ['Автомат', 'Механик'];
const STEERINGS = ['Зүүн', 'Баруун'];
const FUELS = ['Бензин', 'Дизель', 'Хайбрид', 'Цахилгаан', 'Хий'];

const empty: VehicleFormData = {
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  price: 0,
  mileage: 0,
  engine: '',
  exteriorColor: '',
  interiorColor: '',
  description: '',
  images: [],
  video: '',
  status: 'available',
  featured: false,
  downPercent: null,
  transmission: '',
  steering: '',
  fuel: '',
};

function fromVehicle(v: Vehicle): VehicleFormData {
  return {
    brand: v.brand,
    model: v.model,
    year: v.year,
    price: v.price,
    mileage: v.mileage,
    engine: v.engine ?? '',
    exteriorColor: v.exteriorColor ?? '',
    interiorColor: v.interiorColor ?? '',
    description: v.description ?? '',
    images: v.images ?? [],
    video: v.video ?? '',
    status: v.status,
    featured: v.featured,
    downPercent: v.downPercent ?? null,
    transmission: v.transmission ?? '',
    steering: v.steering ?? '',
    fuel: v.fuel ?? '',
  };
}

export default function VehicleForm({
  initial,
  onSubmit,
}: {
  initial?: Vehicle;
  onSubmit: (data: VehicleFormData) => Promise<void>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<VehicleFormData>(
    initial ? fromVehicle(initial) : empty
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof VehicleFormData>(key: K, value: VehicleFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const num = (v: string) => (v === '' ? 0 : Number(v));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.brand || !form.model || !form.year || !form.price || !form.mileage) {
      setError(t.admin.form.requiredError);
      return;
    }
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t.admin.form.brand} required>
            <input className="input" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
          </Field>
          <Field label={t.admin.form.model} required>
            <input className="input" value={form.model} onChange={(e) => set('model', e.target.value)} />
          </Field>
          <Field label={t.admin.form.year} required>
            <input type="number" className="input" value={form.year} onChange={(e) => set('year', num(e.target.value))} />
          </Field>
          <Field label={t.admin.form.price} required>
            <input type="number" className="input" value={form.price} onChange={(e) => set('price', num(e.target.value))} />
          </Field>
          <Field label={t.admin.form.mileage} required>
            <input type="number" className="input" value={form.mileage} onChange={(e) => set('mileage', num(e.target.value))} />
          </Field>
          <Field label={t.admin.form.engine}>
            <input className="input" value={form.engine} onChange={(e) => set('engine', e.target.value)} />
          </Field>
          <Field label={t.admin.form.transmission}>
            <select className="input" value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
              <option value="">{t.admin.form.selectOption}</option>
              {TRANSMISSIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label={t.admin.form.steering}>
            <select className="input" value={form.steering} onChange={(e) => set('steering', e.target.value)}>
              <option value="">{t.admin.form.selectOption}</option>
              {STEERINGS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label={t.admin.form.fuel}>
            <select className="input" value={form.fuel} onChange={(e) => set('fuel', e.target.value)}>
              <option value="">{t.admin.form.selectOption}</option>
              {FUELS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label={t.admin.form.exteriorColor}>
            <input className="input" value={form.exteriorColor} onChange={(e) => set('exteriorColor', e.target.value)} />
          </Field>
          <Field label={t.admin.form.interiorColor}>
            <input className="input" value={form.interiorColor} onChange={(e) => set('interiorColor', e.target.value)} />
          </Field>
          <Field label={t.admin.form.status}>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as VehicleFormData['status'])}>
              <option value="available">{t.status.available}</option>
              <option value="sold">{t.status.sold}</option>
            </select>
          </Field>
          <Field label={t.admin.form.downPercent}>
            <input
              type="number"
              className="input"
              value={form.downPercent ?? ''}
              min={0}
              max={100}
              placeholder={t.admin.form.downPercentPlaceholder}
              onChange={(e) =>
                set('downPercent', e.target.value === '' ? null : Number(e.target.value))
              }
            />
            <p className="mt-1 text-xs text-gray-400">{t.admin.form.downPercentHint}</p>
          </Field>
        </div>

        <div className="mt-4">
          <label className="label">{t.admin.form.description}</label>
          <textarea
            className="input min-h-[100px]"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <label className="label">{t.admin.form.images}</label>
        <ImageUploader value={form.images} onChange={(urls) => set('images', urls)} />
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
        <label className="label">{t.admin.form.video}</label>
        <VideoUploader value={form.video} onChange={(url) => set('video', url)} />
      </div>

      {error && <p className="text-sm font-medium text-accent">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? t.admin.form.saving : t.admin.form.save}
        </button>
        <button type="button" onClick={() => router.push('/admin/vehicles')} className="btn-outline">
          {t.admin.form.cancel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
  );
}
