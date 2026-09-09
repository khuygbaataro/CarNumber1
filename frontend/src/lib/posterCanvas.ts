// Draws the downloadable vehicle poster onto a canvas.
//
// The whole layout is written against a fixed 1080 × 1350 (4:5 — the
// portrait shape Facebook and Instagram show largest) coordinate space and
// then drawn through a scale transform. One set of numbers therefore
// produces both the small preview in the modal and the full-resolution PNG.

import { t } from './labels';

export const POSTER_W = 1080;
export const POSTER_H = 1350;
/** Export multiplier — 2 gives a 2160 × 2700 PNG, crisp in any feed. */
export const POSTER_SCALE = 2;

// Poster palette. Deliberately independent of the site's blue theme: this
// is the black/red identity of the printed and posted material.
const RED = '#e11b22';
const BLACK = '#070707';
const TILE_BG = '#161616';
const TILE_LINE = '#2c2c2c';
const WHITE = '#ffffff';
const MUTED = '#8f8f8f';

const M = 56; // outer margin
const CW = POSTER_W - M * 2; // content width — 968

const HEADER_Y = 28;
const LOGO_H = 88;
const LOGO_MAX_W = 330;

const PHOTO_Y = 136;
const PHOTO_H = Math.round((CW * 3) / 4); // 4:3 photo — 726
const PHOTO_R = 16;

const ROW_BASE = 978; // title baseline; the chips sit on the same line
const CHIP_H = 56;

const TILES_Y = 1012;
const TILE_H = 140;

const BAR_Y = 1204; // red contact bar, runs to the bottom edge

export interface PosterContent {
  title: string; // "TOYOTA AQUA"
  yearLabel: string; // "2015"
  mileageLabel: string; // "98,000 км"
  priceLabel: string;
  downLabel: string;
  monthlyLabel: string;
  termLabel: string; // "48 сар" — qualifies the monthly figure
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

function drawHeader(ctx: Ctx, c: PosterContent) {
  // The badge is measured first; the logo takes whatever width is left.
  const badgeText = c.badge.trim().toUpperCase();
  const badgeH = 66;
  const badgeY = HEADER_Y + (LOGO_H - badgeH) / 2;
  let badgeW = 0;

  if (badgeText) {
    ctx.font = font(700, 30, c.fontStack);
    badgeW = measureTracked(ctx, badgeText, 5) + 56;
    const bx = POSTER_W - M - badgeW;
    ctx.fillStyle = RED;
    roundRectPath(ctx, bx, badgeY, badgeW, badgeH, 6);
    ctx.fill();
    ctx.fillStyle = WHITE;
    fillTracked(ctx, badgeText, bx + 28, badgeY + badgeH / 2 + 11, 5);
  }

  const logoW = Math.min(LOGO_MAX_W, Math.max(160, CW - badgeW - 40));
  if (c.logo) {
    drawContainLeft(ctx, c.logo, M, HEADER_Y, logoW, LOGO_H);
  } else if (c.companyName) {
    const name = c.companyName.toUpperCase();
    const size = fitSize(ctx, name, 700, c.fontStack, logoW, 46, 24, 2);
    ctx.fillStyle = WHITE;
    fillTracked(ctx, name, M, HEADER_Y + LOGO_H / 2 + size * 0.35, 2);
  }
}

function drawPhoto(ctx: Ctx, c: PosterContent) {
  ctx.save();
  roundRectPath(ctx, M, PHOTO_Y, CW, PHOTO_H, PHOTO_R);
  ctx.clip();

  if (c.photo) {
    drawCover(ctx, c.photo, M, PHOTO_Y, CW, PHOTO_H);
  } else {
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(M, PHOTO_Y, CW, PHOTO_H);
    ctx.fillStyle = MUTED;
    ctx.font = font(500, 32, c.fontStack);
    ctx.textAlign = 'center';
    ctx.fillText(t.common.noImage, POSTER_W / 2, PHOTO_Y + PHOTO_H / 2);
    ctx.textAlign = 'left';
  }

  // Corner tag — drawn inside the clip so it follows the rounded corner.
  const tag = c.companyName.trim().toUpperCase();
  if (tag) {
    ctx.font = font(700, 26, c.fontStack);
    const tagW = Math.min(CW * 0.6, measureTracked(ctx, tag, 5) + 64);
    const tagH = 58;
    const tx = M + CW - tagW;
    const ty = PHOTO_Y + PHOTO_H - tagH;
    ctx.fillStyle = RED;
    roundRectPath(ctx, tx, ty, tagW, tagH, [PHOTO_R, 0, 0, 0]);
    ctx.fill();
    ctx.fillStyle = WHITE;
    fillTracked(ctx, ellipsize(ctx, tag, tagW - 64, 5), tx + 32, ty + tagH / 2 + 9, 5);
  }
  ctx.restore();

  // Frame last, so it stays crisp on top of the photo.
  ctx.strokeStyle = RED;
  ctx.lineWidth = 3;
  roundRectPath(ctx, M + 1.5, PHOTO_Y + 1.5, CW - 3, PHOTO_H - 3, PHOTO_R - 1);
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
function drawTitleRow(ctx: Ctx, c: PosterContent) {
  const chips = [
    { label: t.admin.poster.yearChip, value: c.yearLabel },
    { label: t.admin.poster.mileageChip, value: c.mileageLabel },
  ].filter((chip) => chip.value);

  // Measured at full size first: the title is laid out against the width
  // that leaves, and shrinking the chips afterwards only ever gives it more.
  const full = measureChips(ctx, chips, CHIP_H, c.fontStack);
  const beside = Math.max(220, POSTER_W - M * 2 - full.total - 28);

  const title = c.title.trim().toUpperCase();
  const layout = layoutTitle(ctx, title, c.fontStack, beside);

  const chipH = layout.lines.length > 1 ? 46 : CHIP_H;
  const metrics = chipH === CHIP_H ? full : measureChips(ctx, chips, chipH, c.fontStack);
  // Chips centre on the first line's optical middle, whatever size it took.
  const chipY = layout.firstBaseline - layout.size * 0.36 - chipH / 2;

  let cx = POSTER_W - M - metrics.total;
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

    cx += w + 14;
  });

