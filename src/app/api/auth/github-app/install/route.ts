import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, importPKCS8 } from 'jose';

const COOKIE_NAME = 'readmecraft-config';

/**
 * Look up an existing installation for the given account login.
 * Returns the installation id when the GitHub App is already installed,
 * otherwise null. This lets repeat deploys skip GitHub's "Configure"
 * screen and go straight to the callback.
 */
async function findExistingInstallation(accountLogin: string): Promise<string | null> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKeyPem) return null;

  try {
    const privateKey = await importPKCS8(privateKeyPem, 'RS256');
    const now = Math.floor(Date.now() / 1000);
    const appJwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt(now - 60)
      .setExpirationTime(now + 600)
      .setIssuer(appId)
      .sign(privateKey);

    const res = await fetch('https://api.github.com/app/installations?per_page=100', {
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ReadmeCraft',
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const installations = (await res.json()) as Array<{
      id: number;
      account?: { login?: string };
    }>;

    const match = installations.find(
      (inst) => inst.account?.login?.toLowerCase() === accountLogin.toLowerCase()
    );

    return match ? String(match.id) : null;
  } catch (error) {
    console.error('Existing installation lookup failed:', error);
    return null;
  }
}

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
    const theme = searchParams.get('theme') || 'gta6';
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

    // If the app is already installed for this account, skip GitHub's
    // "Configure" screen entirely and go straight to the callback.
    const existingInstallationId = await findExistingInstallation(username);
    if (existingInstallationId) {
      const callbackUrl = new URL('/api/auth/github-app/callback', request.nextUrl.origin);
      callbackUrl.searchParams.set('installation_id', existingInstallationId);
      callbackUrl.searchParams.set('setup_action', 'install');
      callbackUrl.searchParams.set('state', state);
      return NextResponse.redirect(callbackUrl.toString());
    }

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