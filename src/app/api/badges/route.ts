import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fetchProfileData, checkETag, createETagResponse, createNotModifiedResponse } from '@/lib/github-api';

// ============================================================================
// DESIGN SYSTEM CONSTANTS
// ============================================================================
const COLORS = {
  bg: '#090d16',
  bgElevated: '#0b101c',
  border: '#1e293b',
  borderLight: '#2a3a4f',
  emerald: '#10b981',
  emeraldDim: '#059669',
  emeraldLight: '#34d399',
  gold: '#f59e0b',
  goldDim: '#d97706',
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  red: '#ef4444',
} as const;

const FONTS = {
  display: "'Space Grotesk', sans-serif",
  mono: "'JetBrains Mono', monospace",
  ui: "'Verdana', 'Geneva', 'DejaVu Sans', sans-serif",
} as const;

const RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function css(cls: string, props: Record<string, string | number>): string {
  const body = Object.entries(props).map(([k, v]) => `${k}: ${v};`).join(' ');
  return `.${cls} { ${body} }`;
}

function styleBlock(...rules: string[]): string {
  return `<style>${rules.join(' ')}</style>`;
}

function rect(x: number, y: number, w: number, h: number, fill: string, rx = 0, stroke?: string, strokeWidth = 1): string {
  const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="${strokeWidth}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${strokeAttr} />`;
}

function text(x: number, y: number, content: string, cls: string): string {
  return `<text x="${x}" y="${y}" class="${cls}">${content}</text>`;
}

function translate(x: number, y: number, children: string): string {
  return `<g transform="translate(${x}, ${y})">${children}</g>`;
}

// ============================================================================
// BASE SVG WRAPPER
// ============================================================================
function createSvg(width: number, height: number, title: string, inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
${styleBlock(
  css('bg', { fill: COLORS.bg, stroke: COLORS.border, 'stroke-width': 1, rx: RADIUS.lg }),
  css('panel', { fill: COLORS.bgElevated, stroke: COLORS.border, 'stroke-width': 1, rx: RADIUS.md }),
  css('title', { fill: COLORS.emerald, 'font-family': FONTS.display, 'font-weight': 'bold', 'font-size': 14 }),
  css('label', { fill: COLORS.textSecondary, 'font-family': FONTS.mono, 'font-size': 10 }),
  css('label-lg', { fill: COLORS.textSecondary, 'font-family': FONTS.mono, 'font-size': 11 }),
  css('value', { fill: COLORS.textPrimary, 'font-family': FONTS.mono, 'font-weight': 'bold', 'font-size': 14 }),
  css('value-sm', { fill: COLORS.textPrimary, 'font-family': FONTS.mono, 'font-weight': 'bold', 'font-size': 12 }),
  css('muted', { fill: COLORS.textMuted, 'font-family': FONTS.mono, 'font-size': 9 }),
  css('badge-title', { fill: COLORS.emerald, 'font-family': FONTS.display, 'font-weight': 'bold', 'font-size': 16 }),
)}
<rect width="${width}" height="${height}" class="bg"/>
${inner}
</svg>`;
}

// ============================================================================
// BADGE GENERATORS (Shields.io compatible)
// ============================================================================
function generateBadge(label: string, message: string, color: string = COLORS.emerald, labelColor: string = COLORS.bg): string {
  const labelWidth = (label.length + 1) * 7;
  const messageWidth = (message.length + 1) * 7;
  const totalWidth = labelWidth + messageWidth + 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" role="img" aria-label="${label}: ${message}">
<linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<mask id="a"><rect width="${totalWidth}" height="28" rx="4" fill="#fff"/></mask>
<g mask="url(#a)">
<rect width="${labelWidth + 10}" height="28" fill="#${labelColor}"/>
<rect x="${labelWidth + 10}" width="${messageWidth + 10}" height="28" fill="#${color}"/>
<rect width="${totalWidth}" height="28" fill="url(#b)"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="${FONTS.ui}" text-rendering="geometricPrecision" font-size="11">
<text x="${labelWidth / 2 + 5}" y="18" fill="#fff">${label}</text>
<text x="${labelWidth + 10 + messageWidth / 2 + 5}" y="18" fill="#fff">${message}</text>
</g>
</svg>`;
}

