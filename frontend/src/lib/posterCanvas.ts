// Draws the downloadable vehicle poster onto a canvas.
//
// The layout is written against a fixed coordinate space and then drawn
// through a scale transform, so one set of numbers produces both the small
// preview in the modal and the full-resolution PNG.
//
// Two shapes are built from the same code: the 4:5 feed post and the 9:16
// reel/story. They are hand-tuned rather than derived from one another — a
// reel is not a stretched post. It gets a taller photo, roomier gaps and
// type a fifth larger, because it is watched full-screen on a phone rather
// than scrolled past in a feed.

import { t } from './labels';

export type PosterFormat = 'feed' | 'reel';

export interface PosterLayout {
  format: PosterFormat;
  W: number;
  H: number;
  /** Type scale. Every font size and padding is multiplied by this. */
  k: number;
  /** Photo height as a share of the content width. */
  photoRatio: number;
  M: number;
  CW: number;
  headerY: number;
  logoH: number;
  photoY: number;
  photoH: number;
  /** Title baseline; the year/mileage chips sit on the same line. */
  rowBase: number;
  tilesY: number;
  tileH: number;
  /** Baseline of the one-line footnote under the tiles. */
  noteBase: number;
  barY: number;
  barH: number;
}

const M = 56;
const CW = 1080 - M * 2; // 968 — both formats are 1080 wide

export const POSTER_LAYOUTS: Record<PosterFormat, PosterLayout> = {
  // 4:5 — the tallest shape Facebook and Instagram show in a feed.
  feed: {
    format: 'feed',
    W: 1080,
    H: 1350,
    k: 1,
    photoRatio: 0.75, // 4:3
    M,
    CW,
    headerY: 28,
    logoH: 88,
    photoY: 136,
    photoH: Math.round(CW * 0.75), // 726
    rowBase: 978,
    tilesY: 1006,
    tileH: 136,
    noteBase: 1176,
    barY: 1202,
    barH: 148,
  },
  // 9:16 — reels and stories. The photo grows towards square, which is as
  // tall as a landscape car shot can go before c_fill starts cutting
  // bumpers off the sides; the rest of the height becomes air and scale.
  reel: {
    format: 'reel',
    W: 1080,
    H: 1920,
    k: 1.2,
    photoRatio: 0.9,
    M,
    CW,
    headerY: 70,
    logoH: 118,
    photoY: 296,
    photoH: Math.round(CW * 0.9), // 871
    rowBase: 1330,
    tilesY: 1390,
    tileH: 176,
    noteBase: 1624,
    barY: 1684,
    barH: 236,
  },
};

/** Export multiplier — 2 gives a 2160 × 2700 (or × 3840) PNG. */
export const POSTER_SCALE = 2;

// Poster palette. Deliberately independent of the site's blue theme: this
// is the black/red identity of the printed and posted material.
const RED = '#e11b22';
const BLACK = '#070707';
const TILE_BG = '#161616';
const TILE_LINE = '#2c2c2c';
const WHITE = '#ffffff';
const MUTED = '#8f8f8f';

export interface PosterContent {
  title: string; // "TOYOTA AQUA"
  yearLabel: string; // "2015"
  mileageLabel: string; // "98,000 км"
  priceLabel: string;
  downLabel: string;
  monthlyLabel: string;
  termLabel: string; // "48 сар" — qualifies the monthly figure
  termNote: string; // spelled-out footnote under the tiles
  phone: string;
  website: string;
  address: string;
  badge: string; // "ЛИЗИНГЭЭР"
  companyName: string; // corner tag + logo fallback
  photo: HTMLImageElement | null;
  logo: HTMLImageElement | null;
  fontStack: string;
}

type Ctx = CanvasRenderingContext2D;

const font = (weight: number, size: number, stack: string) =>
  `${weight} ${size}px ${stack}`;

