'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import { Settings } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/api';
import { t } from '@/lib/labels';
import { INTEREST_BANDS } from '@/lib/loan';
import ImageUploader from '@/components/admin/ImageUploader';
import { tooLargeMessage, uploadErrorMessage } from '@/lib/uploadLimit';

/**
 * The design handoff's artwork, committed under public/brand so nobody has
 * to go looking for the files again. The button uploads them through the
 * ordinary image endpoint as the signed-in admin and drops the resulting
 * Cloudinary urls into the four fields — the admin never picks a file.
 *
 * Labels are thunks because `t` is read at module load and these need to
 * stay next to the paths they describe.
 */
const BRAND_ARTWORK = [
  ['frameMark', '/brand/frame.png', () => t.admin.settings.frameMark],
  ['websiteMark', '/brand/website-pill.png', () => t.admin.settings.websiteMark],
  ['logoMark', '/brand/logo.png', () => t.admin.settings.logoMark],
  ['phoneMark', '/brand/phone-pill.png', () => t.admin.settings.phoneMark],
] as const;

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [termText, setTermText] = useState('12, 24, 36');
  const [brandFilling, setBrandFilling] = useState(false);
  const [brandNote, setBrandNote] = useState('');
  const [brandError, setBrandError] = useState('');

  // Fetches the bundled artwork and uploads all four in one request, so the
  // four fields fill from a single click. The form is left dirty on purpose:
  // saving stays the admin's decision, like every other field here.
  const fillBrandMarks = async () => {
    setBrandFilling(true);
    setBrandNote('');
    setBrandError('');
    try {
      const files = await Promise.all(
        BRAND_ARTWORK.map(async ([, path]) => {
          const res = await fetch(path);
          if (!res.ok) throw new Error(`${path} — ${res.status}`);
          const blob = await res.blob();
          return new File([blob], path.split('/').pop() as string, { type: 'image/png' });
        })
      );
      const { urls } = await adminApi.uploadImages(files);
      const watermark = { ...form.images.watermark };
      BRAND_ARTWORK.forEach(([key], index) => {
        if (urls[index]) watermark[key] = urls[index];
      });
      setForm({ ...form, images: { ...form.images, watermark } });
      setBrandNote(t.admin.settings.marksFilled);
    } catch (e) {
      setBrandError(uploadErrorMessage(e));
    } finally {
      setBrandFilling(false);
    }
  };

  useEffect(() => {
    adminApi
      .getSettings()
      .then((data) => {
        const normalized = {
          ...DEFAULT_SETTINGS,
          ...data,
          loan: data.loan ?? DEFAULT_SETTINGS.loan,
          images: {
            ...DEFAULT_SETTINGS.images,
            ...data.images,
            watermark: {
              ...DEFAULT_SETTINGS.images.watermark,
              ...data.images?.watermark,
            },
          },
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
        images: {
          ...DEFAULT_SETTINGS.images,
          ...updated.images,
          watermark: {
            ...DEFAULT_SETTINGS.images.watermark,
            ...updated.images?.watermark,
          },
        },
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
        <div className="mt-4">
          <label className="label">{t.admin.settings.mapUrl}</label>
          <input
            className="input"
            placeholder="https://maps.app.goo.gl/..."
            value={form.contact.mapUrl}
            onChange={(e) => setForm({ ...form, contact: { ...form.contact, mapUrl: e.target.value } })}
          />
          <p className="mt-1 text-xs text-gray-400">{t.admin.settings.mapUrlHint}</p>
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
          {/* The rate is no longer one number — it is a table keyed on the
              down payment, so it is shown here rather than edited. A single
              editable field that nothing reads would be worse than none. */}
          <div>
            <label className="label">{t.admin.settings.monthlyInterestRate}</label>
            <div className="rounded-xl bg-gray-50 px-3.5 py-2.5 ring-1 ring-gray-200">
              <ul className="space-y-1 text-sm text-gray-700">
                {INTEREST_BANDS.map((band, i) => {
                  const above = INTEREST_BANDS[i - 1];
                  return (
                    <li key={band.minDown} className="flex justify-between gap-3">
                      <span className="text-gray-500">
                        {above
                          ? t.loan.rateBandRange(band.minDown, above.minDown)
                          : t.loan.rateBandFrom(band.minDown)}
                      </span>
                      <b className="tabular-nums">{band.rate}%</b>
                    </li>
                  );
                })}
              </ul>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {t.admin.settings.interestBandsHint}
            </p>
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

      <Card title={t.admin.settings.imagesSection}>
        <p className="mb-4 text-xs text-gray-400">{t.admin.settings.imagesHint}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{t.admin.settings.maxWidth}</label>
            <input
              type="number"
              className="input"
              value={form.images.maxWidth}
              onChange={(e) =>
                setForm({
                  ...form,
                  images: { ...form.images, maxWidth: Number(e.target.value) },
                })
              }
            />
          </div>
          <label className="flex items-center gap-2 self-end pb-2">
            <input
              type="checkbox"
              checked={form.images.watermark.enabled}
              onChange={(e) =>
                setForm({
                  ...form,
                  images: {
                    ...form.images,
                    watermark: { ...form.images.watermark, enabled: e.target.checked },
                  },
                })
              }
            />
            <span className="text-sm font-medium text-gray-700">
              {t.admin.settings.watermarkEnabled}
            </span>
          </label>
        </div>

        {form.images.watermark.enabled && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <span className="label mb-0">{t.admin.settings.marksTitle}</span>
              <button
                type="button"
                onClick={fillBrandMarks}
                disabled={brandFilling}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {brandFilling ? t.admin.settings.marksFilling : t.admin.settings.marksFill}
              </button>
            </div>
            <p className="mb-3 mt-1 text-xs text-gray-400">{t.admin.settings.marksFillHint}</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BRAND_ARTWORK.map(([key, , label]) => (
                <SingleImage
                  key={key}
                  label={label()}
                  value={form.images.watermark[key]}
                  onChange={(url) =>
                    setForm({
                      ...form,
                      images: {
                        ...form.images,
                        watermark: { ...form.images.watermark, [key]: url },
                      },
                    })
                  }
                />
              ))}
            </div>

            {brandNote && (
              <p className="mt-2 text-xs font-medium text-green-600">{brandNote}</p>
            )}
            {brandError && <p className="mt-2 text-xs text-accent">{brandError}</p>}
            <p className="mt-2 text-xs text-gray-400">{t.admin.settings.marksHint}</p>
          </div>
        )}
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
    const tooLarge = tooLargeMessage([files[0]]);
    if (tooLarge) {
      setError(tooLarge);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setError('');
    setUploading(true);
    try {
      const { urls } = await adminApi.uploadImages([files[0]]);
      onChange(urls[0]);
    } catch (e) {
      setError(uploadErrorMessage(e));
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
