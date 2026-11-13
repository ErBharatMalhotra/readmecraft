import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { fetchProfileData, checkETag, createETagResponse, createNotModifiedResponse } from '@/lib/github-api';

// ============================================================================
// DESIGN SYSTEM CONSTANTS
// ============================================================================
// Theme definitions - each theme is a complete color palette
const THEMES = {
  tokyonight: {
    bg: '#1a1b26',
    bgElevated: '#24283b',
    border: '#414868',
    borderLight: '#565f89',
    emerald: '#7aa2f7',
    emeraldDim: '#5d7acf',
    emeraldLight: '#a5bdfc',
    gold: '#e0af68',
    goldDim: '#c4964a',
    textPrimary: '#c0caf5',
    textSecondary: '#9aa5ce',
    textMuted: '#565f89',
    red: '#f7768e',
  },
  dracula: {
    bg: '#282a36',
    bgElevated: '#44475a',
    border: '#6272a4',
    borderLight: '#6272a4',
    emerald: '#50fa7b',
    emeraldDim: '#3fd86a',
    emeraldLight: '#6aff8f',
    gold: '#f1fa8c',
    goldDim: '#d9e27a',
    textPrimary: '#f8f8f2',
    textSecondary: '#bd93f9',
    textMuted: '#6272a4',
    red: '#ff5555',
  },
  nord: {
    bg: '#2e3440',
    bgElevated: '#3b4252',
    border: '#4c566a',
    borderLight: '#4c566a',
    emerald: '#88c0d0',
    emeraldDim: '#6db4c4',
    emeraldLight: '#a0d8e8',
    gold: '#ebcb8b',
    goldDim: '#d8b778',
    textPrimary: '#eceff4',
    textSecondary: '#d8dee9',
    textMuted: '#4c566a',
    red: '#bf616a',
  },
  github: {
    bg: '#0d1117',
    bgElevated: '#161b22',
    border: '#30363d',
    borderLight: '#484f58',
    emerald: '#58a6ff',
    emeraldDim: '#3d8ce0',
    emeraldLight: '#79c0ff',
    gold: '#d2a8ff',
    goldDim: '#b88fff',
    textPrimary: '#e6edf3',
    textSecondary: '#8b949e',
    textMuted: '#6e7681',
    red: '#f85149',
  },
  gruvbox: {
    bg: '#282828',
    bgElevated: '#3c3836',
    border: '#504945',
    borderLight: '#665c54',
    emerald: '#8ec07c',
    emeraldDim: '#7aa86a',
    emeraldLight: '#a8d898',
    gold: '#fabd2f',
    goldDim: '#e2a81d',
    textPrimary: '#ebdbb2',
    textSecondary: '#a89984',
    textMuted: '#665c54',
    red: '#fb4934',
  },
  rosePine: {
    bg: '#191724',
    bgElevated: '#1f1d2e',
    border: '#6e6a86',
    borderLight: '#908caa',
    emerald: '#9ccfd8',
    emeraldDim: '#7abdc8',
    emeraldLight: '#b8e7f0',
    gold: '#f6c177',
    goldDim: '#e8ad5f',
    textPrimary: '#e0def4',
    textSecondary: '#908caa',
    textMuted: '#6e6a86',
    red: '#eb6f92',
  },
  catppuccin: {
    bg: '#1e1e2e',
    bgElevated: '#313244',
    border: '#45475a',
    borderLight: '#585b70',
    emerald: '#89dceb',
    emeraldDim: '#6ec9d8',
    emeraldLight: '#a4e4f3',
    gold: '#f9e2af',
    goldDim: '#e8c996',
    textPrimary: '#cdd6f4',
    textSecondary: '#bac2de',
    textMuted: '#6c7086',
    red: '#f38ba8',
  },
  synthwave: {
    bg: '#2d2a40',
    bgElevated: '#3e3a59',
    border: '#f92aad',
    borderLight: '#f92aad',
    emerald: '#00ffff',
    emeraldDim: '#00cccc',
    emeraldLight: '#33ffff',
    gold: '#ffe600',
    goldDim: '#e6cc00',
    textPrimary: '#ffffff',
    textSecondary: '#f92aad',
    textMuted: '#8a88b0',
    red: '#ff4c4c',
  },
  // Default (original) theme
  default: {
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
  },
} as const;

type ThemeName = keyof typeof THEMES;
type Theme = typeof THEMES[ThemeName];

function getTheme(themeName?: string): Theme {
  const normalized = (themeName || 'default').toLowerCase() as ThemeName;
  return THEMES[normalized] || THEMES.default;
}

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

// Per-request color accessor (theme-aware)
function C(theme: Theme) {
  return {
    bg: theme.bg,
    bgElevated: theme.bgElevated,
    border: theme.border,
    borderLight: theme.borderLight,
    emerald: theme.emerald,
    emeraldDim: theme.emeraldDim,
    emeraldLight: theme.emeraldLight,
    gold: theme.gold,
    goldDim: theme.goldDim,
    textPrimary: theme.textPrimary,
    textSecondary: theme.textSecondary,
    textMuted: theme.textMuted,
    red: theme.red,
  };
}

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

function translate(x: number, y: number, children: string): string {
  return `<g transform="translate(${x}, ${y})">${children}</g>`;
}

// ============================================================================
// TEXT HANDLING SYSTEM - Prevents overflow, clipping, overlapping
// ============================================================================

// Font metrics (approximate char widths for JetBrains Mono / Verdana at different sizes)
const FONT_METRICS = {
  mono: { 9: 5.5, 10: 6, 11: 6.6, 12: 7.2, 14: 8.4, 16: 9.6, 18: 10.8, 20: 12, 22: 13.2, 24: 14.4, 28: 16.8 },
  display: { 14: 8.5, 16: 9.7, 18: 10.9, 20: 12.1, 24: 14.5, 30: 18.2 },
  ui: { 11: 6.5 },
} as const;

type FontFamily = keyof typeof FONT_METRICS;

/**
 * Estimate text width in pixels for given font family and size
 */
function estimateTextWidth(text: string, fontSize: number, fontFamily: FontFamily = 'mono'): number {
  const metrics = FONT_METRICS[fontFamily];
  // Use the closest available font size metric, fallback to 12
  const availableSizes = Object.keys(metrics).map(Number);
  const closestSize = availableSizes.reduce((prev, curr) => 
    Math.abs(curr - fontSize) < Math.abs(prev - fontSize) ? curr : prev
  );
  const charWidth = metrics[closestSize as keyof typeof metrics];
  return text.length * charWidth;
}

/**
 * Estimate text height (line height) for given font size
 */
function estimateTextHeight(fontSize: number, lineHeightMultiplier = 1.3): number {
  return Math.ceil(fontSize * lineHeightMultiplier);
}

/**
 * Truncate text with ellipsis to fit within maxWidth
 */
function truncateText(text: string, maxWidth: number, fontSize: number, fontFamily: FontFamily = 'mono'): string {
  const ellipsis = '…';
  const ellipsisWidth = estimateTextWidth(ellipsis, fontSize, fontFamily);
  const availableWidth = maxWidth - ellipsisWidth;
  
  if (estimateTextWidth(text, fontSize, fontFamily) <= maxWidth) {
    return text;
  }
  
  // Binary search for max characters that fit
  let low = 0;
  let high = text.length;
  let result = '';
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = text.slice(0, mid) + ellipsis;
    if (estimateTextWidth(candidate, fontSize, fontFamily) <= maxWidth) {
      result = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  return result || ellipsis;
}

/**
 * Wrap text to fit within maxWidth, returning array of lines
 */
function wrapText(text: string, maxWidth: number, fontSize: number, fontFamily: FontFamily = 'mono', maxLines = 3): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (estimateTextWidth(testLine, fontSize, fontFamily) <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word too long - truncate it
        lines.push(truncateText(word, maxWidth, fontSize, fontFamily));
        currentLine = '';
      }
    }
    
    if (lines.length >= maxLines) break;
  }
  
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  
  // If we have more content than maxLines, truncate last line
  if (lines.length === maxLines && currentLine) {
    const lastLine = lines[maxLines - 1];
    const remaining = `${lastLine} ${currentLine}`;
    lines[maxLines - 1] = truncateText(remaining, maxWidth, fontSize, fontFamily);
  }
  
  return lines;
}

/**
 * Safe text element with automatic truncation/wrapping
 */
interface SafeTextOptions {
  x: number;
  y: number;
  content: string;
  cls: string;
  maxWidth?: number;
  maxLines?: number;
  fontSize?: number;
  fontFamily?: FontFamily;
  textAnchor?: 'start' | 'middle' | 'end';
  truncate?: boolean; // if true, truncate single line; if false, wrap
}

function safeText(options: SafeTextOptions): string {
  const {
    x, y, content, cls, maxWidth, maxLines = 1, fontSize = 12, 
    fontFamily = 'mono', textAnchor = 'start', truncate = true
  } = options;
  
  if (!maxWidth || estimateTextWidth(content, fontSize, fontFamily) <= maxWidth) {
    // Fits in single line
    const anchorAttr = textAnchor !== 'start' ? ` text-anchor="${textAnchor}"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${anchorAttr}>${content}</text>`;
  }
  
  if (truncate || maxLines === 1) {
    // Single line truncation
    const truncated = truncateText(content, maxWidth, fontSize, fontFamily);
    const anchorAttr = textAnchor !== 'start' ? ` text-anchor="${textAnchor}"` : '';
    return `<text x="${x}" y="${y}" class="${cls}"${anchorAttr}>${truncated}</text>`;
  }
  
  // Multi-line wrapping
  const lines = wrapText(content, maxWidth, fontSize, fontFamily, maxLines);
  const lineHeight = estimateTextHeight(fontSize);
  
  return lines.map((line, i) => {
    const lineY = y + i * lineHeight;
    const anchorAttr = textAnchor !== 'start' ? ` text-anchor="${textAnchor}"` : '';
    return `<text x="${x}" y="${lineY}" class="${cls}"${anchorAttr}>${line}</text>`;
  }).join('');
}

/**
 * Calculate required width for a text label + value pair (for badges)
 */
function calculateBadgeWidth(label: string, value: string, labelFontSize = 11, valueFontSize = 11, padding = 20): number {
  const labelWidth = estimateTextWidth(label, labelFontSize, 'ui') + 10;
  const valueWidth = estimateTextWidth(value, valueFontSize, 'ui') + 10;
  return labelWidth + valueWidth + padding;
}

/**
 * Safe rectangle bounds checker - ensures content fits within container
 */
interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function ensureFitsInBounds(textContent: string, bounds: Bounds, fontSize: number, fontFamily: FontFamily = 'mono', padding = 8): {
  fits: boolean;
  truncatedText: string;
  lines: string[];
} {
  const maxWidth = bounds.width - padding * 2;
  const maxHeight = bounds.height - padding * 2;
  const lineHeight = estimateTextHeight(fontSize);
  const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight));
  
  const lines = wrapText(textContent, maxWidth, fontSize, fontFamily, maxLines);
  const truncatedText = lines.join(' ');
  const fits = lines.length <= maxLines && lines.every(l => estimateTextWidth(l, fontSize, fontFamily) <= maxWidth);
  
  return { fits, truncatedText, lines };
}

/**
 * Create a safe text block that auto-sizes and positions within bounds
 */
interface TextBlockOptions {
  bounds: Bounds;
  content: string;
  cls: string;
  fontSize?: number;
  fontFamily?: FontFamily;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeightMultiplier?: number;
  maxLines?: number;
}

function createTextBlock(options: TextBlockOptions): string {
  const {
    bounds, content, cls, fontSize = 12, fontFamily = 'mono', 
    align = 'left', verticalAlign = 'top', lineHeightMultiplier = 1.3, maxLines = 10
  } = options;
  
  const padding = 4;
  const maxWidth = bounds.width - padding * 2;
  const maxHeight = bounds.height - padding * 2;
  const lineHeight = Math.ceil(fontSize * lineHeightMultiplier);
  const actualMaxLines = Math.min(maxLines, Math.max(1, Math.floor(maxHeight / lineHeight)));
  
  const lines = wrapText(content, maxWidth, fontSize, fontFamily, actualMaxLines);
  const totalHeight = lines.length * lineHeight;
  
  let startY: number;
  switch (verticalAlign) {
    case 'middle': startY = bounds.y + (bounds.height - totalHeight) / 2 + fontSize * 0.7; break;
    case 'bottom': startY = bounds.y + bounds.height - padding - (lines.length - 1) * lineHeight; break;
    default: startY = bounds.y + padding + fontSize * 0.7;
  }
  
  let xOffset: number;
  switch (align) {
    case 'center': xOffset = bounds.x + bounds.width / 2; break;
    case 'right': xOffset = bounds.x + bounds.width - padding; break;
    default: xOffset = bounds.x + padding;
  }
  
  const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';
  
  return lines.map((line, i) => 
    `<text x="${xOffset}" y="${startY + i * lineHeight}" class="${cls}" text-anchor="${anchor}">${line}</text>`
  ).join('');
}

