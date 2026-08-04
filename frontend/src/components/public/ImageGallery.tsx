'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { t } from '@/lib/labels';

/**
 * Swipeable gallery. The main viewport is a native scroll-snap track, so on a
 * phone the buyer just swipes — no gesture library, nothing to load. Arrows
 * appear on pointer devices and the thumbnail strip stays in sync both ways.
 */
export default function ImageGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const count = images?.length ?? 0;

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(count - 1, index));
    track.scrollTo({ left: target * track.clientWidth, behavior: 'smooth' });
    setActive(target);
  };

  // Keep the counter and thumbnails in step while the user swipes.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    setActive(Math.max(0, Math.min(count - 1, index)));
  };

  if (count === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
        {t.common.noImage}
      </div>
    );
  }

  return (
    // min-w-0 keeps the scroll track from widening its grid/flex parent —
    // without it the slides push the whole column past the viewport.
    <div className="min-w-0">
      <div className="group relative">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar snap-x-mandatory flex aspect-[4/3] w-full overflow-x-auto overscroll-x-contain rounded-2xl bg-gray-100"
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              className="snap-start-always relative h-full basis-full flex-[0_0_100%]"
            >
              <Image
                src={src}
                alt={`${alt} — ${t.detail.photos} ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <ArrowButton
              side="left"
              disabled={active === 0}
              onClick={() => goTo(active - 1)}
            />
            <ArrowButton
              side="right"
              disabled={active === count - 1}
              onClick={() => goTo(active + 1)}
            />

            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-gray-900/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
              {active + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              aria-label={`${t.detail.photos} ${i + 1}`}
              onClick={() => goTo(i)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition sm:h-20 sm:w-24 ${
                i === active
                  ? 'ring-brand'
                  : 'opacity-70 ring-transparent hover:opacity-100 hover:ring-gray-300'
              }`}
            >
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  side,
  disabled,
  onClick,
}: {
  side: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Prev' : 'Next'}
      className={`absolute top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex ${
        side === 'left' ? 'left-3' : 'right-3'
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path
          d={side === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
