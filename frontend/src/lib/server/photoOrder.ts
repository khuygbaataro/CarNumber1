import Anthropic from '@anthropic-ai/sdk';
import { originalImageUrl } from '../imageUrl';

/**
 * Puts a car's photos in the order a buyer wants to see them.
 *
 * Messenger does not promise to deliver a batch of photos in the order they
 * were picked, and it often does not, so the first one is as likely to be a
 * back seat as the car itself — and the first one is the cover, on the site
 * and in the Facebook post. Reordering it by hand afterwards is the job this
 * replaces.
 *
 * The order is the one a seller would choose:
 *   the three-quarter front from the left, then the front, then the rest of
 *   the outside, then the inside, then everything else.
 *
 * Within a group the photos keep the order they arrived in, so a sequence
 * the sender did mean — three angles of the same damage, say — survives.
 *
 * Nothing here can stop a car being published. Every failure path returns
 * the photos exactly as they came in.
 */

const GROUPS = ['front_left', 'front', 'exterior', 'interior', 'other'] as const;
type Group = (typeof GROUPS)[number];

/** Sorting photos is a small job; the catalogue's writing model is not needed. */
const MODEL = process.env.PHOTO_SORT_MODEL || 'claude-haiku-4-5-20251001';

/** Set PHOTO_SORT=off to leave photos in the order they arrived. */
const ENABLED = process.env.PHOTO_SORT !== 'off';

/** Past this a car is being documented rather than sold. */
const MAX_PHOTOS = 24;

/** The publish must not wait on this. Comfortably inside the webhook's own 60s. */
const TIMEOUT_MS = 25_000;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * The untouched upload, small.
 *
 * The stored url carries the watermark; the gold pills and the logo are
 * exactly the sort of thing a classifier reads as content, so the original
 * goes to the model instead. 360px is plenty to tell a bonnet from a seat.
 */
const thumb = (url: string) =>
  originalImageUrl(url).replace('/upload/', '/upload/w_360,c_limit,q_auto/');

const PROMPT = `These are photos of one used car for sale, numbered from 1 in the order given.

Label each photo with exactly one of:
- "front_left": the whole car from outside, three-quarter view showing its front and its left side
- "front": the whole car from outside, straight on from the front
- "exterior": any other view from outside — rear, rear three-quarter, side profile, wheels, lights, badges
- "interior": inside the car — seats, dashboard, steering wheel, boot space, door cards
- "other": engine bay, undercarriage, documents, paperwork, screens, anything else

Reply with only a JSON array of strings, one label per photo, in the same order. No prose, no code fence.`;

/**
 * Reorders `urls` for display. Returns them untouched if sorting is off, if
 * there is nothing to sort, or if anything at all goes wrong.
 */
export async function sortPhotosForDisplay(urls: string[]): Promise<string[]> {
  if (!ENABLED) return urls;
  if (!Array.isArray(urls) || urls.length < 2) return urls;
  if (!process.env.ANTHROPIC_API_KEY) return urls;

  // Only the first MAX_PHOTOS are classified; the rest keep their place at
  // the end rather than being dropped.
  const head = urls.slice(0, MAX_PHOTOS);
  const tail = urls.slice(MAX_PHOTOS);

  try {
    const resp = await anthropic.messages.create(
      {
        model: MODEL,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              ...head.map((url) => ({
                type: 'image' as const,
                source: { type: 'url' as const, url: thumb(url) },
              })),
              { type: 'text' as const, text: PROMPT },
            ],
          },
        ],
      },
      { timeout: TIMEOUT_MS, maxRetries: 1 }
    );

    const text = resp.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return urls;

    const labels: unknown = JSON.parse(match[0]);
    if (!Array.isArray(labels)) return urls;

    const rank = (i: number) => {
      const at = GROUPS.indexOf(String(labels[i] ?? '').toLowerCase() as Group);
      // A label the model did not give, or one it invented, sorts to the back
      // — never in front of a photo it did recognise.
      return at === -1 ? GROUPS.length : at;
    };

    const sorted = head
      .map((url, i) => ({ url, rank: rank(i), i }))
      .sort((a, b) => a.rank - b.rank || a.i - b.i)
      .map((x) => x.url);

    const moved = sorted.findIndex((url, i) => url !== head[i]);
    console.log(
      `[photoOrder] ${head.length} photos, ${moved === -1 ? 'order unchanged' : 'reordered'}`
    );
    return [...sorted, ...tail];
  } catch (error) {
    // A cover in the wrong order is a blemish; a car that cannot be added is
    // an outage. This never decides whether a car is saved.
    console.error(
      '[photoOrder] left as sent:',
      error instanceof Error ? error.message : error
    );
    return urls;
  }
}