/** Rounded-rect path. `r` is one radius, or [tl, tr, br, bl]. */
function roundRectPath(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | [number, number, number, number]
) {
  const [tl, tr, br, bl] = typeof r === 'number' ? [r, r, r, r] : r;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.arcTo(x + w, y, x + w, y + h, tr);
  ctx.arcTo(x + w, y + h, x, y + h, br);
  ctx.arcTo(x, y + h, x, y, bl);
  ctx.arcTo(x, y, x + w, y, tl);
  ctx.closePath();
}

// Letter-spacing drawn by hand: ctx.letterSpacing is still missing in
// enough browsers that the uppercase labels would come out cramped.
function measureTracked(ctx: Ctx, text: string, spacing: number): number {
  const chars = [...text];
  if (!chars.length) return 0;
  let w = 0;
  for (const ch of chars) w += ctx.measureText(ch).width + spacing;
  return w - spacing;
}

function fillTracked(ctx: Ctx, text: string, x: number, y: number, spacing: number) {
  if (!spacing) {
    ctx.fillText(text, x, y);
    return;
  }
  let cx = x;
  for (const ch of [...text]) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
}

/** Largest size in [min, start] at which `text` still fits `maxWidth`. */
function fitSize(
  ctx: Ctx,
  text: string,
  weight: number,
  stack: string,
  maxWidth: number,
  start: number,
  min: number,
  spacing = 0
): number {
  let size = start;
  while (size > min) {
    ctx.font = font(weight, size, stack);
    if (measureTracked(ctx, text, spacing) <= maxWidth) break;
    size -= 1;
  }
  ctx.font = font(weight, size, stack);
  return size;
}

/** Trims with an ellipsis when even the smallest size overflows. */
function ellipsize(ctx: Ctx, text: string, maxWidth: number, spacing: number): string {
  if (measureTracked(ctx, text, spacing) <= maxWidth) return text;
  const chars = [...text];
  while (chars.length > 1) {
    chars.pop();
    const candidate = `${chars.join('').trimEnd()}…`;
    if (measureTracked(ctx, candidate, spacing) <= maxWidth) return candidate;
  }
  return '…';
}