  if (!title) return;
  ctx.font = font(700, layout.size, c.fontStack);
  ctx.fillStyle = WHITE;
  layout.lines.forEach((line, i) => {
    fillTracked(ctx, line, M, layout.firstBaseline + i * (layout.size + 14), 1);
  });
}

function measureChips(
  ctx: Ctx,
  chips: { label: string; value: string }[],
  chipH: number,
  stack: string
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
    total: widths.reduce((a, b) => a + b, 0) + 14 * Math.max(0, chips.length - 1),
  };
}

interface TitleLayout {
  lines: string[];
  size: number;
  /** Baseline of the first line. The last line always lands on ROW_BASE. */
  firstBaseline: number;
}

function layoutTitle(ctx: Ctx, title: string, stack: string, beside: number): TitleLayout {
  if (!title) return { lines: [], size: 78, firstBaseline: ROW_BASE };

  // One line, as large as it can be next to the chips.
  const size = fitSize(ctx, title, 700, stack, beside, 78, 48, 1);
  if (measureTracked(ctx, title, 1) <= beside) {
    return { lines: [title], size, firstBaseline: ROW_BASE };
  }

  // Two lines: first beside the chips, the rest across the full width.
  const words = title.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    for (let s = 50; s >= 34; s -= 1) {
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
        measureTracked(ctx, second, 1) <= CW
      ) {
        return { lines: [first, second], size: s, firstBaseline: ROW_BASE - s - 14 };
      }
    }
  }

  // One unbreakable word — one line, trimmed.
  const small = fitSize(ctx, title, 700, stack, beside, 78, 34, 1);
  return {
    lines: [ellipsize(ctx, title, beside, 1)],
    size: small,
    firstBaseline: ROW_BASE,
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

function drawTiles(ctx: Ctx, c: PosterContent) {
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
  const gap = 16;
  const w = (CW - gap * 2) / 3;
  const pad = 22;
  const inner = w - pad * 2;

  // One label size across all three tiles, set by whichever needs the most
  // room — a single shrunken label beside two full-size ones reads as a
  // mistake, and only the monthly tile carries a note.
  let labelSize = 23;
  while (labelSize > 15 && tiles.some((tile) => tileLabelWidth(ctx, tile, labelSize, c.fontStack) > inner)) {
    labelSize -= 1;
  }
  const noteSize = Math.round(labelSize * NOTE_RATIO);
  const tracking = labelSize * LABEL_TRACK;

  tiles.forEach((tile, i) => {
    const x = M + i * (w + gap);
    roundRectPath(ctx, x, TILES_Y, w, TILE_H, 16);
    ctx.fillStyle = tile.accent ? RED : TILE_BG;
    ctx.fill();
    if (!tile.accent) {
      ctx.strokeStyle = TILE_LINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    let labelRoom = inner;
    if (tile.note) {
      const note = tile.note.toUpperCase();
      ctx.font = font(600, noteSize, c.fontStack);
      const noteW = measureTracked(ctx, note, tracking * 0.8);
      ctx.fillStyle = tile.accent ? 'rgba(255,255,255,0.7)' : '#6f6f6f';
      fillTracked(ctx, note, x + w - pad - noteW, TILES_Y + 46, tracking * 0.8);
      labelRoom -= noteW + 12;
    }

    ctx.font = font(600, labelSize, c.fontStack);
    ctx.fillStyle = tile.accent ? 'rgba(255,255,255,0.88)' : MUTED;
    fillTracked(
      ctx,
      ellipsize(ctx, tile.label.toUpperCase(), labelRoom, tracking),
      x + pad,
      TILES_Y + 46,
      tracking
    );

    fitSize(ctx, tile.value, 700, c.fontStack, inner, 50, 24);
    ctx.fillStyle = WHITE;
    ctx.fillText(tile.value, x + pad, TILES_Y + 108);
  });
}

/** Label plus its note, at `size`, as the label row would draw them. */
function tileLabelWidth(ctx: Ctx, tile: Tile, size: number, stack: string): number {
  const tracking = size * LABEL_TRACK;
  ctx.font = font(600, size, stack);
  let width = measureTracked(ctx, tile.label.toUpperCase(), tracking);
  if (tile.note) {
    ctx.font = font(600, Math.round(size * NOTE_RATIO), stack);
    width += 12 + measureTracked(ctx, tile.note.toUpperCase(), tracking * 0.8);
  }
  return width;
}

function drawFooter(ctx: Ctx, c: PosterContent) {
  ctx.fillStyle = RED;
  ctx.fillRect(0, BAR_Y, POSTER_W, POSTER_H - BAR_Y);

  // With an address underneath, the phone line sits higher in the bar.
  const base = BAR_Y + (c.address ? 74 : 90);

  if (c.website) {
    const size = fitSize(ctx, c.website, 700, c.fontStack, 380, 40, 22, 2);
    ctx.fillStyle = WHITE;
    fillTracked(
      ctx,
      c.website,
      POSTER_W - M - measureTracked(ctx, c.website, 2),
      base - Math.round(size * 0.15),
      2
    );
  }

  if (c.phone) {
    let x = M;
    const label = t.contact.phone.toUpperCase();
    ctx.font = font(500, 30, c.fontStack);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    fillTracked(ctx, label, x, base, 4);
    x += measureTracked(ctx, label, 4) + 22;

    // Leave room for the web address on the right of the same line.
    fitSize(ctx, c.phone, 700, c.fontStack, POSTER_W - M - 420 - x, 70, 34);
    ctx.fillStyle = WHITE;
    ctx.fillText(c.phone, x, base);
  }

  if (c.address) {
    fitSize(ctx, c.address, 500, c.fontStack, CW, 27, 18);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(ellipsize(ctx, c.address, CW, 0), M, BAR_Y + 118);
  }
}

/** Repaints `canvas` with the poster. Sizes the bitmap itself. */
export function drawPoster(
  canvas: HTMLCanvasElement,
  content: PosterContent,
  scale: number = POSTER_SCALE
) {
  canvas.width = Math.round(POSTER_W * scale);
  canvas.height = Math.round(POSTER_H * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.save();
  ctx.scale(scale, scale);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);

  drawHeader(ctx, content);
  drawPhoto(ctx, content);
  drawTitleRow(ctx, content);
  drawTiles(ctx, content);
  drawFooter(ctx, content);
  ctx.restore();
}
