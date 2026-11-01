'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { adminApi } from '@/lib/adminApi';
import { tooLargeMessage, uploadErrorMessage } from '@/lib/uploadLimit';
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
    const list = Array.from(files);
    const tooLarge = tooLargeMessage(list);
    if (tooLarge) {
      setError(tooLarge);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setError('');
    setUploading(true);
    try {
      const { urls } = await adminApi.uploadImages(list, watermark);
      onChange([...value, ...urls]);
    } catch (e) {
      setError(uploadErrorMessage(e));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  // Which photo is being dragged, and which tile it is currently over. The
  // second is only for the outline that shows where it would land.
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Moving a photo re-renders the row, and the tile that had focus is a new
  // element afterwards — so without this the first arrow key works and the
  // second goes nowhere, and the photo has to be clicked again each time.
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const [focusAt, setFocusAt] = useState<number | null>(null);
  useEffect(() => {
    if (focusAt === null) return;
    tiles.current[focusAt]?.focus();
    setFocusAt(null);
  }, [focusAt, value]);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div
            key={url + i}
            ref={(el) => {
              tiles.current[i] = el;
            }}
            // Arrow keys move a focused photo, so reordering does not depend
            // on a mouse — and on a phone, where HTML drag events never fire.
            tabIndex={0}
            role="button"
            aria-label={`${t.admin.upload.photoPosition(i + 1, value.length)} — ${t.admin.upload.reorderHint}`}
            onKeyDown={(e) => {
              const to = e.key === 'ArrowLeft' ? i - 1 : e.key === 'ArrowRight' ? i + 1 : null;
              if (to === null || to < 0 || to >= value.length) return;
              e.preventDefault();
              move(i, to);
              setFocusAt(to);
            }}
            draggable
            onDragStart={(e) => {
              setDragFrom(i);
              e.dataTransfer.effectAllowed = 'move';
              // Firefox ignores a drag that carries nothing.
              e.dataTransfer.setData('text/plain', String(i));
            }}
            onDragOver={(e) => {
              if (dragFrom === null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDragOver(i);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom !== null) move(dragFrom, i);
              setDragFrom(null);
              setDragOver(null);
            }}
            onDragEnd={() => {
              setDragFrom(null);
              setDragOver(null);
            }}
            className={`relative h-24 w-24 cursor-grab overflow-hidden rounded-lg transition active:cursor-grabbing ${
              dragFrom === i
                ? 'opacity-40 ring-2 ring-brand'
                : dragOver === i && dragFrom !== null
                  ? 'ring-2 ring-brand'
                  : 'ring-1 ring-gray-200 focus:ring-2 focus:ring-brand'
            }`}
          >
            <Image
              src={url}
              alt={`image-${i}`}
              fill
              sizes="96px"
              draggable={false}
              className="pointer-events-none object-cover"
            />
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
      <p className="mt-0.5 text-xs text-gray-400">{t.admin.upload.reorderHint}</p>
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}