function text(x: number, y: number, content: string, cls: string): string {
  return `<text x="${x}" y="${y}" class="${cls}">${content}</text>`;
}

// ============================================================================
// BASE SVG WRAPPER (theme-aware)
// ============================================================================
function createSvg(width: number, height: number, title: string, inner: string, theme: Theme): string {
  const c = C(theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
${styleBlock(
  css('bg', { fill: c.bg, stroke: c.border, 'stroke-width': 1, rx: RADIUS.lg }),
  css('panel', { fill: c.bgElevated, stroke: c.border, 'stroke-width': 1, rx: RADIUS.md }),
  css('title', { fill: c.emerald, 'font-family': FONTS.display, 'font-weight': 'bold', 'font-size': 14 }),
  css('label', { fill: c.textSecondary, 'font-family': FONTS.mono, 'font-size': 10 }),
  css('label-lg', { fill: c.textSecondary, 'font-family': FONTS.mono, 'font-size': 11 }),
  css('value', { fill: c.textPrimary, 'font-family': FONTS.mono, 'font-weight': 'bold', 'font-size': 14 }),
  css('value-sm', { fill: c.textPrimary, 'font-family': FONTS.mono, 'font-weight': 'bold', 'font-size': 12 }),
  css('muted', { fill: c.textMuted, 'font-family': FONTS.mono, 'font-size': 9 }),
  css('badge-title', { fill: c.emerald, 'font-family': FONTS.display, 'font-weight': 'bold', 'font-size': 16 }),
)}
<rect width="${width}" height="${height}" class="bg"/>
${inner}
</svg>`;
}

// ============================================================================
// BADGE GENERATORS (Shields.io compatible)
// ============================================================================
function generateBadge(label: string, message: string, theme: Theme, accent?: 'emerald' | 'gold' | 'red'): string {
  const c = C(theme);
  const color = accent ? c[accent] : c.emerald;
  const labelWidth = (label.length + 1) * 7;
  const messageWidth = (message.length + 1) * 7;
  const totalWidth = labelWidth + messageWidth + 20;
  const labelBg = theme === THEMES.default ? '090d16' : c.bg.replace('#', '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" role="img" aria-label="${label}: ${message}">
<linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<mask id="a"><rect width="${totalWidth}" height="28" rx="4" fill="#fff"/></mask>
<g mask="url(#a)">
<rect width="${labelWidth + 10}" height="28" fill="#${labelBg}"/>
<rect x="${labelWidth + 10}" width="${messageWidth + 10}" height="28" fill="#${color.replace('#', '')}"/>
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
function generateTrophySvg(username: string, reposCount: number, followersCount: number, starsCount: number, theme: Theme): string {
  const c = C(theme);
  const width = 520;
  const height = 140;
  const cardW = 148;
  const gap = 18;
  const startX = (width - (cardW * 3 + gap * 2)) / 2;
  const cardPadding = 12;
  const maxValueWidth = cardW - cardPadding * 2;

  const cards = [
    { icon: '⭐', label: 'OPEN SOURCE', value: `${reposCount.toLocaleString()} Repos`, accent: c.emerald },
    { icon: '🔥', label: 'COMMUNITY', value: `${followersCount.toLocaleString()} Followers`, accent: c.gold },
    { icon: '⚡', label: 'VELOCITY', value: 'Elite Tier', accent: c.red },
  ];

  let inner = '';
  // Safe title with truncation
  const titleText = `🏆 ${username}'s Developer Trophies`;
  inner += safeText({
    x: width / 2, y: 30, content: titleText, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle'
  });

  cards.forEach((card, i) => {
    const x = startX + i * (cardW + gap);
    const y = 50;
    inner += translate(x, y, `
      ${rect(0, 0, cardW, 70, c.bgElevated, RADIUS.md, c.borderLight)}
      <text x="${cardW / 2}" y="24" text-anchor="middle" font-size="22">${card.icon}</text>
      ${safeText({
        x: cardW / 2, y: 42, content: card.label, cls: 'label',
        maxWidth: maxValueWidth, fontSize: 10, fontFamily: 'mono', textAnchor: 'middle', truncate: true
      })}
      ${safeText({
        x: cardW / 2, y: 58, content: card.value, cls: 'value-sm',
        maxWidth: maxValueWidth, fontSize: 12, fontFamily: 'mono', textAnchor: 'middle', truncate: true
      })}
    `);
  });

  return createSvg(width, height, `${username}'s Developer Trophies`, inner, theme);
}

// ============================================================================
// 2. COMMIT ACTIVITY GRAPH
// ============================================================================
function generateActivityGraphSvg(username: string, theme: Theme): string {
  const c = C(theme);
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
  inner += safeText({
    x: width / 2, y: 28, content: `📈 ${username}'s Commit Activity (30 Days)`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  inner += translate(margin.left, margin.top, `
    ${rect(0, 0, chartW, chartH, c.bgElevated, RADIUS.sm, c.border)}
    <defs>
      <linearGradient id="activityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${c.emerald}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${c.bg}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#activityGrad)"/>
    <path d="${path}" fill="none" stroke="${c.emerald}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${points.map((p, i) => i % 4 === 0 ? `<circle cx="${p.x - margin.left}" cy="${p.y - margin.top}" r="3" fill="${c.emerald}" stroke="${c.bg}" stroke-width="2"/>` : '').join('')}
  `);

  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((day, i) => {
    const x = margin.left + (i / 6) * chartW;
    inner += safeText({
      x, y: height - 12, content: day, cls: 'muted',
      maxWidth: chartW / 7, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true
    });
  });

  inner += safeText({
    x: 12, y: height / 2, content: 'Commits', cls: 'muted',
    maxWidth: margin.left - 16, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true
  });

  return createSvg(width, height, `${username}'s Commit Activity`, inner, theme);
}

// ============================================================================
// 3. VISITOR ANALYTICS CARD
// ============================================================================
function generateVisitorCardSvg(username: string, followers: number, repos: number, contributions: number, theme: Theme): string {
  const c = C(theme);
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
  const cardPadding = 12;
  const maxValueWidth = cardW - cardPadding * 2;

  let inner = '';
  inner += safeText({
    x: width / 2, y: 30, content: `👀 ${username}'s Visitor Analytics`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle'
  });

  cards.forEach((card, i) => {
    const x = startX + i * (cardW + gap);
    const y = 50;
    inner += translate(x, y, `
      ${rect(0, 0, cardW, 80, c.bgElevated, RADIUS.md, c.borderLight)}
      <text x="${cardW / 2}" y="22" text-anchor="middle" font-size="20">${card.icon}</text>
      ${safeText({
        x: cardW / 2, y: 42, content: card.label, cls: 'label',
        maxWidth: maxValueWidth, fontSize: 10, fontFamily: 'mono', textAnchor: 'middle', truncate: true
      })}
      ${safeText({
        x: cardW / 2, y: 62, content: card.value, cls: 'value',
        maxWidth: maxValueWidth, fontSize: 14, fontFamily: 'mono', textAnchor: 'middle', truncate: true
      })}
      ${safeText({
        x: cardW / 2, y: 76, content: card.trend, cls: 'muted',
        maxWidth: maxValueWidth, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true
      })}
    `);
  });

  return createSvg(width, height, `${username}'s Visitor Analytics`, inner, theme);
}

// ============================================================================
// 4. CONTRIBUTION HEATMAP (GitHub-style) - WITH VIEWER TIMEZONE HIGHLIGHT
// ============================================================================
function generateHeatmapSvg(username: string, calendar: any, theme: Theme, viewer?: ViewerContext): string {
  const c = C(theme);
  const width = 820;
  const height = 160;
  const weeks = calendar?.weeks || [];
  const cellSize = 11;
  const cellGap = 2;
  const startX = 55;
  const startY = 40;

  const allDays = weeks.flatMap((w: any) => w.contributionDays);
  const maxCount = Math.max(...allDays.map((d: any) => d.contributionCount), 1);

  const getColor = (count: number, isCurrentHour = false) => {
    if (count === 0) return c.bgElevated;
    if (count <= maxCount * 0.2) return isCurrentHour ? '#1a5c35' : '#0e4429';
    if (count <= maxCount * 0.4) return isCurrentHour ? '#0a8a3f' : '#006d32';
    if (count <= maxCount * 0.6) return isCurrentHour ? '#34c652' : '#26a641';
    if (count <= maxCount * 0.8) return isCurrentHour ? '#4fd160' : '#39d353';
    return isCurrentHour ? '#6ff08a' : '#5ee87a';
  };

  let inner = '';
  inner += safeText({
    x: 30, y: 24, content: `🗓️ ${username}'s Contribution Calendar`, cls: 'badge-title',
    maxWidth: width - 80, fontSize: 14, fontFamily: 'display', truncate: true
  });
  const viewerHour = viewer ? getViewerHour(viewer.timezone) : -1;
  const viewerWeekday = viewer ? getViewerWeekday(viewer.timezone) : -1;
  if (viewer && viewerHour >= 0) {
    const greeting = getTimeGreeting(viewerHour);
    const tz = viewer.timezone || 'UTC';
    inner += safeText({
      x: width - 30, y: 24, content: `${greeting.emoji} ${greeting.text} • ${tz} • ${viewerHour.toString().padStart(2, '0')}:00`, cls: 'muted',
      maxWidth: width / 2, fontSize: 10, fontFamily: 'mono', textAnchor: 'end', truncate: true
    });
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  weeks.forEach((week: any, weekIndex: number) => {
    if (week.contributionDays[0]) {
      const date = new Date(week.contributionDays[0].date);
      if (date.getDate() <= 7) {
        const x = startX + weekIndex * (cellSize + cellGap);
        inner += safeText({ x: x + cellSize / 2, y: startY - 8, content: months[date.getMonth()], cls: 'muted',
          maxWidth: cellSize * 4, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true });
      }
    }
  });

  // Get current hour for highlighting (if viewer provided)
  const currentHour = viewerHour;

  weeks.forEach((week: any, weekIndex: number) => {
    week.contributionDays.forEach((day: any, dayIndex: number) => {
      const count = day.contributionCount;
      const isCurrentHour = (dayIndex === currentHour);
      const color = getColor(count, isCurrentHour);
      const x = startX + weekIndex * (cellSize + cellGap);
      const y = startY + dayIndex * (cellSize + cellGap);
      
      if (isCurrentHour && count > 0) {
        // Highlight current hour with pulsing ring
        inner += `<g>
          <rect x="${x - 1}" y="${y - 1}" width="${cellSize + 2}" height="${cellSize + 2}" rx="3" fill="none" stroke="${c.gold}" stroke-width="1.5">
            <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite"/>
            <animate attributeName="stroke-width" values="1;2.5;1" dur="1.5s" repeatCount="indefinite"/>
          </rect>
          <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" />
        </g>`;
      } else {
        inner += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" />`;
      }
    });
  });

  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label, i) => {
    const y = startY + i * (cellSize + cellGap) + cellSize / 2 + 3;
    // Highlight current day label
    if (viewer && viewerWeekday >= 0 && i === viewerWeekday) {
      inner += `<text x="${startX - 10}" y="${y}" class="label" font-size="9" fill="${c.gold}" font-weight="bold">${label}</text>`;
    } else {
      inner += safeText({
        x: startX - 10, y, content: label, cls: 'muted',
        maxWidth: startX - 14, fontSize: 9, fontFamily: 'mono', textAnchor: 'end', truncate: true
      });
    }
  });

  const legendY = height - 15;
  inner += translate(startX, legendY, `
    ${safeText({ x: 0, y: 5, content: 'Less', cls: 'muted', maxWidth: 30, fontSize: 9, fontFamily: 'mono', truncate: true })}
    ${[0, 1, 2, 3, 4, 5].map(i => rect(35 + i * 14, -3, 10, 10, getColor(i === 0 ? 0 : maxCount * i / 5), 2)).join('')}
    ${safeText({ x: 110, y: 5, content: 'More', cls: 'muted', maxWidth: 30, fontSize: 9, fontFamily: 'mono', textAnchor: 'end', truncate: true })}
  `);

  if (viewer && currentHour >= 0) {
    const tz = viewer.timezone || 'UTC';
    inner += safeText({
      x: startX, y: height - 5, content: `◼ Current hour (${currentHour}:00 ${tz}) highlighted in gold`, cls: 'muted',
      maxWidth: width - startX - 20, fontSize: 8, fontFamily: 'mono', truncate: true
    });
  }

  const total = calendar?.totalContributions || allDays.reduce((s: number, d: any) => s + d.contributionCount, 0);
  inner += safeText({
    x: width - 30, y: 24, content: `${total.toLocaleString()} contributions in ${new Date().getFullYear()}`, cls: 'muted',
    maxWidth: width / 2, fontSize: 9, fontFamily: 'mono', textAnchor: 'end', truncate: true
  });

  return createSvg(width, height, `${username}'s Contribution Calendar`, inner, theme);
}

// ============================================================================
// 5. CONTRIBUTION SNAKE ANIMATION (matches Platane/snk behavior)
// ============================================================================
function generateSnakeSvg(username: string, calendar: any, theme: Theme): string {
  const c = C(theme);
  const width = 820;
  const height = 152;
  const cellSize = 11;
  const cellGap = 2;
  const pitch = cellSize + cellGap;
  const startX = 62;
  const startY = 48;
  const rows = 7;
  const emptyFill = c.bgElevated;

  const maxCols = Math.floor((width - startX - 40) / pitch);
  const weeks = (calendar?.weeks || []).slice(-maxCols);
  const cols = weeks.length;

  const levelFill = (count: number) =>
    count <= 0 ? emptyFill : count <= 2 ? '#0e4429' : count <= 4 ? '#006d32' : count <= 8 ? '#26a641' : '#3fb950';

  type Cell = { col: number; row: number; count: number };
  const cells: Cell[] = [];
  weeks.forEach((week: any, col: number) => {
    (week.contributionDays || []).slice(0, rows).forEach((day: any, row: number) => {
      cells.push({ col, row, count: day.contributionCount || 0 });
    });
  });

  const activeCount = cells.filter((cell) => cell.count > 0).length;
  const total = calendar?.totalContributions ?? cells.reduce((s, cell) => s + cell.count, 0);

  let inner = '';
  inner += safeText({
    x: 24, y: 26, content: `🐍 ${username}'s Contribution Snake`, cls: 'badge-title',
    maxWidth: width - 100, fontSize: 16, fontFamily: 'display', truncate: true
  });
  inner += safeText({
    x: width - 24, y: 26, content: `${activeCount} active days • ${total.toLocaleString()} contributions`, cls: 'muted',
    maxWidth: width / 2 - 30, fontSize: 9, fontFamily: 'mono', textAnchor: 'end', truncate: true
  });

  const cellX = (col: number) => startX + col * pitch;
  const cellY = (row: number) => startY + row * pitch;
  const centerX = (col: number) => cellX(col) + cellSize / 2;
  const centerY = (row: number) => cellY(row) + cellSize / 2;

  // Build serpentine path through CONTRIBUTION CELLS ONLY (like real snk)
  // Row 0 (top): left→right, Row 1: right→left, Row 2: left→right, etc.
  // Only includes cells with count > 0
  const route: { col: number; row: number }[] = [];
  for (let r = 0; r < rows; r++) {
    const colsInRow = cells
      .filter(cell => cell.row === r && cell.count > 0)
      .sort((a, b) => a.col - b.col);
    if (r % 2 === 1) colsInRow.reverse(); // serpentine: alternate direction per row
    route.push(...colsInRow.map(cell => ({ col: cell.col, row: cell.row })));
  }

  // Fallback: if no contributions, use a minimal path through all cells
  if (route.length < 2) {
    for (let r = 0; r < rows; r++) {
      const colsInRow = r % 2 === 0
        ? [...Array(cols).keys()]
        : [...Array(cols).keys()].reverse();
      for (const col of colsInRow) {
        route.push({ col, row: r });
      }
    }
  }

  // Home position: off-screen left of the first contribution cell (or first cell)
  const firstCell = route[0];
  const home = { x: centerX(firstCell.col) - 30, y: centerY(firstCell.row) };

  let snakeCss = '';
  let snakeBody = '';
  const routeIndex = new Map<string, number>();
  route.forEach((cell, i) => routeIndex.set(`${cell.col},${cell.row}`, i));

  const segmentDefs = [
    { size: 17, fill: '#4ade80', head: true },
    { size: 15.5, fill: '#34d399', head: false },
    { size: 14, fill: '#22c55e', head: false },
    { size: 12.5, fill: '#16a34a', head: false },
    { size: 11, fill: '#15803d', head: false },
  ];

  // Build base path points (cell centers of CONTRIBUTION cells only in serpentine order)
  const basePoints = route.map((cell) => ({ x: centerX(cell.col), y: centerY(cell.row) }));

  // Build the COMPLETE path once: home -> all contribution cells -> exit -> home
  const exitPoint = { x: basePoints[basePoints.length - 1].x, y: height + 40 };
  const bottomHome = { x: home.x, y: height + 40 };
  const fullPath = [home, ...basePoints, exitPoint, bottomHome, home];

  // Calculate rotation for each step of the full path
  const fullPathWithRot: { x: number; y: number; rot: number }[] = [];
  for (let i = 0; i < fullPath.length; i++) {
    if (i < fullPath.length - 1) {
      const next = fullPath[i + 1];
      const dx = next.x - fullPath[i].x;
      const dy = next.y - fullPath[i].y;
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      fullPathWithRot.push({ ...fullPath[i], rot: angle });
    } else {
      const prev = fullPathWithRot[i - 1];
      fullPathWithRot.push({ ...fullPath[i], rot: prev?.rot ?? 0 });
    }
  }

  // Each segment gets its own keyframe track: same path, but segment i starts i steps LATER (trails head)
  const steps = fullPathWithRot.length + segmentDefs.length; // extra hold frames for last segment
  const dur = Math.min(60, Math.max(28, steps * 0.15)); // duration scales with path length
  const pct = (i: number) => ((i / steps) * 100).toFixed(3);

  segmentDefs.forEach((seg, segIdx) => {
    // Segment segIdx: hold at home for segIdx steps, then follow fullPathWithRot
    let keyframe = `@keyframes sn-move-${segIdx}{`;
    
    // Hold at home for segIdx steps
    for (let i = 0; i < segIdx; i++) {
      keyframe += `${pct(i)}%{transform:translate(${home.x.toFixed(1)}px,${home.y.toFixed(1)}px) rotate(${fullPathWithRot[0].rot.toFixed(1)}deg)}`;
    }
    
    // Then follow the full path
    for (let i = 0; i < fullPathWithRot.length; i++) {
      const stepIdx = i + segIdx;
      if (stepIdx >= steps) break;
      const p = fullPathWithRot[i];
      const rot = ` rotate(${p.rot.toFixed(1)}deg)`;
      keyframe += `${pct(stepIdx)}%{transform:translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)${rot}}`;
    }
    
    // Fill remaining with home position
    const lastStep = fullPathWithRot.length + segIdx - 1;
    for (let i = lastStep + 1; i < steps; i++) {
      keyframe += `${pct(i)}%{transform:translate(${home.x.toFixed(1)}px,${home.y.toFixed(1)}px) rotate(${fullPathWithRot[0].rot.toFixed(1)}deg)}`;
    }
    keyframe += `100%{transform:translate(${home.x.toFixed(1)}px,${home.y.toFixed(1)}px) rotate(${fullPathWithRot[0].rot.toFixed(1)}deg)}}`;
    
    snakeCss += keyframe;

    // Build segment element
    snakeBody +=
      `<g class="sn-seg" style="animation:sn-move-${segIdx} ${dur.toFixed(2)}s linear infinite">` +
      `<rect x="${(-seg.size / 2).toFixed(1)}" y="${(-seg.size / 2).toFixed(1)}" width="${seg.size}" height="${seg.size}" rx="${(seg.size * 0.32).toFixed(1)}" fill="${seg.fill}" stroke="#052e16" stroke-width="0.9"/>` +
      (seg.head ? buildSnakeHead(seg.size) : '') +
      `</g>`;
  });

  // Tongue flicker animation (CSS-based, works with parent rotation)
  snakeCss += `@keyframes sn-tongue-flicker{0%,100%{opacity:0.4;transform:scaleX(1)}50%{opacity:1;transform:scaleX(1.15)}}`;
  snakeCss += `.sn-tongue{animation:sn-tongue-flicker 1.8s ease-in-out infinite;transform-origin:${(segmentDefs[0].size * 0.75).toFixed(1)}px 0}`;

  // Cell eating animations: only contribution cells animate
  // Head (segIdx=0) reaches basePoints[i] at step i+1 (step 0 = home)
  const headOffset = 1; // head starts moving at step 1
  route.forEach((cell, i) => {
    const cellData = cells.find(c => c.col === cell.col && c.row === cell.row);
    if (!cellData || cellData.count <= 0) return;
    const fill = levelFill(cellData.count);
    const eatAt = pct(i + headOffset); // head reaches at step i+1
    const darkAt = pct(i + headOffset + 0.02);
    snakeCss += `@keyframes sn-e${i}{0%,${eatAt}%{fill:${fill}}${darkAt}%,100%{fill:${emptyFill}}}`;
    snakeCss += `.sn-e${i}{animation:sn-e${i} ${dur.toFixed(2)}s linear infinite}`;
  });

  // Contribution grid (all cells)
  let grid = '';
  cells.forEach((cell) => {
    const idx = routeIndex.get(`${cell.col},${cell.row}`);
    const eaten = idx !== undefined && cell.count > 0;
    const fill = levelFill(cell.count);
    const cls = eaten ? `sn-cell sn-e${idx}` : 'sn-cell';
    grid += `<rect class="${cls}" x="${cellX(cell.col)}" y="${cellY(cell.row)}" width="${cellSize}" height="${cellSize}" rx="2.5" fill="${fill}"/>`;
  });

  // Row labels
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label, i) => {
    const y = startY + i * pitch + cellSize / 2 + 3;
    inner += safeText({
      x: startX - 8, y, content: label, cls: 'muted',
      maxWidth: startX - 12, fontSize: 9, fontFamily: 'mono', textAnchor: 'end', truncate: true
    });
  });

  // Month labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  weeks.forEach((week: any, wi: number) => {
    const first = week.contributionDays?.[0];
    if (first) {
      const date = new Date(first.date);
      if (date.getDate() <= 7) {
        const x = startX + wi * pitch + cellSize / 2;
        inner += safeText({
          x, y: startY - 9, content: months[date.getMonth()], cls: 'muted',
          maxWidth: pitch * 2, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true
        });
      }
    }
  });

  if (snakeCss) inner += `<style>${snakeCss}</style>`;
  inner += grid;
  if (snakeBody) inner += snakeBody;

  return createSvg(width, height, `${username}'s Contribution Snake`, inner, theme);
}