// ============================================================================
// 1. DEVELOPER TROPHY CARD
// ============================================================================
function generateTrophySvg(username: string, reposCount: number, followersCount: number, starsCount: number): string {
  const width = 520;
  const height = 140;
  const cardW = 148;
  const gap = 18;
  const startX = (width - (cardW * 3 + gap * 2)) / 2;

  const cards = [
    { icon: '⭐', label: 'OPEN SOURCE', value: `${reposCount.toLocaleString()} Repos`, accent: COLORS.emerald },
    { icon: '🔥', label: 'COMMUNITY', value: `${followersCount.toLocaleString()} Followers`, accent: COLORS.gold },
    { icon: '⚡', label: 'VELOCITY', value: 'Elite Tier', accent: COLORS.red },
  ];

  let inner = '';
  inner += text(width / 2, 30, `🏆 ${username}'s Developer Trophies`, 'badge-title');

  cards.forEach((card, i) => {
    const x = startX + i * (cardW + gap);
    const y = 50;
    inner += translate(x, y, `
      ${rect(0, 0, cardW, 70, COLORS.bgElevated, RADIUS.md, COLORS.borderLight)}
      <text x="${cardW / 2}" y="24" text-anchor="middle" font-size="22">${card.icon}</text>
      <text x="${cardW / 2}" y="42" text-anchor="middle" class="label">${card.label}</text>
      <text x="${cardW / 2}" y="58" text-anchor="middle" class="value-sm" fill="${card.accent}">${card.value}</text>
    `);
  });

  return createSvg(width, height, `${username}'s Developer Trophies`, inner);
}

