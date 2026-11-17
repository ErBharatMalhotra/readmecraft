import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fetchGitHubProfile, fetchGitHubProject } from '@/lib/github';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, target, token } = body;

    // Prefer the signed-in user's OAuth token, then an explicit token, then the
    // server PAT. The chosen value never leaves this function.
    const session = await auth();
    const userToken = (session as any)?.accessToken;

    if (!target || typeof target !== 'string' || target.trim() === '') {
      return NextResponse.json({ error: 'Target identifier is required.' }, { status: 400 });
    }

    const effectiveToken = userToken || token || process.env.GITHUB_TOKEN;

    if (mode === 'project') {
      const projectData = await fetchGitHubProject(target.trim(), effectiveToken, effectiveToken);
      return NextResponse.json({ success: true, data: projectData });
    }

    const profileData = await fetchGitHubProfile(target.trim(), effectiveToken, effectiveToken);
    return NextResponse.json({ success: true, data: profileData });
  } catch (error: any) {
    // Detailed diagnostics stay in the server log only. Responses must never
    // include tokens (even prefixes), stack traces or upstream payloads.
    console.error('Ingest API Error:', error?.message || 'unknown error');
    return NextResponse.json(
      { error: 'Failed to ingest GitHub data. Please try again later.' },
      { status: 500 }
    );
  }
}
