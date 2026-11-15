import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fetchGitHubProfile, fetchGitHubProject } from '@/lib/github';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, target, token } = body;

    // Get user's OAuth token from session if available
    const session = await auth();
    const userToken = (session as any)?.accessToken;

    console.log('[INGEST] Session:', session ? 'present' : 'null');
    console.log('[INGEST] userToken:', userToken ? 'present (length: ' + userToken.length + ')' : 'null');
    console.log('[INGEST] token from body:', token ? 'present' : 'null');
    console.log('[INGEST] GITHUB_TOKEN env:', process.env.GITHUB_TOKEN ? 'present' : 'null');

    if (!target || typeof target !== 'string' || target.trim() === '') {
      return NextResponse.json({ error: 'Target identifier is required.' }, { status: 400 });
    }

    // Use user's OAuth token if available, fallback to provided token, then server PAT
    const effectiveToken = userToken || token || process.env.GITHUB_TOKEN;
    console.log('[INGEST] effectiveToken:', effectiveToken ? 'present (length: ' + effectiveToken.length + ')' : 'null');

    if (mode === 'project') {
      const projectData = await fetchGitHubProject(target.trim(), effectiveToken, effectiveToken);
      return NextResponse.json({ success: true, data: projectData });
    } else {
      const profileData = await fetchGitHubProfile(target.trim(), effectiveToken, effectiveToken);
      return NextResponse.json({ success: true, data: profileData });
    }
  } catch (error: any) {
    console.error('[INGEST] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to ingest GitHub data' },
      { status: 500 }
    );
  }
}