/** object-fit: cover. */
function drawCover(
  ctx: Ctx,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** object-fit: contain, pinned left and vertically centred. */
function drawContainLeft(
  ctx: Ctx,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.min(w / iw, h / ih);
  ctx.drawImage(img, x, y + (h - ih * scale) / 2, iw * scale, ih * scale);
}

function drawHeader(ctx: Ctx, c: PosterContent, L: PosterLayout) {
  const fs = (n: number) => Math.round(n * L.k);
  const sp = (n: number) => n * L.k;

  // The badge is measured first; the logo takes whatever width is left.
  const badgeText = c.badge.trim().toUpperCase();
  const badgeH = Math.round(66 * L.k);
  const badgeY = L.headerY + (L.logoH - badgeH) / 2;
  let badgeW = 0;

  if (badgeText) {
    ctx.font = font(700, fs(30), c.fontStack);
    badgeW = measureTracked(ctx, badgeText, sp(5)) + sp(56);
    const bx = L.W - L.M - badgeW;
    ctx.fillStyle = RED;
    roundRectPath(ctx, bx, badgeY, badgeW, badgeH, sp(6));
    ctx.fill();
    ctx.fillStyle = WHITE;
    fillTracked(ctx, badgeText, bx + sp(28), badgeY + badgeH / 2 + sp(11), sp(5));
  }

  const logoW = Math.min(sp(330), Math.max(sp(160), L.CW - badgeW - sp(40)));
  if (c.logo) {
    drawContainLeft(ctx, c.logo, L.M, L.headerY, logoW, L.logoH);
  } else if (c.companyName) {
    const name = c.companyName.toUpperCase();
    const size = fitSize(ctx, name, 700, c.fontStack, logoW, fs(46), fs(24), sp(2));
    ctx.fillStyle = WHITE;
    fillTracked(ctx, name, L.M, L.headerY + L.logoH / 2 + size * 0.35, sp(2));
  }
}

function drawPhoto(ctx: Ctx, c: PosterContent, L: PosterLayout) {
  const fs = (n: number) => Math.round(n * L.k);
  const sp = (n: number) => n * L.k;
  const radius = sp(16);

  ctx.save();
  roundRectPath(ctx, L.M, L.photoY, L.CW, L.photoH, radius);
  ctx.clip();

  if (c.photo) {
    drawCover(ctx, c.photo, L.M, L.photoY, L.CW, L.photoH);
  } else {
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(L.M, L.photoY, L.CW, L.photoH);
    ctx.fillStyle = MUTED;
    ctx.font = font(500, fs(32), c.fontStack);
    ctx.textAlign = 'center';
    ctx.fillText(t.common.noImage, L.W / 2, L.photoY + L.photoH / 2);
    ctx.textAlign = 'left';
  }

  // Corner tag — drawn inside the clip so it follows the rounded corner.
  // Its type does NOT take the format's scale: both posters are 1080 wide,
  // so scaling here would only shove a long company name into an ellipsis.
  const tag = c.companyName.trim().toUpperCase();
  if (tag) {
    ctx.font = font(700, 26, c.fontStack);
    const tagW = Math.min(L.CW * 0.68, measureTracked(ctx, tag, 5) + 64);
    const tagH = 58;
    const tx = L.M + L.CW - tagW;
    const ty = L.photoY + L.photoH - tagH;
    ctx.fillStyle = RED;
    roundRectPath(ctx, tx, ty, tagW, tagH, [radius, 0, 0, 0]);
    ctx.fill();
    ctx.fillStyle = WHITE;
    fillTracked(ctx, ellipsize(ctx, tag, tagW - 64, 5), tx + 32, ty + tagH / 2 + 9, 5);
  }
  ctx.restore();

  // Frame last, so it stays crisp on top of the photo.
  const line = sp(3);
  ctx.strokeStyle = RED;
  ctx.lineWidth = line;
  roundRectPath(
    ctx,
    L.M + line / 2,
    L.photoY + line / 2,
    L.CW - line,
    L.photoH - line,
    radius - 1
  );
  ctx.stroke();
}

/**
 * Title on the left, year/mileage chips on the right of the same row.
 *
 * A short name ("TOYOTA AQUA") sits on one big line exactly as the design
 * intends. A long one ("TOYOTA LAND CRUISER PRADO TX-L") would have to
 * shrink to nothing to share that line, so it wraps to two instead: the
 * chips stay level with the first line and the second line runs the full
 * width of the poster. The chips also come down a size when it wraps, so
 * they never end up shouting louder than the model name.
 */
function drawTitleRow(ctx: Ctx, c: PosterContent, L: PosterLayout) {
  const sp = (n: number) => n * L.k;
  // Chip sizes do NOT take the format's scale. Both posters are 1080 wide,
  // so every pixel a bigger chip takes is one the model name loses — and
  // the name is the thing that should be big on a reel, not the mileage.
  const chipFull = 56;
  const chipWrapped = 46;
  const gap = 14;

  const chips = [
    { label: t.admin.poster.yearChip, value: c.yearLabel },
    { label: t.admin.poster.mileageChip, value: c.mileageLabel },
  ].filter((chip) => chip.value);

  // Measured at full size first: the title is laid out against the width
  // that leaves, and shrinking the chips afterwards only ever gives it more.
  const full = measureChips(ctx, chips, chipFull, c.fontStack, gap);
  const beside = Math.max(220, L.CW - full.total - 28);

  const title = c.title.trim().toUpperCase();
  const layout = layoutTitle(ctx, title, c.fontStack, beside, L);

  const chipH = layout.lines.length > 1 ? chipWrapped : chipFull;
  const metrics = chipH === chipFull ? full : measureChips(ctx, chips, chipH, c.fontStack, gap);
  // Chips centre on the first line's optical middle, whatever size it took.
  const chipY = layout.firstBaseline - layout.size * 0.36 - chipH / 2;

  let cx = L.W - L.M - metrics.total;
  const labelSize = Math.round(chipH * 0.46);
  const valueSize = Math.round(chipH * 0.5);

  chips.forEach((chip, i) => {
    const w = metrics.widths[i];
    roundRectPath(ctx, cx, chipY, w, chipH, chipH / 2);
    ctx.fillStyle = TILE_BG;
    ctx.fill();
    ctx.strokeStyle = TILE_LINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const pad = chipH * 0.46;
    ctx.font = font(500, labelSize, c.fontStack);
    ctx.fillStyle = MUTED;
    ctx.fillText(`${chip.label} `, cx + pad, chipY + chipH / 2 + labelSize * 0.35);
    const labelW = ctx.measureText(`${chip.label} `).width;
    ctx.font = font(700, valueSize, c.fontStack);
    ctx.fillStyle = WHITE;
    ctx.fillText(chip.value, cx + pad + labelW, chipY + chipH / 2 + valueSize * 0.35);

    cx += w + gap;
  });

  if (!title) return;
  ctx.font = font(700, layout.size, c.fontStack);
  ctx.fillStyle = WHITE;
  layout.lines.forEach((line, i) => {
    fillTracked(ctx, line, L.M, layout.firstBaseline + i * (layout.size + sp(14)), 1);
  });
}

function measureChips(
  ctx: Ctx,
  chips: { label: string; value: string }[],
  chipH: number,
  stack: string,
  gap: number
): { widths: number[]; total: number } {
  const labelSize = Math.round(chipH * 0.46);
  const valueSize = Math.round(chipH * 0.5);
  const widths = chips.map((chip) => {
    ctx.font = font(500, labelSize, stack);
    const labelW = ctx.measureText(`${chip.label} `).width;
    ctx.font = font(700, valueSize, stack);
    return labelW + ctx.measureText(chip.value).width + chipH * 0.92;
  });
  return {
    widths,
    total: widths.reduce((a, b) => a + b, 0) + gap * Math.max(0, chips.length - 1),
  };
}

interface TitleLayout {
  lines: string[];
  size: number;
  /** Baseline of the first line. The last line always lands on rowBase. */
  firstBaseline: number;
}

function layoutTitle(
  ctx: Ctx,
  title: string,
  stack: string,
  beside: number,
  L: PosterLayout
): TitleLayout {
  const fs = (n: number) => Math.round(n * L.k);
  if (!title) return { lines: [], size: fs(78), firstBaseline: L.rowBase };

  // One line, as large as it can be next to the chips.
  const size = fitSize(ctx, title, 700, stack, beside, fs(78), fs(48), 1);
  if (measureTracked(ctx, title, 1) <= beside) {
    return { lines: [title], size, firstBaseline: L.rowBase };
  }

  // Two lines: first beside the chips, the rest across the full width.
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    for (let s = fs(50); s >= fs(34); s -= 1) {
      ctx.font = font(700, s, stack);
      let split = 0;
      for (let i = 1; i < words.length - 1; i++) {
        if (measureTracked(ctx, words.slice(0, i + 1).join(' '), 1) > beside) break;
        split = i;
      }
      const first = words.slice(0, split + 1).join(' ');
      const second = words.slice(split + 1).join(' ');
      if (
        measureTracked(ctx, first, 1) <= beside &&
        measureTracked(ctx, second, 1) <= L.CW
      ) {
        return { lines: [first, second], size: s, firstBaseline: L.rowBase - s - 14 * L.k };
      }
    }
  }

  // One unbreakable word — one line, trimmed.
  const small = fitSize(ctx, title, 700, stack, beside, fs(78), fs(34), 1);
  return {
    lines: [ellipsize(ctx, title, beside, 1)],
    size: small,
    firstBaseline: L.rowBase,
  };
}

