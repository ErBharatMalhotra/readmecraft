import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

// Native shields.io compatible badge generator
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

// Native Trophy generator
function generateTrophySvg(username: string, reposCount: number, followersCount: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="120" viewBox="0 0 450 120">
  <style>
    .bg { fill: #090d16; stroke: #1e293b; stroke-width: 1; rx: 8; }
    .title { fill: #10b981; font-family: 'Space Grotesk', sans-serif; font-weight: bold; font-size: 14px; }
    .label { fill: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: 10px; }
    .value { fill: #ffffff; font-family: 'JetBrains Mono', monospace; font-weight: bold; font-size: 12px; }
  </style>
  <rect width="450" height="120" class="bg"/>
  <text x="20" y="25" class="title">🏆 ReadmeCraft Elite Developer Trophies</text>
  
  <!-- Trophy 1 -->
  <g transform="translate(20, 45)">
    <rect width="125" height="60" rx="6" fill="#0b101c" stroke="#1e293b"/>
    <text x="12" y="22" font-size="16">⭐</text>
    <text x="38" y="20" class="label">OPEN SOURCE</text>
    <text x="38" y="38" class="value">${reposCount} Repos</text>
  </g>
  
  <!-- Trophy 2 -->
  <g transform="translate(162, 45)">
    <rect width="125" height="60" rx="6" fill="#0b101c" stroke="#1e293b"/>
    <text x="12" y="22" font-size="16">🔥</text>
    <text x="38" y="20" class="label">COMMUNITY</text>
    <text x="38" y="38" class="value">${followersCount} Followers</text>
  </g>
  
  <!-- Trophy 3 -->
  <g transform="translate(304, 45)">
    <rect width="125" height="60" rx="6" fill="#0b101c" stroke="#1e293b"/>
    <text x="12" y="22" font-size="16">⚡</text>
    <text x="38" y="20" class="label">VELOCITY</text>
    <text x="38" y="38" class="value">Elite Tier</text>
  </g>
</svg>`;
}

// Native Activity Graph generator
function generateActivityGraphSvg(username: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="495" height="195" viewBox="0 0 495 195">
  <style>
    .bg { fill: #090d16; stroke: #1e293b; stroke-width: 1; rx: 8; }
    .title { fill: #10b981; font-family: 'Space Grotesk', sans-serif; font-weight: bold; font-size: 14px; }
    .label { fill: #94a3b8; font-family: 'JetBrains Mono', monospace; font-size: 11px; }
    .line { fill: none; stroke: #10b981; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .area { fill: url(#grad); opacity: 0.25; }
  </style>
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
  </defs>
  <rect width="495" height="195" class="bg"/>
  <text x="20" y="25" class="title">📈 ${username}'s Commit Activity (Past 30 Days)</text>
  <path class="area" d="M 20 160 Q 60 120 100 130 T 180 90 T 260 110 T 340 70 T 420 85 T 475 50 L 475 170 L 20 170 Z"/>
  <path class="line" d="M 20 160 Q 60 120 100 130 T 180 90 T 260 110 T 340 70 T 420 85 T 475 50"/>
  <text x="20" y="182" class="label">Sun</text>
  <text x="150" y="182" class="label">Mon</text>
  <text x="280" y="182" class="label">Wed</text>
  <text x="440" y="182" class="label">Sat</text>
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
      case 'trophy':
        badgeSvg = generateTrophySvg(username, user.public_repos, user.followers);
        break;
      case 'activity':
        badgeSvg = generateActivityGraphSvg(username);
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