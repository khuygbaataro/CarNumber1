'use client';

import { useRef, useState } from 'react';
import { adminApi } from '@/lib/adminApi';
import { t } from '@/lib/labels';

export default function VideoUploader({
  value,
  onChange,
}: {
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
      const { url } = await adminApi.uploadVideo(files[0]);
      onChange(url);
    } catch {
      setError(t.admin.upload.error);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      {value ? (
        <div className="space-y-2">
          <video controls src={value} className="w-full max-w-sm rounded-lg bg-black" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs font-medium text-accent hover:underline"
          >
            {t.admin.vehicles.delete}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 hover:border-brand hover:text-brand disabled:opacity-60"
        >
          {uploading ? t.admin.upload.uploading : t.admin.upload.selectVideo}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />

      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}
