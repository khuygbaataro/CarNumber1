import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
import { BotSession } from '@/lib/server/models';
import type { MessagingEvent } from '@/lib/server/messenger';
import { getSession, handleUserText } from '@/lib/server/bot';
import { uploadImageFromUrl } from '@/lib/server/cloudinary';
import { verifySignature, sendText, parseEvents } from '@/lib/server/messenger';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Pro: allow time for Claude + Cloudinary

const VERIFY_TOKEN = process.env.MESSENGER_VERIFY_TOKEN || '';

// Comma-separated list of Facebook PSIDs allowed to add/sell cars.
function adminIds(): Set<string> {
  return new Set(
    (process.env.MESSENGER_ADMIN_IDS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

// GET — Facebook webhook verification handshake.
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');
  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  // Diagnostic (no secrets): shows why verification failed in Vercel logs.
  console.log(
    `[messenger verify] mode=${mode} envSet=${VERIFY_TOKEN.length > 0} ` +
      `tokenProvided=${Boolean(token)} match=${token === VERIFY_TOKEN} ` +
      `hasChallenge=${Boolean(challenge)}`
  );
  return new NextResponse('Forbidden', { status: 403 });
}

// POST — incoming messages.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Invalid signature', { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse('Bad request', { status: 400 });
  }

  if (body?.object !== 'page') return NextResponse.json({ ok: true });

  const events = parseEvents(body);
  const admins = adminIds();
  console.log(
    `[messenger] events=${events.length} senders=${events
      .map((e) => e.senderId)
      .join(',')} adminCount=${admins.size}`
  );

  // Process inline before replying so the response is guaranteed to be sent.
  await processEvents(events, admins);
  return NextResponse.json({ ok: true });
}

async function processEvents(events: MessagingEvent[], admins: Set<string>) {
  // Sequential so per-sender state stays consistent.
  for (const ev of events) {
    try {
      if (admins.size > 0 && !admins.has(ev.senderId)) {
        await sendText(
          ev.senderId,
          'Сайн байна уу. Энэ бол VictoryCar-ийн дотоод бот бөгөөд зөвхөн эрх бүхий ажилтан ашиглах боломжтой.'
        );
        continue;
      }

      await connectDB();

      // Skip webhook redeliveries: FB re-sends events when a response is
      // slow, which caused duplicate replies and version conflicts. Atomic
      // check-and-record of the message id; a duplicate either matches
      // nothing or hits the unique senderId index on upsert.
      if (ev.mid) {
        try {
          const r = await BotSession.updateOne(
            { senderId: ev.senderId, processedMids: { $ne: ev.mid } },
            { $push: { processedMids: { $each: [ev.mid], $slice: -50 } } },
            { upsert: true }
          );
          if (r.matchedCount === 0 && !r.upsertedCount) continue;
        } catch {
          continue; // duplicate key → already being processed
        }
      }

      const session = await getSession(ev.senderId);

      // Built-in command: wipe the draft + history and start fresh.
      if (ev.text && ev.text.trim().toLowerCase() === 'reset') {
        session.messages = [];
        session.images = [];
        session.imageAt = [];
        session.markModified('messages');
        session.markModified('images');
        await session.save();
        await sendText(ev.senderId, 'Шинэ эхэллээ. Мэдээллээ оруулаарай.');
        continue;
      }

      let text = ev.text?.trim() || '';

      // 1) Store attached photos, then tell the model about them so it can
      // decide the reply (e.g. jump straight to the confirm summary when
      // everything else is already collected).
      //
      // Facebook delivers each photo as its own webhook call, and Vercel runs
      // those in parallel. Reading the draft, appending, and saving the whole
      // document back — which is what this did — is a lost update waiting to
      // happen: two calls both read five photos, each saves six, and one
      // photo is gone and the order is whoever finished last. Worse, saving
      // the whole document also wrote back a stale processedMids, so a
      // message id another call had just recorded was erased and Facebook's
      // redelivery of it sailed through the duplicate check — which is how
      // the same photo arrived twice and, being last, became the cover.
      //
      // So photos are appended with one atomic push, and nothing else on the
      // document is touched. Each carries Facebook's timestamp for the
      // message it came in, because the order they finish uploading is the
      // order of their file sizes, not the order they were sent.
      if (ev.imageUrls.length > 0) {
        const stored: string[] = [];
        let lastErr = '';
        for (const url of ev.imageUrls) {
          try {
            stored.push(await uploadImageFromUrl(url));
          } catch (e) {
            lastErr = e instanceof Error ? e.message : String(e);
            console.error('image upload failed:', lastErr);
          }
        }

        if (stored.length === 0) {
          await sendText(ev.senderId, `Зураг хадгалахад алдаа: ${lastErr.slice(0, 300)}`);
        } else {
          // Within one message the attachments keep their own order, so the
          // index is a tiebreak under the message's timestamp.
          const base = (ev.at ?? Date.now()) * 1000;
          const keys = stored.map((_, i) => base + i);
          const after = await BotSession.findOneAndUpdate(
            { senderId: ev.senderId },
            { $push: { images: { $each: stored }, imageAt: { $each: keys } } },
            { new: true, projection: { images: 1 } }
          ).lean<{ images?: string[] }>();
          // The count comes from what the database now holds, not from this
          // call's own copy, so it stays right while photos are still landing.
          const total = after?.images?.length ?? stored.length;
          session.images = after?.images ?? stored;
          text = `[${stored.length} зураг ирлээ, нийт ${total}]${text ? ' ' + text : ''}`;
        }
      }

      // 2) Run the model turn (user text and/or the photo notification).
      if (text) {
        const before = (session.images || []).length;
        const reply = await handleUserText(session, text);
        const now = (session.images || []).length;

        // Only ever write back what this turn owns. The draft conversation is
        // this call's to save; the photo list is not, unless the turn
        // deliberately emptied it — which is what publishing a car does.
        const update: Record<string, unknown> = { messages: session.messages };
        if (now === 0 && before > 0) {
          update.images = [];
          update.imageAt = [];
        }
        await BotSession.updateOne({ senderId: ev.senderId }, { $set: update });

        await sendText(ev.senderId, reply);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('event handling failed:', msg, e);
      try {
        await sendText(ev.senderId, `Алдаа гарлаа: ${msg.slice(0, 400)}`);
      } catch {
        /* ignore */
      }
    }
  }
}
