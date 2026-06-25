'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/api';
import { t } from '@/lib/labels';

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .getSettings()
      .then(setForm)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const updated = await adminApi.updateSettings(form);
      setForm(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Алдаа гарлаа');
    } finally {
      setSaving(false);
    }
  };

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
