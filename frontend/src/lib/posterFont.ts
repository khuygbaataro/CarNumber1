// Font used by the downloadable vehicle poster.
//
// Oswald is the closest free match to the condensed heavy lettering the
// poster design uses, and it ships a Cyrillic subset — so "САРЫН ТӨЛБӨР"
// renders in the same face as "TOYOTA AQUA". Canvas draws with a plain
// family string, so the stack keeps condensed system fallbacks behind it:
// if the webfont never arrives, the poster still comes out readable.
import { Oswald } from 'next/font/google';

export const posterFont = Oswald({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700'],
  display: 'swap',
});

export const POSTER_FONT_STACK = `${posterFont.style.fontFamily}, "Arial Narrow", Arial, sans-serif`;

// Every glyph class the poster can draw — Cyrillic labels, a Latin model
// name, digits and the tugrik sign. Passing them to fonts.load() makes the
// browser fetch each unicode-range subset the poster actually needs.
const SAMPLE = 'ҮНЭ ТӨЛБӨР TOYOTA 0123456789₮';

/**
 * Resolve the webfont before the first draw. Canvas silently falls back to
 * the next family in the stack when a font is not loaded yet, and it does
 * not repaint once it arrives — so the poster must wait, not re-render.
 */
export async function ensurePosterFont(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const family = posterFont.style.fontFamily.split(',')[0].trim();
  try {
    await Promise.all(
      [500, 600, 700].map((weight) =>
        document.fonts.load(`${weight} 64px ${family}`, SAMPLE)
      )
    );
  } catch {
    /* fall back to the system stack — the poster still renders */
  }
}