interface Tile {
  label: string;
  value: string;
  accent: boolean;
  /** Small right-aligned qualifier on the label row, e.g. "48 САР". */
  note: string;
}

const LABEL_TRACK = 0.17; // tracking as a share of the label size
const NOTE_RATIO = 0.85; // note size as a share of the label size

function drawTiles(ctx: Ctx, c: PosterContent, L: PosterLayout) {
  const fs = (n: number) => Math.round(n * L.k);
  const sp = (n: number) => n * L.k;

  const tiles: Tile[] = [
    { label: t.admin.poster.priceLabel, value: c.priceLabel, accent: true, note: '' },
    { label: t.admin.poster.downLabel, value: c.downLabel, accent: false, note: '' },
    {
      label: t.admin.poster.monthlyLabel,
      value: c.monthlyLabel,
      accent: false,
      // The monthly figure means nothing without the term it was worked
      // out over, so the poster says so instead of leaving it implied.
      note: c.termLabel,
    },
  ];
  const gap = sp(16);
  const w = (L.CW - gap * 2) / 3;
  const pad = sp(22);
  const inner = w - pad * 2;
  // Inner baselines follow the tile height, so both formats sit the same.
  const labelBase = L.tilesY + L.tileH * 0.331;
  const valueBase = L.tilesY + L.tileH * 0.779;

  // One label size across all three tiles, set by whichever needs the most
  // room — a single shrunken label beside two full-size ones reads as a
  // mistake, and only the monthly tile carries a note.
  let labelSize = fs(23);
  const minLabel = fs(15);
  while (
    labelSize > minLabel &&
    tiles.some((tile) => tileLabelWidth(ctx, tile, labelSize, c.fontStack, sp(12)) > inner)
  ) {
    labelSize -= 1;
  }
  const noteSize = Math.round(labelSize * NOTE_RATIO);
  const tracking = labelSize * LABEL_TRACK;

  tiles.forEach((tile, i) => {
    const x = L.M + i * (w + gap);
    roundRectPath(ctx, x, L.tilesY, w, L.tileH, sp(16));
    ctx.fillStyle = tile.accent ? RED : TILE_BG;
    ctx.fill();
    if (!tile.accent) {
      ctx.strokeStyle = TILE_LINE;
      ctx.lineWidth = sp(1.5);
      ctx.stroke();
    }

    let labelRoom = inner;
    if (tile.note) {
      const note = tile.note.toUpperCase();
      ctx.font = font(600, noteSize, c.fontStack);
      const noteW = measureTracked(ctx, note, tracking * 0.8);
      ctx.fillStyle = tile.accent ? 'rgba(255,255,255,0.7)' : '#6f6f6f';
      fillTracked(ctx, note, x + w - pad - noteW, labelBase, tracking * 0.8);
      labelRoom -= noteW + sp(12);
    }

    ctx.font = font(600, labelSize, c.fontStack);
    ctx.fillStyle = tile.accent ? 'rgba(255,255,255,0.88)' : MUTED;
    fillTracked(
      ctx,
      ellipsize(ctx, tile.label.toUpperCase(), labelRoom, tracking),
      x + pad,
      labelBase,
      tracking
    );

    fitSize(ctx, tile.value, 700, c.fontStack, inner, fs(50), fs(24));
    ctx.fillStyle = WHITE;
    ctx.fillText(tile.value, x + pad, valueBase);
  });
}

