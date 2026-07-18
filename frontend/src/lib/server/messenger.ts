import crypto from 'crypto';

const PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN || '';
const APP_SECRET = process.env.MESSENGER_APP_SECRET || '';
const GRAPH_URL = 'https://graph.facebook.com/v19.0/me/messages';

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
  if (!PAGE_ACCESS_TOKEN) return;
  try {
    await fetch(`${GRAPH_URL}?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        messaging_type: 'RESPONSE',
        message: { text: text.slice(0, 1900) },
      }),
    });
  } catch (e) {
    console.error('sendText failed', e);
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