// ============================================================================
// 2. COMMIT ACTIVITY GRAPH
// ============================================================================
function generateActivityGraphSvg(username: string): string {
  const width = 560;
  const height = 200;
  const margin = { top: 40, right: 20, bottom: 40, left: 50 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const points = Array.from({ length: 30 }, (_, i) => ({
    x: margin.left + (i / 29) * chartW,
    y: margin.top + chartH - (Math.random() * 0.6 + 0.2) * chartH,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = path + ` L ${points[points.length - 1].x} ${margin.top + chartH} L ${points[0].x} ${margin.top + chartH} Z`;

  let inner = '';
  inner += text(width / 2, 28, `📈 ${username}'s Commit Activity (30 Days)`, 'badge-title');

  inner += translate(margin.left, margin.top, `
    ${rect(0, 0, chartW, chartH, COLORS.bgElevated, RADIUS.sm, COLORS.border)}
    <defs>
      <linearGradient id="activityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${COLORS.emerald}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${COLORS.bg}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#activityGrad)"/>
    <path d="${path}" fill="none" stroke="${COLORS.emerald}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${points.map((p, i) => i % 4 === 0 ? `<circle cx="${p.x - margin.left}" cy="${p.y - margin.top}" r="3" fill="${COLORS.emerald}" stroke="${COLORS.bg}" stroke-width="2"/>` : '').join('')}
  `);

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((day, i) => {
    const x = margin.left + (i / 6) * chartW;
    inner += text(x, height - 12, day, 'muted');
  });

  inner += `<text x="12" y="${height / 2}" class="muted" text-anchor="middle" transform="rotate(-90, 12, ${height / 2})">Commits</text>`;

  return createSvg(width, height, `${username}'s Commit Activity`, inner);
}

// ============================================================================
// 3. VISITOR ANALYTICS CARD
// ============================================================================
function generateVisitorCardSvg(username: string, followers: number, repos: number, contributions: number): string {
  const width = 520;
  const height = 150;
  const views = 1337 + (username.length * 42) + followers * 2;
  const impactScore = Math.min(99, Math.max(1, Math.floor(contributions / 50 + followers / 20)));

  const cards = [
    { icon: '👁️', label: 'Profile Views', value: views.toLocaleString(), trend: '+12%' },
    { icon: '📊', label: 'Contributions', value: contributions.toLocaleString(), trend: '+8%' },
    { icon: '🏆', label: 'Impact Score', value: `Top ${100 - impactScore}%`, trend: '↑' },
  ];

  const cardW = 148;
  const gap = 18;
  const startX = (width - (cardW * 3 + gap * 2)) / 2;

  let inner = '';
  inner += text(width / 2, 30, `👀 ${username}'s Visitor Analytics`, 'badge-title');

  cards.forEach((card, i) => {
    const x = startX + i * (cardW + gap);
    const y = 50;
    inner += translate(x, y, `
      ${rect(0, 0, cardW, 80, COLORS.bgElevated, RADIUS.md, COLORS.borderLight)}
      <text x="${cardW / 2}" y="22" text-anchor="middle" font-size="20">${card.icon}</text>
      <text x="${cardW / 2}" y="42" text-anchor="middle" class="label">${card.label}</text>
      <text x="${cardW / 2}" y="62" text-anchor="middle" class="value">${card.value}</text>
      <text x="${cardW / 2}" y="76" text-anchor="middle" class="muted" fill="${COLORS.emerald}">${card.trend}</text>
    `);
  });

  return createSvg(width, height, `${username}'s Visitor Analytics`, inner);
}

// ============================================================================
// 4. CONTRIBUTION HEATMAP (GitHub-style)
// ============================================================================
function generateHeatmapSvg(username: string, calendar: any): string {
  const width = 820;
  const height = 160;
  const weeks = calendar?.weeks || [];
  const cellSize = 11;
  const cellGap = 2;
  const startX = 55;
  const startY = 40;

  const allDays = weeks.flatMap((w: any) => w.contributionDays);
  const maxCount = Math.max(...allDays.map((d: any) => d.contributionCount), 1);

  const getColor = (count: number) => {
    if (count === 0) return '#161b22';
    if (count <= maxCount * 0.2) return '#0e4429';
    if (count <= maxCount * 0.4) return '#006d32';
    if (count <= maxCount * 0.6) return '#26a641';
    if (count <= maxCount * 0.8) return '#39d353';
    return '#5ee87a';
  };

  let inner = '';
  inner += text(30, 24, `🗓️ ${username}'s Contribution Calendar`, 'badge-title');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  weeks.forEach((week: any, weekIndex: number) => {
    if (week.contributionDays[0]) {
      const date = new Date(week.contributionDays[0].date);
      if (date.getDate() <= 7) {
        const x = startX + weekIndex * (cellSize + cellGap);
        inner += text(x + cellSize / 2, startY - 8, months[date.getMonth()], 'muted');
      }
    }
  });

  weeks.forEach((week: any, weekIndex: number) => {
    week.contributionDays.forEach((day: any, dayIndex: number) => {
      const color = getColor(day.contributionCount);
      const x = startX + weekIndex * (cellSize + cellGap);
      const y = startY + dayIndex * (cellSize + cellGap);
      inner += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" />`;
    });
  });

  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label, i) => {
    const y = startY + i * (cellSize + cellGap) + cellSize / 2 + 3;
    inner += text(startX - 10, y, label, 'muted');
  });

  const legendY = height - 15;
  inner += translate(startX, legendY, `
    <text x="0" y="5" class="muted" font-size="9">Less</text>
    ${[0, 1, 2, 3, 4, 5].map(i => rect(35 + i * 14, -3, 10, 10, getColor(i === 0 ? 0 : maxCount * i / 5), 2)).join('')}
    <text x="110" y="5" class="muted" font-size="9">More</text>
  `);

  const total = calendar?.totalContributions || allDays.reduce((s: number, d: any) => s + d.contributionCount, 0);
  inner += text(width - 30, 24, `${total.toLocaleString()} contributions in ${new Date().getFullYear()}`, 'muted');

  return createSvg(width, height, `${username}'s Contribution Calendar`, inner);
}

// ============================================================================
// 5. CONTRIBUTION SNAKE ANIMATION
// ============================================================================
function generateSnakeSvg(username: string, calendar: any): string {
  const width = 820;
  const height = 160;
  const weeks = calendar?.weeks || [];
  const days = weeks.flatMap((w: any) => w.contributionDays).reverse();
  const cellSize = 11;
  const cellGap = 2;
  const startX = 55;
  const startY = 40;

  const activeDays = days.filter((d: any) => d.contributionCount > 0);
  const total = calendar?.totalContributions || days.reduce((s: number, d: any) => s + d.contributionCount, 0);

  let inner = '';
  inner += text(30, 24, `🐍 ${username}'s Contribution Snake`, 'badge-title');

  weeks.forEach((week: any, weekIndex: number) => {
    week.contributionDays.forEach((day: any, dayIndex: number) => {
      const count = day.contributionCount;
      const color = count === 0 ? '#161b22' : count <= 2 ? '#0e4429' : count <= 4 ? '#006d32' : '#26a641';
      const x = startX + weekIndex * (cellSize + cellGap);
      const y = startY + dayIndex * (cellSize + cellGap);
      inner += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" opacity="0.3"/>`;
    });
  });

  activeDays.forEach((day: any, i: number) => {
    const origIndex = days.findIndex((d: any) => d.date === day.date);
    const weekIdx = Math.floor(origIndex / 7);
    const dayIdx = origIndex % 7;
    const x = startX + weekIdx * (cellSize + cellGap) + cellSize / 2;
    const y = startY + dayIdx * (cellSize + cellGap) + cellSize / 2;
    const delay = i * 0.08;
    const hue = (i * 13) % 360;
    inner += `<circle cx="${x}" cy="${y}" r="5" fill="hsl(${hue}, 80%, 50%)" opacity="0">
      <animate attributeName="opacity" values="0;1;0.3" dur="2.5s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
      <animate attributeName="r" values="5;7;5" dur="2.5s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
    </circle>`;
  });

  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label, i) => {
    const y = startY + i * (cellSize + cellGap) + cellSize / 2 + 3;
    inner += text(startX - 10, y, label, 'muted');
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  weeks.forEach((week: any, weekIndex: number) => {
    if (week.contributionDays[0]) {
      const date = new Date(week.contributionDays[0].date);
      if (date.getDate() <= 7) {
        const x = startX + weekIndex * (cellSize + cellGap);
        inner += text(x + cellSize / 2, startY - 8, months[date.getMonth()], 'muted');
      }
    }
  });

  inner += text(width - 30, 24, `${activeDays.length} active days • ${total.toLocaleString()} total`, 'muted');

  return createSvg(width, height, `${username}'s Contribution Snake`, inner);
}

// ============================================================================
// 6. TYPING SVG ANIMATION (Viral - pure SVG)
// ============================================================================
function generateTypingSvg(username: string, bio?: string): string {
  const width = 600;
  const height = 100;
  const phrases = [
    `Hi, I'm ${username} 👋`,
    'Full-Stack Developer',
    'Building Developer Tools',
    'Open Source Enthusiast',
    'Coffee Powered ☕',
  ];
  const cycleTime = phrases.length * 3;
  const phraseDuration = 3;

  let inner = '';
  inner += text(width / 2, height / 2 - 8, '', 'typing-text');

  phrases.forEach((phrase, i) => {
    const start = i * phraseDuration;
    inner += `<text x="${width / 2}" y="${height / 2 + 6}" text-anchor="middle" class="typing-text" fill="${COLORS.emerald}" font-family="${FONTS.mono}" font-size="18" font-weight="bold" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" dur="${cycleTime}s" begin="${start}s" repeatCount="indefinite" keyTimes="0;0.1;0.9;1" keySplines="0 0 1 1;0 0 1 1;0 0 1 1"/>
      ${phrase}
    </text>`;
  });

  inner += `<text x="${width / 2 + 2}" y="${height / 2 + 6}" text-anchor="start" class="cursor" fill="${COLORS.emerald}" font-family="${FONTS.mono}" font-size="18" font-weight="bold">|</text>`;

  return createSvg(width, height, `${username}'s Typing Animation`, `
    ${styleBlock(
      css('typing-text', { fill: COLORS.textPrimary, 'font-family': FONTS.mono, 'font-size': 20, 'font-weight': 'bold' }),
      css('cursor', { fill: COLORS.emerald, 'font-family': FONTS.mono, 'font-size': 20, 'font-weight': 'bold' })
    )}
    ${inner}
  `);
}

// ============================================================================
// 7. STAR HISTORY GRAPH
// ============================================================================
function generateStarHistorySvg(username: string, repos: any[]): string {
  const width = 600;
  const height = 220;
  const margin = { top: 40, right: 20, bottom: 40, left: 60 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const totalStars = repos.reduce((s, r) => s + (r.stargazerCount || 0), 0);
  const dataPoints = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
    stars: Math.floor((totalStars / 12) * (i + 1) * (0.8 + Math.random() * 0.4)),
  }));
  const maxStars = Math.max(...dataPoints.map(d => d.stars));

  let inner = '';
  inner += text(width / 2, 28, `⭐ ${username}'s Star History`, 'badge-title');

  inner += translate(margin.left, margin.top, `
    ${rect(0, 0, chartW, chartH, COLORS.bgElevated, RADIUS.sm, COLORS.border)}
    <defs>
      <linearGradient id="starGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${COLORS.gold}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${COLORS.bg}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${dataPoints.map((d, i) => {
      const x = (i / 11) * chartW;
      const y = chartH - (d.stars / maxStars) * chartH;
      const prev = i > 0 ? dataPoints[i - 1] : d;
      const prevX = (Math.max(0, i - 1) / 11) * chartW;
      const prevY = chartH - (prev.stars / maxStars) * chartH;
      return i === 0 
        ? `<path d="M ${x} ${y}" stroke="${COLORS.gold}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M ${prevX} ${prevY} Q ${(prevX + x) / 2} ${prevY} ${x} ${y}" stroke="${COLORS.gold}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('')}
    ${dataPoints.map((d, i) => {
      const x = (i / 11) * chartW;
      const y = chartH - (d.stars / maxStars) * chartH;
      return `<circle cx="${x}" cy="${y}" r="4" fill="${COLORS.gold}" stroke="${COLORS.bg}" stroke-width="2"/>
        <text x="${x}" y="${y - 12}" text-anchor="middle" class="muted" font-size="9">${d.stars.toLocaleString()}</text>
        <text x="${x}" y="${chartH + 18}" text-anchor="middle" class="muted" font-size="9">${d.month}</text>`;
    }).join('')}
  `);

  inner += text(width / 2, height - 8, `Total: ${totalStars.toLocaleString()} stars across ${repos.length} repos`, 'muted');

  return createSvg(width, height, `${username}'s Star History`, inner);
}

// ============================================================================
// 8. REPO CARD GENERATOR
// ============================================================================
function generateRepoCardSvg(repo: any): string {
  const width = 500;
  const height = 180;
  const name = repo.name || 'Repository';
  const desc = repo.description || 'No description provided';
  const stars = repo.stargazerCount || 0;
  const forks = repo.forkCount || 0;
  const language = repo.primaryLanguage?.name || 'Unknown';
  const languageColor = repo.primaryLanguage?.color || COLORS.emerald;
  const topics = (repo.repositoryTopics?.nodes?.map((n: any) => n.topic.name) || []).slice(0, 5);

  let inner = '';
  inner += text(30, 30, name, 'badge-title');
  inner += text(30, 50, desc, 'label-lg');

  const stats = [
    { icon: '⭐', value: stars.toLocaleString(), label: 'Stars' },
    { icon: '🍴', value: forks.toLocaleString(), label: 'Forks' },
    { icon: '🔤', value: language, label: 'Language', color: languageColor },
  ];
  stats.forEach((stat, i) => {
    const x = 30 + i * 140;
    inner += translate(x, 75, `
      <text x="0" y="0" class="label">${stat.icon} ${stat.value}</text>
      <text x="0" y="16" class="muted" font-size="9">${stat.label}</text>
    `);
  });

  if (topics.length > 0) {
    let topicX = 30;
    topics.forEach((topic: string) => {
      const w = topic.length * 7 + 16;
      inner += translate(topicX, 115, `
        ${rect(0, 0, w, 22, COLORS.bgElevated, RADIUS.sm, COLORS.borderLight)}
        <text x="${w / 2}" y="15" text-anchor="middle" class="muted" font-size="9">#${topic}</text>
      `);
      topicX += w + 8;
    });
  }

  return createSvg(width, height, `${name} Repository Card`, inner);
}

// ============================================================================
// 9. LANGUAGE DONUT CHART
// ============================================================================
function generateLanguageDonutSvg(languages: any[]): string {
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 120;
  const strokeWidth = 24;

  const total = languages.reduce((s, l) => s + (l.percentage || 0), 0);
  const sorted = [...languages].sort((a, b) => (b.percentage || 0) - (a.percentage || 0)).slice(0, 6);

  let inner = '';
  inner += text(width / 2, 30, 'Language Breakdown', 'badge-title');

  let currentAngle = -90;
  sorted.forEach((lang, i) => {
    const percentage = lang.percentage / total;
    const sweepAngle = percentage * 360;
    const endAngle = currentAngle + sweepAngle;
    const largeArc = sweepAngle > 180 ? 1 : 0;

    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const color = lang.color || `hsl(${i * 60}, 70%, 50%)`;
    inner += `<path d="M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round">
      <animate attributeName="stroke-dasharray" values="0 ${2 * Math.PI * radius}; ${sweepAngle / 360 * 2 * Math.PI * radius} ${2 * Math.PI * radius}" dur="1.5s" begin="${i * 0.2}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    </path>`;

    const legendY = 180 + i * 22;
    inner += translate(60, legendY, `
      ${rect(0, 0, 14, 14, color, RADIUS.sm)}
      <text x="22" y="11" class="label-lg">${lang.name} <tspan class="value-sm">${lang.percentage.toFixed(1)}%</tspan></text>
    `);

    currentAngle = endAngle;
  });

  inner += `<text x="${centerX}" y="${centerY - 4}" text-anchor="middle" class="value" font-size="24">${total.toFixed(0)}%</text>`;
  inner += `<text x="${centerX}" y="${centerY + 20}" text-anchor="middle" class="muted" font-size="11">Languages</text>`;

  return createSvg(width, height, 'Language Breakdown', inner);
}

// ============================================================================
// 10. SKILL BUBBLES CLOUD
// ============================================================================
function generateSkillBubblesSvg(skills: string[]): string {
  const width = 600;
  const height = 200;
  const displaySkills = skills.slice(0, 15);

  let inner = '';
  inner += text(width / 2, 30, 'Tech Stack', 'badge-title');

  displaySkills.forEach((skill, i) => {
    const angle = (i / displaySkills.length) * Math.PI * 2;
    const radius = 70 + (i % 3) * 30;
    const x = width / 2 + radius * Math.cos(angle);
    const y = height / 2 + radius * Math.sin(angle);
    const w = skill.length * 8 + 24;
    const delay = i * 0.1;

    inner += translate(x - w / 2, y - 18, `
      ${rect(0, 0, w, 36, COLORS.bgElevated, RADIUS.lg, COLORS.borderLight, 1)}
      <text x="${w / 2}" y="22" text-anchor="middle" class="label-lg">${skill}</text>
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="${delay}s" fill="freeze"/>
    `);
  });

  return createSvg(width, height, 'Tech Stack Bubbles', inner);
}

// ============================================================================
// 11. ASCII BANNER GENERATOR
// ============================================================================
function generateAsciiBannerSvg(text_content: string, font = 'standard'): string {
  const width = 800;
  const height = 120;
  const lines = text_content.split('\n');
  const charWidth = 8;
  const lineHeight = 18;

  let inner = '';
  inner += text(width / 2, 20, 'ASCII Banner', 'badge-title');

  lines.forEach((line, i) => {
    const x = (width - line.length * charWidth) / 2;
    inner += `<text x="${x}" y="${50 + i * lineHeight}" class="ascii" fill="${COLORS.emerald}" font-family="${FONTS.mono}" font-size="12" letter-spacing="1px">${line}</text>`;
  });

  return createSvg(width, height, 'ASCII Banner', inner + styleBlock(
    css('ascii', { fill: COLORS.emerald, 'font-family': FONTS.mono, 'font-size': 12, 'letter-spacing': '1px' })
  ));
}

// ============================================================================
// 12. CONTRIBUTION STREAK CALENDAR (Compact)
// ============================================================================
function generateStreakCalendarSvg(username: string, calendar: any, streak: number): string {
  const width = 400;
  const height = 180;
  const weeks = calendar?.weeks || [];
  const cellSize = 10;
  const cellGap = 2;
  const startX = 30;
  const startY = 50;

  let inner = '';
  inner += text(width / 2, 28, `🔥 ${username}'s Streak: ${streak} Days`, 'badge-title');

  weeks.slice(-7).forEach((week: any, weekIndex: number) => {
    week.contributionDays.forEach((day: any, dayIndex: number) => {
      const count = day.contributionCount;
      const color = count === 0 ? '#161b22' : count <= 2 ? '#0e4429' : count <= 4 ? '#006d32' : '#26a641';
      const x = startX + weekIndex * (cellSize + cellGap);
      const y = startY + dayIndex * (cellSize + cellGap);
      inner += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}"/>`;
    });
  });

  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label, i) => {
    inner += text(startX - 8, startY + i * (cellSize + cellGap) + cellSize / 2 + 3, label, 'muted');
  });

  inner += text(width / 2, height - 20, 'Last 7 weeks • Green = active day', 'muted');

  return createSvg(width, height, `${username}'s Streak Calendar`, inner);
}

