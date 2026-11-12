import { NextRequest, NextResponse } from 'next/server';
import { fetchGitHubProfile, fetchGitHubProject } from '@/lib/github';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, target, token } = body;

    if (!target || typeof target !== 'string' || target.trim() === '') {
      return NextResponse.json({ error: 'Target identifier is required.' }, { status: 400 });
    }

    if (mode === 'project') {
      const projectData = await fetchGitHubProject(target.trim(), token);
      return NextResponse.json({ success: true, data: projectData });
    } else {
      const profileData = await fetchGitHubProfile(target.trim(), token);
      return NextResponse.json({ success: true, data: profileData });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to ingest GitHub data' }, { status: 500 });
  }
}
