import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

const COOKIE_NAME = 'readmecraft-config';

const AVAILABLE_BADGES = [
  'composite', 'stats', 'snake', 'heatmap', 'trophy', 'activity',
  'skill-radar', 'language-race', 'repo-constellation',
  'code-pulse', 'contribution-mountain', 'tech-galaxy',
  'contribution-flow', 'code-time-heatmap'
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username') || 'ErBharatMalhotra';
    const theme = searchParams.get('theme') || 'tokyonight';
    const badgesParam = searchParams.get('badges');
    const autoSync = searchParams.get('autosync') === 'true';
    const badges = badgesParam ? badgesParam.split(',').filter(b => AVAILABLE_BADGES.includes(b)) : AVAILABLE_BADGES;
    
    // Get config from request (passed via query params or body in real usage)
    // For now, we'll use a standard config that matches the UI
    const config = {
      username,
      template: 'bento',
      badges,
      theme,
      autoSync,
    };

    // Create signed state with config
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');
    const state = await new SignJWT({ config, csrf: crypto.randomUUID() })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(secret);

    // Store config in signed cookie for callback
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    // Build GitHub App install URL
    const appSlug = 'readmecraft-deploy'; // Must match your GitHub App name slug
    const installUrl = new URL(`https://github.com/apps/${appSlug}/installations/new`);
    installUrl.searchParams.set('state', state);
    installUrl.searchParams.set('suggested_target_id', 'user'); // Will be replaced by actual user
    installUrl.searchParams.set('repository_selection', 'single'); // Force single repo selection

    return NextResponse.redirect(installUrl.toString());
  } catch (error: any) {
    console.error('GitHub App install error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/deploy?error=install_failed`);
  }
}