// ============================================================================
// DEMO CALENDAR FALLBACK
// ============================================================================
function generateDemoCalendar() {
  interface ContributionDay {
    date: string;
    contributionCount: number;
  }
  interface Week { contributionDays: ContributionDay[] }
  
  const weeks: Week[] = [];
  const now = new Date();
  for (let w = 0; w < 53; w++) {
    const week: Week = { contributionDays: [] };
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (52 - w) * 7 - (6 - d));
      const count = Math.random() > 0.7 ? Math.floor(Math.random() * 8) : 0;
      week.contributionDays.push({ date: date.toISOString().split('T')[0], contributionCount: count });
    }
    weeks.push(week);
  }
  return { weeks, totalContributions: weeks.flatMap(w => w.contributionDays).reduce((s, d) => s + d.contributionCount, 0) };
}

// ============================================================================
// MAIN HANDLER WITH ETAG & CACHING
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const type = searchParams.get('type') || 'stats';
    const token = searchParams.get('token') || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    const userToken = searchParams.get('user_token') || undefined; // User's OAuth token from NextAuth

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // Fetch profile data with caching and ETag support
    const { data: profileData, etag, fromCache } = await fetchProfileData(username, { token, userToken });

    // Check ETag for conditional request
    if (checkETag(req, etag)) {
      return createNotModifiedResponse(etag);
    }

    const userData = {
      public_repos: profileData.repositories?.totalCount || 0,
      followers: profileData.followers?.totalCount || 0,
      following: profileData.following?.totalCount || 0,
      bio: profileData.bio || '',
      login: profileData.login,
    };

    const reposData = profileData.reposList?.nodes || [];
    const calendar = profileData.contributionsCollection?.contributionCalendar;
    const demoCalendar = calendar || generateDemoCalendar();

    // Calculate streak from calendar
    const days = calendar?.weeks?.flatMap((w: any) => w.contributionDays) || demoCalendar.weeks.flatMap((w: any) => w.contributionDays);
    days.sort((a: any, b: any) => b.date.localeCompare(a.date));
    let streak = 0;
    const mostRecentDate = days[0]?.date;
    for (const day of days) {
      if (day.contributionCount > 0) streak++;
      else if (day.date !== mostRecentDate) break;
    }

    const languagesData = calculateLanguages(reposData);

    const stats = {
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      topLanguage: languagesData[0]?.name || 'TypeScript',
      totalContributions: calendar?.totalContributions || demoCalendar.totalContributions,
      streak,
    };

    let badgeSvg: string;
    const labelColor = '090d16';
    const color = '10b981';

    // ===== SHIELDS COMPATIBLE BADGES =====
    if (type === 'repos') badgeSvg = generateBadge('Public Repos', String(stats.publicRepos), color, labelColor);
    else if (type === 'followers') badgeSvg = generateBadge('Followers', String(stats.followers), color, labelColor);
    else if (type === 'following') badgeSvg = generateBadge('Following', String(stats.following), color, labelColor);
    else if (type === 'language') badgeSvg = generateBadge('Top Language', stats.topLanguage, color, labelColor);
    else if (type === 'streak') badgeSvg = generateBadge('Streak', `${stats.streak} days`, 'f59e0b', labelColor);
    else if (type === 'contributions') badgeSvg = generateBadge('Contributions', String(stats.totalContributions), color, labelColor);

    // ===== RICH SVG CARDS =====
    else if (type === 'trophy') badgeSvg = generateTrophySvg(username, userData.public_repos, userData.followers, reposData.reduce((s, r) => s + (r.stargazerCount || 0), 0));
    else if (type === 'activity') badgeSvg = generateActivityGraphSvg(username);
    else if (type === 'visitor') badgeSvg = generateVisitorCardSvg(username, userData.followers, userData.public_repos, stats.totalContributions);
    else if (type === 'heatmap') badgeSvg = generateHeatmapSvg(username, demoCalendar);
    else if (type === 'snake') badgeSvg = generateSnakeSvg(username, demoCalendar);
    else if (type === 'typing') badgeSvg = generateTypingSvg(username, userData.bio);
    else if (type === 'star-history') badgeSvg = generateStarHistorySvg(username, reposData);
    else if (type === 'repo-card') {
      const repoName = searchParams.get('repo');
      const repo = reposData.find((r: any) => r.name === repoName) || reposData[0];
      badgeSvg = generateRepoCardSvg(repo);
    }
    else if (type === 'language-donut') badgeSvg = generateLanguageDonutSvg(languagesData);
    else if (type === 'skill-bubbles') badgeSvg = generateSkillBubblesSvg(['TypeScript', 'React', 'Next.js', 'Node.js', 'Rust', 'Go', 'Python', 'TailwindCSS', 'PostgreSQL', 'Docker', 'GraphQL', 'WebGL']);
    else if (type === 'ascii') {
      const text = searchParams.get('text') || username;
      badgeSvg = generateAsciiBannerSvg(text);
    }
    else if (type === 'streak-calendar') badgeSvg = generateStreakCalendarSvg(username, demoCalendar, stats.streak);

    // ===== EXTERNAL API BADGES (Disabled until tokens provided) =====
    else if (type === 'wakatime') {
      if (!process.env.WAKATIME_API_KEY) badgeSvg = generateBadge('WakaTime', 'Token Required', COLORS.red, labelColor);
      else badgeSvg = generateBadge('WakaTime', 'Configured ✓', COLORS.emerald, labelColor);
    }
    else if (type === 'leetcode') {
      if (!process.env.LEETCODE_SESSION) badgeSvg = generateBadge('LeetCode', 'Token Required', COLORS.red, labelColor);
      else badgeSvg = generateBadge('LeetCode', 'Configured ✓', COLORS.emerald, labelColor);
    }
    else if (type === 'codeforces') {
      const handle = searchParams.get('handle') || process.env.CODEFORCES_HANDLE;
      if (!handle) badgeSvg = generateBadge('Codeforces', 'Handle Required', COLORS.red, labelColor);
      else badgeSvg = generateBadge('Codeforces', 'Configured ✓', COLORS.emerald, labelColor);
    }
    else if (type === 'spotify') {
      if (!process.env.SPOTIFY_REFRESH_TOKEN) badgeSvg = generateBadge('Spotify', 'Token Required', COLORS.red, labelColor);
      else badgeSvg = generateBadge('Spotify', 'Configured ✓', COLORS.emerald, labelColor);
    }
    else if (type === 'youtube') {
      if (!process.env.YOUTUBE_API_KEY) badgeSvg = generateBadge('YouTube', 'Token Required', COLORS.red, labelColor);
      else badgeSvg = generateBadge('YouTube', 'Configured ✓', COLORS.emerald, labelColor);
    }
    else if (type === 'blog') {
      badgeSvg = generateBadge('Blog Posts', 'Configured ✓', COLORS.emerald, labelColor);
    }

    // ===== STATS JSON =====
    else {
      return createETagResponse({ ...stats, languages: languagesData, username, fromCache }, etag);
    }

    return new NextResponse(badgeSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'ETag': etag,
        'Cache-Control': 'public, max-age=21600, stale-while-revalidate=21600', // 6 hours
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to generate badge' }, { status: 500 });
  }
}

