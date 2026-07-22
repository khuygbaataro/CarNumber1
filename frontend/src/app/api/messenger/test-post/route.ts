import { NextRequest, NextResponse } from 'next/server';
import { postToFeed } from '@/lib/server/messenger';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Manual test for the Facebook auto-post, isolated from the chat flow.
// Visit: /api/messenger/test-post?token=<MESSENGER_VERIFY_TOKEN>
// Optional: &image=<public-image-url> to also test photo posting.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token || token !== process.env.MESSENGER_VERIFY_TOKEN) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  const image = req.nextUrl.searchParams.get('image');
  const message = `VictoryCar тест пост\n${new Date().toLocaleString('mn-MN')}`;
  const result = await postToFeed(message, image ? [image] : []);
  return NextResponse.json(result);
}