// Build a proper snake head with eyes, nostrils, and forked tongue
// Tongue is drawn symmetrically (both directions) so it's visible regardless of head rotation
function buildSnakeHead(size: number): string {
  const half = size / 2;
  const eyeOffset = size * 0.22;
  const eyeR = Math.max(1.2, size * 0.1);
  const nostrilR = Math.max(0.6, size * 0.05);
  const tongueLen = size * 0.6;
  const tongueSplit = size * 0.3;

  // Tongue path: double-ended fork (points both forward and backward)
  // This ensures visibility regardless of head rotation (0° or 180°)
  const tonguePath = `M ${(half * 0.75).toFixed(1)} ${(-tongueSplit * 0.5).toFixed(1)} L ${(half + tongueLen).toFixed(1)} ${(-tongueSplit).toFixed(1)} M ${(half * 0.75).toFixed(1)} ${(tongueSplit * 0.5).toFixed(1)} L ${(half + tongueLen).toFixed(1)} ${(tongueSplit).toFixed(1)} M ${(half * 0.75).toFixed(1)} ${(-tongueSplit * 0.5).toFixed(1)} L ${(half - tongueLen * 0.5).toFixed(1)} ${(-tongueSplit * 0.8).toFixed(1)} M ${(half * 0.75).toFixed(1)} ${(tongueSplit * 0.5).toFixed(1)} L ${(half - tongueLen * 0.5).toFixed(1)} ${(tongueSplit * 0.8).toFixed(1)}`;

  return (
    // Eyes (larger, more forward-facing)
    `<circle cx="${(half * 0.4).toFixed(1)}" cy="${(-eyeOffset).toFixed(1)}" r="${eyeR.toFixed(1)}" fill="#021a0a"/>` +
    `<circle cx="${(half * 0.4).toFixed(1)}" cy="${(eyeOffset).toFixed(1)}" r="${eyeR.toFixed(1)}" fill="#021a0a"/>` +
    // Eye highlights (catch light)
    `<circle cx="${(half * 0.45).toFixed(1)}" cy="${(-eyeOffset + 0.5).toFixed(1)}" r="${(eyeR * 0.35).toFixed(1)}" fill="#4ade80" opacity="0.6"/>` +
    `<circle cx="${(half * 0.45).toFixed(1)}" cy="${(eyeOffset + 0.5).toFixed(1)}" r="${(eyeR * 0.35).toFixed(1)}" fill="#4ade80" opacity="0.6"/>` +
    // Nostrils
    `<circle cx="${(half * 0.7).toFixed(1)}" cy="${(-nostrilR * 1.5).toFixed(1)}" r="${nostrilR.toFixed(1)}" fill="#021a0a"/>` +
    `<circle cx="${(half * 0.7).toFixed(1)}" cy="${(nostrilR * 1.5).toFixed(1)}" r="${nostrilR.toFixed(1)}" fill="#021a0a"/>` +
    // Forked tongue (double-sided, animated flicker via CSS)
    `<path class="sn-tongue" d="${tonguePath}" stroke="#ef4444" stroke-width="${(size * 0.09).toFixed(1)}" stroke-linecap="round" fill="none"/>`
  );
}