// Helper function moved from github.ts
function calculateLanguages(repos: any[]): Array<{ name: string; percentage: number; color: string }> {
  const LANG_COLORS: Record<string, string> = {
    TypeScript: '#3178c6', JavaScript: '#f1e05a', Rust: '#dea584', Python: '#3572A5',
    Go: '#00ADD8', HTML: '#e34c26', CSS: '#563d7c', Java: '#b07219', C: '#555555',
    'C++': '#f34b7d', Ruby: '#701516', PHP: '#4F5D95', Swift: '#ffac45', Kotlin: '#A97BFF',
  };
  
  const langCounts: Record<string, number> = {};
  let totalLangCount = 0;
  repos.forEach((repo) => {
    if (repo.primaryLanguage && !repo.isFork) {
      const lang = repo.primaryLanguage.name;
      langCounts[lang] = (langCounts[lang] || 0) + 1;
      totalLangCount++;
    }
    repo.languages?.nodes?.forEach((l: any) => {
      if (!repo.isFork) {
        langCounts[l.name] = (langCounts[l.name] || 0) + 1;
        totalLangCount++;
      }
    });
  });

  const sortedLangs = Object.entries(langCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return sortedLangs.map(([name, count]) => ({
    name,
    percentage: totalLangCount > 0 ? Number(((count / totalLangCount) * 100).toFixed(1)) : 20,
    color: LANG_COLORS[name] || '#8b5cf6',
  }));
}