/** Label plus its note, at `size`, as the label row would draw them. */
function tileLabelWidth(
  ctx: Ctx,
  tile: Tile,
  size: number,
  stack: string,
  noteGap: number
): number {
  const tracking = size * LABEL_TRACK;
  ctx.font = font(600, size, stack);
  let width = measureTracked(ctx, tile.label.toUpperCase(), tracking);
  if (tile.note) {
    ctx.font = font(600, Math.round(size * NOTE_RATIO), stack);
    width += noteGap + measureTracked(ctx, tile.note.toUpperCase(), tracking * 0.8);
  }
  return width;
}

/**
 * "Сарын төлбөрийг 48 сарын лизингээр бодсон дундаж дүн." — the small
 * print between the tiles and the contact bar. The tile already carries
 * the term, but a number this prominent deserves saying in full.
 */
function drawTermNote(ctx: Ctx, c: PosterContent, L: PosterLayout) {
  if (!c.termNote) return;
  const fs = (n: number) => Math.round(n * L.k);
  fitSize(ctx, c.termNote, 500, c.fontStack, L.CW, fs(23), fs(16));
  ctx.fillStyle = '#7d7d7d';
  ctx.fillText(ellipsize(ctx, c.termNote, L.CW, 0), L.M, L.noteBase);
}

