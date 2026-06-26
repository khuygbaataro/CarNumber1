'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/api';
import { t } from '@/lib/labels';
import ImageUploader from '@/components/admin/ImageUploader';

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [termText, setTermText] = useState('12, 24, 36');

  useEffect(() => {
    adminApi
      .getSettings()
      .then((data) => {
        const normalized = {
          ...DEFAULT_SETTINGS,
          ...data,
          loan: data.loan ?? DEFAULT_SETTINGS.loan,
        };
        setForm(normalized);
        if (normalized.loan.termOptions?.length) {
          setTermText(normalized.loan.termOptions.join(', '));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const termOptions = termText
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0);
      const payload: Settings = {
        ...form,
        loan: {
          ...form.loan,
          termOptions: termOptions.length ? termOptions : form.loan.termOptions,
        },
      };
      const updated = await adminApi.updateSettings(payload);
      const normalized = {
        ...DEFAULT_SETTINGS,
        ...updated,
        loan: updated.loan ?? DEFAULT_SETTINGS.loan,
      };
      setForm(normalized);
      if (normalized.loan.termOptions?.length) {
        setTermText(normalized.loan.termOptions.join(', '));
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

  const addTestimonial = () =>
    setForm((f) => ({
      ...f,
      testimonials: [...f.testimonials, { name: '', text: '' }],
    }));
  const updateTestimonial = (i: number, field: 'name' | 'text', value: string) =>
    setForm((f) => ({
      ...f,
      testimonials: f.testimonials.map((it, idx) =>
        idx === i ? { ...it, [field]: value } : it
      ),
    }));
  const removeTestimonial = (i: number) =>
    setForm((f) => ({
      ...f,
      testimonials: f.testimonials.filter((_, idx) => idx !== i),
    }));

  if (loading) return <p className="text-gray-500">{t.common.loading}</p>;

  return (
    <form onSubmit={save} className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t.admin.settings.title}</h1>

      <Card>
        <div>
          <label className="label">{t.admin.settings.companyName}</label>
          <input
            className="input"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SingleImage
            label={t.admin.settings.logo}
            value={form.logo}
            onChange={(url) => setForm({ ...form, logo: url })}
          />
          <SingleImage
            label={t.admin.settings.banner}
            value={form.banner}
            onChange={(url) => setForm({ ...form, banner: url })}
          />
        </div>
      </Card>

      <Card title={t.admin.settings.contactSection}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">{t.admin.settings.phone}</label>
            <input
              className="input"
              value={form.contact.phone}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })}
            />
          </div>
          <div>
            <label className="label">{t.admin.settings.email}</label>
            <input
              className="input"
              value={form.contact.email}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })}
            />
          </div>
          <div>
            <label className="label">{t.admin.settings.address}</label>
            <input
              className="input"
              value={form.contact.address}
              onChange={(e) => setForm({ ...form, contact: { ...form.contact, address: e.target.value } })}
            />
          </div>
        </div>
      </Card>

      <Card title={t.admin.settings.socialSection}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">{t.admin.settings.facebook}</label>
            <input
              className="input"
              value={form.social.facebook}
              onChange={(e) => setForm({ ...form, social: { ...form.social, facebook: e.target.value } })}
            />
          </div>
          <div>
            <label className="label">{t.admin.settings.instagram}</label>
            <input
              className="input"
              value={form.social.instagram}
              onChange={(e) => setForm({ ...form, social: { ...form.social, instagram: e.target.value } })}
            />
          </div>
          <div>
            <label className="label">{t.admin.settings.youtube}</label>
            <input
              className="input"
              value={form.social.youtube}
              onChange={(e) => setForm({ ...form, social: { ...form.social, youtube: e.target.value } })}
            />
          </div>
        </div>
      </Card>

      <Card title={t.admin.settings.trustSection}>
        <div>
          <label className="label">{t.admin.settings.about}</label>
          <textarea
            className="input min-h-[100px]"
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
          />
        </div>
        <div className="mt-4">
          <label className="label">{t.admin.settings.workingHours}</label>
          <input
            className="input"
            value={form.workingHours}
            onChange={(e) => setForm({ ...form, workingHours: e.target.value })}
          />
        </div>
      </Card>

      <Card title={t.admin.settings.testimonialsSection}>
        <div className="space-y-3">
          {form.testimonials.map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 p-3"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  className="input"
                  placeholder={t.admin.settings.testimonialName}
                  value={item.name}
                  onChange={(e) => updateTestimonial(i, 'name', e.target.value)}
                />
                <input
                  className="input sm:col-span-2"
                  placeholder={t.admin.settings.testimonialText}
                  value={item.text}
                  onChange={(e) => updateTestimonial(i, 'text', e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeTestimonial(i)}
                className="mt-2 text-xs font-medium text-accent hover:underline"
              >
                {t.admin.settings.remove}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addTestimonial}
          className="btn-outline mt-3"
        >
          {t.admin.settings.addTestimonial}
        </button>
      </Card>

      <Card title={t.admin.settings.partnersSection}>
        <ImageUploader
          value={form.partners}
          onChange={(urls) => setForm({ ...form, partners: urls })}
        />
      </Card>

      <Card title={t.admin.settings.loanSection}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">{t.admin.settings.minDownPercent}</label>
            <input
              type="number"
              className="input"
              value={form.loan.minDownPercent}
              onChange={(e) =>
                setForm({ ...form, loan: { ...form.loan, minDownPercent: Number(e.target.value) } })
              }
            />
          </div>
          <div>
            <label className="label">{t.admin.settings.monthlyInterestRate}</label>
            <input
              type="number"
              step="0.1"
              className="input"
              value={form.loan.monthlyInterestRate}
              onChange={(e) =>
                setForm({
                  ...form,
                  loan: { ...form.loan, monthlyInterestRate: Number(e.target.value) },
                })
              }
            />
          </div>
          <div>
            <label className="label">{t.admin.settings.termOptions}</label>
            <input
              className="input"
              value={termText}
              onChange={(e) => setTermText(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-400">{t.admin.settings.termOptionsHint}</p>
          </div>
        </div>
      </Card>

      {error && <p className="text-sm font-medium text-accent">{error}</p>}
      {saved && <p className="text-sm font-medium text-green-600">{t.admin.settings.saved}</p>}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? t.admin.settings.saving : t.admin.settings.save}
      </button>
    </form>
  );
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200 sm:p-6">
      {title && <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>}
      {children}
    </div>
  );
}

function SingleImage({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const { urls } = await adminApi.uploadImages([files[0]]);
      onChange(urls[0]);
    } catch {
      setError(t.admin.upload.error);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg bg-gray-100 ring-1 ring-gray-200">
          {value && (
            <Image src={value} alt={label} fill sizes="112px" className="object-contain" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {uploading ? t.admin.upload.uploading : t.admin.upload.selectImages}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs font-medium text-accent hover:underline"
            >
              {t.admin.vehicles.delete}
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}
