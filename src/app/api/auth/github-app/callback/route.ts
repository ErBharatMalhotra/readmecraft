import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT, importPKCS8 } from 'jose';
import { Octokit } from '@octokit/rest';
import { ProfileData, ProfilePreset, RepositoryLanguage, RepositoryTopic } from '@/types/readmecraft';
import { fetchProfileData } from '@/lib/github-api';
import { fetchGitHubProfile } from '@/lib/github';

const COOKIE_NAME = 'readmecraft-config';

async function createAppJWT(appId: string, privateKeyPem: string): Promise<string> {
  // jose v6 importPKCS8 accepts PEM string or Uint8Array (DER)
  // TypeScript types may be restrictive, so use the PEM directly
  const privateKey = await importPKCS8(privateKeyPem, 'RS256');
  
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt(now - 60)
    .setExpirationTime(now + 600) // 10 minutes
    .setIssuer(appId)
    .sign(privateKey);
}

async function getInstallationToken(installationId: string): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY;
  
  if (!appId || !privateKeyPem) {
    throw new Error('GitHub App credentials not configured');
  }

  const jwt = await createAppJWT(appId, privateKeyPem);
  
  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'ReadmeCraft',
      },
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Failed to get installation token: ${err.message}`);
  }

  const data = await res.json();
  return data.token;
}

async function fetchRealProfileData(octokit: Octokit, username: string): Promise<ProfileData> {
  // Fetch user profile
  const { data: user } = await octokit.rest.users.getByUsername({ username });
  
  // Fetch pinned repos
  const { data: repos } = await octokit.rest.repos.listForUser({
    username,
    sort: 'updated',
    per_page: 100,
    type: 'owner'
  });
  
  const publicRepos = repos.filter(r => !r.fork && r.visibility === 'public');
  const pinnedRepos = publicRepos.slice(0, 6).map(r => ({
    name: r.name,
    description: r.description || '',
    url: r.html_url,
    stargazersCount: r.stargazers_count,
    forksCount: r.forks_count,
    language: r.language || 'Code',
    topics: r.topics || [],
    isFork: r.fork,
    isArchived: r.archived,
    releases: [],
    homepageUrl: r.homepage,
  }));
  
  // Fetch languages across all repos
  const languageMap = new Map<string, { bytes: number; color: string }>();
  for (const repo of publicRepos.slice(0, 20)) {
    try {
      const { data: langs } = await octokit.rest.repos.listLanguages({
        owner: username,
        repo: repo.name
      });
      for (const [lang, bytes] of Object.entries(langs)) {
        const existing = languageMap.get(lang) || { bytes: 0, color: '' };
        existing.bytes += bytes as number;
        languageMap.set(lang, existing);
      }
    } catch {}
  }
  
  const totalBytes = Array.from(languageMap.values()).reduce((sum, l) => sum + l.bytes, 0);
  const languages = Array.from(languageMap.entries())
    .map(([name, { bytes }]) => ({
      name,
      percentage: Math.round((bytes / totalBytes) * 1000) / 10,
      color: '#586069', // default color
      bytes
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);
  
  // Get top repositories by stars
  const topRepos = [...publicRepos]
    .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
    .slice(0, 5)
    .map(r => ({
      name: r.name,
      owner: { login: r.owner.login },
      url: r.html_url,
      stargazerCount: r.stargazers_count || 0,
      primaryLanguage: r.language ? { name: r.language, color: '#586069' } : null,
    }));
  
  const pinnedReposData = publicRepos.slice(0, 6).map(r => ({
    name: r.name,
    description: r.description || '',
    url: r.html_url,
    stargazersCount: r.stargazers_count || 0,
    forksCount: r.forks_count || 0,
    language: r.language || 'Code',
    topics: r.topics || [],
    isFork: r.fork,
    isArchived: r.archived || false,
    releases: [],
    homepageUrl: r.homepage || undefined,
  }));
  
  const topReposData = topRepos.map(r => ({
    name: r.name,
    owner: { login: r.owner.login },
    url: r.url,
    stargazerCount: r.stargazerCount,
    primaryLanguage: r.primaryLanguage,
  }));
  
  return {
    username: user.login,
    name: user.name || user.login,
    bio: user.bio || 'Developer & Open Source Contributor',
    bioHTML: user.bio ? `<div>${user.bio}</div>` : undefined,
    avatarUrl: user.avatar_url,
    company: user.company || '',
    location: user.location || '',
    website: user.blog || '',
    twitter: user.twitter_username || '',
    email: user.email || undefined,
    githubUrl: user.html_url,
    resourcePath: `/${user.login}`,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    userViewType: 'PUBLIC',
    isSponsorable: false,
    estimatedNextSponsorsPayoutInCents: 0,
    monthlyEstimatedSponsorsIncomeInCents: 0,
    hasSponsorsListing: false,
    pronouns: null,
    publicRepos: user.public_repos,
    totalDiskUsage: 0,
    followers: user.followers,
    following: user.following,
    starredRepositoriesCount: 0,
    watchingCount: 0,
    gistsCount: user.public_gists,
    languages,
    skills: languages.map(l => l.name).slice(0, 10),
    pinnedRepos: pinnedReposData,
    topRepositories: topReposData,
    contributionCalendar: { totalContributions: 0, weeks: [] },
    totalCommitContributions: 0,
    totalIssueContributions: 0,
    totalPullRequestContributions: 0,
    totalPullRequestReviewContributions: 0,
    totalRepositoriesWithContributedCommits: 0,
    commitContributionsByRepository: [],
    pullRequestContributionsByRepository: [],
    organizations: [],
    packages: [],
    sponsors: [],
    sponsorshipsAsMaintainer: [],
    socialAccounts: [],
    status: null,
    recentPullRequests: [],
    recentIssues: [],
    repositoriesContributedTo: [],
    gitHoloEnabled: true,
    gitChronicleEnabled: true,
    visitorBadgeEnabled: true,
    githubStatsEnabled: true,
    githubStreakEnabled: true,
    topLanguagesEnabled: true,
  };
}

async function generateReadmeMarkdown(config: any, realProfileData?: ProfileData): Promise<string> {
  const { getProfileSections, compileSectionsToMarkdown, appendDeployExtras } = await import('@/lib/generators');

  // Use real profile data if available, otherwise fall back to config-based mock data
  const profileData: ProfileData = realProfileData || {
    username: config.username,
    name: config.username,
    bio: 'Building resilient systems & high-taste developer tools.',
    avatarUrl: `https://github.com/${config.username}.png`,
    company: '',
    location: 'Global',
    website: `https://github.com/${config.username}`,
    twitter: config.username,
    githubUrl: `https://github.com/${config.username}`,
    publicRepos: 0,
    followers: 0,
    following: 0,
    languages: [],
    pinnedRepos: [],
    skills: [],
    gitHoloEnabled: false,
    gitChronicleEnabled: false,
    visitorBadgeEnabled: false,
    githubStatsEnabled: true,
    githubStreakEnabled: true,
    topLanguagesEnabled: true,
  } as ProfileData;

  const preset: ProfilePreset = config.template || 'bento';
  const theme = config.theme || 'gta6';
  const username = config.username || profileData.username;
  // Use the exact same generator pipeline as the homepage / craft preview,
  // so the deployed README matches what the user saw in the Studio.
  const sections = getProfileSections(profileData, preset, theme);
  let markdown = compileSectionsToMarkdown(sections);

  // Append the exact same extras the Studio preview shows (animated badges,
  // composite card, auto-sync workflow, footer) so Pane 3 always matches the
  // README that is written to the user's profile repository.
  markdown = appendDeployExtras(markdown, {
    username,
    displayName: profileData.name || username,
    theme,
    badges: config.badges as string[] | undefined,
    autoSync: config.autoSync as boolean | undefined,
  });

  return markdown.trim();
}

