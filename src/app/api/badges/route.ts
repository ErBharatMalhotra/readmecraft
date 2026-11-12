import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

function generateBadge(label: string, message: string, color: string = '10b981', labelColor: string = '090d16', logo?: string): string {
  const labelWidth = (label.length + 1) * 7;
  const messageWidth = (message.length + 1) * 7;
  const totalWidth = labelWidth + messageWidth + 20;
  
  const logoSvg = logo ? `<image x="${labelWidth + 14}" y="2" width="16" height="16" href="data:image/svg+xml;base64,${btoa(logo)}"/>` : '';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" role="img" aria-label="${label}: ${message}">
  <linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <mask id="a"><rect width="${totalWidth}" height="28" rx="4" fill="#fff"/></mask>
  <g mask="url(#a)">
    <rect width="${labelWidth + 10}" height="28" fill="#${labelColor}"/>
    <rect x="${labelWidth + 10}" width="${messageWidth + 10}" height="28" fill="#${color}"/>
    <rect width="${totalWidth}" height="28" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2 + 5}" y="18" fill="#fff">${label}</text>
    <text x="${labelWidth + 10 + messageWidth / 2 + 5}" y="18" fill="#fff">${message}</text>
  </g>
</svg>`;
}

async function fetchContributionCalendar(username: string): Promise<{ totalContributions: number; streak: number }> {
  try {
    const query = `
      query($username: String!) {
        user(login: $username) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;
    
    const response = await octokit.graphql<{ user: { contributionsCollection: { contributionCalendar: { totalContributions: number; weeks: { contributionDays: { contributionCount: number; date: string }[] }[] } } } }>(query, { username });
    const calendar = response.user?.contributionsCollection?.contributionCalendar;
    
    if (!calendar) return { totalContributions: 0, streak: 0 };
    
    // Calculate current streak
    const days = calendar.weeks.flatMap((w: any) => w.contributionDays);
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = days.length - 1; i >= 0; i--) {
      const day = days[i];
      if (day.date === today || day.date < today) {
        if (day.contributionCount > 0) {
          streak++;
        } else if (day.date !== today) {
          break;
        }
      }
    }
    
    return { totalContributions: calendar.totalContributions, streak };
  } catch {
    return { totalContributions: 0, streak: 0 };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const type = searchParams.get('type') || 'stats';
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }
    
    // Fetch user data
    const { data: user } = await octokit.rest.users.getByUsername({ username });
    const { data: repos } = await octokit.rest.repos.listForUser({ 
      username, 
      type: 'owner', 
      sort: 'updated',
      per_page: 100 
    });
    
    // Calculate language stats
    const langStats: Record<string, number> = {};
    for (const repo of repos) {
      if (!repo.fork && repo.language) {
        langStats[repo.language] = (langStats[repo.language] || 0) + 1;
      }
    }
    const topLanguage = Object.entries(langStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    // Fetch contribution calendar for streak
    const { streak } = await fetchContributionCalendar(username);
    
    const stats = {
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      topLanguage,
      totalContributions: 0,
      streak,
    };
    
    let badgeSvg: string;
    const labelColor = '090d16';
    const color = '10b981';
    
    switch (type) {
      case 'repos':
        badgeSvg = generateBadge('Public Repos', String(stats.publicRepos), color, labelColor);
        break;
      case 'followers':
        badgeSvg = generateBadge('Followers', String(stats.followers), color, labelColor);
        break;
      case 'following':
        badgeSvg = generateBadge('Following', String(stats.following), color, labelColor);
        break;
      case 'language':
        badgeSvg = generateBadge('Top Language', stats.topLanguage, color, labelColor);
        break;
      case 'streak':
        badgeSvg = generateBadge('Streak', `${stats.streak} days`, 'f59e0b', labelColor);
        break;
      case 'contributions':
        badgeSvg = generateBadge('Contributions', String(stats.totalContributions), color, labelColor);
        break;
      case 'stats':
      default:
        // Return combined stats as JSON
        return NextResponse.json(stats);
    }
    
    return new NextResponse(badgeSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate badge' },
      { status: 500 }
    );
  }
}