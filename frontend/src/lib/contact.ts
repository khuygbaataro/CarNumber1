// Contact-link helpers. Everything here is derived from the settings the
// admin already fills in (contact.phone, social.facebook) — no new backend
// fields, no new env vars. Every helper returns null when it cannot build a
// usable link, so callers just hide the button instead of rendering a
// broken one.

/** First number when the admin typed several ("9911-2233, 8800-4455"). */
export function primaryPhone(phone?: string): string {
  if (!phone) return '';
  return phone.split(/[,;/]/)[0].trim();
}

/** `tel:` link for the first phone number, digits only. */
export function telHref(phone?: string): string | null {
  const cleaned = primaryPhone(phone).replace(/[^\d+]/g, '');
  return cleaned.replace(/\D/g, '').length >= 6 ? `tel:${cleaned}` : null;
}

// Path segments that are part of Facebook's URL structure rather than the
// page's own handle.
const FB_RESERVED = new Set(['pages', 'pg', 'people', 'profile.php', 'p', 'groups']);

/**
 * Turn the admin's Facebook page URL into a Messenger deep link so the
 * button opens the Messenger app directly. Handles the common shapes:
 *
 *   facebook.com/victorycar              → m.me/victorycar
 *   facebook.com/profile.php?id=123456   → m.me/123456
 *   facebook.com/pages/Some-Name/123456  → m.me/123456
 *   m.me/victorycar                      → unchanged
 */
export function messengerHref(facebookUrl?: string): string | null {
  const url = facebookUrl?.trim();
  if (!url) return null;

  // Already a Messenger link.
  const direct = url.match(/m\.me\/([^/?#]+)/i);
  if (direct) return `https://m.me/${direct[1]}`;

  // Numeric page id carried in a query string or a /people/ URL.
  const byId = url.match(/[?&]id=(\d+)/) || url.match(/\/people\/[^/]+\/(\d+)/);
  if (byId) return `https://m.me/${byId[1]}`;

  const afterHost = url.match(/(?:facebook\.com|fb\.com|fb\.me)\/(.+)/i);
  if (!afterHost) return null;

  const segments = afterHost[1].split(/[?#]/)[0].split('/').filter(Boolean);
  // /pages/Some-Name/123456 — the numeric id is what m.me needs.
  const numeric = segments.find((s) => /^\d{5,}$/.test(s));
  if (numeric) return `https://m.me/${numeric}`;

  const slug = segments.find((s) => !FB_RESERVED.has(s.toLowerCase()));
  return slug ? `https://m.me/${slug}` : null;
}
