import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fetchGitHubProfile, fetchGitHubProject } from '@/lib/github';
import { fetchProfileData, fetchRepoData } from '@/lib/github-api';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, target, token } = body;

    // Get user's OAuth token from session if available
    const session = await auth();
    const userToken = (session as any)?.accessToken;

    const debugInfo = {
      sessionPresent: !!session,
      userTokenPresent: !!userToken,
      userTokenPrefix: userToken ? userToken.slice(0, 10) + '...' : null,
      tokenFromBodyPresent: !!token,
      envTokenPresent: !!process.env.GITHUB_TOKEN,
      effectiveTokenPresent: false,
      effectiveTokenPrefix: null as string | null,
    };

    if (!target || typeof target !== 'string' || target.trim() === '') {
      return NextResponse.json({ error: 'Target identifier is required.' }, { status: 400 });
    }

    // Use user's OAuth token if available, fallback to provided token, then server PAT
    const effectiveToken = userToken || token || process.env.GITHUB_TOKEN;
    debugInfo.effectiveTokenPresent = !!effectiveToken;
    debugInfo.effectiveTokenPrefix = effectiveToken ? effectiveToken.slice(0, 10) + '...' : null;

    if (mode === 'project') {
      // Also get raw GraphQL data to check for errors
      const [owner, repo] = target.trim().split('/');
      const rawResult = await fetchRepoData(owner, repo, { token: effectiveToken, userToken: effectiveToken });
      const projectData = await fetchGitHubProject(target.trim(), effectiveToken, effectiveToken);
      
      // Check if raw data has GraphQL error
      const graphQLError = (rawResult.data as any)?.__graphQLError;
      
      return NextResponse.json({ 
        success: true, 
        data: projectData, 
        debug: debugInfo,
        graphQLError: graphQLError || null,
      });
    } else {
      // Also get raw GraphQL data to check for errors
      const rawResult = await fetchProfileData(target.trim(), { token: effectiveToken, userToken: effectiveToken });
      const profileData = await fetchGitHubProfile(target.trim(), effectiveToken, effectiveToken);
      
      // Check if raw data has GraphQL error
      const graphQLError = (rawResult.data as any)?.__graphQLError;
      
      return NextResponse.json({ 
        success: true, 
        data: profileData, 
        debug: debugInfo,
        graphQLError: graphQLError || null,
      });
    }
  } catch (error: any) {
    console.error('Ingest API Error:', {
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
      status: error?.status,
      response: error?.response?.data,
    });
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to ingest GitHub data', 
        debug: { 
          error: error?.message,
          stack: error?.stack?.slice(0, 500),
          cause: error?.cause?.message,
        } 
      },
      { status: 500 }
    );
  }
}