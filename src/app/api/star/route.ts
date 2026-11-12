import { auth } from '@/auth';
import { Octokit } from '@octokit/rest';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { owner, repo } = await req.json();

    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!owner || !repo) {
      return NextResponse.json({ error: 'Owner and repo required' }, { status: 400 });
    }

    const octokit = new Octokit({ auth: session.accessToken });

    // Check if already starred
    try {
      await octokit.rest.activity.checkRepoIsStarredByAuthenticatedUser({ owner, repo });
      return NextResponse.json({ starred: true, alreadyStarred: true, message: 'Already starred ⭐' });
    } catch (e: any) {
      if (e.status !== 404) throw e;
      // Not starred, proceed to star
    }

    // Star the repo
    await octokit.rest.activity.starRepoForAuthenticatedUser({ owner, repo });

    return NextResponse.json({ starred: true, alreadyStarred: false, message: 'Starred! Thanks ⭐' });
  } catch (error: any) {
    console.error('Star error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to star' }, { status: 500 });
  }
}