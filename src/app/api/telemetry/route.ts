import { NextRequest, NextResponse } from 'next/server';
import { generateAnalyticsBadgeSvg, recordView } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username')?.trim();
  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }
  const theme = searchParams.get('theme') || 'gta6';
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  recordView(username, ip);

  const svg = generateAnalyticsBadgeSvg(username, theme);

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}