// ============================================================================
// 6. TYPING SVG ANIMATION (Viral - pure SVG)
// ============================================================================
function generateTypingSvg(username: string, bio?: string, theme?: Theme): string {
  const c = theme ? C(theme) : C(THEMES.default);
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
  inner += safeText({
    x: width / 2, y: height / 2 - 8, content: '', cls: 'typing-text',
    maxWidth: width - 40, fontSize: 18, fontFamily: 'mono', textAnchor: 'middle', truncate: true
  });

  phrases.forEach((phrase, i) => {
    const start = i * phraseDuration;
    inner += `<text x="${width / 2}" y="${height / 2 + 6}" text-anchor="middle" class="typing-text" fill="${c.emerald}" font-family="${FONTS.mono}" font-size="18" font-weight="bold" opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" dur="${cycleTime}s" begin="${start}s" repeatCount="indefinite" keyTimes="0;0.1;0.9;1" keySplines="0 0 1 1;0 0 1 1;0 0 1 1"/>
      ${phrase}
    </text>`;
  });

  inner += `<text x="${width / 2 + 2}" y="${height / 2 + 6}" text-anchor="start" class="cursor" fill="${c.emerald}" font-family="${FONTS.mono}" font-size="18" font-weight="bold">|</text>`;

  return createSvg(width, height, `${username}'s Typing Animation`, `
    ${styleBlock(
      css('typing-text', { fill: c.textPrimary, 'font-family': FONTS.mono, 'font-size': 20, 'font-weight': 'bold' }),
      css('cursor', { fill: c.emerald, 'font-family': FONTS.mono, 'font-size': 20, 'font-weight': 'bold' })
    )}
    ${inner}
  `, theme || THEMES.default);
}