/**
 * GitHub lets users store a twitter handle, but that handle can be stale or
 * renamed. Rendering it blindly produced a dead 404 link on the profile.
 * Returns the handle when it still resolves, or '' when X says 404.
 * Fails open: network errors / timeouts keep the handle.
 */
async function dropDeadTwitterHandle(handle: string | undefined | null): Promise<string> {
  if (!handle) return '';

  try {
    // twitter.com itself bot-blocks server requests, but the public oEmbed
    // endpoint answers 200 for real accounts and 404 for unknown ones.
    const url =
      'https://publish.twitter.com/oembed?url=' +
      encodeURIComponent(`https://twitter.com/${handle}`) +
      '&omit_script=1';

    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(3000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });
    if (res.status === 404) return '';
  } catch {
    // keep the handle on timeout / blocked request
  }

  return handle;
}

async function findProfileRepo(octokit: Octokit, username: string) {
  try {
    const { data } = await octokit.rest.repos.get({
      owner: username,
      repo: username,
    });
    if (!data.fork && data.visibility === 'public') return data;
  } catch {}
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  let installationId = searchParams.get('installation_id');
  const setupAction = searchParams.get('setup_action');
  const state = searchParams.get('state');
  
  if (!state) {
    return new NextResponse(
      `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
        <h1>Invalid Callback</h1><p>Missing state parameter.</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    );
  }

  // If setup_action is configure (app already installed), we need to find the installation_id
  if (!installationId && setupAction === 'configure') {
    // Verify state first to get the username
    const cookieStore = await cookies();
    const stateCookie = cookieStore.get(COOKIE_NAME)?.value;
    
    if (!stateCookie || stateCookie !== state) {
      return new NextResponse(
        `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
          <h1>Invalid State</h1><p>CSRF validation failed. Please try again.</p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
      );
    }

    // Decode state to get username
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');
    const { payload } = await jwtVerify(state, secret);
    const { config } = payload as { config: any };
    const username = config.username || 'ErBharatMalhotra';

    // Fetch installation for this user/account
    const appId = process.env.GITHUB_APP_ID;
    const privateKeyPem = process.env.GITHUB_APP_PRIVATE_KEY;
    
    if (!appId || !privateKeyPem) {
      return new NextResponse(
        `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
          <h1>Configuration Error</h1><p>GitHub App credentials not configured.</p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 500 }
      );
    }

    // Create app JWT
    const privateKey = await importPKCS8(privateKeyPem, 'RS256');
    const now = Math.floor(Date.now() / 1000);
    const appJwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt(now - 60)
      .setExpirationTime(now + 600)
      .setIssuer(appId)
      .sign(privateKey);

    // Get installations for the app
    const installationsRes = await fetch(
      'https://api.github.com/app/installations',
      {
        headers: {
          Authorization: `Bearer ${appJwt}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'ReadmeCraft',
        },
      }
    );

    if (!installationsRes.ok) {
      throw new Error('Failed to fetch app installations');
    }

    const installations = await installationsRes.json();
    
    // Find installation for this user/account
    const installation = installations.find((inst: any) => 
      inst.account?.login?.toLowerCase() === username.toLowerCase()
    );

    if (!installation) {
      return new NextResponse(
        `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
          <h1>Installation Not Found</h1>
          <p>GitHub App is not installed for <strong>${username}</strong>.</p>
          <p><a href="/deploy" style="color: #10b981;">Try deploying again</a> to install the app.</p>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    installationId = installation.id.toString();
  }

  // Now require installationId
  if (!installationId) {
    return new NextResponse(
      `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
        <h1>Invalid Callback</h1><p>Missing installation_id parameter.</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    );
  }

  // Verify state cookie
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!stateCookie || stateCookie !== state) {
    return new NextResponse(
      `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
        <h1>Invalid State</h1><p>CSRF validation failed. Please try again.</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 }
    );
  }

  try {
    // Verify and decode state JWT
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-secret');
    const { payload } = await jwtVerify(state, secret);
    const { config } = payload as { config: any };

    // Get installation token
    const token = await getInstallationToken(installationId);
    
    // Create Octokit with installation token
    const octokit = new Octokit({ auth: token });

    // Find the profile repo (username/username)
    const username = config.username || 'ErBharatMalhotra';
    const profileRepo = await findProfileRepo(octokit, username);
    
    if (!profileRepo) {
      cookieStore.delete(COOKIE_NAME);

      // Distinguish "repo does not exist" from "app was not granted access to it"
      let repoIsPublic = false;
      try {
        const probe = await fetch(`https://api.github.com/repos/${username}/${username}`, {
          headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'ReadmeCraft' },
          cache: 'no-store',
        });
        repoIsPublic = probe.ok;
      } catch {}

      if (repoIsPublic) {
        return new NextResponse(
          `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
            <h1>Repository Access Needed</h1>
            <p>Repository <code>${username}/${username}</code> exists, but the ReadmeCraft GitHub App was not granted access to it.</p>
            <p>Open the app settings, add <strong>${username}/${username}</strong> to the allowed repositories, then deploy again.</p>
            <a href="https://github.com/apps/readmecraft-deploy/installations/${installationId}" target="_blank" style="display: inline-block; margin-top: 0.5rem; color: #10b981;">Manage repository access</a>
            <p style="margin-top: 1.5rem;"><a href="/deploy" style="color: #94a3b8;">Back to deploy</a></p>
          </body></html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }

      return new NextResponse(
        `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
          <h1>Profile Repository Not Found</h1>
          <p>Repository <code>${username}/${username}</code> does not exist or is not public.</p>
          <p>Create a public repository named <strong>${username}</strong> under your account, then try again.</p>
          <a href="https://github.com/new" target="_blank" style="color: #10b981;">Create Repository</a>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Fetch real profile data. Prefer the same source the Studio preview uses
    // (GraphQL with GITHUB_TOKEN) so the deployed README matches the preview
    // exactly; fall back to REST via the installation token if unavailable.
    let realProfileData: ProfileData;
    try {
      const { data: graphqlData } = await fetchProfileData(username, { token: process.env.GITHUB_TOKEN });
      if ((graphqlData as any)?.__graphQLError) throw new Error('GraphQL profile fetch failed');
      realProfileData = await fetchGitHubProfile(username, process.env.GITHUB_TOKEN);
    } catch {
      realProfileData = await fetchRealProfileData(octokit, username);
    }

    // Drop a stale X/Twitter handle so the README never ships a dead 404 link
    realProfileData.twitter = await dropDeadTwitterHandle(realProfileData.twitter);
    
    // Generate README with real data
    const readme = await generateReadmeMarkdown(config, realProfileData);
    
    // Push to repo - handle both create and update
    const defaultBranch = profileRepo.default_branch || 'main';
    let fileSha: string | undefined;
    try {
      const { data: existingFile } = await octokit.rest.repos.getContent({
        owner: username,
        repo: username,
        path: 'README.md',
        ref: defaultBranch,
      });
      if ('sha' in existingFile) {
        fileSha = existingFile.sha;
      }
    } catch (e) {
      // File doesn't exist, will create new
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner: username,
      repo: username,
      path: 'README.md',
      message: '🎨 Update profile README via ReadmeCraft',
      content: Buffer.from(readme).toString('base64'),
      branch: defaultBranch,
      sha: fileSha,
      committer: { 
        name: 'ReadmeCraft Bot', 
        email: 'bot@readmecraft.app' 
      },
      author: { 
        name: username, 
        email: `${username}@users.noreply.github.com` 
      },
    });

    // Clear cookie
    cookieStore.delete(COOKIE_NAME);

    return new NextResponse(
      `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
        <h1>README Deployed Successfully!</h1>
        <p>Your profile README has been updated.</p>
        <a href="https://github.com/${username}/${username}" target="_blank" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #10b981; color: white; text-decoration: none; border-radius: 6px;">View Profile →</a>
        <p style="margin-top: 2rem; color: #64748b; font-size: 0.875rem;">Deployed via <a href="https://readme.bharatdn.com" style="color: #10b981;">ReadmeCraft</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error: any) {
    console.error('Deploy error:', error);
    
    cookieStore.delete(COOKIE_NAME);
    
    return new NextResponse(
      `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
        <h1>Deployment Failed</h1>
        <p>${error.message}</p>
        <a href="/deploy" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ef4444; color: white; text-decoration: none; border-radius: 6px;">Try Again</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 500 }
    );
  }
}