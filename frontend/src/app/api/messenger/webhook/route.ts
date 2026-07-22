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

      // 1) Handle attached photos first.
      if (ev.imageUrls.length > 0) {
        let ok = 0;
        let lastErr = '';
        for (const url of ev.imageUrls) {
          try {
            const stored = await uploadImageFromUrl(url);
            session.images = [...(session.images || []), stored];
            ok++;
          } catch (e) {
            lastErr = e instanceof Error ? e.message : String(e);
            console.error('image upload failed:', lastErr);
          }
        }
        session.markModified('images');
        await session.save();
        await sendText(
          ev.senderId,
          ok > 0
            ? `Зураг хүлээж авлаа (${ok} ширхэг). Одоо нийт ${(session.images || []).length} зурагтай.`
            : `Зураг хадгалахад алдаа: ${lastErr.slice(0, 300)}`
        );
      }

      // 2) Handle text.
      if (ev.text && ev.text.trim()) {
        // Built-in command: wipe the draft + history and start fresh.
        if (ev.text.trim().toLowerCase() === 'reset') {
          session.messages = [];
          session.images = [];
          session.markModified('messages');
          session.markModified('images');
          await session.save();
          await sendText(ev.senderId, 'Шинэ эхэллээ. Мэдээллээ оруул.');
          continue;
        }
        const reply = await handleUserText(session, ev.text.trim());
        session.markModified('messages');
        session.markModified('images');
        await session.save();
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
