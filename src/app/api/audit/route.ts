import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auditReadme } from '@/lib/badge-audit';

const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

export const revalidate = 300;

async function fetchProfileReadme(
  username: string
): Promise<{ markdown: string | null; readmeUrl: string | null; status: number }> {
  const readmeUrl = `https://github.com/${username}/${username}#readme`;
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  try {
    // JSON + base64 instead of `Accept: application/vnd.github.raw`: the raw
    // media type goes through a redirect, and the production fetch cache can
    // hand back an empty 200 body for it. The JSON endpoint is stable.
    const endpoint = `https://api.github.com/repos/${username}/${username}/readme`;
    const baseHeaders: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ReadmeCraft-Auditor',
    };

    let res = await fetch(endpoint, {
      headers: token ? { ...baseHeaders, Authorization: `Bearer ${token}` } : baseHeaders,
      next: { revalidate: 300 },
    });

    // A stale or revoked server token would otherwise take the whole feature
    // down (GitHub answers 401 "Bad credentials"). Anonymous reads are enough
    // for a public profile README, so retry without it.
    if (token && (res.status === 401 || res.status === 403)) {
      console.warn(`[audit] server token rejected (${res.status}); retrying anonymously`);
      res = await fetch(`${endpoint}?anon=1`, {
        headers: baseHeaders,
        next: { revalidate: 300 },
      });
    }

    if (res.status === 404) {
      return { markdown: null, readmeUrl, status: 404 };
    }
    if (!res.ok) {
      // Server-side diagnostic: never surfaced to the client, but without it a
      // failing GitHub call is indistinguishable from a bad username.
      const detail = await res.text().catch(() => '');
      console.warn(
        `[audit] GitHub readme fetch failed for ${username}: ${res.status} ${detail.slice(0, 160)}`
      );
      return { markdown: null, readmeUrl, status: res.status };
    }
    const payload = (await res.json()) as {
      content?: string;
      encoding?: string;
      download_url?: string | null;
    };

    if (payload.content && payload.encoding === 'base64') {
      const decoded = Buffer.from(payload.content, 'base64').toString('utf8').trim();
      return { markdown: decoded || null, readmeUrl, status: decoded ? 200 : 0 };
    }

    // Files above the 1 MB JSON limit come back without inline content.
    if (payload.download_url) {
      const raw = await fetch(payload.download_url, {
        headers: { 'User-Agent': 'ReadmeCraft-Auditor' },
        next: { revalidate: 300 },
      });
      if (raw.ok) {
        const text = (await raw.text()).trim();
        return { markdown: text || null, readmeUrl, status: text ? 200 : 0 };
      }
    }

    console.warn(`[audit] GitHub readme payload for ${username} had no usable content`);
    return { markdown: null, readmeUrl, status: 0 };
  } catch {
    return { markdown: null, readmeUrl, status: 0 };
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = (searchParams.get('username') || searchParams.get('u') || '').trim();

  if (!username) {
    return NextResponse.json({ error: 'username is required' }, { status: 400 });
  }
  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json({ error: 'not a valid GitHub username' }, { status: 400 });
  }

  const readme = await fetchProfileReadme(username);

  const headers = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' };

  if (readme.status === 0) {
    return NextResponse.json(
      { error: 'Could not reach GitHub. Try again in a moment.' },
      { status: 502, headers }
    );
  }

  if (!readme.markdown) {
    return NextResponse.json(
      {
        error:
          readme.status === 404
            ? `No profile README found. Create a public repository named "${username}" and add a README.md to audit it.`
            : 'GitHub returned an unexpected response. Try again in a moment.',
      },
      { status: readme.status === 404 ? 404 : 502, headers }
    );
  }

  const report = auditReadme({
    username,
    readmeUrl: readme.readmeUrl,
    readmeFound: true,
    markdown: readme.markdown,
  });

  return NextResponse.json(report, { headers });
}