// ============================================================================
// 7. STAR HISTORY GRAPH
// ============================================================================
function generateStarHistorySvg(username: string, repos: any[], theme: Theme): string {
  const c = C(theme);
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
  inner += safeText({
    x: width / 2, y: 28, content: `⭐ ${username}'s Star History`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  inner += translate(margin.left, margin.top, `
    ${rect(0, 0, chartW, chartH, c.bgElevated, RADIUS.sm, c.border)}
    <defs>
      <linearGradient id="starGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${c.gold}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${c.bg}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${dataPoints.map((d, i) => {
      const x = (i / 11) * chartW;
      const y = chartH - (d.stars / maxStars) * chartH;
      const prev = i > 0 ? dataPoints[i - 1] : d;
      const prevX = (Math.max(0, i - 1) / 11) * chartW;
      const prevY = chartH - (prev.stars / maxStars) * chartH;
      return i === 0 
        ? `<path d="M ${x} ${y}" stroke="${c.gold}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<path d="M ${prevX} ${prevY} Q ${(prevX + x) / 2} ${prevY} ${x} ${y}" stroke="${c.gold}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join('')}
    ${dataPoints.map((d, i) => {
      const x = (i / 11) * chartW;
      const y = chartH - (d.stars / maxStars) * chartH;
      return `<circle cx="${x}" cy="${y}" r="4" fill="${c.gold}" stroke="${c.bg}" stroke-width="2"/>
        ${safeText({ x, y: y - 12, content: d.stars.toLocaleString(), cls: 'muted',
          maxWidth: chartW / 12, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
        ${safeText({ x, y: chartH + 18, content: d.month, cls: 'muted',
          maxWidth: chartW / 12, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}`;
    }).join('')}
  `);

  inner += safeText({ x: width / 2, y: height - 8, content: `Total: ${totalStars.toLocaleString()} stars across ${repos.length} repos`, cls: 'muted',
    maxWidth: width - 40, fontSize: 11, fontFamily: 'mono', textAnchor: 'middle', truncate: true });

  return createSvg(width, height, `${username}'s Star History`, inner, theme);
}

// ============================================================================
// 8. REPO CARD GENERATOR
// ============================================================================
function generateRepoCardSvg(repo: any, theme: Theme): string {
  const c = C(theme);
  const width = 500;
  const height = 180;
  const name = repo.name || 'Repository';
  const desc = repo.description || 'No description provided';
  const stars = repo.stargazerCount || 0;
  const forks = repo.forkCount || 0;
  const language = repo.primaryLanguage?.name || 'Unknown';
  const languageColor = repo.primaryLanguage?.color || c.emerald;
  const topics = (repo.repositoryTopics?.nodes?.map((n: any) => n.topic.name) || []).slice(0, 5);
  const padding = 30;
  const contentWidth = width - padding * 2;

  let inner = '';
  inner += safeText({
    x: padding, y: 30, content: name, cls: 'badge-title',
    maxWidth: contentWidth, fontSize: 16, fontFamily: 'display', truncate: true
  });
  inner += safeText({
    x: padding, y: 50, content: desc, cls: 'label-lg',
    maxWidth: contentWidth, fontSize: 12, fontFamily: 'mono', truncate: true, maxLines: 2
  });

  const stats = [
    { icon: '⭐', value: stars.toLocaleString(), label: 'Stars' },
    { icon: '🍴', value: forks.toLocaleString(), label: 'Forks' },
    { icon: '🔤', value: language, label: 'Language', color: languageColor },
  ];
  stats.forEach((stat, i) => {
    const x = padding + i * 140;
    const statWidth = 130;
    inner += translate(x, 75, `
      ${safeText({ x: 0, y: 0, content: `${stat.icon} ${stat.value}`, cls: 'label',
        maxWidth: statWidth, fontSize: 11, fontFamily: 'mono', truncate: true })}
      ${safeText({ x: 0, y: 16, content: stat.label, cls: 'muted',
        maxWidth: statWidth, fontSize: 9, fontFamily: 'mono', truncate: true })}
    `);
  });

  if (topics.length > 0) {
    let topicX = padding;
    topics.forEach((topic: string) => {
      const w = topic.length * 7 + 16;
      inner += translate(topicX, 115, `
        ${rect(0, 0, w, 22, c.bgElevated, RADIUS.sm, c.borderLight)}
        ${safeText({ x: w / 2, y: 15, content: `#${topic}`, cls: 'muted',
          maxWidth: w - 8, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
      `);
      topicX += w + 8;
    });
  }

  return createSvg(width, height, `${name} Repository Card`, inner, theme);
}

// ============================================================================
// 9. LANGUAGE DONUT CHART
// ============================================================================
function generateLanguageDonutSvg(languages: any[], theme: Theme): string {
  const c = C(theme);
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 120;
  const strokeWidth = 24;

  const total = languages.reduce((s, l) => s + (l.percentage || 0), 0);
  const sorted = [...languages].sort((a, b) => (b.percentage || 0) - (a.percentage || 0)).slice(0, 6);

  let inner = '';
  inner += safeText({
    x: width / 2, y: 30, content: 'Language Breakdown', cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

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
    const legendText = `${lang.name} ${lang.percentage.toFixed(1)}%`;
    inner += translate(60, legendY, `
      ${rect(0, 0, 14, 14, color, RADIUS.sm)}
      ${safeText({ x: 22, y: 11, content: legendText, cls: 'label-lg',
        maxWidth: width - 100, fontSize: 11, fontFamily: 'mono', truncate: true })}
    `);

    currentAngle = endAngle;
  });

  inner += safeText({
    x: centerX, y: centerY - 4, content: `${total.toFixed(0)}%`, cls: 'value',
    maxWidth: radius * 1.5, fontSize: 24, fontFamily: 'mono', textAnchor: 'middle', truncate: true
  });

  inner += safeText({
    x: centerX, y: centerY + 20, content: 'Languages', cls: 'muted',
    maxWidth: radius * 1.5, fontSize: 11, fontFamily: 'mono', textAnchor: 'middle', truncate: true
  });

  return createSvg(width, height, 'Language Breakdown', inner, theme);
}

// ============================================================================
// 10. SKILL BUBBLES CLOUD
// ============================================================================
function generateSkillBubblesSvg(skills: string[], theme: Theme): string {
  const c = C(theme);
  const width = 600;
  const height = 200;
  const displaySkills = skills.slice(0, 15);

  let inner = '';
  inner += safeText({
    x: width / 2, y: 30, content: 'Tech Stack', cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  displaySkills.forEach((skill, i) => {
    const angle = (i / displaySkills.length) * Math.PI * 2;
    const radius = 70 + (i % 3) * 30;
    const x = width / 2 + radius * Math.cos(angle);
    const y = height / 2 + radius * Math.sin(angle);
    const w = Math.min(skill.length * 8 + 24, 180);
    const delay = i * 0.1;

    inner += translate(x - w / 2, y - 18, `
      ${rect(0, 0, w, 36, c.bgElevated, RADIUS.lg, c.borderLight, 1)}
      ${safeText({ x: w / 2, y: 22, content: skill, cls: 'label-lg',
        maxWidth: w - 8, fontSize: 11, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
      <animate attributeName="opacity" values="0;1" dur="0.6s" begin="${delay}s" fill="freeze"/>
    `);
  });

  return createSvg(width, height, 'Tech Stack Bubbles', inner, theme);
}

// ============================================================================
// 11. ASCII BANNER GENERATOR
// ============================================================================
function generateAsciiBannerSvg(text_content: string, theme: Theme): string {
  const c = C(theme);
  const width = 800;
  const height = 120;
  const lines = text_content.split('\n');
  const charWidth = 8;
  const lineHeight = 18;
  const maxContentWidth = width - 40;

  let inner = '';
  inner += safeText({
    x: width / 2, y: 20, content: 'ASCII Banner', cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  lines.forEach((line, i) => {
    const x = Math.max(20, (width - line.length * charWidth) / 2);
    inner += safeText({
      x, y: 50 + i * lineHeight, content: line, cls: 'ascii',
      maxWidth: maxContentWidth, fontSize: 12, fontFamily: 'mono', truncate: true
    });
  });

  return createSvg(width, height, 'ASCII Banner', inner + styleBlock(
    css('ascii', { fill: c.emerald, 'font-family': FONTS.mono, 'font-size': 12, 'letter-spacing': '1px' })
  ), theme);
}

// ============================================================================
// 12. CONTRIBUTION STREAK CALENDAR (Compact)
// ============================================================================
function generateStreakCalendarSvg(username: string, calendar: any, streak: number, theme: Theme): string {
  const c = C(theme);
  const width = 400;
  const height = 180;
  const weeks = calendar?.weeks || [];
  const cellSize = 10;
  const cellGap = 2;
  const startX = 30;
  const startY = 50;

  let inner = '';
  inner += safeText({
    x: width / 2, y: 28, content: `🔥 ${username}'s Streak: ${streak} Days`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  weeks.slice(-7).forEach((week: any, weekIndex: number) => {
    week.contributionDays.forEach((day: any, dayIndex: number) => {
      const count = day.contributionCount;
      const color = count === 0 ? c.bgElevated : count <= 2 ? '#0e4429' : count <= 4 ? '#006d32' : '#26a641';
      const x = startX + weekIndex * (cellSize + cellGap);
      const y = startY + dayIndex * (cellSize + cellGap);
      inner += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}"/>`;
    });
  });

  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label, i) => {
    inner += safeText({
      x: startX - 8, y: startY + i * (cellSize + cellGap) + cellSize / 2 + 3, content: label, cls: 'muted',
      maxWidth: startX - 12, fontSize: 9, fontFamily: 'mono', textAnchor: 'end', truncate: true
    });
  });

  inner += safeText({
    x: width / 2, y: height - 20, content: 'Last 7 weeks • Green = active day', cls: 'muted',
    maxWidth: width - 40, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true
  });

  return createSvg(width, height, `${username}'s Streak Calendar`, inner, theme);
}

// ============================================================================
// 13. SKILL RADAR CHART (Animated Spider/Radar Chart)
// ============================================================================
function generateSkillRadarSvg(skills: Array<{ name: string; level: number; category?: string }>, theme: Theme): string {
  const c = C(theme);
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = 140;
  const levels = 5;

  // Default skills if none provided
  const defaultSkills = [
    { name: 'Frontend', level: 90, category: 'core' },
    { name: 'Backend', level: 85, category: 'core' },
    { name: 'DevOps', level: 75, category: 'infra' },
    { name: 'Architecture', level: 80, category: 'design' },
    { name: 'Testing', level: 70, category: 'quality' },
    { name: 'Security', level: 65, category: 'quality' },
  ];
  
  const displaySkills = skills.length > 0 ? skills : defaultSkills;
  const count = displaySkills.length;
  const angleStep = (Math.PI * 2) / count;

  let inner = '';
  inner += safeText({
    x: width / 2, y: 30, content: 'Skill Radar', cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  // Grid lines (polygons)
  for (let l = 1; l <= levels; l++) {
    const radius = (l / levels) * maxRadius;
    const points = displaySkills.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
    inner += `<polygon points="${points}" fill="none" stroke="${c.borderLight}" stroke-width="0.5" opacity="0.5"/>`;
  }

  // Axis lines
  displaySkills.forEach((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = centerX + maxRadius * Math.cos(angle);
    const y = centerY + maxRadius * Math.sin(angle);
    inner += `<line x1="${centerX}" y1="${centerY}" x2="${x}" y2="${y}" stroke="${c.borderLight}" stroke-width="0.5" opacity="0.5"/>`;
  });

  // Skill area (animated)
  const areaPoints = displaySkills.map((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (skill.level / 100) * maxRadius;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return `${x},${y}`;
  }).join(' ');

  const areaColor = c.emerald;
  inner += `<polygon points="${areaPoints}" fill="${areaColor}" fill-opacity="0.15" stroke="${areaColor}" stroke-width="2" stroke-opacity="0.8">
    <animate attributeName="points" values="
      ${displaySkills.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return `${centerX},${centerY}`;
      }).join(' ')};
      ${areaPoints}
    " dur="1.5s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
  </polygon>`;

  // Skill labels and dots
  displaySkills.forEach((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (skill.level / 100) * maxRadius;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const labelRadius = maxRadius + 25;
    const labelX = centerX + labelRadius * Math.cos(angle);
    const labelY = centerY + labelRadius * Math.sin(angle);
    const textAnchor = angle > -Math.PI/2 && angle < Math.PI/2 ? 'start' : angle > Math.PI/2 || angle < -Math.PI/2 ? 'end' : 'middle';
    const dx = angle > -Math.PI/2 && angle < Math.PI/2 ? 8 : angle > Math.PI/2 || angle < -Math.PI/2 ? -8 : 0;

    // Dot (animated)
    inner += `<circle cx="${x}" cy="${y}" r="5" fill="${areaColor}" stroke="${c.bg}" stroke-width="2">
      <animate attributeName="r" values="0;6;5" dur="0.8s" begin="${i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${i * 0.1}s" fill="freeze"/>
    </circle>`;

    // Label - safe with truncation
    const maxLabelWidth = 80;
    inner += safeText({
      x: labelX, y: labelY, content: `${skill.name} ${skill.level}%`, cls: 'label',
      maxWidth: maxLabelWidth, fontSize: 10, fontFamily: 'mono', textAnchor, truncate: true
    });
  });

  // Level markers
  for (let l = 1; l <= levels; l++) {
    const radius = (l / levels) * maxRadius;
    const y = centerY - radius;
    inner += safeText({
      x: centerX - 5, y: y + 4, content: `${Math.round((l / levels) * 100)}%`, cls: 'muted',
      maxWidth: 40, fontSize: 8, fontFamily: 'mono', textAnchor: 'end', truncate: true
    });
    inner += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${c.borderLight}" stroke-width="0.5" opacity="0.3"/>`;
  }

  return createSvg(width, height, 'Skill Radar Chart', inner, theme);
}

// ============================================================================
// 14. LANGUAGE EVOLUTION RACE (Animated Bar Chart Race)
// ============================================================================
function generateLanguageRaceSvg(username: string, languages: Array<{ name: string; percentage: number; color: string }>, theme: Theme): string {
  const c = C(theme);
  const width = 600;
  const height = 300;
  const margin = { top: 50, right: 20, bottom: 40, left: 120 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const defaultLangs = [
    { name: 'TypeScript', percentage: 35, color: '#3178c6' },
    { name: 'JavaScript', percentage: 25, color: '#f1e05a' },
    { name: 'Python', percentage: 15, color: '#3572A5' },
    { name: 'Rust', percentage: 10, color: '#dea584' },
    { name: 'Go', percentage: 8, color: '#00ADD8' },
    { name: 'HTML/CSS', percentage: 7, color: '#e34c26' },
  ];
  
  const displayLangs = languages.length > 0 ? languages : defaultLangs;
  const sortedLangs = [...displayLangs].sort((a, b) => b.percentage - a.percentage).slice(0, 8);
  const maxPct = Math.max(...sortedLangs.map(l => l.percentage));

  let inner = '';
  inner += safeText({
    x: width / 2, y: 30, content: `📈 ${username}'s Language Evolution`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  inner += translate(margin.left, margin.top, `
    ${sortedLangs.map((lang, i) => {
      const barH = 24;
      const y = i * (barH + 8);
      const targetWidth = (lang.percentage / maxPct) * chartW;
      
      return `
        <g transform="translate(0, ${y})">
          <!-- Label -->
          ${safeText({ x: -10, y: barH / 2 + 5, content: lang.name, cls: 'label',
            maxWidth: margin.left - 20, fontSize: 11, fontFamily: 'mono', textAnchor: 'end', truncate: true })}
          
          <!-- Background track -->
          <rect x="0" y="0" width="${chartW}" height="${barH}" rx="${barH/2}" fill="${c.bgElevated}" stroke="${c.borderLight}" stroke-width="0.5"/>
          
          <!-- Animated bar -->
          <rect x="0" y="0" width="0" height="${barH}" rx="${barH/2}" fill="${lang.color}">
            <animate attributeName="width" values="0;${targetWidth}" dur="1.2s" begin="${i * 0.15}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
          </rect>
          
          <!-- Percentage label (animated count-up) -->
          ${safeText({ x: targetWidth + 8, y: barH / 2 + 5, content: `${lang.percentage.toFixed(1)}%`, cls: 'value-sm',
            maxWidth: 60, fontSize: 11, fontFamily: 'mono', truncate: true })}
          
          <!-- Shimmer effect -->
          <rect x="0" y="0" width="${targetWidth}" height="${barH}" rx="${barH/2}" fill="url(#shimmer-${i})" opacity="0.3">
            <animate attributeName="x" values="-${targetWidth};${chartW}" dur="2s" repeatCount="indefinite"/>
          </rect>
        </g>
      `;
    }).join('')}
    
    <defs>
      ${sortedLangs.map((_, i) => `
        <linearGradient id="shimmer-${i}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${c.textPrimary}" stop-opacity="0"/>
          <stop offset="50%" stop-color="${c.textPrimary}" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="${c.textPrimary}" stop-opacity="0"/>
        </linearGradient>
      `).join('')}
    </defs>
  `);

  return createSvg(width, height, `${username}'s Language Race`, inner, theme);
}

// ============================================================================
// 15. REPO CONSTELLATION (Force-Directed Graph)
// ============================================================================
function generateRepoConstellationSvg(username: string, repos: any[], theme: Theme): string {
  const c = C(theme);
  const width = 500;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;

  // Simulate force-directed layout
  const displayRepos = repos.slice(0, 12).map((repo, i) => {
    const stars = repo.stargazerCount || 0;
    const angle = (i / repos.length) * Math.PI * 2;
    const radius = 80 + (stars / 100) * 120;
    return {
      name: repo.name,
      stars,
      language: repo.primaryLanguage?.name || 'Unknown',
      color: repo.primaryLanguage?.color || c.emerald,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  let inner = '';
  inner += safeText({
    x: width / 2, y: 30, content: `🌌 ${username}'s Repo Constellation`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  // Connections (lines to center - gravity)
  displayRepos.forEach((repo, i) => {
    inner += `<line x1="${centerX}" y1="${centerY}" x2="${repo.x}" y2="${repo.y}" 
      stroke="${repo.color}" stroke-width="0.5" stroke-opacity="0.3" stroke-dasharray="4,4">
      <animate attributeName="stroke-opacity" values="0.1;0.5;0.1" dur="3s" begin="${i * 0.2}s" repeatCount="indefinite"/>
    </line>`;
  });

  // Repo nodes
  displayRepos.forEach((repo, i) => {
    const size = Math.max(12, Math.min(40, 12 + Math.log10(repo.stars + 1) * 8));
    const maxNameWidth = size * 4;
    
    inner += `<g transform="translate(${repo.x}, ${repo.y})">
      <!-- Orbit ring -->
      <circle r="${size + 8}" fill="none" stroke="${repo.color}" stroke-width="1" stroke-opacity="0.2">
        <animate attributeName="r" values="${size + 4};${size + 12};${size + 4}" dur="4s" begin="${i * 0.3}s" repeatCount="indefinite"/>
        <animate attributeName="stroke-opacity" values="0.1;0.3;0.1" dur="4s" begin="${i * 0.3}s" repeatCount="indefinite"/>
      </circle>
      
      <!-- Main node -->
      <circle r="${size}" fill="${repo.color}" stroke="${c.bg}" stroke-width="2">
        <animate attributeName="r" values="${size * 0.8};${size};${size * 0.8}" dur="2s" begin="${i * 0.2}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      </circle>
      
      <!-- Star count -->
      ${safeText({ x: 0, y: 4, content: `⭐ ${repo.stars.toLocaleString()}`, cls: 'value-sm',
        maxWidth: size * 2, fontSize: Math.max(8, size * 0.4), fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
      
      <!-- Repo name (on hover area) -->
      ${safeText({ x: 0, y: -size - 6, content: repo.name, cls: 'label',
        maxWidth: maxNameWidth, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
    </g>`;
  });

  // Center node (user)
  inner += `<g transform="translate(${centerX}, ${centerY})">
    <circle r="25" fill="${c.emerald}" stroke="${c.bg}" stroke-width="3">
      <animate attributeName="r" values="22;28;22" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    </circle>
    ${safeText({ x: 0, y: 4, content: username, cls: 'value',
      maxWidth: 45, fontSize: 14, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
    ${safeText({ x: 0, y: 22, content: `${displayRepos.length} Repos`, cls: 'muted',
      maxWidth: 45, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
  </g>`;

  return createSvg(width, height, `${username}'s Repo Constellation`, inner, theme);
}

// ============================================================================
// 16. CODE PULSE / HEARTBEAT (Real-time Activity Pulse) - WITH VIEWER AWARENESS
// ============================================================================
function generateCodePulseSvg(username: string, stats: any, theme: Theme, viewer?: ViewerContext): string {
  const c = C(theme);
  const width = 400;
  const height = 200;
  const centerX = width / 2;
  const centerY = height / 2;

  const commits = stats.totalContributions || 1234;
  const streak = stats.streak || 42;
  const repos = stats.publicRepos || 56;

  // Viewer-aware greeting
  const viewerHour = viewer ? getViewerHour(viewer.timezone) : -1;
  let greetingText = 'Code Pulse';
  let greetingEmoji = '💓';
  if (viewer && viewerHour >= 0) {
    const greeting = getTimeGreeting(viewerHour);
    greetingText = greeting.text;
    greetingEmoji = greeting.emoji;
  }

  let inner = '';
  inner += safeText({
    x: width / 2, y: 30, content: `${greetingEmoji} ${username}'s ${greetingText}`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });
  if (viewer && viewerHour >= 0) {
    const location = viewer.city || viewer.region || viewer.country || 'Unknown';
    const tz = viewer.timezone || 'UTC';
    inner += safeText({
      x: width / 2, y: 48, content: `Viewer: ${location} • ${tz} • ${viewerHour.toString().padStart(2, '0')}:00`, cls: 'muted',
      maxWidth: width - 40, fontSize: 10, fontFamily: 'mono', textAnchor: 'middle', truncate: true
    });
  }

  // Pulse rings
  for (let i = 0; i < 4; i++) {
    const delay = i * 0.4;
    inner += `<circle cx="${centerX}" cy="${centerY}" r="30" fill="none" stroke="${c.emerald}" stroke-width="2" stroke-opacity="0.6">
      <animate attributeName="r" values="30;100" dur="2s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
      <animate attributeName="stroke-opacity" values="0.6;0" dur="2s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
    </circle>`;
  }

  // Core pulse
  inner += `<circle cx="${centerX}" cy="${centerY}" r="25" fill="${c.emerald}" fill-opacity="0.2" stroke="${c.emerald}" stroke-width="3">
    <animate attributeName="r" values="20;30;20" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    <animate attributeName="fill-opacity" values="0.1;0.3;0.1" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
  </circle>`;

  // Stats around the pulse
  const statData = [
    { icon: '💚', value: commits.toLocaleString(), label: 'Commits', angle: -Math.PI/2 - 0.5, dist: 130 },
    { icon: '🔥', value: streak, label: 'Streak', angle: -Math.PI/2 + 0.5, dist: 130 },
    { icon: '📦', value: repos, label: 'Repos', angle: Math.PI/2, dist: 130 },
    { icon: '⚡', value: 'Live', label: 'Status', angle: Math.PI, dist: 130 },
  ];

  statData.forEach((stat, i) => {
    const x = centerX + stat.dist * Math.cos(stat.angle);
    const y = centerY + stat.dist * Math.sin(stat.angle);
    const delay = i * 0.2;
    const statRadius = 35;
    const maxStatWidth = statRadius * 2 - 8;

    inner += `<g transform="translate(${x}, ${y})" opacity="0">
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${0.8 + delay}s" fill="freeze"/>
      <animate attributeName="transform" values="translate(${centerX}, ${centerY});translate(${x}, ${y})" dur="0.6s" begin="${0.8 + delay}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      
      <circle r="${statRadius}" fill="${c.bgElevated}" stroke="${c.border}" stroke-width="1" rx="8"/>
      ${safeText({
        x: 0, y: -8, content: `${stat.icon} ${stat.value}`, cls: 'value',
        maxWidth: maxStatWidth, fontSize: 14, fontFamily: 'mono', textAnchor: 'middle', truncate: true
      })}
      ${safeText({
        x: 0, y: 10, content: stat.label, cls: 'muted',
        maxWidth: maxStatWidth, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true
      })}
    </g>`;
  });

  // Heartbeat line (EKG style)
  inner += `<polyline fill="none" stroke="${c.red}" stroke-width="2" points="
    20,${height - 30} 
    60,${height - 30} 
    70,${height - 50} 
    80,${height - 10} 
    90,${height - 50} 
    100,${height - 30} 
    140,${height - 30}
    150,${height - 30}
    160,${height - 50}
    170,${height - 10}
    180,${height - 50}
    190,${height - 30}
    230,${height - 30}
    240,${height - 50}
    250,${height - 10}
    260,${height - 50}
    270,${height - 30}
    310,${height - 30}
    320,${height - 50}
    330,${height - 10}
    340,${height - 50}
    350,${height - 30}
    380,${height - 30}
  ">
    <animate attributeName="stroke-dashoffset" values="1000;0" dur="3s" repeatCount="indefinite" calcMode="linear"/>
    <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
  </polyline>`;

  return createSvg(width, height, `${username}'s Code Pulse`, inner, theme);
}

// ============================================================================
// 17. 3D CONTRIBUTION MOUNTAIN (Isometric View)
// ============================================================================
function generateContributionMountainSvg(username: string, calendar: any, theme: Theme): string {
  const c = C(theme);
  const width = 600;
  const height = 300;
  const weeks = calendar?.weeks || [];
  const cols = Math.min(weeks.length, 26); // Last 26 weeks
  const rows = 7;
  const cellW = 14;
  const cellH = 7; // isometric height
  const startX = width / 2 - (cols * cellW) / 2;
  const startY = height - 50;

  let inner = '';
  inner += safeText({
    x: width / 2, y: 30, content: `🏔️ ${username}'s Contribution Mountain`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  // Draw from back to front for proper layering
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      const week = weeks[weeks.length - cols + c];
      if (!week) continue;
      const day = week.contributionDays?.[r];
      if (!day) continue;
      
      const count = day.contributionCount || 0;
      if (count === 0) continue;
      
      const level = count <= 2 ? 1 : count <= 4 ? 2 : count <= 8 ? 3 : 4;
      const height3D = level * 12;
      const color = level === 1 ? '#0e4429' : level === 2 ? '#006d32' : level === 3 ? '#26a641' : '#3fb950';
      const colorLight = level === 1 ? '#1a5c35' : level === 2 ? '#0a8a3f' : level === 3 ? '#34c652' : '#4fd160';
      const colorDark = level === 1 ? '#082e1a' : level === 2 ? '#004a24' : level === 3 ? '#1a7a2e' : '#2da640';
      
      // Isometric coordinates
      const isoX = startX + c * cellW + r * (cellW / 2);
      const isoY = startY - r * (cellH / 2) - height3D;

      // Delay based on position for wave animation
      const delay = (c * 0.02 + r * 0.03);

      inner += `<g transform="translate(${isoX}, ${isoY})">
        <!-- Top face -->
        <polygon points="0,0 ${cellW},0 ${cellW/2},${cellH/2} ${-cellW/2},${cellH/2}" 
          fill="${colorLight}">
          <animate attributeName="opacity" values="0;1" dur="0.4s" begin="${delay}s" fill="freeze"/>
          <animate attributeName="transform" values="translate(0,20);translate(0,0)" dur="0.5s" begin="${delay}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
        </polygon>
        
        <!-- Right face -->
        <polygon points="${cellW},0 ${cellW},${-height3D} ${cellW/2},${cellH/2 - height3D} ${cellW/2},${cellH/2}" 
          fill="${color}">
          <animate attributeName="opacity" values="0;1" dur="0.4s" begin="${delay}s" fill="freeze"/>
        </polygon>
        
        <!-- Left face -->
        <polygon points="0,0 ${0},${-height3D} ${-cellW/2},${cellH/2 - height3D} ${-cellW/2},${cellH/2}" 
          fill="${colorDark}">
          <animate attributeName="opacity" values="0;1" dur="0.4s" begin="${delay}s" fill="freeze"/>
        </polygon>
      </g>`;
    }
  }

  // Ground grid
  for (let colIdx = 0; colIdx <= cols; colIdx++) {
    const x1 = startX + colIdx * cellW;
    const y1 = startY;
    const x2 = startX + colIdx * cellW + rows * (cellW / 2);
    const y2 = startY - rows * (cellH / 2);
    inner += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.borderLight}" stroke-width="0.3" opacity="0.3"/>`;
  }
  for (let r = 0; r <= rows; r++) {
    const x1 = startX + r * (cellW / 2);
    const y1 = startY - r * (cellH / 2);
    const x2 = startX + cols * cellW + r * (cellW / 2);
    const y2 = startY - r * (cellH / 2);
    inner += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.borderLight}" stroke-width="0.3" opacity="0.3"/>`;
  }

  // Day labels
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label, i) => {
    const x = startX + i * (cellW / 2) - 20;
    const y = startY - i * (cellH / 2) + 10;
    inner += safeText({ x, y, content: label, cls: 'muted',
      maxWidth: 40, fontSize: 8, fontFamily: 'mono', textAnchor: 'end', truncate: true });
  });

  // Legend
  const legendData = [
    { color: '#0e4429', label: '1-2' },
    { color: '#006d32', label: '3-4' },
    { color: '#26a641', label: '5-8' },
    { color: '#3fb950', label: '9+' },
  ];
  legendData.forEach((item, i) => {
    const x = 30;
    const y = 60 + i * 20;
    inner += `<rect x="${x}" y="${y}" width="14" height="10" rx="2" fill="${item.color}"/>`;
    inner += safeText({ x: x + 20, y: y + 7, content: `${item.label} contributions`, cls: 'muted',
      maxWidth: 100, fontSize: 9, fontFamily: 'mono', truncate: true });
  });

  return createSvg(width, height, `${username}'s Contribution Mountain`, inner, theme);
}

// ============================================================================
// 18. TECH STACK GALAXY (Orbiting Logos)
// ============================================================================
function generateTechGalaxySvg(skills: string[], theme: Theme): string {
  const c = C(theme);
  const width = 500;
  const height = 500;
  const centerX = width / 2;
  const centerY = height / 2;

  const defaultSkills = [
    'TypeScript', 'React', 'Next.js', 'Node.js', 'Rust', 
    'Go', 'Python', 'PostgreSQL', 'Docker', 'GraphQL', 
    'TailwindCSS', 'Kubernetes', 'AWS', 'Redis', 'WebGL'
  ];
  
  const displaySkills = skills.length > 0 ? skills : defaultSkills;
  const skillCount = Math.min(displaySkills.length, 15);

  let inner = '';
  inner += safeText({
    x: width / 2, y: 30, content: '🌌 Tech Stack Galaxy', cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  // Orbit rings
  for (let ring = 1; ring <= 3; ring++) {
    const radius = 80 + ring * 70;
    inner += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${c.borderLight}" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.3">
      <animate attributeName="stroke-dashoffset" values="0;${radius * 2 * Math.PI}" dur="${20 + ring * 5}s" repeatCount="indefinite" calcMode="linear"/>
    </circle>`;
  }

  // Skills as orbiting planets
  displaySkills.slice(0, skillCount).forEach((skill, i) => {
    const ring = Math.floor(i / 5) + 1;
    const radius = 80 + ring * 70;
    const angleStart = (i % 5) * (Math.PI * 2 / 5);
    const speed = 15 + ring * 5 + (i % 3) * 3;
    const size = 14 + (i % 3) * 6;
    const colors = [c.emerald, c.gold, '#8b5cf6', c.red, '#06b6d4'];
    const color = colors[i % colors.length];

    inner += `<g>
      <animateTransform attributeName="transform" type="rotate" 
        from="0 ${centerX} ${centerY}" to="360 ${centerX} ${centerY}" 
        dur="${speed}s" repeatCount="indefinite" calcMode="linear"/>
      
      <g transform="translate(${centerX + radius}, ${centerY})">
        <!-- Planet -->
        <circle r="${size}" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2">
          <animate attributeName="r" values="${size};${size * 1.2};${size}" dur="${speed/2}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
        </circle>
        
        <!-- Core -->
        <circle r="${size * 0.5}" fill="${color}"/>
        
        <!-- Label -->
        ${safeText({ x: size + 6, y: 4, content: skill, cls: 'label',
          maxWidth: 80, fontSize: 8, fontFamily: 'mono', truncate: true })}
      </g>
    </g>`;
  });

  // Center star
  inner += `<g transform="translate(${centerX}, ${centerY})">
    <circle r="20" fill="${c.emerald}" fill-opacity="0.15" stroke="${c.emerald}" stroke-width="2">
      <animate attributeName="r" values="18;25;18" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    </circle>
    <text x="0" y="5" text-anchor="middle" class="value" font-size="12" fill="${c.emerald}">★</text>
    ${safeText({ x: 0, y: 22, content: `${skillCount} Technologies`, cls: 'muted',
      maxWidth: 100, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
  </g>`;

  return createSvg(width, height, 'Tech Stack Galaxy', inner, theme);
}

// ============================================================================
// 19. CONTRIBUTION FLOW (Sankey Diagram)
// ============================================================================
function generateContributionFlowSvg(username: string, repos: any[], theme: Theme): string {
  const c = C(theme);
  const width = 600;
  const height = 300;
  const margin = { top: 40, right: 150, bottom: 40, left: 150 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  // Categories: Time → Language → Repo
  const categories = {
    time: ['Morning', 'Afternoon', 'Evening', 'Night'],
    language: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'],
    repo: repos.slice(0, 6).map(r => r.name.length > 12 ? r.name.slice(0, 12) + '…' : r.name),
  };

  // Simulated flow data
  const flowData = [
    { from: 'time', to: 'language', value: 100 },
    { from: 'language', to: 'repo', value: 100 },
  ];

  let inner = '';
  inner += safeText({
    x: width / 2, y: 28, content: `🌊 ${username}'s Contribution Flow`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  inner += translate(margin.left, margin.top, `
    <!-- Time nodes (left) -->
    ${categories.time.map((cat, i) => {
      const y = (i / (categories.time.length - 1)) * chartH;
      return `
        <g transform="translate(0, ${y})" opacity="0">
          <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${i * 0.1}s" fill="freeze"/>
          <rect x="-140" y="-20" width="130" height="40" rx="6" fill="${c.bgElevated}" stroke="${c.emerald}" stroke-width="1">
            <animate attributeName="x" values="-200;-140" dur="0.6s" begin="${i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
          </rect>
          ${safeText({ x: -75, y: 7, content: cat, cls: 'label',
            maxWidth: 120, fontSize: 10, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
          <text x="-75" y="22" text-anchor="middle" class="value-sm" font-size="10">🌅</text>
        </g>
      `;
    }).join('')}
    
    <!-- Language nodes (center) -->
    ${categories.language.map((cat, i) => {
      const y = (i / (categories.language.length - 1)) * chartH;
      return `
        <g transform="translate(${chartW / 2}, ${y})" opacity="0">
          <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${0.5 + i * 0.1}s" fill="freeze"/>
          <rect x="-70" y="-20" width="140" height="40" rx="6" fill="${c.bgElevated}" stroke="${c.gold}" stroke-width="1">
            <animate attributeName="x" values="${chartW + 100};-70" dur="0.6s" begin="${0.5 + i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
          </rect>
          ${safeText({ x: 0, y: 7, content: cat, cls: 'label',
            maxWidth: 130, fontSize: 10, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
          <text x="0" y="22" text-anchor="middle" class="value-sm" font-size="10">⚡</text>
        </g>
      `;
    }).join('')}
    
    <!-- Repo nodes (right) -->
    ${categories.repo.map((cat, i) => {
      const y = (i / (categories.repo.length - 1)) * chartH;
      return `
        <g transform="translate(${chartW}, ${y})" opacity="0">
          <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${1 + i * 0.1}s" fill="freeze"/>
          <rect x="0" y="-20" width="130" height="40" rx="6" fill="${c.bgElevated}" stroke="${c.red}" stroke-width="1">
            <animate attributeName="x" values="${chartW + 200};0" dur="0.6s" begin="${1 + i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
          </rect>
          ${safeText({ x: 65, y: 7, content: cat, cls: 'label',
            maxWidth: 120, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true })}
          <text x="65" y="22" text-anchor="middle" class="value-sm" font-size="9">📦</text>
        </g>
      `;
    }).join('')}
    
    <!-- Flow curves (animated) -->
    <defs>
      <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${c.emerald}" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="${c.gold}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${c.red}" stop-opacity="0.6"/>
      </linearGradient>
    </defs>
    
    ${[...Array(8)].map((_, i) => `
      <path d="M 0,${(i/7)*chartH} Q ${chartW/4},${(i/7)*chartH} ${chartW/2},${(i/7)*chartH} Q ${chartW*3/4},${(i/7)*chartH} ${chartW},${(i/7)*chartH}"
        fill="none" stroke="url(#flowGrad)" stroke-width="3" stroke-opacity="0.4" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" values="${chartW};-${chartW}" dur="4s" begin="${i * 0.3}s" repeatCount="indefinite" calcMode="linear"/>
        <animate attributeName="stroke-width" values="1;4;1" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      </path>
    `).join('')}
  `);

  return createSvg(width, height, `${username}'s Contribution Flow`, inner, theme);
}

// ============================================================================
// 20. CODE TIME HEATMAP (When You Code - Hour × Day)
// ============================================================================
function generateCodeTimeHeatmapSvg(username: string, theme: Theme): string {
  const c = C(theme);
  const width = 500;
  const height = 280;
  const cellSize = 24;
  const cellGap = 3;
  const startX = 80;
  const startY = 50;
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate realistic coding pattern data
  const getIntensity = (day: number, hour: number) => {
    // Night owl pattern with weekend variation
    const isWeekend = day >= 5;
    const baseHour = isWeekend ? 14 : 10; // Weekend afternoon, weekday morning
    const dist = Math.abs(hour - baseHour);
    const wrapDist = Math.min(dist, 24 - dist);
    const intensity = Math.max(0, 1 - wrapDist / 8);
    const noise = (Math.sin(day * 7 + hour * 3) + 1) / 2 * 0.2;
    return Math.min(1, intensity + noise);
  };

  let inner = '';
  inner += safeText({
    x: width / 2, y: 28, content: `🕐 ${username}'s Code Time Heatmap`, cls: 'badge-title',
    maxWidth: width - 40, fontSize: 16, fontFamily: 'display', textAnchor: 'middle', truncate: true
  });

  // Hour labels (top)
  hours.forEach((hour, i) => {
    if (hour % 3 === 0) {
      const x = startX + i * (cellSize + cellGap) + cellSize / 2;
      inner += safeText({ x, y: startY - 8, content: `${hour}:00`, cls: 'muted',
        maxWidth: cellSize * 3, fontSize: 8, fontFamily: 'mono', textAnchor: 'middle', truncate: true });
    }
  });

  // Heatmap cells
  days.forEach((day, dayIdx) => {
    // Day label
    inner += safeText({ x: startX - 12, y: startY + dayIdx * (cellSize + cellGap) + cellSize / 2 + 4, content: day, cls: 'label',
      maxWidth: startX - 16, fontSize: 10, fontFamily: 'mono', textAnchor: 'end', truncate: true });
    
    hours.forEach((hour, hourIdx) => {
      const intensity = getIntensity(dayIdx, hour);
      if (intensity < 0.1) return;
      
      const level = intensity < 0.25 ? 1 : intensity < 0.5 ? 2 : intensity < 0.75 ? 3 : 4;
      const colors = ['#0e4429', '#006d32', '#26a641', '#3fb950'];
      const color = colors[level - 1];
      const x = startX + hourIdx * (cellSize + cellGap);
      const y = startY + dayIdx * (cellSize + cellGap);
      const delay = (dayIdx * 24 + hourIdx) * 0.005;

      inner += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="${color}" opacity="0">
        <animate attributeName="opacity" values="0;1" dur="0.3s" begin="${delay}s" fill="freeze"/>
        <animate attributeName="transform" values="scale(0);scale(1)" dur="0.3s" begin="${delay}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1">
          <animateTransform type="scale" values="0;1" additive="sum"/>
        </animate>
        <animate attributeName="fill" values="${color};${c.gold};${color}" dur="3s" begin="${2 + delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      </rect>`;
    });
  });

  // Legend
  const legendColors = [
    { color: '#0e4429', label: 'Low' },
    { color: '#006d32', label: 'Medium' },
    { color: '#26a641', label: 'High' },
    { color: '#3fb950', label: 'Peak' },
  ];
  legendColors.forEach((item, i) => {
    const x = width - 100;
    const y = 60 + i * 24;
    inner += `<rect x="${x}" y="${y}" width="16" height="16" rx="3" fill="${item.color}"/>`;
    inner += safeText({ x: x + 22, y: y + 11, content: `${item.label} activity`, cls: 'muted',
      maxWidth: 70, fontSize: 9, fontFamily: 'mono', truncate: true });
  });

  // Stats
  inner += safeText({ x: width / 2, y: height - 15, content: 'Green = coding intensity • Gold pulse = peak hours', cls: 'muted',
    maxWidth: width - 40, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true });

  return createSvg(width, height, `${username}'s Code Time Heatmap`, inner, theme);
}

// ============================================================================
// COMPOSITE CARD GENERATOR (NEW - One embed for everything) - SAFE TEXT VERSION
// ============================================================================
function generateCompositeSvg(
  username: string,
  stats: any,
  userData: any,
  reposData: any[],
  calendar: any,
  languagesData: any[],
  include: string[],
  theme: Theme
): string {
  const c = C(theme);
  
  // Layout: 2x2 grid with header
  const cardW = 380;
  const cardH = 180;
  const gap = 20;
  const headerH = 60;
  const width = cardW * 2 + gap + 40;
  const height = headerH + cardH * 2 + gap + 40;
  const startX = 20;
  const startY = headerH + 20;
  const panelPadding = 16;
  const panelContentWidth = cardW - panelPadding * 2;
  const halfPanelW = (cardW - panelPadding * 2 - 10) / 2; // Two columns with 10px gap

  let inner = '';
  
  // Header - safe title
  inner += safeText({
    x: width / 2, y: 35, content: `🐍 ${username}'s GitHub Pulse`, cls: 'badge-title',
    maxWidth: width - 80, fontSize: 16, fontFamily: 'display', textAnchor: 'middle'
  });
  
  // Header subtitle - safe
  inner += safeText({
    x: width - 20, y: 35, content: `${new Date().getFullYear()} • ${stats.totalContributions.toLocaleString()} contributions`, cls: 'muted',
    maxWidth: width / 2 - 30, fontSize: 11, fontFamily: 'mono', textAnchor: 'end', truncate: true
  });
  
  // Divider
  inner += `<line x1="20" y1="50" x2="${width - 20}" y2="50" stroke="${c.border}" stroke-width="1" opacity="0.5"/>`;

  // Helper to draw a panel background with safe title
  const panel = (x: number, y: number, w: number, h: number, title: string, icon: string, content: string) => `
    <g transform="translate(${x}, ${y})">
      ${rect(0, 0, w, h, c.bgElevated, RADIUS.md, c.border)}
      ${safeText({
        x: panelPadding, y: 28, content: `${icon} ${title}`, cls: 'badge-title',
        maxWidth: w - panelPadding * 2, fontSize: 14, fontFamily: 'display', truncate: true
      })}
      <line x1="${panelPadding}" y1="34" x2="${w - panelPadding}" y2="34" stroke="${c.border}" stroke-width="1" opacity="0.3"/>
      <g transform="translate(0, 40)">${content}</g>
    </g>
  `;

  // Helper for safe stat rows (2-column layout)
  const statRow = (col: number, row: number, value: string, label: string, valueColor?: string, valueFontSize = 24) => {
    const x = panelPadding + col * (halfPanelW + 10);
    const y = row * 55;
    const colorAttr = valueColor ? ` fill="${valueColor}"` : '';
    return `
      ${safeText({
        x, y: y + 16, content: value, cls: 'value',
        maxWidth: halfPanelW, fontSize: valueFontSize, fontFamily: 'mono', truncate: true
      })}
      ${safeText({
        x, y: y + 34, content: label, cls: 'muted',
        maxWidth: halfPanelW, fontSize: 10, fontFamily: 'mono', truncate: true
      })}
    `;
  };

  const totalStars = reposData.reduce((s, r) => s + (r.stargazerCount || 0), 0);

  // ===== PANEL 1: STATS (top-left) =====
  const statsContent = `
    ${statRow(0, 0, stats.publicRepos.toLocaleString(), 'Public Repositories')}
    ${statRow(1, 0, stats.followers.toLocaleString(), 'Followers')}
    ${statRow(0, 1, stats.topLanguage, 'Top Language', c.emerald, 20)}
    ${statRow(1, 1, String(stats.streak), 'Day Streak', c.gold)}
    ${statRow(0, 2, stats.totalContributions.toLocaleString(), 'Total Contributions', c.emerald)}
    ${statRow(1, 2, totalStars.toLocaleString(), 'Total Stars', c.gold)}
  `;
  inner += panel(startX, startY, cardW, cardH, 'Stats', '📊', statsContent);

  // ===== PANEL 2: TROPHIES (top-right) =====
  const trophiesContent = `
    ${statRow(0, 0, userData.public_repos.toLocaleString(), 'Repositories', c.emerald, 22)}
    ${statRow(1, 0, '★', 'Starstruck', c.emerald, 22)}
    ${statRow(0, 1, userData.followers.toLocaleString(), 'Followers', c.gold, 22)}
    ${statRow(1, 1, '🔥', 'Streak', c.gold, 22)}
    ${statRow(0, 2, totalStars.toLocaleString(), 'Stars Earned', c.red, 22)}
    ${statRow(1, 2, '💬', 'Pull Requests', c.red, 22)}
  `;
  inner += panel(startX + cardW + gap, startY, cardW, cardH, 'Trophies', '🏆', trophiesContent);

  // ===== PANEL 3: SNAKE (bottom-left) =====
  const snakeGridSize = 8;
  const snakeCellSize = 8;
  const snakeGap = 1;
  const snakeStartX = panelPadding;
  const snakeStartY = 0;
  
  const weeks = calendar?.weeks || [];
  const maxCols = Math.min(24, weeks.length);
  const recentWeeks = weeks.slice(-maxCols);
  
  let snakeGrid = '';
  const activeDays: {col: number, row: number}[] = [];
  
  recentWeeks.forEach((week: any, col: number) => {
    (week.contributionDays || []).slice(0, 7).forEach((day: any, row: number) => {
      const count = day.contributionCount || 0;
      const color = count === 0 ? c.bgElevated : count <= 2 ? '#0e4429' : count <= 4 ? '#006d32' : count <= 8 ? '#26a641' : '#3fb950';
      const x = snakeStartX + col * (snakeCellSize + snakeGap);
      const y = snakeStartY + row * (snakeCellSize + snakeGap);
      snakeGrid += `<rect x="${x}" y="${y}" width="${snakeCellSize}" height="${snakeCellSize}" rx="1.5" fill="${color}"/>`;
      if (count > 0) activeDays.push({col, row});
    });
  });

  let snakeAnim = '';
  if (activeDays.length > 0) {
    const route: {col: number, row: number}[] = [];
    for (let r = 0; r < 7; r++) {
      const colsInRow = activeDays.filter(d => d.row === r).sort((a, b) => a.col - b.col);
      if (r % 2 === 1) colsInRow.reverse();
      route.push(...colsInRow);
    }
    
    if (route.length > 0) {
      const cellCenterX = (col: number) => snakeStartX + col * (snakeCellSize + snakeGap) + snakeCellSize / 2;
      const cellCenterY = (row: number) => snakeStartY + row * (snakeCellSize + snakeGap) + snakeCellSize / 2;
      
      const dur = Math.max(8, route.length * 0.2);
      let keyframes = `@keyframes mini-snake{`;
      const homeX = cellCenterX(route[0].col) - 15;
      const homeY = cellCenterY(route[0].row);
      
      keyframes += `0%{transform:translate(${homeX}px,${homeY}px)}`;
      
      route.forEach((cell, i) => {
        const pct = ((i + 1) / (route.length + 1)) * 100;
        keyframes += `${pct.toFixed(1)}%{transform:translate(${cellCenterX(cell.col)}px,${cellCenterY(cell.row)}px)}`;
      });
      
      keyframes += `100%{transform:translate(${homeX}px,${homeY}px)}}`;
      snakeAnim = `<style>${keyframes}</style>`;
      
      snakeAnim += `<circle r="5" fill="${c.emerald}" stroke="${c.bg}" stroke-width="1.5" style="animation:mini-snake ${dur}s linear infinite">
        <animate attributeName="r" values="3;6;3" dur="${dur/3}s" repeatCount="indefinite"/>
      </circle>`;
    }
  }
  
  const snakeContent = `
    ${snakeGrid}
    ${snakeAnim}
    ${safeText({
      x: cardW / 2, y: cardH - 20, content: `${activeDays.length} active days`, cls: 'muted',
      maxWidth: panelContentWidth, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true
    })}
  `;
  inner += panel(startX, startY + cardH + gap, cardW, cardH, 'Snake', '🐍', snakeContent);

  // ===== PANEL 4: HEATMAP (bottom-right) =====
  const hmCellSize = 6;
  const hmGap = 1;
  const hmStartX = panelPadding;
  const hmStartY = 0;
  const hmWeeks = weeks.slice(-16);
  
  let hmGrid = '';
  hmWeeks.forEach((week: any, col: number) => {
    (week.contributionDays || []).slice(0, 7).forEach((day: any, row: number) => {
      const count = day.contributionCount || 0;
      const color = count === 0 ? c.bgElevated : count <= 2 ? '#0e4429' : count <= 4 ? '#006d32' : count <= 8 ? '#26a641' : '#3fb950';
      const x = hmStartX + col * (hmCellSize + hmGap);
      const y = hmStartY + row * (hmCellSize + hmGap);
      hmGrid += `<rect x="${x}" y="${y}" width="${hmCellSize}" height="${hmCellSize}" rx="1" fill="${color}"/>`;
    });
  });
  
  const totalContributions = calendar?.totalContributions || 
    weeks.flatMap((w: any) => w.contributionDays).reduce((s: number, d: any) => s + d.contributionCount, 0);
  
  const heatmapContent = `
    ${hmGrid}
    ${safeText({
      x: cardW / 2, y: cardH - 20, content: `${totalContributions.toLocaleString()} contributions this year`, cls: 'muted',
      maxWidth: panelContentWidth, fontSize: 9, fontFamily: 'mono', textAnchor: 'middle', truncate: true
    })}
  `;
  inner += panel(startX + cardW + gap, startY + cardH + gap, cardW, cardH, 'Heatmap', '📅', heatmapContent);

  return createSvg(width, height, `${username}'s GitHub Pulse`, inner, theme);
}

// ============================================================================
// VIEWER DETECTION & TIMEZONE HELPERS
// ============================================================================
interface ViewerContext {
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  latitude?: string;
  longitude?: string;
  isVercelEdge: boolean;
}

function extractViewerContext(req: NextRequest): ViewerContext {
  const headers = req.headers;
  
  // Vercel Edge headers
  const vercelIp = headers.get('x-vercel-ip') || headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const vercelCountry = headers.get('x-vercel-ip-country');
  const vercelRegion = headers.get('x-vercel-ip-country-region');
  const vercelCity = headers.get('x-vercel-ip-city');
  const vercelTimezone = headers.get('x-vercel-ip-timezone');
  const vercelLat = headers.get('x-vercel-ip-latitude');
  const vercelLon = headers.get('x-vercel-ip-longitude');
  
  // Cloudflare headers (if proxied through CF)
  const cfCountry = headers.get('cf-ipcountry');
  const cfRegion = headers.get('cf-region');
  const cfCity = headers.get('cf-ipcity');
  const cfTimezone = headers.get('cf-timezone');
  const cfLat = headers.get('cf-iplatitude');
  const cfLon = headers.get('cf-iplongitude');
  
  // Determine best available values
  const country = vercelCountry || cfCountry || 'US';
  const region = vercelRegion || cfRegion || '';
  const city = vercelCity || cfCity || '';
  const timezone = vercelTimezone || cfTimezone || guessTimezoneFromCountry(country);
  const ip = vercelIp || '';
  const latitude = vercelLat || cfLat || '';
  const longitude = vercelLon || cfLon || '';
  
  return {
    ip,
    country,
    region,
    city,
    timezone,
    latitude,
    longitude,
    isVercelEdge: !!(vercelIp || vercelCountry),
  };
}

// Guess timezone from country code (fallback)
function guessTimezoneFromCountry(country: string): string {
  const tzMap: Record<string, string> = {
    'US': 'America/New_York',
    'GB': 'Europe/London',
    'DE': 'Europe/Berlin',
    'FR': 'Europe/Paris',
    'JP': 'Asia/Tokyo',
    'CN': 'Asia/Shanghai',
    'IN': 'Asia/Kolkata',
    'AU': 'Australia/Sydney',
    'CA': 'America/Toronto',
    'BR': 'America/Sao_Paulo',
    'KR': 'Asia/Seoul',
    'SG': 'Asia/Singapore',
    'NL': 'Europe/Amsterdam',
    'ES': 'Europe/Madrid',
    'IT': 'Europe/Rome',
    'MX': 'America/Mexico_City',
    'RU': 'Europe/Moscow',
    'ZA': 'Africa/Johannesburg',
  };
  return tzMap[country.toUpperCase()] || 'UTC';
}

// Get current hour in viewer's timezone
function getViewerHour(timezone: string | undefined): number {
  const tz = timezone || 'UTC';
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    return new Date().getUTCHours(); // Fallback to UTC
  }
}

// Get current weekday (0-6, Sunday=0) in viewer's timezone
function getViewerWeekday(timezone: string | undefined): number {
  const tz = timezone || 'UTC';
  try {
    const now = new Date();
    // Use formatToParts to get weekday as number
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short', // Returns 'Mon', 'Tue', etc.
    });
    const parts = formatter.formatToParts(now);
    const weekdayStr = parts.find(p => p.type === 'weekday')?.value || '';
    const weekdayMap: Record<string, number> = {
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6,
    };
    return weekdayMap[weekdayStr] ?? new Date().getUTCDay();
  } catch {
    return new Date().getUTCDay();
  }
}

// Get greeting based on viewer's local time
function getTimeGreeting(hour: number): { text: string; emoji: string } {
  if (hour >= 5 && hour < 12) return { text: 'Good morning', emoji: '🌅' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '☀️' };
  if (hour >= 17 && hour < 22) return { text: 'Good evening', emoji: '🌆' };
  return { text: 'Good night', emoji: '🌙' };
}

// Highlight current hour in heatmap data
function highlightCurrentHour(heatmapData: number[][], timezone: string): number[][] {
  const viewerHour = getViewerHour(timezone);
  const highlighted = heatmapData.map(row => [...row]);
  // Mark current hour column (0-23) with a special flag
  // We'll use negative values to indicate "current hour" for styling
  for (let day = 0; day < 7; day++) {
    if (highlighted[day] && highlighted[day][viewerHour] !== undefined) {
      highlighted[day][viewerHour] = -Math.abs(highlighted[day][viewerHour]) - 100; // Flag as current hour
    }
  }
  return highlighted;
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
    const themeName = searchParams.get('theme') || 'default';

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // Extract viewer context from edge headers (Vercel, Cloudflare)
    const viewer = extractViewerContext(req);
    const viewerHour = getViewerHour(viewer.timezone);
    const greeting = getTimeGreeting(viewerHour);

    // Fetch profile data with caching and ETag support
    const { data: profileData, etag, fromCache } = await fetchProfileData(username, { token, userToken });

    // Check ETag for conditional request
    if (checkETag(req, etag)) {
      return createNotModifiedResponse(etag);
    }

    const theme = getTheme(themeName);

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

    // ===== SHIELDS COMPATIBLE BADGES =====
    if (type === 'repos') badgeSvg = generateBadge('Public Repos', String(stats.publicRepos), theme);
    else if (type === 'followers') badgeSvg = generateBadge('Followers', String(stats.followers), theme);
    else if (type === 'following') badgeSvg = generateBadge('Following', String(stats.following), theme);
    else if (type === 'language') badgeSvg = generateBadge('Top Language', stats.topLanguage, theme);
    else if (type === 'streak') badgeSvg = generateBadge('Streak', `${stats.streak} days`, theme, 'gold');
    else if (type === 'contributions') badgeSvg = generateBadge('Contributions', String(stats.totalContributions), theme);

    // ===== RICH SVG CARDS =====
    else if (type === 'trophy') badgeSvg = generateTrophySvg(username, userData.public_repos, userData.followers, reposData.reduce((s, r) => s + (r.stargazerCount || 0), 0), theme);
    else if (type === 'activity') badgeSvg = generateActivityGraphSvg(username, theme);
    else if (type === 'visitor') badgeSvg = generateVisitorCardSvg(username, userData.followers, userData.public_repos, stats.totalContributions, theme);
    else if (type === 'heatmap') badgeSvg = generateHeatmapSvg(username, demoCalendar, theme, viewer);
    else if (type === 'snake') badgeSvg = generateSnakeSvg(username, demoCalendar, theme);
    else if (type === 'typing') badgeSvg = generateTypingSvg(username, userData.bio, theme);
    else if (type === 'star-history') badgeSvg = generateStarHistorySvg(username, reposData, theme);
    else if (type === 'repo-card') {
      const repoName = searchParams.get('repo');
      const repo = reposData.find((r: any) => r.name === repoName) || reposData[0];
      badgeSvg = generateRepoCardSvg(repo, theme);
    }
    else if (type === 'language-donut') badgeSvg = generateLanguageDonutSvg(languagesData, theme);
    else if (type === 'skill-bubbles') badgeSvg = generateSkillBubblesSvg(['TypeScript', 'React', 'Next.js', 'Node.js', 'Rust', 'Go', 'Python', 'TailwindCSS', 'PostgreSQL', 'Docker', 'GraphQL', 'WebGL'], theme);
    else if (type === 'ascii') {
      const text = searchParams.get('text') || username;
      badgeSvg = generateAsciiBannerSvg(text, theme);
    }
    else if (type === 'streak-calendar') badgeSvg = generateStreakCalendarSvg(username, demoCalendar, stats.streak, theme);

    // ===== NEW ANIMATED GRAPH BADGES =====
    else if (type === 'skill-radar') badgeSvg = generateSkillRadarSvg([
      { name: 'Frontend', level: 90 }, { name: 'Backend', level: 85 },
      { name: 'DevOps', level: 75 }, { name: 'Architecture', level: 80 },
      { name: 'Testing', level: 70 }, { name: 'Security', level: 65 },
    ], theme);
    else if (type === 'language-race') badgeSvg = generateLanguageRaceSvg(username, languagesData, theme);
    else if (type === 'repo-constellation') badgeSvg = generateRepoConstellationSvg(username, reposData, theme);
    else if (type === 'code-pulse') badgeSvg = generateCodePulseSvg(username, stats, theme, viewer);
    else if (type === 'contribution-mountain') badgeSvg = generateContributionMountainSvg(username, demoCalendar, theme);
    else if (type === 'tech-galaxy') badgeSvg = generateTechGalaxySvg(['TypeScript', 'React', 'Next.js', 'Node.js', 'Rust', 'Go', 'Python', 'PostgreSQL', 'Docker', 'GraphQL', 'TailwindCSS', 'Kubernetes', 'AWS', 'Redis', 'WebGL'], theme);
    else if (type === 'contribution-flow') badgeSvg = generateContributionFlowSvg(username, reposData, theme);
    else if (type === 'code-time-heatmap') badgeSvg = generateCodeTimeHeatmapSvg(username, theme);

    // ===== COMPOSITE CARD (NEW) =====
    else if (type === 'composite') {
      const include = searchParams.get('include')?.split(',') || ['stats', 'trophies', 'snake', 'heatmap'];
      badgeSvg = generateCompositeSvg(username, stats, userData, reposData, calendar || demoCalendar, languagesData, include, theme);
    }

    // ===== EXTERNAL API BADGES (Disabled until tokens provided) =====
    else if (type === 'wakatime') {
      if (!process.env.WAKATIME_API_KEY) badgeSvg = generateBadge('WakaTime', 'Token Required', theme, 'red');
      else badgeSvg = generateBadge('WakaTime', 'Configured ✓', theme);
    }
    else if (type === 'leetcode') {
      if (!process.env.LEETCODE_SESSION) badgeSvg = generateBadge('LeetCode', 'Token Required', theme, 'red');
      else badgeSvg = generateBadge('LeetCode', 'Configured ✓', theme);
    }
    else if (type === 'codeforces') {
      const handle = searchParams.get('handle') || process.env.CODEFORCES_HANDLE;
      if (!handle) badgeSvg = generateBadge('Codeforces', 'Handle Required', theme, 'red');
      else badgeSvg = generateBadge('Codeforces', 'Configured ✓', theme);
    }
    else if (type === 'spotify') {
      if (!process.env.SPOTIFY_REFRESH_TOKEN) badgeSvg = generateBadge('Spotify', 'Token Required', theme, 'red');
      else badgeSvg = generateBadge('Spotify', 'Configured ✓', theme);
    }
    else if (type === 'youtube') {
      if (!process.env.YOUTUBE_API_KEY) badgeSvg = generateBadge('YouTube', 'Token Required', theme, 'red');
      else badgeSvg = generateBadge('YouTube', 'Configured ✓', theme);
    }
    else if (type === 'blog') {
      badgeSvg = generateBadge('Blog Posts', 'Configured ✓', theme);
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
        'X-Viewer-Country': viewer.country || 'unknown',
        'X-Viewer-Timezone': viewer.timezone || 'unknown',
        'X-Viewer-Hour': String(getViewerHour(viewer.timezone)),
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