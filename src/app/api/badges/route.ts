import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

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

async function fetchContributionCalendar(username: string, client: Octokit): Promise<{ totalContributions: number; streak: number; source: string }> {
  // Strategy 1: GraphQL with auth (most accurate)
  try {
    const to = new Date().toISOString();
    const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    
    const query = `
      query($username: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(from: $from, to: $to) {
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
    
    const response = await client.graphql<{ user: { contributionsCollection: { contributionCalendar: { totalContributions: number; weeks: { contributionDays: { contributionCount: number; date: string }[] }[] } } } }>(query, { username, from, to });
    const calendar = response.user?.contributionsCollection?.contributionCalendar;
    
    if (calendar && calendar.weeks.length > 0) {
      const days = calendar.weeks.flatMap((w: any) => w.contributionDays);
      days.sort((a: any, b: any) => b.date.localeCompare(a.date));
      
      let streak = 0;
      const mostRecentDate = days[0].date;
      
      for (const day of days) {
        if (day.contributionCount > 0) streak++;
        else if (day.date !== mostRecentDate) break;
      }
      
      return { totalContributions: calendar.totalContributions, streak, source: 'graphql' };
    }
  } catch (e) {
    console.log('GraphQL failed:', e);
  }
  
  // Strategy 2: REST Events API - count recent PushEvents for streak estimate (no auth needed, 60/hr)
  try {
    const { data: events } = await client.rest.activity.listPublicEventsForUser({ 
      username, 
      per_page: 100 
    });
    
    const pushEvents = events.filter(e => e.type === 'PushEvent');
    if (pushEvents.length > 0) {
      // Group by date
      const dates = new Set<string>();
      for (const event of pushEvents) {
        const date = event.created_at!.split('T')[0];
        dates.add(date);
      }
      
      // Calculate streak from most recent date backwards
      const sortedDates = Array.from(dates).sort().reverse();
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      let checkDate = sortedDates[0] === today || sortedDates[0] === yesterday ? sortedDates[0] : today;
      
      for (let i = 0; i < 365; i++) {
        const checkStr = new Date(checkDate).toISOString().split('T')[0];
        if (dates.has(checkStr)) {
          streak++;
          checkDate = new Date(new Date(checkDate).getTime() - 86400000).toISOString().split('T')[0];
        } else {
          break;
        }
      }
      
      return { totalContributions: pushEvents.length, streak: Math.max(streak, 1), source: 'events' };
    }
  } catch (e) {
    console.log('Events API failed:', e);
  }
  
  // Strategy 3: Return 0 if unable to calculate
  return { totalContributions: 0, streak: 0, source: 'none' };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const type = searchParams.get('type') || 'stats';
    const token = searchParams.get('token') || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }
    
    // Create Octokit with token if provided
    const client = token 
      ? new Octokit({ auth: token })
      : new Octokit();
    
    // Fetch user data
    const { data: user } = await client.rest.users.getByUsername({ username });
    const { data: repos } = await client.rest.repos.listForUser({ 
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
    const { streak, totalContributions, source } = await fetchContributionCalendar(username, client);
    
    const stats = {
      publicRepos: user.public_repos,
      followers: user.followers,
      following: user.following,
      topLanguage,
      totalContributions,
      streak,
      source,
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
        badgeSvg = generateBadge('Streak', streak === -1 ? 'Token Required' : `${stats.streak} days`, streak === -1 ? 'ef4444' : 'f59e0b', labelColor);
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