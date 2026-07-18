import crypto from 'crypto';

const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN || '';
const APP_SECRET = process.env.MESSENGER_APP_SECRET || '';
const GRAPH_BASE = 'https://graph.facebook.com/v19.0';
const GRAPH_URL = `${GRAPH_BASE}/me/messages`;

// Verify the X-Hub-Signature-256 header against the raw request body.
export function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!APP_SECRET) return true; // no secret configured → skip (dev only)
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const expected = crypto
    .createHmac('sha256', APP_SECRET)
    .update(rawBody, 'utf8')
    .digest('hex');
  const received = signatureHeader.slice('sha256='.length);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(received, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Send a plain text reply to a Messenger user (PSID).
export async function sendText(recipientId: string, text: string): Promise<void> {
  if (!PAGE_ACCESS_TOKEN) {
    console.error('sendText: MESSENGER_PAGE_ACCESS_TOKEN is not set');
    return;
  }
  try {
    const res = await fetch(
      `${GRAPH_URL}?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          messaging_type: 'RESPONSE',
          message: { text: text.slice(0, 1900) },
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`sendText: Graph API ${res.status} — ${body}`);
    }
  } catch (e) {
    console.error('sendText failed', e);
  }
}

// Post a photo album + message to the Facebook PAGE feed (best effort).
// Requires the page token to have the pages_manage_posts permission.
export async function postToFeed(message: string, imageUrls: string[]): Promise<boolean> {
  if (!PAGE_ACCESS_TOKEN) return false;
  const tk = encodeURIComponent(PAGE_ACCESS_TOKEN);
  try {
    // 1) Upload each photo unpublished to get a media_fbid.
    const mediaFbids: string[] = [];
    for (const url of imageUrls.slice(0, 10)) {
      const r = await fetch(`${GRAPH_BASE}/me/photos?access_token=${tk}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, published: false }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.id) mediaFbids.push(j.id);
      else console.error('FB photo upload failed:', JSON.stringify(j));
    }
    // 2) Create the feed post, attaching the uploaded photos.
    const body: any = { message };
    if (mediaFbids.length) body.attached_media = mediaFbids.map((id) => ({ media_fbid: id }));
    const res = await fetch(`${GRAPH_BASE}/me/feed?access_token=${tk}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('FB feed post failed:', await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.error('postToFeed failed', e);
    return false;
  }
}

export interface MessagingEvent {
  senderId: string;
  text?: string;
  imageUrls: string[];
}

// Flatten a webhook payload into a simple list of events we care about.
export function parseEvents(body: any): MessagingEvent[] {
  const out: MessagingEvent[] = [];
  const entries = Array.isArray(body?.entry) ? body.entry : [];
  for (const entry of entries) {
    const messaging = Array.isArray(entry?.messaging) ? entry.messaging : [];
    for (const m of messaging) {
      const senderId = m?.sender?.id;
      if (!senderId || !m?.message) continue;
      if (m.message.is_echo) continue; // ignore the page's own outgoing messages
      const imageUrls: string[] = [];
      const attachments = Array.isArray(m.message.attachments) ? m.message.attachments : [];
      for (const att of attachments) {
        if (att?.type === 'image' && att?.payload?.url) imageUrls.push(att.payload.url);
      }
      out.push({ senderId, text: m.message.text, imageUrls });
    }
  }
  return out;
}
