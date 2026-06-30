'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import { t } from '@/lib/labels';

export default function ImageUploader({
  value,
  onChange,
  watermark = false,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  watermark?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const { urls } = await adminApi.uploadImages(Array.from(files), watermark);
      onChange([...value, ...urls]);
    } catch {
      setError(t.admin.upload.error);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div
            key={url + i}
            className="relative h-24 w-24 overflow-hidden rounded-lg ring-1 ring-gray-200"
          >
            <Image src={url} alt={`image-${i}`} fill sizes="96px" className="object-cover" />
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-brand/80 py-0.5 text-center text-[10px] text-white">
                Нүүр
              </span>
            )}
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white hover:bg-black"
              aria-label="remove"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-xs text-gray-500 hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {uploading ? t.admin.upload.uploading : t.admin.upload.selectImages}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="mt-2 text-xs text-gray-400">{t.admin.upload.hint}</p>
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}
