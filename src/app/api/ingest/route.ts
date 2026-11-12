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

    if (!target || typeof target !== 'string' || target.trim() === '') {
      return NextResponse.json({ error: 'Target identifier is required.' }, { status: 400 });
    }

    // Use user's OAuth token if available, fallback to provided token, then server PAT
    const effectiveToken = userToken || token || process.env.GITHUB_TOKEN;

    if (mode === 'project') {
      const projectData = await fetchGitHubProject(target.trim(), token, userToken);
      return NextResponse.json({ success: true, data: projectData });
    } else {
      const profileData = await fetchGitHubProfile(target.trim(), token, userToken);
      return NextResponse.json({ success: true, data: profileData });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to ingest GitHub data' },
      { status: 500 }
    );
  }
}