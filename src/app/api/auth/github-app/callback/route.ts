import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT, importPKCS8 } from 'jose';
import { Octokit } from '@octokit/rest';
import { ProfileData, ProfilePreset } from '@/types/readmecraft';

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

async function generateReadmeMarkdown(config: any): Promise<string> {
  const { getProfileSections } = await import('@/lib/generators');
  
  const profileData: ProfileData = {
    username: config.username,
    name: config.username,
    bio: 'Building resilient systems & high-taste developer tools.',
    avatarUrl: `https://github.com/${config.username}.png`,
    company: '',
    location: 'Global',
    website: `https://github.com/${config.username}`,
    twitter: config.username,
    githubUrl: `https://github.com/${config.username}`,
    publicRepos: 47,
    followers: 123,
    following: 45,
    languages: [
      { name: 'TypeScript', percentage: 35, color: '#3178c6' },
      { name: 'JavaScript', percentage: 25, color: '#f1e05a' },
      { name: 'Python', percentage: 15, color: '#3572A5' },
      { name: 'Rust', percentage: 10, color: '#dea584' },
      { name: 'Go', percentage: 8, color: '#00ADD8' },
    ],
    pinnedRepos: [],
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Rust', 'Go', 'Python'],
    gitHoloEnabled: false,
    gitChronicleEnabled: false,
    visitorBadgeEnabled: false,
    githubStatsEnabled: true,
    githubStreakEnabled: true,
    topLanguagesEnabled: true,
  };
  
  const preset: ProfilePreset = config.template || 'bento';
  const sections = getProfileSections(profileData, preset);
  
  const enabledBadges = new Set(config.badges || []);
  const theme = config.theme || 'gta6';
  const themeParam = `&theme=${theme}`;
  const baseUrl = 'https://readme.bharatdn.com/api/badges';
  
  let markdown = `# ${config.username}\n`;
  markdown += '> Building resilient systems & high-taste developer tools.\n\n';
  markdown += '---\n\n';
  
  // Core badge sections
  for (const section of sections) {
    if (!section.enabled) continue;
    
    if (section.id === 'stats' || section.id === 'github_metrics') {
      markdown += `## ${section.title}\n\n`;
      let content = section.content;
      content = content.replace(
        /https:\/\/github-readme-stats\.vercel\.app\/api\?username=([^&"]+)/g,
        `${baseUrl}?username=$1&type=stats${themeParam}`
      );
      content = content.replace(
        /https:\/\/github-readme-stats\.vercel\.app\/api\/top-langs\/\?username=([^&"]+)/g,
        `${baseUrl}?username=$1&type=language${themeParam}`
      );
      markdown += content + '\n\n';
    } else if (section.id === 'snake_animation') {
      markdown += `## 🐍 Contribution Snake\n\n`;
      markdown += `<img src="${baseUrl}?username=${config.username}&type=snake&v=13${themeParam}" alt="Contribution Snake" />\n\n`;
    } else if (section.id === 'contribution_heatmap' || section.id === 'heatmap') {
      markdown += `## 🗓️ Contribution Heatmap\n\n`;
      markdown += `<img src="${baseUrl}?username=${config.username}&type=heatmap${themeParam}" alt="Contribution Heatmap" />\n\n`;
    } else if (section.id === 'trophy_card') {
      markdown += `## 🏆 Developer Trophies\n\n`;
      markdown += `<img src="${baseUrl}?username=${config.username}&type=trophy${themeParam}" alt="Developer Trophies" />\n\n`;
    } else if (section.id === 'activity_graph') {
      markdown += `## 📊 Commit Activity Graph\n\n`;
      markdown += `<img src="${baseUrl}?username=${config.username}&type=activity${themeParam}" alt="Commit Activity" />\n\n`;
    } else if (section.id === 'visitor_card') {
      markdown += `## 👀 Visitor Analytics\n\n`;
      markdown += `<img src="${baseUrl}?username=${config.username}&type=visitor${themeParam}" alt="Visitor Analytics" />\n\n`;
    }
  }
  
  // New animated badges
  const newBadges = [
    { id: 'skill-radar', title: '🎯 Skill Radar', url: `${baseUrl}?username=${config.username}&type=skill-radar${themeParam}` },
    { id: 'language-race', title: '🏁 Language Evolution Race', url: `${baseUrl}?username=${config.username}&type=language-race${themeParam}` },
    { id: 'repo-constellation', title: '🌌 Repository Constellation', url: `${baseUrl}?username=${config.username}&type=repo-constellation${themeParam}` },
    { id: 'code-pulse', title: '💓 Code Pulse', url: `${baseUrl}?username=${config.username}&type=code-pulse${themeParam}` },
    { id: 'contribution-mountain', title: '🏔️ Contribution Mountain', url: `${baseUrl}?username=${config.username}&type=contribution-mountain${themeParam}` },
    { id: 'tech-galaxy', title: '🌌 Tech Stack Galaxy', url: `${baseUrl}?username=${config.username}&type=tech-galaxy${themeParam}` },
    { id: 'contribution-flow', title: '🌊 Contribution Flow', url: `${baseUrl}?username=${config.username}&type=contribution-flow${themeParam}` },
    { id: 'code-time-heatmap', title: '🕐 Code Time Heatmap', url: `${baseUrl}?username=${config.username}&type=code-time-heatmap${themeParam}` },
  ];
  
  for (const badge of newBadges) {
    if (enabledBadges.has(badge.id)) {
      markdown += `## ${badge.title}\n\n`;
      markdown += `<img src="${badge.url}" alt="${badge.title}" />\n\n`;
    }
  }
  
  // Composite card (all-in-one)
  if (enabledBadges.has('composite')) {
    markdown += `## 🎯 GitHub Pulse (Composite)\n\n`;
    const include = enabledBadges.has('composite') && config.badges 
      ? config.badges.filter((b: string) => b !== 'composite').join(',')
      : 'stats,trophies,snake,heatmap';
    markdown += `<img src="${baseUrl}?username=${config.username}&type=composite&include=${include}${themeParam}" alt="GitHub Pulse Composite" />\n\n`;
  }

  // GitHub Action Scheduled Auto-Update Workflow instruction
  if (config.autoSync) {
    markdown += `## 🔄 Scheduled Auto-Update (GitHub Action)\n\n`;
    markdown += `<details>\n<summary><b>🤖 Automated Daily Refresh Workflow</b></summary>\n\n`;
    markdown += `This profile is configured with [ReadmeCraft Action](https://github.com/ErBharatMalhotra/readmecraft) for 24-hour scheduled badge & snake refresh:\n\n`;
    markdown += `\`\`\`yaml\nname: ReadmeCraft Auto Refresh\non:\n  schedule:\n    - cron: '0 0 * * *' # Every midnight\n  workflow_dispatch:\n\njobs:\n  refresh:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Ping Badge Cache Invalidator\n        run: |\n          curl -s "https://readme.bharatdn.com/api/badges?username=${config.username}&type=composite&v=$(date +%s)" > /dev/null\n\`\`\`\n\n`;
    markdown += `</details>\n\n`;
  }
  
  markdown += '---\n\n';
  markdown += `<div align="center">\n  <sub>⚡ Powered by <a href="https://readme.bharatdn.com" target="_blank"><b>ReadmeCraft</b></a> — Intelligent Dual-Mode GitHub README Studio</sub>\n</div>`;
  
  return markdown;
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
  const installationId = searchParams.get('installation_id');
  const setupAction = searchParams.get('setup_action');
  const state = searchParams.get('state');
  
  if (!installationId || !state) {
    return new NextResponse(
      `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
        <h1>❌ Invalid callback</h1><p>Missing installation_id or state parameter.</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 400 }
    );
  }

  // Verify state cookie
  const cookieStore = await cookies();
  const stateCookie = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!stateCookie || stateCookie !== state) {
    return new NextResponse(
      `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
        <h1>❌ Invalid state</h1><p>CSRF validation failed. Please try again.</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 400 }
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
      
      return new NextResponse(
        `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
          <h1>❌ Profile Repository Not Found</h1>
          <p>Repository <code>${username}/${username}</code> does not exist or is not public.</p>
          <p>Create a public repository named <strong>${username}</strong> under your account, then try again.</p>
          <a href="https://github.com/new" target="_blank" style="color: #10b981;">Create Repository</a>
        </body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Generate README
    const readme = await generateReadmeMarkdown(config);
    
    // Push to repo
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: username,
      repo: username,
      path: 'README.md',
      message: '🎨 Update profile README via ReadmeCraft',
      content: Buffer.from(readme).toString('base64'),
      branch: 'main',
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
        <h1>✅ README Deployed Successfully!</h1>
        <p>Your profile README has been updated.</p>
        <a href="https://github.com/${username}/${username}" target="_blank" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #10b981; color: white; text-decoration: none; border-radius: 6px;">View Profile →</a>
        <p style="margin-top: 2rem; color: #64748b; font-size: 0.875rem;">Deployed via <a href="https://readme.bharatdn.com" style="color: #10b981;">ReadmeCraft</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: any) {
    console.error('Deploy error:', error);
    
    cookieStore.delete(COOKIE_NAME);
    
    return new NextResponse(
      `<html><body style="font-family: system-ui; max-width: 600px; margin: 2rem auto; padding: 1rem; background: #090d16; color: #f1f5f9;">
        <h1>❌ Deployment Failed</h1>
        <p>${error.message}</p>
        <a href="/deploy" style="display: inline-block; margin-top: 1rem; padding: 0.75rem 1.5rem; background: #ef4444; color: white; text-decoration: none; border-radius: 6px;">Try Again</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    );
  }
}