/**
 * Red contact bar: phone on the left and the web address on the right of
 * one line, then a hairline, then the address centred beneath it. The
 * rule and the centring are what stop the address reading as an
 * afterthought squeezed into the bottom edge. Every position inside the
 * bar is a share of its height, so it holds together at either format.
 */
function drawFooter(ctx: Ctx, c: PosterContent, L: PosterLayout) {
  const fs = (n: number) => Math.round(n * L.k);
  const sp = (n: number) => n * L.k;

  ctx.fillStyle = RED;
  ctx.fillRect(0, L.barY, L.W, L.H - L.barY);

  // The two lines are laid out as one block and centred in the bar, rather
  // than pinned at percentages of its height — the reel's bar is taller
  // than the feed's by more than its type is bigger, and percentages would
  // leave a pool of empty red above the phone number.
  const blockTop = L.barY + (L.barH - sp(112)) / 2;
  const base = c.address ? blockTop + sp(56) : L.barY + L.barH / 2 + sp(22);

  if (c.website) {
    const size = fitSize(ctx, c.website, 700, c.fontStack, sp(380), fs(40), fs(22), sp(2));
    ctx.fillStyle = WHITE;
    fillTracked(
      ctx,
      c.website,
      L.W - L.M - measureTracked(ctx, c.website, sp(2)),
      base - Math.round(size * 0.15),
      sp(2)
    );
  }

  if (c.phone) {
    let x = L.M;
    const label = t.contact.phone.toUpperCase();
    ctx.font = font(500, fs(30), c.fontStack);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    fillTracked(ctx, label, x, base, sp(4));
    x += measureTracked(ctx, label, sp(4)) + sp(22);

    // Leave room for the web address on the right of the same line.
    fitSize(ctx, c.phone, 700, c.fontStack, L.W - L.M - sp(420) - x, fs(66), fs(34));
    ctx.fillStyle = WHITE;
    ctx.fillText(c.phone, x, base);
  }

  if (!c.address) return;

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(L.M, blockTop + sp(70), L.CW, sp(1.5));

  fitSize(ctx, c.address, 500, c.fontStack, L.CW, fs(26), fs(17));
  ctx.fillStyle = WHITE;
  ctx.textAlign = 'center';
  ctx.fillText(ellipsize(ctx, c.address, L.CW, 0), L.W / 2, blockTop + sp(110));
  ctx.textAlign = 'left';
}

/** Repaints `canvas` with the poster. Sizes the bitmap itself. */
export function drawPoster(
  canvas: HTMLCanvasElement,
  content: PosterContent,
  format: PosterFormat = 'feed',
  scale: number = POSTER_SCALE
) {
  const L = POSTER_LAYOUTS[format] ?? POSTER_LAYOUTS.feed;
  canvas.width = Math.round(L.W * scale);
  canvas.height = Math.round(L.H * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(scale, scale);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, L.W, L.H);

  drawHeader(ctx, content, L);
  drawPhoto(ctx, content, L);
  drawTitleRow(ctx, content, L);
  drawTiles(ctx, content, L);
  drawTermNote(ctx, content, L);
  drawFooter(ctx, content, L);
  ctx.restore();
}
