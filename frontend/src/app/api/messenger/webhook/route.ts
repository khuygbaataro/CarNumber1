import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/server/db';
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

  // Process events sequentially so per-sender state stays consistent.
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
        if (ok > 0) {
          await sendText(
            ev.senderId,
            `Зураг хүлээж авлаа (${ok} ширхэг). Одоо нийт ${(session.images || []).length} зурагтай.`
          );
        } else {
          await sendText(
            ev.senderId,
            'Зураг хадгалахад алдаа гарлаа. Cloudinary тохиргоог шалгана уу.'
          );
        }
      }

      // 2) Handle text.
      if (ev.text && ev.text.trim()) {
        const reply = await handleUserText(session, ev.text.trim());
        session.markModified('messages');
        session.markModified('images');
        await session.save();
        await sendText(ev.senderId, reply);
      }
    } catch (e) {
      console.error('event handling failed', e);
      try {
        await sendText(ev.senderId, 'Уучлаарай, алдаа гарлаа. Дахин оролдоно уу.');
      } catch {
        /* ignore */
      }
    }
  }

  return NextResponse.json({ ok: true });
}
