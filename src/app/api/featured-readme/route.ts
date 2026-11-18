import { NextResponse } from 'next/server';

// The homepage shows the maintainer's final, already-deployed README. Reading
// the raw file is CDN-served (no GitHub API token, no rate limit) and this route
// is cached, so visitors never trigger a fresh profile ingestion.
export const revalidate = 300;

const MAINTAINER = process.env.FEATURED_README_USER || 'ErBharatMalhotra';
const RAW_README_URL = `https://raw.githubusercontent.com/${MAINTAINER}/${MAINTAINER}/main/README.md`;

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

export async function GET() {
  try {
    const res = await fetch(RAW_README_URL, {
      headers: { Accept: 'text/plain', 'User-Agent': 'ReadmeCraft' },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { markdown: null },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } }
      );
    }

    const markdown = (await res.text()).trim();
    return NextResponse.json({ markdown: markdown || null }, { headers: CACHE_HEADERS });
  } catch {
    // Never break the homepage: the client keeps its local sample on failure.
    return NextResponse.json(
      { markdown: null },
      { headers: { 'Cache-Control': 'public, s-maxage=60' } }
    );
  }
}
