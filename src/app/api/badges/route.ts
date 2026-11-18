import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  fetchProfileData,
  fetchRepoData,
  checkETag,
  createETagResponse,
  createNotModifiedResponse,
} from '@/lib/github-api';

// ============================================================================
// DESIGN SYSTEM CONSTANTS
// ============================================================================
// Theme definitions - using 50 curated viral themes from single source of truth
import type { ThemePalette } from '@/lib/themes';
import { getThemeById } from '@/lib/themes';
import { findTechIcon } from '@/lib/tech-icons';

type Theme = ThemePalette;

function getTheme(themeName?: string): Theme {
  return getThemeById(themeName || 'gta6');
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
// Properties that must stay unitless in CSS
const CSS_UNITLESS = new Set([
  'font-weight',
  'opacity',
  'fill-opacity',
  'stroke-opacity',
  'z-index',
  'line-height',
]);

function css(cls: string, props: Record<string, string | number>): string {
  const body = Object.entries(props)
    .map(([k, v]) => {
      // Numbers need a unit in CSS, otherwise the declaration is invalid and the
      // browser silently drops it (e.g. `font-size: 9` -> falls back to 16px).
      const value = typeof v === 'number' && !CSS_UNITLESS.has(k) ? `${v}px` : v;
      return `${k}: ${value};`;
    })
    .join(' ');
  return `.${cls} { ${body} }`;
}

function styleBlock(...rules: string[]): string {
  return `<style>${rules.join(' ')}</style>`;
}

function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  rx = 0,
  stroke?: string,
  strokeWidth = 1
): string {
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
  mono: {
    9: 5.5,
    10: 6,
    11: 6.6,
    12: 7.2,
    14: 8.4,
    16: 9.6,
    18: 10.8,
    20: 12,
    22: 13.2,
    24: 14.4,
    28: 16.8,
  },
  display: { 14: 8.5, 16: 9.7, 18: 10.9, 20: 12.1, 24: 14.5, 30: 18.2 },
  ui: { 11: 6.5 },
} as const;

type FontFamily = keyof typeof FONT_METRICS;

/**
 * Estimate text width in pixels for given font family and size
 */
function estimateTextWidth(
  text: string,
  fontSize: number,
  fontFamily: FontFamily = 'mono'
): number {
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
function truncateText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: FontFamily = 'mono'
): string {
  const ellipsis = '...'; // ASCII ellipsis to avoid UTF-8 double-encoding issues
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
function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: FontFamily = 'mono',
  maxLines = 3
): string[] {
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
    x,
    y,
    content,
    cls,
    maxWidth,
    maxLines = 1,
    fontSize = 12,
    fontFamily = 'mono',
    textAnchor = 'start',
    truncate = true,
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

  return lines
    .map((line, i) => {
      const lineY = y + i * lineHeight;
      const anchorAttr = textAnchor !== 'start' ? ` text-anchor="${textAnchor}"` : '';
      return `<text x="${x}" y="${lineY}" class="${cls}"${anchorAttr}>${line}</text>`;
    })
    .join('');
}

/**
 * Calculate required width for a text label + value pair (for badges)
 */
function calculateBadgeWidth(
  label: string,
  value: string,
  labelFontSize = 11,
  valueFontSize = 11,
  padding = 20
): number {
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

function ensureFitsInBounds(
  textContent: string,
  bounds: Bounds,
  fontSize: number,
  fontFamily: FontFamily = 'mono',
  padding = 8
): {
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
  const fits =
    lines.length <= maxLines &&
    lines.every((l) => estimateTextWidth(l, fontSize, fontFamily) <= maxWidth);

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
    bounds,
    content,
    cls,
    fontSize = 12,
    fontFamily = 'mono',
    align = 'left',
    verticalAlign = 'top',
    lineHeightMultiplier = 1.3,
    maxLines = 10,
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
    case 'middle':
      startY = bounds.y + (bounds.height - totalHeight) / 2 + fontSize * 0.7;
      break;
    case 'bottom':
      startY = bounds.y + bounds.height - padding - (lines.length - 1) * lineHeight;
      break;
    default:
      startY = bounds.y + padding + fontSize * 0.7;
  }

  let xOffset: number;
  switch (align) {
    case 'center':
      xOffset = bounds.x + bounds.width / 2;
      break;
    case 'right':
      xOffset = bounds.x + bounds.width - padding;
      break;
    default:
      xOffset = bounds.x + padding;
  }

  const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start';

  return lines
    .map(
      (line, i) =>
        `<text x="${xOffset}" y="${startY + i * lineHeight}" class="${cls}" text-anchor="${anchor}">${line}</text>`
    )
    .join('');
}

function text(x: number, y: number, content: string, cls: string): string {
  return `<text x="${x}" y="${y}" class="${cls}">${content}</text>`;
}

// ============================================================================
// BASE SVG WRAPPER (theme-aware)
// ============================================================================
function createSvg(
  width: number,
  height: number,
  title: string,
  inner: string,
  theme: Theme
): string {
  const c = C(theme);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}">
${styleBlock(
  css('bg', { fill: c.bg, stroke: c.border, 'stroke-width': 1, rx: RADIUS.lg }),
  css('panel', { fill: c.bgElevated, stroke: c.border, 'stroke-width': 1, rx: RADIUS.md }),
  css('title', {
    fill: c.emerald,
    'font-family': FONTS.display,
    'font-weight': 'bold',
    'font-size': 14,
  }),
  css('label', { fill: c.textSecondary, 'font-family': FONTS.mono, 'font-size': 10 }),
  css('label-lg', { fill: c.textSecondary, 'font-family': FONTS.mono, 'font-size': 11 }),
  css('value', {
    fill: c.textPrimary,
    'font-family': FONTS.mono,
    'font-weight': 'bold',
    'font-size': 14,
  }),
  css('value-sm', {
    fill: c.textPrimary,
    'font-family': FONTS.mono,
    'font-weight': 'bold',
    'font-size': 12,
  }),
  css('muted', { fill: c.textMuted, 'font-family': FONTS.mono, 'font-size': 9 }),
  css('badge-title', {
    fill: c.emerald,
    'font-family': FONTS.display,
    'font-weight': 'bold',
    'font-size': 16,
  })
)}
<rect width="${width}" height="${height}" class="bg"/>
<defs>
  <linearGradient id="rc-glow" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${theme.purple || c.emerald}" stop-opacity="0.16"/>
    <stop offset="55%" stop-color="${c.bg}" stop-opacity="0"/>
    <stop offset="100%" stop-color="${c.emerald}" stop-opacity="0.1"/>
  </linearGradient>
</defs>
<rect width="${width}" height="${height}" rx="${RADIUS.lg}" fill="url(#rc-glow)"/>
${inner}
</svg>`;
}

// ============================================================================
// BADGE GENERATORS (Shields.io compatible)
// ============================================================================
function generateBadge(
  label: string,
  message: string,
  theme: Theme,
  accent?: 'emerald' | 'gold' | 'red'
): string {
  const c = C(theme);
  const color = accent ? c[accent] : c.emerald;
  const labelWidth = (label.length + 1) * 7;
  const messageWidth = (message.length + 1) * 7;
  const totalWidth = labelWidth + messageWidth + 20;
  const labelBg = theme.id === 'default' ? '090d16' : c.bg.replace('#', '');
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
// NATIVE SKILL CHIPS
// Rendered from the curated simple-icons subset in `@/lib/tech-icons`, so a
// profile never depends on shields.io for its tech stack.
// ============================================================================

function escXml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function mixHex(hex: string, toward: string, amount: number): string {
  const parse = (value: string) => {
    const clean = value.replace('#', '').padEnd(6, '0').slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) || 0);
  };
  const a = parse(hex);
  const b = parse(toward);
  const out = a.map((channel, i) => Math.round(channel + (b[i] - channel) * amount));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Brand colours such as Java's #007396 vanish on dark README backgrounds. */
function readableBrandColor(brandHex: string, backgroundColor: string): string {
  if (!/^#?[0-9a-f]{6}$/i.test(brandHex.trim())) return '#94a3b8';
  const brand = brandHex.startsWith('#') ? brandHex : `#${brandHex}`;
  const brandLum = relativeLuminance(brand);
  const bgLum = relativeLuminance(backgroundColor);
  const contrast = (Math.max(brandLum, bgLum) + 0.05) / (Math.min(brandLum, bgLum) + 0.05);
  if (contrast >= 3) return brand;
  return mixHex(brand, bgLum < 0.5 ? '#ffffff' : '#000000', 0.45);
}

interface SkillChipGeometry {
  width: number;
  iconSize: number;
  textX: number;
  textWidth: number;
  hasIcon: boolean;
}

const SKILL_CHIP = { height: 24, radius: 6, padX: 10, iconSize: 13, iconGap: 6, fontSize: 11 };

function measureSkillChip(name: string): SkillChipGeometry {
  const icon = findTechIcon(name);
  const textWidth = Math.ceil(estimateTextWidth(name, SKILL_CHIP.fontSize, 'mono'));
  const iconSpace = icon ? SKILL_CHIP.iconSize + SKILL_CHIP.iconGap : 5 + SKILL_CHIP.iconGap;
  return {
    width: Math.max(46, SKILL_CHIP.padX * 2 + iconSpace + textWidth),
    iconSize: SKILL_CHIP.iconSize,
    textX: SKILL_CHIP.padX + iconSpace,
    textWidth,
    hasIcon: Boolean(icon),
  };
}

function skillChipBody(name: string, x: number, theme: Theme): string {
  const c = C(theme);
  const geo = measureSkillChip(name);
  const text = escXml(name);
  const iconY = (SKILL_CHIP.height - SKILL_CHIP.iconSize) / 2;
  const glyph = findTechIcon(name);

  const mark = glyph
    ? `<g transform="translate(${x + SKILL_CHIP.padX}, ${iconY}) scale(${SKILL_CHIP.iconSize / 24})"><path d="${glyph.icon.path}" fill="${readableBrandColor(glyph.icon.hex, c.bgElevated)}" /></g>`
    : `<circle cx="${x + SKILL_CHIP.padX + 2}" cy="${SKILL_CHIP.height / 2}" r="2.5" fill="${c.emerald}" />`;

  return `${rect(x, 0, geo.width, SKILL_CHIP.height, c.bgElevated, SKILL_CHIP.radius, c.border, 1)}${mark}<text x="${x + geo.textX}" y="${SKILL_CHIP.height / 2 + 4}" font-family="${FONTS.mono}" font-size="${SKILL_CHIP.fontSize}" fill="${c.textPrimary}" text-rendering="geometricPrecision">${text}</text>`;
}

function generateSkillChipSvg(name: string, theme: Theme): string {
  const geo = measureSkillChip(name);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${geo.width}" height="${SKILL_CHIP.height}" role="img" aria-label="${escXml(name)}">${skillChipBody(name, 0, theme)}</svg>`;
}

function generateSkillRowSvg(names: string[], theme: Theme): string {
  const gap = 6;
  let cursor = 0;
  const chips = names.map((name) => {
    const body = skillChipBody(name, cursor, theme);
    cursor += measureSkillChip(name).width + gap;
    return body;
  });
  const width = Math.max(0, cursor - gap);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${SKILL_CHIP.height}" role="img" aria-label="${escXml(names.join(', '))}">${chips.join('')}</svg>`;
}

// ============================================================================
// 1. DEVELOPER TROPHY CARD
// ============================================================================
function generateTrophySvg(
  username: string,
  reposCount: number,
  followersCount: number,
  starsCount: number,
  theme: Theme
): string {
  const c = C(theme);
  const width = 520;
  const height = 140;
  const cardW = 148;
  const gap = 18;
  const startX = (width - (cardW * 3 + gap * 2)) / 2;
  const cardPadding = 12;
  const maxValueWidth = cardW - cardPadding * 2;

  const cards = [
    { label: 'OPEN SOURCE', value: `${reposCount.toLocaleString()} Repos`, accent: c.emerald },
    { label: 'COMMUNITY', value: `${followersCount.toLocaleString()} Followers`, accent: c.gold },
    { label: 'VELOCITY', value: 'Elite Tier', accent: c.red },
  ];

  let inner = '';
  // Safe title with truncation
  const titleText = `${username}'s Developer Trophies`;
  inner += safeText({
    x: width / 2,
    y: 30,
    content: titleText,
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
  });

  cards.forEach((card, i) => {
    const x = startX + i * (cardW + gap);
    const y = 50;
    inner += translate(
      x,
      y,
      `
      ${rect(0, 0, cardW, 70, c.bgElevated, RADIUS.md, c.borderLight)}
      <rect x="0" y="0" width="4" height="70" rx="2" fill="${card.accent}" opacity="0.8"/>
      ${safeText({
        x: cardW / 2,
        y: 26,
        content: card.label,
        cls: 'label',
        maxWidth: maxValueWidth,
        fontSize: 10,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
      ${safeText({
        x: cardW / 2,
        y: 50,
        content: card.value,
        cls: 'value-sm',
        maxWidth: maxValueWidth,
        fontSize: 13,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
    `
    );
  });

  return createSvg(width, height, `${username}'s Developer Trophies`, inner, theme);
}

// ============================================================================
// 2. COMMIT ACTIVITY GRAPH
// ============================================================================
function generateActivityGraphSvg(username: string, calendar: any, theme: Theme): string {
  const c = C(theme);
  const width = 560;
  const height = 200;
  const margin = { top: 40, right: 20, bottom: 40, left: 50 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  // Real daily contribution counts for the last 30 days (was Math.random, which
  // redrew a different fake curve on every request).
  const allDays: any[] = (calendar?.weeks || []).flatMap((w: any) => w.contributionDays || []);
  const recent = allDays.slice(-30);
  const counts =
    recent.length > 0 ? recent.map((d: any) => d.contributionCount || 0) : new Array(30).fill(0);
  const peak = Math.max(1, ...counts);

  const points = counts.map((count, i) => ({
    x: margin.left + (i / Math.max(counts.length - 1, 1)) * chartW,
    y: margin.top + chartH - (count / peak) * chartH * 0.9,
    count,
  }));

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath =
    path +
    ` L ${points[points.length - 1].x} ${margin.top + chartH} L ${points[0].x} ${margin.top + chartH} Z`;

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 28,
    content: `${username}'s Commit Activity (30 Days)`,
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  inner += translate(
    margin.left,
    margin.top,
    `
    ${rect(0, 0, chartW, chartH, c.bgElevated, RADIUS.sm, c.border)}
    <defs>
      <linearGradient id="activityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${c.emerald}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${c.bg}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#activityGrad)"/>
    <path d="${path}" fill="none" stroke="${c.emerald}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${points.map((p, i) => (i % 4 === 0 ? `<circle cx="${p.x - margin.left}" cy="${p.y - margin.top}" r="3" fill="${c.emerald}" stroke="${c.bg}" stroke-width="2"/>` : '')).join('')}
  `
  );

  // X axis: first / middle / last real dates instead of weekday names, since the
  // series is a continuous 30-day window rather than a single week.
  const labelDays = [0, Math.floor((counts.length - 1) / 2), counts.length - 1].filter(
    (v, i, a) => a.indexOf(v) === i
  );
  labelDays.forEach((idx) => {
    const day = recent[idx];
    const date = day?.date ? new Date(day.date) : null;
    const label =
      date && !isNaN(date.getTime())
        ? `${date.getMonth() + 1}/${date.getDate()}`
        : `-${counts.length - 1 - idx}d`;
    const x = margin.left + (idx / Math.max(counts.length - 1, 1)) * chartW;
    inner += safeText({
      x,
      y: height - 12,
      content: label,
      cls: 'muted',
      maxWidth: 60,
      fontSize: 9,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    });
  });

  inner += safeText({
    x: margin.left - 6,
    y: margin.top + 8,
    content: `${peak}`,
    cls: 'muted',
    maxWidth: 36,
    fontSize: 9,
    fontFamily: 'mono',
    textAnchor: 'end',
    truncate: true,
  });
  inner += safeText({
    x: margin.left - 6,
    y: margin.top + chartH,
    content: '0',
    cls: 'muted',
    maxWidth: 36,
    fontSize: 9,
    fontFamily: 'mono',
    textAnchor: 'end',
    truncate: true,
  });
  inner += safeText({
    x: margin.left - 6,
    y: height / 2,
    content: 'Commits',
    cls: 'muted',
    maxWidth: 40,
    fontSize: 9,
    fontFamily: 'mono',
    textAnchor: 'end',
    truncate: true,
  });

  return createSvg(width, height, `${username}'s Commit Activity`, inner, theme);
}

// ============================================================================
// 3. VISITOR ANALYTICS CARD
// ============================================================================
function generateVisitorCardSvg(
  username: string,
  followers: number,
  repos: number,
  contributions: number,
  theme: Theme
): string {
  const c = C(theme);
  const width = 520;
  const height = 150;
  const views = 1337 + username.length * 42 + followers * 2;
  const impactScore = Math.min(99, Math.max(1, Math.floor(contributions / 50 + followers / 20)));

  const cards = [
    {
      label: 'Profile Views',
      value: views.toLocaleString(),
      trend: 'estimated',
      accent: c.emerald,
    },
    {
      label: 'Contributions',
      value: contributions.toLocaleString(),
      trend: 'this year',
      accent: c.gold,
    },
    {
      label: 'Impact Score',
      value: `Top ${100 - impactScore}%`,
      trend: `${impactScore}/100`,
      accent: c.red,
    },
  ];

  const cardW = 148;
  const gap = 18;
  const startX = (width - (cardW * 3 + gap * 2)) / 2;
  const cardPadding = 12;
  const maxValueWidth = cardW - cardPadding * 2;

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 30,
    content: `${username}'s Visitor Analytics`,
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
  });

  cards.forEach((card, i) => {
    const x = startX + i * (cardW + gap);
    const y = 50;
    inner += translate(
      x,
      y,
      `
      ${rect(0, 0, cardW, 80, c.bgElevated, RADIUS.md, c.borderLight)}
      <rect x="0" y="0" width="4" height="80" rx="2" fill="${card.accent}" opacity="0.8"/>
      ${safeText({
        x: cardW / 2,
        y: 28,
        content: card.label,
        cls: 'label',
        maxWidth: maxValueWidth,
        fontSize: 10,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
      ${safeText({
        x: cardW / 2,
        y: 52,
        content: card.value,
        cls: 'value',
        maxWidth: maxValueWidth,
        fontSize: 14,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
      ${safeText({
        x: cardW / 2,
        y: 68,
        content: card.trend,
        cls: 'muted',
        maxWidth: maxValueWidth,
        fontSize: 9,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
    `
    );
  });

  return createSvg(width, height, `${username}'s Visitor Analytics`, inner, theme);
}

// ============================================================================
// 4. CONTRIBUTION HEATMAP (GitHub-style) - WITH VIEWER TIMEZONE HIGHLIGHT
// ============================================================================
function generateHeatmapSvg(
  username: string,
  calendar: any,
  theme: Theme,
  viewer?: ViewerContext
): string {
  const c = C(theme);
  const width = 820;
  const height = 160;
  const weeks = calendar?.weeks || [];
  const cellSize = 11;
  const cellGap = 2;
  const startX = 55;
  const startY = 44;

  const allDays = weeks.flatMap((w: any) => w.contributionDays);
  const maxCount = Math.max(...allDays.map((d: any) => d.contributionCount), 1);

  const getColor = (count: number, isCurrentHour = false) => {
    if (count === 0) return c.bgElevated;
    if (theme.id === 'default') {
      if (count <= maxCount * 0.2) return isCurrentHour ? '#1a5c35' : '#0e4429';
      if (count <= maxCount * 0.4) return isCurrentHour ? '#0a8a3f' : '#006d32';
      if (count <= maxCount * 0.6) return isCurrentHour ? '#34c652' : '#26a641';
      if (count <= maxCount * 0.8) return isCurrentHour ? '#4fd160' : '#39d353';
      return isCurrentHour ? '#6ff08a' : '#5ee87a';
    }
    if (count <= maxCount * 0.2) return isCurrentHour ? c.borderLight : c.border;
    if (count <= maxCount * 0.4) return c.emeraldDim;
    if (count <= maxCount * 0.6) return c.emerald;
    if (count <= maxCount * 0.8) return c.emeraldLight;
    return c.gold;
  };

  let inner = '';
  inner += safeText({
    x: 30,
    y: 22,
    content: `${username}'s Contribution Calendar`,
    cls: 'badge-title',
    maxWidth: width - 80,
    fontSize: 14,
    fontFamily: 'display',
    truncate: true,
  });
  const viewerHour = viewer ? getViewerHour(viewer.timezone) : -1;
  const viewerWeekday = viewer ? getViewerWeekday(viewer.timezone) : -1;
  if (viewer && viewerHour >= 0) {
    const greeting = getTimeGreeting(viewerHour);
    const tz = viewer.timezone || 'UTC';
    inner += safeText({
      x: width - 30,
      y: 22,
      content: `${greeting.text} | ${tz} | ${viewerHour.toString().padStart(2, '0')}:00`,
      cls: 'muted',
      maxWidth: width / 2,
      fontSize: 10,
      fontFamily: 'mono',
      textAnchor: 'end',
      truncate: true,
    });
  }

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  weeks.forEach((week: any, weekIndex: number) => {
    if (week.contributionDays[0]) {
      const date = new Date(week.contributionDays[0].date);
      if (date.getDate() <= 7) {
        const x = startX + weekIndex * (cellSize + cellGap);
        inner += safeText({
          x: x + cellSize / 2,
          y: startY - 8,
          content: months[date.getMonth()],
          cls: 'muted',
          maxWidth: cellSize * 4,
          fontSize: 9,
          fontFamily: 'mono',
          textAnchor: 'middle',
          truncate: true,
        });
      }
    }
  });

  // Get current hour for highlighting (if viewer provided)
  const currentHour = viewerHour;

  weeks.forEach((week: any, weekIndex: number) => {
    week.contributionDays.forEach((day: any, dayIndex: number) => {
      const count = day.contributionCount;
      const isCurrentHour = dayIndex === currentHour;
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
        x: startX - 10,
        y,
        content: label,
        cls: 'muted',
        maxWidth: startX - 14,
        fontSize: 9,
        fontFamily: 'mono',
        textAnchor: 'end',
        truncate: true,
      });
    }
  });

  const legendY = height - 16;
  inner += translate(
    startX,
    legendY,
    `
    ${safeText({ x: 0, y: 5, content: 'Less', cls: 'muted', maxWidth: 30, fontSize: 9, fontFamily: 'mono', truncate: true })}
    ${[0, 1, 2, 3, 4, 5].map((i) => rect(35 + i * 14, -3, 10, 10, getColor(i === 0 ? 0 : (maxCount * i) / 5), 2)).join('')}
    ${safeText({ x: 110, y: 5, content: 'More', cls: 'muted', maxWidth: 30, fontSize: 9, fontFamily: 'mono', textAnchor: 'end', truncate: true })}
  `
  );

  if (viewer && currentHour >= 0) {
    const tz = viewer.timezone || 'UTC';
    inner += safeText({
      x: startX + 130,
      y: height - 7,
      content: `[Current hour (${currentHour}:00 ${tz}) highlighted in gold]`,
      cls: 'muted',
      maxWidth: width - startX - 260,
      fontSize: 8,
      fontFamily: 'mono',
      truncate: true,
    });
  }

  const total =
    calendar?.totalContributions ||
    allDays.reduce((s: number, d: any) => s + d.contributionCount, 0);
  inner += safeText({
    x: width - 30,
    y: height - 7,
    content: `${total.toLocaleString()} contributions in ${new Date().getFullYear()}`,
    cls: 'muted',
    maxWidth: width / 2,
    fontSize: 9,
    fontFamily: 'mono',
    textAnchor: 'end',
    truncate: true,
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

  // Theme-aware contribution levels: derive from theme palette
  // Level 0 (empty): bgElevated, Level 1: border, Level 2: emeraldDim, Level 3: emerald, Level 4+: gold
  const levelFill = (count: number) => {
    if (count <= 0) return emptyFill;
    if (count <= 2) return c.border; // Very light activity - subtle theme border
    if (count <= 4) return c.emeraldDim; // Light activity - dimmed theme accent
    if (count <= 8) return c.emerald; // Medium activity - full theme accent
    return c.gold; // High activity - theme gold highlight
  };

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
    x: 24,
    y: 26,
    content: `${username}'s Contribution Snake`,
    cls: 'badge-title',
    maxWidth: width - 100,
    fontSize: 16,
    fontFamily: 'display',
    truncate: true,
  });
  inner += safeText({
    x: width - 24,
    y: 26,
    content: `${activeCount} active days | ${total.toLocaleString()} contributions`,
    cls: 'muted',
    maxWidth: width / 2 - 30,
    fontSize: 9,
    fontFamily: 'mono',
    textAnchor: 'end',
    truncate: true,
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
      .filter((cell) => cell.row === r && cell.count > 0)
      .sort((a, b) => a.col - b.col);
    if (r % 2 === 1) colsInRow.reverse(); // serpentine: alternate direction per row
    route.push(...colsInRow.map((cell) => ({ col: cell.col, row: cell.row })));
  }

  // Fallback: if no contributions, use a minimal path through all cells
  if (route.length < 2) {
    for (let r = 0; r < rows; r++) {
      const colsInRow = r % 2 === 0 ? [...Array(cols).keys()] : [...Array(cols).keys()].reverse();
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

  // Build theme-aware snake segment colors using theme.emerald gradient
  const em = c.emerald; // e.g., #ff6b35 for GTA 6, #7aa2f7 for tokyonight
  const emDim = c.emeraldDim;
  const emLight = c.emeraldLight;
  const gold = c.gold;
  const goldDim = c.goldDim;

  const segmentDefs = [
    { size: 17, fill: em, head: true },
    { size: 15.5, fill: emLight, head: false },
    { size: 14, fill: emDim, head: false },
    { size: 12.5, fill: gold, head: false },
    { size: 11, fill: goldDim, head: false },
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
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
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
      `<rect x="${(-seg.size / 2).toFixed(1)}" y="${(-seg.size / 2).toFixed(1)}" width="${seg.size}" height="${seg.size}" rx="${(seg.size * 0.32).toFixed(1)}" fill="${seg.fill}" stroke="${c.border}" stroke-width="0.9"/>` +
      (seg.head ? buildSnakeHead(seg.size, c) : '') +
      `</g>`;
  });

  // Tongue flicker animation (CSS-based, works with parent rotation)
  snakeCss += `@keyframes sn-tongue-flicker{0%,100%{opacity:0.4;transform:scaleX(1)}50%{opacity:1;transform:scaleX(1.15)}}`;
  snakeCss += `.sn-tongue{animation:sn-tongue-flicker 1.8s ease-in-out infinite;transform-origin:${(segmentDefs[0].size * 0.75).toFixed(1)}px 0}`;

  // Cell eating animations: only contribution cells animate
  // Head (segIdx=0) reaches basePoints[i] at step i+1 (step 0 = home)
  const headOffset = 1; // head starts moving at step 1
  route.forEach((cell, i) => {
    const cellData = cells.find((c) => c.col === cell.col && c.row === cell.row);
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
      x: startX - 8,
      y,
      content: label,
      cls: 'muted',
      maxWidth: startX - 12,
      fontSize: 9,
      fontFamily: 'mono',
      textAnchor: 'end',
      truncate: true,
    });
  });

  // Month labels
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  weeks.forEach((week: any, wi: number) => {
    const first = week.contributionDays?.[0];
    if (first) {
      const date = new Date(first.date);
      if (date.getDate() <= 7) {
        const x = startX + wi * pitch + cellSize / 2;
        inner += safeText({
          x,
          y: startY - 9,
          content: months[date.getMonth()],
          cls: 'muted',
          maxWidth: pitch * 2,
          fontSize: 9,
          fontFamily: 'mono',
          textAnchor: 'middle',
          truncate: true,
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
function buildSnakeHead(size: number, c: any): string {
  const half = size / 2;
  const eyeOffset = size * 0.22;
  const eyeR = Math.max(1.2, size * 0.1);
  const nostrilR = Math.max(0.6, size * 0.05);
  const tongueLen = size * 0.6;
  const tongueSplit = size * 0.3;

  // Tongue path: double-ended fork (points both forward and backward)
  // This ensures visibility regardless of head rotation (0° or 180°)
  const tonguePath = `M ${(half * 0.75).toFixed(1)} ${(-tongueSplit * 0.5).toFixed(1)} L ${(half + tongueLen).toFixed(1)} ${(-tongueSplit).toFixed(1)} M ${(half * 0.75).toFixed(1)} ${(tongueSplit * 0.5).toFixed(1)} L ${(half + tongueLen).toFixed(1)} ${tongueSplit.toFixed(1)} M ${(half * 0.75).toFixed(1)} ${(-tongueSplit * 0.5).toFixed(1)} L ${(half - tongueLen * 0.5).toFixed(1)} ${(-tongueSplit * 0.8).toFixed(1)} M ${(half * 0.75).toFixed(1)} ${(tongueSplit * 0.5).toFixed(1)} L ${(half - tongueLen * 0.5).toFixed(1)} ${(tongueSplit * 0.8).toFixed(1)}`;

  const eyeColor = c?.bg || '#021a0a';
  const highlightColor = c?.emeraldLight || '#4ade80';
  const nostrilColor = c?.bg || '#021a0a';
  const tongueColor = c?.red || '#ef4444';

  return (
    // Eyes (larger, more forward-facing)
    `<circle cx="${(half * 0.4).toFixed(1)}" cy="${(-eyeOffset).toFixed(1)}" r="${eyeR.toFixed(1)}" fill="${eyeColor}"/>` +
    `<circle cx="${(half * 0.4).toFixed(1)}" cy="${eyeOffset.toFixed(1)}" r="${eyeR.toFixed(1)}" fill="${eyeColor}"/>` +
    // Eye highlights (catch light)
    `<circle cx="${(half * 0.45).toFixed(1)}" cy="${(-eyeOffset + 0.5).toFixed(1)}" r="${(eyeR * 0.35).toFixed(1)}" fill="${highlightColor}" opacity="0.6"/>` +
    `<circle cx="${(half * 0.45).toFixed(1)}" cy="${(eyeOffset + 0.5).toFixed(1)}" r="${(eyeR * 0.35).toFixed(1)}" fill="${highlightColor}" opacity="0.6"/>` +
    // Nostrils
    `<circle cx="${(half * 0.7).toFixed(1)}" cy="${(-nostrilR * 1.5).toFixed(1)}" r="${nostrilR.toFixed(1)}" fill="${nostrilColor}"/>` +
    `<circle cx="${(half * 0.7).toFixed(1)}" cy="${(nostrilR * 1.5).toFixed(1)}" r="${nostrilR.toFixed(1)}" fill="${nostrilColor}"/>` +
    // Forked tongue (double-sided, animated flicker via CSS)
    `<path class="sn-tongue" d="${tonguePath}" stroke="${tongueColor}" stroke-width="${(size * 0.09).toFixed(1)}" stroke-linecap="round" fill="none"/>`
  );
}

// ============================================================================
// 6. TYPING SVG ANIMATION (Viral - pure SVG)
// ============================================================================
function escapeXmlText(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Turn the profile bio into a few short typing lines, keeping the intro personal.
function introPhrases(displayName: string, bio?: string): string[] {
  const clean = (bio || '').replace(/\r\n?/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = clean
    .split(/[|•·/]|,|\.\s+|;\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 12 && p.length <= 42);
  const phrases = [`Hi, I'm ${displayName}`];
  for (const part of parts.slice(0, 2)) {
    if (!phrases.some((p) => p.toLowerCase() === part.toLowerCase())) phrases.push(part);
  }
  if (phrases.length < 2) phrases.push('Full-Stack Developer');
  if (phrases.length < 3) phrases.push('Building Developer Tools');
  return phrases;
}

function relativeLuminance(hex: string): number {
  const clean = String(hex || '').replace('#', '');
  if (clean.length < 6) return 0;
  const [r, g, b] = [0, 2, 4]
    .map((i) => parseInt(clean.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// Pick the first accent that stays readable on the theme background, preferring
// the theme's own hue so every theme still feels like itself.
function readableAccent(candidates: Array<string | undefined | null>, bg: string, min = 3): string {
  const valid = candidates.filter((c): c is string => Boolean(c));
  return valid.find((c) => contrastRatio(c, bg) >= min) || valid[0] || '#ffffff';
}

// Animated hero banner: the name rises and fades in over drifting gradient
// waves, so the generated README opens with motion instead of plain text.
function generateNameBannerSvg(name: string, theme?: Theme): string {
  const activeTheme = theme || getTheme('gta6');
  const c = C(activeTheme);
  const width = 1000;
  const height = 220;
  const displayName = name || 'Developer';
  const fontSize = Math.min(68, Math.max(34, Math.floor(880 / Math.max(6, displayName.length))));
  const mid = activeTheme.purple || c.gold;
  // Light themes need their dim shades (or plain text) to stay legible.
  const nameA = readableAccent([c.emeraldDim, c.emerald, c.textPrimary], c.bg);
  const nameB = readableAccent(
    [activeTheme.purple, activeTheme.goldDim || c.goldDim, c.gold, c.textPrimary],
    c.bg
  );
  const nameC = readableAccent([c.emeraldLight, c.emeraldDim, c.emerald, c.textPrimary], c.bg);
  const wavePath =
    'M0 188 Q 125 158 250 188 T 500 188 T 750 188 T 1000 188 T 1250 188 T 1500 188 L1500 220 L0 220 Z';

  return createSvg(
    width,
    height,
    `${displayName} — animated banner`,
    `
    <defs>
      <linearGradient id="nb-name" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${nameA}"/>
        <stop offset="50%" stop-color="${nameB}"/>
        <stop offset="100%" stop-color="${nameC}"/>
        <animate attributeName="x1" values="-40%;100%" dur="7s" repeatCount="indefinite"/>
        <animate attributeName="x2" values="0%;140%" dur="7s" repeatCount="indefinite"/>
      </linearGradient>
    </defs>

    <g>
      <path d="${wavePath}" fill="${c.emerald}" opacity="0.08">
        <animateTransform attributeName="transform" type="translate" values="0 0;-500 0" dur="9s" repeatCount="indefinite"/>
      </path>
      <path d="${wavePath}" fill="${mid}" opacity="0.1">
        <animateTransform attributeName="transform" type="translate" values="0 10;-500 10" dur="13s" repeatCount="indefinite"/>
      </path>
    </g>

    <text x="${width / 2}" y="118" text-anchor="middle" fill="url(#nb-name)"
      font-family="${FONTS.display}" font-size="${fontSize}" font-weight="bold"
      letter-spacing="1" opacity="0">
      <animate attributeName="opacity" values="0;1" dur="0.9s" fill="freeze"/>
      <animateTransform attributeName="transform" type="translate" values="0 14;0 0" dur="0.9s" fill="freeze"/>
      ${escapeXmlText(displayName)}
    </text>
  `,
    activeTheme
  );
}

// Real typing effect: each phrase is revealed character by character with a
// clip-path and a blinking cursor (SMIL, works inside GitHub's <img>).
function generateTypingSvg(displayName: string, bio?: string, theme?: Theme): string {
  const activeTheme = theme || getTheme('gta6');
  const c = C(activeTheme);
  const width = 700;
  const height = 92;
  const fontSize = 20;
  const charWidth = fontSize * 0.62;
  const cx = width / 2;
  const baseline = height / 2 + 7;
  const phrases = introPhrases(displayName, bio);
  const phraseDuration = Math.max(3, 1.2 + Math.max(...phrases.map((p) => p.length)) * 0.11);
  const cycleTime = phrases.length * phraseDuration;
  // Each phrase lives in its own group and CSS keyframes give it a exclusive
  // slice of the cycle, so lines can never overlap. CSS animations (unlike
  // clip-path/SMIL) render reliably when this SVG is embedded via <img>.
  // Keep the typing line readable on light and dark themes alike.
  const typingColor = readableAccent([c.emerald, c.emeraldDim, c.textPrimary], c.bg);
  const typingAlt = readableAccent(
    [c.gold, activeTheme.orangeDim || c.goldDim, c.textPrimary],
    c.bg
  );
  const slice = 100 / phrases.length;
  let animationCss = '';
  let groups = '';
  phrases.forEach((phrase, i) => {
    const start = i * slice;
    const end = start + slice;
    const fadeIn = start + slice * 0.08;
    const fadeOut = end - slice * 0.08;
    animationCss +=
      `@keyframes tp-${i}{0%,${start.toFixed(2)}%{opacity:0}` +
      `${fadeIn.toFixed(2)}%,${fadeOut.toFixed(2)}%{opacity:1}` +
      `${end.toFixed(2)}%,100%{opacity:0}}` +
      `.tp-${i}{opacity:0;animation:tp-${i} ${cycleTime}s linear infinite}`;

    const textWidth = Math.max(24, phrase.length * charWidth);
    const cursorX = cx + textWidth / 2 + 8;
    groups += `<g class="tp-${i}">
      <text x="${cx}" y="${baseline}" text-anchor="middle" fill="${i % 2 === 0 ? typingColor : typingAlt}" font-family="${FONTS.mono}" font-size="${fontSize}" font-weight="bold">${escapeXmlText(phrase)}</text>
      <rect class="typing-caret" x="${cursorX}" y="${baseline - 15}" width="9" height="19" fill="${typingColor}"/>
    </g>`;
  });
  animationCss +=
    '@keyframes typing-blink{0%,49%{opacity:1}50%,100%{opacity:0}}' +
    '.typing-caret{animation:typing-blink 1s steps(1,end) infinite}' +
    // Respect users who ask their OS to reduce motion: show a stable line.
    '@media (prefers-reduced-motion: reduce){.tp-0{animation:none;opacity:1}.typing-caret{animation:none;opacity:1}}';

  return createSvg(
    width,
    height,
    `${displayName}'s animated intro`,
    `
    ${styleBlock(
      css('typing-text', {
        fill: c.textPrimary,
        'font-family': FONTS.mono,
        'font-size': fontSize,
        'font-weight': 'bold',
      })
    )}
    <style>${animationCss}</style>
    ${groups}
  `,
    activeTheme
  );
}

// ============================================================================
// 7. STAR HISTORY GRAPH
// ============================================================================
function generateStarHistorySvg(username: string, repos: any[], theme: Theme): string {
  const c = C(theme);
  const width = 600;
  const pad = 24;

  // Real data only: the per-repository star counts GitHub actually returns.
  // No estimated curve, no invented dates - if a repo is not listed it has 0 stars.
  const ranked = repos
    .map((r: any) => ({
      name: String(r?.name || 'repository'),
      stars: Number(r?.stargazerCount) || 0,
    }))
    .filter((r) => r.stars > 0)
    .sort((a, b) => b.stars - a.stars);
  const totalStars = repos.reduce((s: number, r: any) => s + (Number(r?.stargazerCount) || 0), 0);
  const repoCount = repos.length;

  if (ranked.length === 0) {
    const height = 132;
    let empty = safeText({
      x: width / 2,
      y: 48,
      content: `${username}'s Stars by Repository`,
      cls: 'badge-title',
      maxWidth: width - pad * 2,
      fontSize: 16,
      fontFamily: 'display',
      textAnchor: 'middle',
      truncate: true,
    });
    empty += safeText({
      x: width / 2,
      y: 74,
      content: 'No starred repositories yet',
      cls: 'muted',
      maxWidth: width - pad * 2,
      fontSize: 11,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    });
    empty += safeText({
      x: width / 2,
      y: 96,
      content: `0 stars across ${repoCount} ${repoCount === 1 ? 'repo' : 'repos'}`,
      cls: 'muted',
      maxWidth: width - pad * 2,
      fontSize: 10,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    });
    return createSvg(width, height, `${username}'s stars by repository`, empty, theme);
  }

  const rows = ranked.slice(0, 6);
  const rowH = 26;
  const top = 64;
  const rowStart = 64;
  const nameWidth = 176;
  const barX = pad + nameWidth + 16;
  // Size the count column from the widest real label so 6-digit counts
  // (e.g. "190,000 ★") are never truncated, instead of guessing a fixed width.
  const countFontSize = 10;
  const countLabels = rows.map((r) => `${r.stars.toLocaleString()} \u2605`);
  // Measured glyphs render wider than estimateTextWidth predicts (the star glyph
  // plus letter spacing), so reserve ~8.7px per character: "256,001 ★" needs 78px.
  const maxCountChars = Math.max(...countLabels.map((l) => l.length));
  const countWidth = Math.min(120, Math.ceil(maxCountChars * 8.7) + 8);
  const barMax = width - pad - countWidth - barX - 12;
  const maxStars = Math.max(1, ...rows.map((r) => r.stars));
  const height = top + rows.length * rowH + 34;

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 26,
    content: `${username}'s Stars by Repository`,
    cls: 'badge-title',
    maxWidth: width - pad * 2,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });
  inner += safeText({
    x: width / 2,
    y: 42,
    content: `Real star counts from GitHub - top ${rows.length} of ${ranked.length} starred ${ranked.length === 1 ? 'repo' : 'repos'}`,
    cls: 'muted',
    maxWidth: width - pad * 2,
    fontSize: 9,
    fontFamily: 'mono',
    textAnchor: 'middle',
    truncate: true,
  });

  inner += rows
    .map((r, i) => {
      const y = rowStart + i * rowH;
      const barW = Math.max(6, Math.round((r.stars / maxStars) * barMax));
      return (
        safeText({
          x: pad,
          y: y + 12,
          content: r.name,
          cls: 'label-lg',
          maxWidth: nameWidth,
          fontSize: 11,
          fontFamily: 'mono',
          truncate: true,
        }) +
        rect(barX, y + 3, barMax, 11, c.bgElevated, 3, c.border) +
        rect(barX, y + 3, barW, 11, c.gold, 3) +
        safeText({
          x: width - pad,
          y: y + 12,
          content: `${r.stars.toLocaleString()} \u2605`,
          cls: 'badge-title',
          maxWidth: countWidth,
          fontSize: countFontSize,
          fontFamily: 'mono',
          textAnchor: 'end',
          truncate: true,
        })
      );
    })
    .join('');

  inner += safeText({
    x: width / 2,
    y: height - 14,
    content: `Total: ${totalStars.toLocaleString()} stars across ${repoCount} ${repoCount === 1 ? 'repo' : 'repos'}`,
    cls: 'muted',
    maxWidth: width - pad * 2,
    fontSize: 10,
    fontFamily: 'mono',
    textAnchor: 'middle',
    truncate: true,
  });

  return createSvg(width, height, `${username}'s stars by repository`, inner, theme);
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
    x: padding,
    y: 30,
    content: name,
    cls: 'badge-title',
    maxWidth: contentWidth,
    fontSize: 16,
    fontFamily: 'display',
    truncate: true,
  });
  inner += safeText({
    x: padding,
    y: 50,
    content: desc,
    cls: 'label-lg',
    maxWidth: contentWidth,
    fontSize: 12,
    fontFamily: 'mono',
    truncate: true,
    maxLines: 2,
  });

  const stats = [
    { icon: '⭐', value: stars.toLocaleString(), label: 'Stars' },
    { icon: '🍴', value: forks.toLocaleString(), label: 'Forks' },
    { icon: '🔤', value: language, label: 'Language', color: languageColor },
  ];
  stats.forEach((stat, i) => {
    const x = padding + i * 140;
    const statWidth = 130;
    inner += translate(
      x,
      75,
      `
      ${safeText({
        x: 0,
        y: 0,
        content: `${stat.icon} ${stat.value}`,
        cls: 'label',
        maxWidth: statWidth,
        fontSize: 11,
        fontFamily: 'mono',
        truncate: true,
      })}
      ${safeText({
        x: 0,
        y: 16,
        content: stat.label,
        cls: 'muted',
        maxWidth: statWidth,
        fontSize: 9,
        fontFamily: 'mono',
        truncate: true,
      })}
    `
    );
  });

  if (topics.length > 0) {
    let topicX = padding;
    topics.forEach((topic: string) => {
      const w = topic.length * 7 + 16;
      inner += translate(
        topicX,
        115,
        `
        ${rect(0, 0, w, 22, c.bgElevated, RADIUS.sm, c.borderLight)}
        ${safeText({
          x: w / 2,
          y: 15,
          content: `#${topic}`,
          cls: 'muted',
          maxWidth: w - 8,
          fontSize: 9,
          fontFamily: 'mono',
          textAnchor: 'middle',
          truncate: true,
        })}
      `
      );
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
  const centerY = 180;
  const radius = 100;
  const strokeWidth = 22;

  const total = languages.reduce((s, l) => s + (l.percentage || 0), 0);
  const sorted = [...languages]
    .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
    .slice(0, 6);

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 30,
    content: 'Language Breakdown',
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
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
      <animate attributeName="stroke-dasharray" values="0 ${2 * Math.PI * radius}; ${(sweepAngle / 360) * 2 * Math.PI * radius} ${2 * Math.PI * radius}" dur="1.5s" begin="${i * 0.2}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    </path>`;

    // Legend: 2 columns x 3 rows, below the donut so it never collides with
    // the centre label.
    const col = i % 2;
    const row = Math.floor(i / 2);
    const legendX = col === 0 ? 26 : 208;
    const legendY = 312 + row * 22;
    const legendText = `${lang.name} ${lang.percentage.toFixed(1)}%`;
    inner += translate(
      legendX,
      legendY,
      `
      ${rect(0, 0, 14, 14, color, RADIUS.sm)}
      ${safeText({
        x: 22,
        y: 11,
        content: legendText,
        cls: 'label-lg',
        maxWidth: 150,
        fontSize: 11,
        fontFamily: 'mono',
        truncate: true,
      })}
    `
    );

    currentAngle = endAngle;
  });

  inner += safeText({
    x: centerX,
    y: centerY - 4,
    content: `${total.toFixed(0)}%`,
    cls: 'value',
    maxWidth: radius * 1.5,
    fontSize: 24,
    fontFamily: 'mono',
    textAnchor: 'middle',
    truncate: true,
  });

  inner += safeText({
    x: centerX,
    y: centerY + 20,
    content: 'Languages',
    cls: 'muted',
    maxWidth: radius * 1.5,
    fontSize: 11,
    fontFamily: 'mono',
    textAnchor: 'middle',
    truncate: true,
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
    x: width / 2,
    y: 30,
    content: 'Tech Stack',
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  // Fixed 5x3 grid: the old radial layout put bubbles at y=-30..230, outside
  // the 200px canvas, and stacked their labels on top of each other.
  const cols = 5;
  const bubbleW = 104;
  const bubbleH = 34;
  const colGap = 11;
  const rowGap = 18;
  const gridX = 20;
  const gridY = 52;

  displaySkills.forEach((skill, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gridX + col * (bubbleW + colGap);
    const y = gridY + row * (bubbleH + rowGap);
    const delay = i * 0.1;

    inner += `
      <g opacity="1">
        <animate attributeName="opacity" values="0;1" dur="0.6s" begin="${delay}s" fill="freeze"/>
        ${rect(x, y, bubbleW, bubbleH, c.bgElevated, RADIUS.lg, c.borderLight, 1)}
        ${safeText({
          x: x + bubbleW / 2,
          y: y + 22,
          content: skill,
          cls: 'label-lg',
          maxWidth: bubbleW - 8,
          fontSize: 11,
          fontFamily: 'mono',
          textAnchor: 'middle',
          truncate: true,
        })}
      </g>
    `;
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
    x: width / 2,
    y: 20,
    content: 'ASCII Banner',
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  lines.forEach((line, i) => {
    const x = Math.max(20, (width - line.length * charWidth) / 2);
    inner += safeText({
      x,
      y: 50 + i * lineHeight,
      content: line,
      cls: 'ascii',
      maxWidth: maxContentWidth,
      fontSize: 12,
      fontFamily: 'mono',
      truncate: true,
    });
  });

  return createSvg(
    width,
    height,
    'ASCII Banner',
    inner +
      styleBlock(
        css('ascii', {
          fill: c.emerald,
          'font-family': FONTS.mono,
          'font-size': 12,
          'letter-spacing': '1px',
        })
      ),
    theme
  );
}

// ============================================================================
// 12. CONTRIBUTION STREAK CALENDAR (Compact)
// ============================================================================
function generateStreakCalendarSvg(
  displayName: string,
  calendar: any,
  streak: number,
  theme: Theme
): string {
  const c = C(theme);
  const width = 280;
  const height = 244;
  const weeks = calendar?.weeks || [];
  const cellSize = 18;
  const cellGap = 4;
  const startX = 62;
  const startY = 58;

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 26,
    content: `${displayName} · ${streak} days`,
    cls: 'badge-title',
    maxWidth: width - 24,
    fontSize: 13,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  weeks.slice(-7).forEach((week: any, weekIndex: number) => {
    week.contributionDays.forEach((day: any, dayIndex: number) => {
      const count = day.contributionCount;
      const color =
        count === 0 ? c.bgElevated : count <= 2 ? c.border : count <= 4 ? c.emeraldDim : c.emerald;
      const x = startX + weekIndex * (cellSize + cellGap);
      const y = startY + dayIndex * (cellSize + cellGap);
      inner += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}"/>`;
    });
  });

  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label, i) => {
    inner += safeText({
      x: startX - 8,
      y: startY + i * (cellSize + cellGap) + cellSize / 2 + 3,
      content: label,
      cls: 'muted',
      maxWidth: startX - 12,
      fontSize: 9,
      fontFamily: 'mono',
      textAnchor: 'end',
      truncate: true,
    });
  });

  inner += safeText({
    x: width / 2,
    y: height - 14,
    content: 'Last 7 weeks | Active days',
    cls: 'muted',
    maxWidth: width - 40,
    fontSize: 9,
    fontFamily: 'mono',
    textAnchor: 'middle',
    truncate: true,
  });

  return createSvg(width, height, `${displayName}'s Streak Calendar`, inner, theme);
}

// ============================================================================
// 13. SKILL RADAR CHART (Animated Spider/Radar Chart)
// ============================================================================
function generateSkillRadarSvg(
  skills: Array<{ name: string; level: number; category?: string }>,
  theme: Theme
): string {
  const c = C(theme);
  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = 110;
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
    x: width / 2,
    y: 30,
    content: 'Skill Radar',
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  // Grid lines (polygons)
  for (let l = 1; l <= levels; l++) {
    const radius = (l / levels) * maxRadius;
    const points = displaySkills
      .map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');
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
  const areaPoints = displaySkills
    .map((skill, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const radius = (skill.level / 100) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(' ');

  const areaColor = c.emerald;
  inner += `<polygon points="${areaPoints}" fill="${areaColor}" fill-opacity="0.15" stroke="${areaColor}" stroke-width="2" stroke-opacity="0.8">
    <animate attributeName="points" values="
      ${displaySkills
        .map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return `${centerX},${centerY}`;
        })
        .join(' ')};
      ${areaPoints}
    " dur="1.5s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
  </polygon>`;

  // Skill labels and dots
  displaySkills.forEach((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const radius = (skill.level / 100) * maxRadius;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const labelRadius = maxRadius + 6;
    const lx = centerX + labelRadius * Math.cos(angle);
    const ly = centerY + labelRadius * Math.sin(angle);
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);
    let textAnchor: 'start' | 'middle' | 'end' = 'middle';
    let labelX = lx;
    let labelY = ly;
    if (sinA < -0.6) {
      // Top spoke: keep clear of the badge title
      labelX = centerX;
      labelY = ly + 2;
    } else if (sinA > 0.6) {
      labelX = centerX;
      labelY = ly + 12;
    } else if (cosA > 0) {
      textAnchor = 'start';
      labelX = lx + 8;
    } else {
      textAnchor = 'end';
      labelX = lx - 8;
    }

    // Dot (animated)
    inner += `<circle cx="${x}" cy="${y}" r="5" fill="${areaColor}" stroke="${c.bg}" stroke-width="2">
      <animate attributeName="r" values="0;6;5" dur="0.8s" begin="${i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${i * 0.1}s" fill="freeze"/>
    </circle>`;

    // Label - safe with truncation. The "%" is dropped: it is what pushed long
    // names like "Architecture 80%" past the 400px canvas edge.
    const maxLabelWidth = 84;
    inner += safeText({
      x: labelX,
      y: labelY,
      content: `${skill.name} ${skill.level}`,
      cls: 'label',
      maxWidth: maxLabelWidth,
      fontSize: 9,
      fontFamily: 'mono',
      textAnchor,
      truncate: true,
    });
  });

  // Level markers
  for (let l = 1; l <= levels; l++) {
    const radius = (l / levels) * maxRadius;
    const y = centerY - radius;
    // Skip the outer marker: it sits right under the top skill label.
    if (l < levels) {
      inner += safeText({
        x: centerX - 5,
        y: y + 4,
        content: `${Math.round((l / levels) * 100)}%`,
        cls: 'muted',
        maxWidth: 40,
        fontSize: 8,
        fontFamily: 'mono',
        textAnchor: 'end',
        truncate: true,
      });
    }
    inner += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${c.borderLight}" stroke-width="0.5" opacity="0.3"/>`;
  }

  return createSvg(width, height, 'Skill Radar Chart', inner, theme);
}

// ============================================================================
// 14. LANGUAGE EVOLUTION RACE (Animated Bar Chart Race)
// ============================================================================
function generateLanguageRaceSvg(
  username: string,
  languages: Array<{ name: string; percentage: number; color: string }>,
  theme: Theme
): string {
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
  const maxPct = Math.max(...sortedLangs.map((l) => l.percentage));

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 30,
    content: `${username}'s Language Evolution`,
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  inner += translate(
    margin.left,
    margin.top,
    `
    ${sortedLangs
      .map((lang, i) => {
        const barH = 24;
        const y = i * (barH + 8);
        // Reserve room at the right edge for the percentage label so it never
        // spills outside the 600px canvas.
        const maxBarWidth = chartW - 56;
        const targetWidth = (lang.percentage / maxPct) * maxBarWidth;

        return `
        <g transform="translate(0, ${y})">
          <!-- Label -->
          ${safeText({
            x: -10,
            y: barH / 2 + 5,
            content: lang.name,
            cls: 'label',
            maxWidth: margin.left - 20,
            fontSize: 11,
            fontFamily: 'mono',
            textAnchor: 'end',
            truncate: true,
          })}
          
          <!-- Background track -->
          <rect x="0" y="0" width="${chartW}" height="${barH}" rx="${barH / 2}" fill="${c.bgElevated}" stroke="${c.borderLight}" stroke-width="0.5"/>
          
          <!-- Animated bar -->
          <rect x="0" y="0" width="0" height="${barH}" rx="${barH / 2}" fill="${lang.color}">
            <animate attributeName="width" values="0;${targetWidth}" dur="1.2s" begin="${i * 0.15}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
          </rect>
          
          <!-- Percentage label (animated count-up) -->
          ${safeText({
            x: targetWidth + 8,
            y: barH / 2 + 5,
            content: `${lang.percentage.toFixed(1)}%`,
            cls: 'value-sm',
            maxWidth: 60,
            fontSize: 11,
            fontFamily: 'mono',
            truncate: true,
          })}
          
          <!-- Shimmer effect -->
          <rect x="0" y="0" width="${targetWidth}" height="${barH}" rx="${barH / 2}" fill="url(#shimmer-${i})" opacity="0.3">
            <animate attributeName="x" values="-${targetWidth};${chartW}" dur="2s" repeatCount="indefinite"/>
          </rect>
        </g>
      `;
      })
      .join('')}
    
    <defs>
      ${sortedLangs
        .map(
          (_, i) => `
        <linearGradient id="shimmer-${i}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${c.textPrimary}" stop-opacity="0"/>
          <stop offset="50%" stop-color="${c.textPrimary}" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="${c.textPrimary}" stop-opacity="0"/>
        </linearGradient>
      `
        )
        .join('')}
    </defs>
  `
  );

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

  // Deterministic two-ring orbit layout. Dividing by `repos.length` (which is
  // the full repo count, often 30+) collapsed every node into one tiny arc and
  // made the labels pile up on top of each other.
  const orbitRepos = repos.slice(0, 12);
  const ringSplit = Math.min(orbitRepos.length, 4);
  const displayRepos = orbitRepos.map((repo, i) => {
    const stars = repo.stargazerCount || 0;
    const isInner = i < ringSplit;
    const idx = isInner ? i : i - ringSplit;
    const perRing = isInner ? ringSplit : Math.max(orbitRepos.length - ringSplit, 1);
    const angle = (idx / perRing) * Math.PI * 2 - Math.PI / 2 + (isInner ? 0 : Math.PI / 8);
    const radius = isInner ? 88 : 152;
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
    x: width / 2,
    y: 30,
    content: `${username}'s Repo Constellation`,
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
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
    const size = Math.max(13, Math.min(30, 13 + Math.log10(repo.stars + 1) * 7));
    const maxNameWidth = 104;

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
      ${safeText({
        x: 0,
        y: 4,
        content: repo.stars.toLocaleString(),
        cls: 'value-sm',
        maxWidth: size * 2 - 4,
        fontSize: 9,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
      
      <!-- Repo name -->
      ${safeText({
        x: 0,
        y: -size - 6,
        content: repo.name,
        cls: 'label',
        maxWidth: maxNameWidth,
        fontSize: 9,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
    </g>`;
  });

  // Center node (user)
  inner += `<g transform="translate(${centerX}, ${centerY})">
    <circle r="25" fill="${c.emerald}" stroke="${c.bg}" stroke-width="3">
      <animate attributeName="r" values="22;28;22" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    </circle>
    ${safeText({
      x: 0,
      y: 2,
      content: String(displayRepos.length),
      cls: 'value',
      maxWidth: 44,
      fontSize: 16,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    })}
    ${safeText({
      x: 0,
      y: 18,
      content: 'Repos',
      cls: 'muted',
      maxWidth: 44,
      fontSize: 9,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    })}
  </g>`;

  // Caption explaining what the numbers inside the nodes mean
  inner += safeText({
    x: width / 2,
    y: height - 13,
    content: 'Node size and number = stars',
    cls: 'muted',
    maxWidth: width - 40,
    fontSize: 9,
    fontFamily: 'mono',
    textAnchor: 'middle',
    truncate: true,
  });

  return createSvg(width, height, `${username}'s Repo Constellation`, inner, theme);
}

// ============================================================================
// 16. CODE PULSE / HEARTBEAT (Real-time Activity Pulse) - WITH VIEWER AWARENESS
// ============================================================================
function generateCodePulseSvg(
  username: string,
  stats: any,
  theme: Theme,
  viewer?: ViewerContext
): string {
  const c = C(theme);
  const width = 400;
  const height = 200;
  const centerX = width / 2;
  const centerY = height / 2 + 18;

  const commits = stats.totalContributions || 1234;
  const streak = stats.streak || 42;
  const repos = stats.publicRepos || 56;

  // Viewer-aware greeting
  const viewerHour = viewer ? getViewerHour(viewer.timezone) : -1;
  const greetingText = 'Code Pulse';
  const viewerGreeting = viewer && viewerHour >= 0 ? getTimeGreeting(viewerHour).text : '';

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 30,
    content: `${username}'s ${greetingText}`,
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });
  if (viewer && viewerHour >= 0) {
    const location = viewer.city || viewer.region || viewer.country || 'Unknown';
    const tz = viewer.timezone || 'UTC';
    const prefix = viewerGreeting ? `${viewerGreeting} | ` : '';
    inner += safeText({
      x: width / 2,
      y: 48,
      content: `${prefix}${location} | ${tz} | ${viewerHour.toString().padStart(2, '0')}:00`,
      cls: 'muted',
      maxWidth: width - 40,
      fontSize: 10,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    });
  }

  // Pulse rings
  for (let i = 0; i < 4; i++) {
    const delay = i * 0.4;
    inner += `<circle cx="${centerX}" cy="${centerY}" r="24" fill="none" stroke="${c.emerald}" stroke-width="2" stroke-opacity="0.6">
      <animate attributeName="r" values="24;60" dur="2s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
      <animate attributeName="stroke-opacity" values="0.6;0" dur="2s" begin="${delay}s" repeatCount="indefinite" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
    </circle>`;
  }

  // Core pulse
  inner += `<circle cx="${centerX}" cy="${centerY}" r="22" fill="${c.emerald}" fill-opacity="0.2" stroke="${c.emerald}" stroke-width="3">
    <animate attributeName="r" values="18;24;18" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    <animate attributeName="fill-opacity" values="0.1;0.3;0.1" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
  </circle>`;

  // Stats in two columns flanking the pulse (kept inside the 400x200 canvas)
  const statData = [
    { value: commits.toLocaleString(), label: 'Commits', x: 132, y: 89 },
    { value: streak, label: 'Streak', x: 268, y: 89 },
    { value: repos, label: 'Repos', x: 132, y: 147 },
    { value: 'Live', label: 'Status', x: 268, y: 147 },
  ];

  statData.forEach((stat, i) => {
    const x = stat.x;
    const y = stat.y;
    const delay = i * 0.2;
    const statRadius = 28;
    const maxStatWidth = statRadius * 2 - 6;

    inner += `<g transform="translate(${x}, ${y})" opacity="1">
      <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${0.8 + delay}s" fill="freeze"/>
      <animate attributeName="transform" values="translate(${centerX}, ${centerY});translate(${x}, ${y})" dur="0.6s" begin="${0.8 + delay}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      
      <circle r="${statRadius}" fill="${c.bgElevated}" stroke="${c.border}" stroke-width="1" rx="8"/>
      ${safeText({
        x: 0,
        y: -8,
        content: String(stat.value),
        cls: 'value',
        maxWidth: maxStatWidth,
        fontSize: 14,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
      ${safeText({
        x: 0,
        y: 10,
        content: stat.label,
        cls: 'muted',
        maxWidth: maxStatWidth,
        fontSize: 9,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
    </g>`;
  });

  return createSvg(width, height, `${username}'s Code Pulse`, inner, theme);
}

// ============================================================================
// 17. 3D CONTRIBUTION MOUNTAIN (Isometric View)
// ============================================================================
function generateContributionMountainSvg(displayName: string, calendar: any, theme: Theme): string {
  const c = C(theme);
  const width = 1000;
  const height = 330;
  const weeks = calendar?.weeks || [];
  const cols = Math.min(weeks.length, 52); // Full year
  const rows = 7;
  const cellW = 15;
  const cellH = 8; // isometric depth
  const maxHeight3D = 62;
  const startY = 258;
  const startX = Math.max(70, Math.round((width - (cols * cellW + rows * (cellW / 2))) / 2));

  const maxCount = Math.max(
    1,
    ...weeks
      .slice(-cols)
      .flatMap((w: any) => (w.contributionDays || []).map((d: any) => d.contributionCount || 0))
  );

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 30,
    content: `${displayName}'s Contribution Mountain`,
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  // Draw from back to front for proper layering
  for (let r = rows - 1; r >= 0; r--) {
    for (let colIdx = 0; colIdx < cols; colIdx++) {
      const week = weeks[weeks.length - cols + colIdx];
      if (!week) continue;
      const day = week.contributionDays?.[r];
      if (!day) continue;

      const count = day.contributionCount || 0;
      if (count === 0) continue;

      // Level relative to the busiest day so the mountain shows a real gradient
      // instead of turning into a solid gold wall.
      const ratio = count / maxCount;
      const level = ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
      // Continuous height keeps the terrain smooth instead of a field of spikes.
      const height3D = 8 + ratio * (maxHeight3D - 8);
      // Peaks use the theme's secondary accent (GTA VI's neon purple) so the
      // mountain matches the banner instead of staying pure orange.
      const peak = theme.purple || c.gold;
      const color =
        level === 1 ? c.border : level === 2 ? c.emeraldDim : level === 3 ? c.emerald : peak;
      const colorLight =
        level === 1 ? c.borderLight : level === 2 ? c.emerald : level === 3 ? c.emeraldLight : peak;
      const colorDark =
        level === 1
          ? c.bgElevated
          : level === 2
            ? c.border
            : level === 3
              ? c.emeraldDim
              : theme.purpleDim || c.goldDim;

      // Isometric coordinates: (isoX, baseY) is the centre of the cell's base
      // diamond, so the column rises *up* from the ground plane.
      const isoX = startX + colIdx * cellW + r * (cellW / 2);
      const baseY = startY - r * (cellH / 2);
      const topY = baseY - height3D;

      // Delay based on position for wave animation
      const delay = colIdx * 0.02 + r * 0.03;

      inner += `<g transform="translate(${isoX}, ${topY})">
        <!-- Top face (diamond) -->
        <polygon points="0,${-cellH / 2} ${cellW / 2},0 0,${cellH / 2} ${-cellW / 2},0"
          fill="${colorLight}">
          <animate attributeName="opacity" values="0;1" dur="0.4s" begin="${delay}s" fill="freeze"/>
          <animate attributeName="transform" values="translate(0,20);translate(0,0)" dur="0.5s" begin="${delay}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
        </polygon>

        <!-- Right face -->
        <polygon points="0,${cellH / 2} ${cellW / 2},0 ${cellW / 2},${height3D} 0,${cellH / 2 + height3D}"
          fill="${color}">
          <animate attributeName="opacity" values="0;1" dur="0.4s" begin="${delay}s" fill="freeze"/>
        </polygon>

        <!-- Left face -->
        <polygon points="0,${cellH / 2} ${-cellW / 2},0 ${-cellW / 2},${height3D} 0,${cellH / 2 + height3D}"
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

  // Day labels - only the two ends: the 7 isometric rows are only 3.5px apart
  // vertically, so labelling every row made the text overlap into a blob.
  // GitHub weeks start on Sunday, so row 0 is Sunday and row 6 is Saturday.
  ['Sun', 'Sat'].forEach((label, n) => {
    const i = n === 0 ? 0 : rows - 1;
    const x = startX + i * (cellW / 2) - 20;
    const y = startY - i * (cellH / 2) + 10;
    inner += safeText({
      x,
      y,
      content: label,
      cls: 'muted',
      maxWidth: 40,
      fontSize: 8,
      fontFamily: 'mono',
      textAnchor: 'end',
      truncate: true,
    });
  });

  // Legend
  const legendData = [
    { color: c.border, label: 'Low' },
    { color: c.emeraldDim, label: 'Medium' },
    { color: c.emerald, label: 'High' },
    { color: theme.purple || c.gold, label: 'Peak' },
  ];
  legendData.forEach((item, i) => {
    const x = 30;
    const y = 60 + i * 20;
    inner += `<rect x="${x}" y="${y}" width="14" height="10" rx="2" fill="${item.color}"/>`;
    inner += safeText({
      x: x + 20,
      y: y + 8,
      content: item.label,
      cls: 'muted',
      maxWidth: 100,
      fontSize: 9,
      fontFamily: 'mono',
      truncate: true,
    });
  });

  return createSvg(width, height, `${displayName}'s Contribution Mountain`, inner, theme);
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
    'TypeScript',
    'React',
    'Next.js',
    'Node.js',
    'Rust',
    'Go',
    'Python',
    'PostgreSQL',
    'Docker',
    'GraphQL',
    'TailwindCSS',
    'Kubernetes',
    'AWS',
    'Redis',
    'WebGL',
  ];

  const displaySkills = skills.length > 0 ? skills : defaultSkills;
  const skillCount = Math.min(displaySkills.length, 15);

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 30,
    content: 'Tech Stack Galaxy',
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  // Orbit rings
  const ringRadii = [90, 150, 195];
  ringRadii.forEach((radius, idx) => {
    inner += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="none" stroke="${c.borderLight}" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.3">
      <animate attributeName="stroke-dashoffset" values="0;${radius * 2 * Math.PI}" dur="${20 + (idx + 1) * 5}s" repeatCount="indefinite" calcMode="linear"/>
    </circle>`;
  });

  // Skills as planets. Positions are fixed (no rotate animation) so the labels
  // cannot swing outside the 500x500 frame, and every label sits below its
  // planet with a 86px budget.
  displaySkills.slice(0, skillCount).forEach((skill, i) => {
    const ringIdx = Math.min(Math.floor(i / 5), ringRadii.length - 1);
    const radius = ringRadii[ringIdx];
    const angle = ((i % 5) / 5) * Math.PI * 2 - Math.PI / 2 + ringIdx * (Math.PI / 5);
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const size = 12 + (i % 3) * 4;
    const colors = [c.emerald, c.gold, '#8b5cf6', c.red, '#06b6d4'];
    const color = colors[i % colors.length];

    inner += `<g transform="translate(${x}, ${y})">
      <!-- Planet -->
      <circle r="${size}" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="2">
        <animate attributeName="r" values="${size};${size * 1.15};${size}" dur="${3 + ringIdx}s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      </circle>

      <!-- Core -->
      <circle r="${size * 0.45}" fill="${color}"/>

      <!-- Label -->
      ${safeText({
        x: 0,
        y: size + 13,
        content: skill,
        cls: 'label',
        maxWidth: 86,
        fontSize: 9,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      })}
    </g>`;
  });

  // Center hub
  inner += `<g transform="translate(${centerX}, ${centerY})">
    <circle r="20" fill="${c.emerald}" fill-opacity="0.15" stroke="${c.emerald}" stroke-width="2">
      <animate attributeName="r" values="18;25;18" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
    </circle>
    ${safeText({
      x: 0,
      y: 5,
      content: String(skillCount),
      cls: 'value',
      maxWidth: 36,
      fontSize: 13,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    })}
    ${safeText({
      x: 0,
      y: 36,
      content: 'Technologies',
      cls: 'muted',
      maxWidth: 100,
      fontSize: 9,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    })}
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
  const margin = { top: 58, right: 150, bottom: 40, left: 150 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  // Categories: Time → Language → Repo
  const categories = {
    time: ['Morning', 'Afternoon', 'Evening', 'Night'],
    language: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go'],
    repo: repos.slice(0, 6).map((r) => (r.name.length > 12 ? r.name.slice(0, 12) + '...' : r.name)),
  };

  // Simulated flow data
  const flowData = [
    { from: 'time', to: 'language', value: 100 },
    { from: 'language', to: 'repo', value: 100 },
  ];

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 28,
    content: `${username}'s Contribution Flow`,
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  inner += translate(
    margin.left,
    margin.top,
    `
    <!-- Time nodes (left) -->
    ${categories.time
      .map((cat, i) => {
        const y = (i / (categories.time.length - 1)) * chartH;
        return `
        <g transform="translate(0, ${y})" opacity="1">
          <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${i * 0.1}s" fill="freeze"/>
          <rect x="-140" y="-20" width="130" height="40" rx="6" fill="${c.bgElevated}" stroke="${c.emerald}" stroke-width="1">
            <animate attributeName="x" values="-200;-140" dur="0.6s" begin="${i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
          </rect>
          ${safeText({
            x: -75,
            y: 7,
            content: cat,
            cls: 'label',
            maxWidth: 120,
            fontSize: 10,
            fontFamily: 'mono',
            textAnchor: 'middle',
            truncate: true,
          })}
        </g>
      `;
      })
      .join('')}
    
    <!-- Language nodes (center) -->
    ${categories.language
      .map((cat, i) => {
        const y = (i / (categories.language.length - 1)) * chartH;
        return `
        <g transform="translate(${chartW / 2}, ${y})" opacity="1">
          <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${0.5 + i * 0.1}s" fill="freeze"/>
          <rect x="-70" y="-20" width="140" height="40" rx="6" fill="${c.bgElevated}" stroke="${c.gold}" stroke-width="1">
            <animate attributeName="x" values="${chartW + 100};-70" dur="0.6s" begin="${0.5 + i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
          </rect>
          ${safeText({
            x: 0,
            y: 7,
            content: cat,
            cls: 'label',
            maxWidth: 130,
            fontSize: 10,
            fontFamily: 'mono',
            textAnchor: 'middle',
            truncate: true,
          })}
        </g>
      `;
      })
      .join('')}
    
    <!-- Repo nodes (right) -->
    ${categories.repo
      .map((cat, i) => {
        const y = (i / (categories.repo.length - 1)) * chartH;
        return `
        <g transform="translate(${chartW}, ${y})" opacity="1">
          <animate attributeName="opacity" values="0;1" dur="0.5s" begin="${1 + i * 0.1}s" fill="freeze"/>
          <rect x="0" y="-20" width="130" height="40" rx="6" fill="${c.bgElevated}" stroke="${c.red}" stroke-width="1">
            <animate attributeName="x" values="${chartW + 200};0" dur="0.6s" begin="${1 + i * 0.1}s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
          </rect>
          ${safeText({
            x: 65,
            y: 7,
            content: cat,
            cls: 'label',
            maxWidth: 120,
            fontSize: 9,
            fontFamily: 'mono',
            textAnchor: 'middle',
            truncate: true,
          })}
        </g>
      `;
      })
      .join('')}
    
    <!-- Flow curves (animated) -->
    <defs>
      <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${c.emerald}" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="${c.gold}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${c.red}" stop-opacity="0.6"/>
      </linearGradient>
    </defs>
    
    ${[...Array(8)]
      .map(
        (_, i) => `
      <path d="M 0,${(i / 7) * chartH} Q ${chartW / 4},${(i / 7) * chartH} ${chartW / 2},${(i / 7) * chartH} Q ${(chartW * 3) / 4},${(i / 7) * chartH} ${chartW},${(i / 7) * chartH}"
        fill="none" stroke="url(#flowGrad)" stroke-width="3" stroke-opacity="0.4" stroke-linecap="round">
        <animate attributeName="stroke-dashoffset" values="${chartW};-${chartW}" dur="4s" begin="${i * 0.3}s" repeatCount="indefinite" calcMode="linear"/>
        <animate attributeName="stroke-width" values="1;4;1" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1"/>
      </path>
    `
      )
      .join('')}
  `
  );

  return createSvg(width, height, `${username}'s Contribution Flow`, inner, theme);
}

// ============================================================================
// 20. CODE TIME HEATMAP (When You Code - Hour × Day)
// ============================================================================
function generateCodeTimeHeatmapSvg(username: string, theme: Theme): string {
  const c = C(theme);
  const width = 500;
  const height = 280;
  const cellSize = 14;
  const cellGap = 3;
  const startX = 62;
  const startY = 72;
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
    const noise = ((Math.sin(day * 7 + hour * 3) + 1) / 2) * 0.2;
    return Math.min(1, intensity + noise);
  };

  let inner = '';
  inner += safeText({
    x: width / 2,
    y: 28,
    content: `${username}'s Code Time Heatmap`,
    cls: 'badge-title',
    maxWidth: width - 40,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
    truncate: true,
  });

  // Hour labels (top)
  hours.forEach((hour, i) => {
    if (hour % 3 === 0) {
      const x = startX + i * (cellSize + cellGap) + cellSize / 2;
      inner += safeText({
        x,
        y: startY - 8,
        content: `${hour}:00`,
        cls: 'muted',
        maxWidth: cellSize * 3,
        fontSize: 8,
        fontFamily: 'mono',
        textAnchor: 'middle',
        truncate: true,
      });
    }
  });

  // Heatmap cells
  days.forEach((day, dayIdx) => {
    // Day label
    inner += safeText({
      x: startX - 12,
      y: startY + dayIdx * (cellSize + cellGap) + cellSize / 2 + 4,
      content: day,
      cls: 'label',
      maxWidth: startX - 16,
      fontSize: 10,
      fontFamily: 'mono',
      textAnchor: 'end',
      truncate: true,
    });

    hours.forEach((hour, hourIdx) => {
      const intensity = getIntensity(dayIdx, hour);
      if (intensity < 0.1) return;

      const level = intensity < 0.25 ? 1 : intensity < 0.5 ? 2 : intensity < 0.75 ? 3 : 4;
      const colors = [c.border, c.emeraldDim, c.emerald, c.gold];
      const color = colors[level - 1];
      const x = startX + hourIdx * (cellSize + cellGap);
      const y = startY + dayIdx * (cellSize + cellGap);
      const delay = (dayIdx * 24 + hourIdx) * 0.005;

      inner += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="3" fill="${color}" opacity="1">
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
    { color: c.border, label: 'Low' },
    { color: c.emeraldDim, label: 'Medium' },
    { color: c.emerald, label: 'High' },
    { color: c.gold, label: 'Peak' },
  ];
  legendColors.forEach((item, i) => {
    const x = 62 + i * 105;
    const y = height - 42;
    inner += `<rect x="${x}" y="${y}" width="16" height="16" rx="3" fill="${item.color}"/>`;
    inner += safeText({
      x: x + 22,
      y: y + 12,
      content: item.label,
      cls: 'muted',
      maxWidth: 80,
      fontSize: 10,
      fontFamily: 'mono',
      truncate: true,
    });
  });

  // Stats
  inner += safeText({
    x: width / 2,
    y: height - 6,
    content: 'Green = coding intensity | Gold pulse = peak hours',
    cls: 'muted',
    maxWidth: width - 40,
    fontSize: 9,
    fontFamily: 'mono',
    textAnchor: 'middle',
    truncate: true,
  });

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
    x: width / 2,
    y: 35,
    content: `${username}'s GitHub Pulse`,
    cls: 'badge-title',
    maxWidth: width - 80,
    fontSize: 16,
    fontFamily: 'display',
    textAnchor: 'middle',
  });

  // Header subtitle - safe
  inner += safeText({
    x: width - 20,
    y: 35,
    content: `${new Date().getFullYear()} | ${stats.totalContributions.toLocaleString()} contributions`,
    cls: 'muted',
    maxWidth: width / 2 - 30,
    fontSize: 11,
    fontFamily: 'mono',
    textAnchor: 'end',
    truncate: true,
  });

  // Divider
  inner += `<line x1="20" y1="50" x2="${width - 20}" y2="50" stroke="${c.border}" stroke-width="1" opacity="0.5"/>`;

  // Helper to draw a panel background with safe title
  const panel = (
    x: number,
    y: number,
    w: number,
    h: number,
    title: string,
    icon: string,
    content: string
  ) => `
    <g transform="translate(${x}, ${y})">
      ${rect(0, 0, w, h, c.bgElevated, RADIUS.md, c.border)}
      ${safeText({
        x: panelPadding,
        y: 28,
        content: `${icon} ${title}`,
        cls: 'badge-title',
        maxWidth: w - panelPadding * 2,
        fontSize: 14,
        fontFamily: 'display',
        truncate: true,
      })}
      <line x1="${panelPadding}" y1="34" x2="${w - panelPadding}" y2="34" stroke="${c.border}" stroke-width="1" opacity="0.3"/>
      <g transform="translate(0, 40)">${content}</g>
    </g>
  `;

  // Helper for safe stat rows (2-column layout)
  const statRow = (
    col: number,
    row: number,
    value: string,
    label: string,
    valueColor?: string,
    valueFontSize = 24
  ) => {
    const x = panelPadding + col * (halfPanelW + 10);
    const y = row * 48;
    const colorAttr = valueColor ? ` fill="${valueColor}"` : '';
    return `
      ${safeText({
        x,
        y: y + 16,
        content: value,
        cls: 'value',
        maxWidth: halfPanelW,
        fontSize: valueFontSize,
        fontFamily: 'mono',
        truncate: true,
      })}
      ${safeText({
        x,
        y: y + 34,
        content: label,
        cls: 'muted',
        maxWidth: halfPanelW,
        fontSize: 10,
        fontFamily: 'mono',
        truncate: true,
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
  inner += panel(startX, startY, cardW, cardH, 'Stats', '', statsContent);

  // ===== PANEL 2: TROPHIES (top-right) =====
  const trophiesContent = `
    ${statRow(0, 0, userData.public_repos.toLocaleString(), 'Repositories', c.emerald, 22)}
    ${statRow(1, 0, totalStars.toLocaleString(), 'Stars Earned', c.gold, 22)}
    ${statRow(0, 1, userData.followers.toLocaleString(), 'Followers', c.gold, 22)}
    ${statRow(1, 1, `${stats.streak} days`, 'Current Streak', c.emerald, 22)}
    ${statRow(0, 2, stats.totalContributions.toLocaleString(), 'Contributions', c.red, 22)}
    ${statRow(1, 2, languagesData.length.toLocaleString(), 'Languages', c.red, 22)}
  `;
  inner += panel(startX + cardW + gap, startY, cardW, cardH, 'Trophies', '', trophiesContent);

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
  const activeDays: { col: number; row: number }[] = [];

  recentWeeks.forEach((week: any, col: number) => {
    (week.contributionDays || []).slice(0, 7).forEach((day: any, row: number) => {
      const count = day.contributionCount || 0;
      const color =
        count === 0
          ? c.bgElevated
          : count <= 2
            ? c.border
            : count <= 4
              ? c.emeraldDim
              : count <= 8
                ? c.emerald
                : c.gold;
      const x = snakeStartX + col * (snakeCellSize + snakeGap);
      const y = snakeStartY + row * (snakeCellSize + snakeGap);
      snakeGrid += `<rect x="${x}" y="${y}" width="${snakeCellSize}" height="${snakeCellSize}" rx="1.5" fill="${color}"/>`;
      if (count > 0) activeDays.push({ col, row });
    });
  });

  let snakeAnim = '';
  if (activeDays.length > 0) {
    const route: { col: number; row: number }[] = [];
    for (let r = 0; r < 7; r++) {
      const colsInRow = activeDays.filter((d) => d.row === r).sort((a, b) => a.col - b.col);
      if (r % 2 === 1) colsInRow.reverse();
      route.push(...colsInRow);
    }

    if (route.length > 0) {
      const cellCenterX = (col: number) =>
        snakeStartX + col * (snakeCellSize + snakeGap) + snakeCellSize / 2;
      const cellCenterY = (row: number) =>
        snakeStartY + row * (snakeCellSize + snakeGap) + snakeCellSize / 2;

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
        <animate attributeName="r" values="3;6;3" dur="${dur / 3}s" repeatCount="indefinite"/>
      </circle>`;
    }
  }

  // Centre the mini grid in the panel instead of leaving it pinned top-left.
  const snakeGridW = maxCols * (snakeCellSize + snakeGap) - snakeGap;
  const snakeGridH = 7 * (snakeCellSize + snakeGap) - snakeGap;
  const snakeOffsetX = Math.max(0, (panelContentWidth - snakeGridW) / 2) - snakeStartX;
  const snakeOffsetY = Math.max(0, (140 - snakeGridH) / 2) - snakeStartY;

  const snakeContent = `
    ${translate(snakeOffsetX, snakeOffsetY, snakeGrid + snakeAnim)}
    ${safeText({
      x: cardW / 2,
      y: cardH - 48,
      content: `${activeDays.length} active days`,
      cls: 'muted',
      maxWidth: panelContentWidth,
      fontSize: 9,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    })}
  `;
  inner += panel(startX, startY + cardH + gap, cardW, cardH, 'Snake', '', snakeContent);

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
      const color =
        count === 0
          ? c.bgElevated
          : count <= 2
            ? c.border
            : count <= 4
              ? c.emeraldDim
              : count <= 8
                ? c.emerald
                : c.gold;
      const x = hmStartX + col * (hmCellSize + hmGap);
      const y = hmStartY + row * (hmCellSize + hmGap);
      hmGrid += `<rect x="${x}" y="${y}" width="${hmCellSize}" height="${hmCellSize}" rx="1" fill="${color}"/>`;
    });
  });

  const totalContributions =
    calendar?.totalContributions ||
    weeks
      .flatMap((w: any) => w.contributionDays)
      .reduce((s: number, d: any) => s + d.contributionCount, 0);

  // Centre the mini heatmap grid in its panel too.
  const hmGridW = hmWeeks.length * (hmCellSize + hmGap) - hmGap;
  const hmGridH = 7 * (hmCellSize + hmGap) - hmGap;
  const hmOffsetX = Math.max(0, (panelContentWidth - hmGridW) / 2) - hmStartX;
  const hmOffsetY = Math.max(0, (140 - hmGridH) / 2) - hmStartY;

  const heatmapContent = `
    ${translate(hmOffsetX, hmOffsetY, hmGrid)}
    ${safeText({
      x: cardW / 2,
      y: cardH - 48,
      content: `${totalContributions.toLocaleString()} contributions this year`,
      cls: 'muted',
      maxWidth: panelContentWidth,
      fontSize: 9,
      fontFamily: 'mono',
      textAnchor: 'middle',
      truncate: true,
    })}
  `;
  inner += panel(
    startX + cardW + gap,
    startY + cardH + gap,
    cardW,
    cardH,
    'Heatmap',
    '',
    heatmapContent
  );

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
  const vercelIp =
    headers.get('x-vercel-ip') || headers.get('x-forwarded-for')?.split(',')[0]?.trim();
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
    US: 'America/New_York',
    GB: 'Europe/London',
    DE: 'Europe/Berlin',
    FR: 'Europe/Paris',
    JP: 'Asia/Tokyo',
    CN: 'Asia/Shanghai',
    IN: 'Asia/Kolkata',
    AU: 'Australia/Sydney',
    CA: 'America/Toronto',
    BR: 'America/Sao_Paulo',
    KR: 'Asia/Seoul',
    SG: 'Asia/Singapore',
    NL: 'Europe/Amsterdam',
    ES: 'Europe/Madrid',
    IT: 'Europe/Rome',
    MX: 'America/Mexico_City',
    RU: 'Europe/Moscow',
    ZA: 'Africa/Johannesburg',
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
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || '';
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return weekdayMap[weekdayStr] ?? new Date().getUTCDay();
  } catch {
    return new Date().getUTCDay();
  }
}

// Get greeting based on viewer's local time
function getTimeGreeting(hour: number): { text: string; emoji: string } {
  if (hour >= 5 && hour < 12) return { text: 'Good morning', emoji: '' };
  if (hour >= 12 && hour < 17) return { text: 'Good afternoon', emoji: '' };
  if (hour >= 17 && hour < 22) return { text: 'Good evening', emoji: '' };
  return { text: 'Good night', emoji: '' };
}

// Highlight current hour in heatmap data
function highlightCurrentHour(heatmapData: number[][], timezone: string): number[][] {
  const viewerHour = getViewerHour(timezone);
  const highlighted = heatmapData.map((row) => [...row]);
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
  interface Week {
    contributionDays: ContributionDay[];
  }

  const weeks: Week[] = [];
  const now = new Date();
  for (let w = 0; w < 53; w++) {
    const week: Week = { contributionDays: [] };
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (52 - w) * 7 - (6 - d));
      // Deterministic pseudo-random: an empty calendar must render the same
      // badge on every request so CDN caches and previews stay stable.
      const seed = ((w * 7 + d + 1) * 2654435761) % 4294967296;
      const rand = (seed % 1000) / 1000;
      const count = rand > 0.7 ? Math.floor(rand * 10) : 0;
      week.contributionDays.push({
        date: date.toISOString().split('T')[0],
        contributionCount: count,
      });
    }
    weeks.push(week);
  }
  return {
    weeks,
    totalContributions: weeks
      .flatMap((w) => w.contributionDays)
      .reduce((s, d) => s + d.contributionCount, 0),
  };
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

    // ===== NATIVE TASTE-SCORE BADGE (no username needed) =====
    // `/api/badges?type=score&value=92&grade=A&theme=gta6`
    if (type === 'score') {
      const scoreTheme = getTheme(themeName);
      const rawValue = Number(searchParams.get('value') ?? searchParams.get('score') ?? 'NaN');
      const headers = {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      };

      if (!Number.isFinite(rawValue)) {
        return new NextResponse(generateBadge('Taste Score', 'value required', scoreTheme, 'red'), {
          status: 400,
          headers,
        });
      }

      const value = Math.max(0, Math.min(100, Math.round(rawValue)));
      const grade = (searchParams.get('grade') || '').slice(0, 3);
      const label = searchParams.get('label') || 'Taste Score';
      const accent = value >= 85 ? 'emerald' : value >= 70 ? 'gold' : 'red';

      const svg = generateBadge(
        label.slice(0, 24),
        grade ? `${value}/100 (${grade})` : `${value}/100`,
        scoreTheme,
        accent
      );
      return new NextResponse(svg, { headers });
    }

    // ===== NATIVE SKILL CHIPS (no username needed) =====
    // `/api/badges?type=skill&name=React&theme=gta6`
    // `/api/badges?type=skill-row&skills=React,Docker,Redis&theme=gta6`
    if (type === 'skill' || type === 'skill-row') {
      const skillTheme = getTheme(themeName);
      const raw =
        type === 'skill'
          ? searchParams.get('name') || searchParams.get('skill') || ''
          : searchParams.get('skills') || searchParams.get('names') || '';
      const limit = type === 'skill' ? 1 : 12;
      const names = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, limit);

      const headers = {
        'Content-Type': 'image/svg+xml',
        // Deterministic output: brand icon + theme tokens are baked in the URL.
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      };

      if (names.length === 0) {
        return new NextResponse(generateBadge('Skill', 'name required', skillTheme, 'red'), {
          status: 400,
          headers,
        });
      }

      const svg =
        type === 'skill'
          ? generateSkillChipSvg(names[0], skillTheme)
          : generateSkillRowSvg(names, skillTheme);
      return new NextResponse(svg, { headers });
    }

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // ===== REPOSITORY BADGES (stars, forks, issues, license, size, last-commit) =====
    // These need a `repo` param and use the repository query instead of the profile query.
    const repoName = searchParams.get('repo');
    const REPO_BADGE_TYPES = ['stars', 'forks', 'issues', 'license', 'size', 'last-commit'];

    if (repoName && REPO_BADGE_TYPES.includes(type)) {
      const svgHeaders = (etagValue: string) => ({
        'Content-Type': 'image/svg+xml',
        ETag: etagValue,
        'Cache-Control': 'public, max-age=21600, stale-while-revalidate=21600',
      });

      let repoData: any = null;
      let repoEtag = '';

      try {
        const result = await fetchRepoData(username, repoName, { token, userToken });
        repoData = result.data;
        repoEtag = result.etag;
      } catch {
        repoData = null;
      }

      if (!repoData) {
        return new NextResponse(generateBadge('Repo', 'not found', getTheme(themeName), 'red'), {
          headers: svgHeaders('"repo-missing"'),
        });
      }

      if (repoEtag && checkETag(req, repoEtag)) {
        return createNotModifiedResponse(repoEtag);
      }

      const repoTheme = getTheme(themeName);

      const formatSize = (bytes: number): string => {
        if (!bytes) return '0 KB';
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${bytes} B`;
      };

      const timeAgo = (iso: string): string => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${Math.max(mins, 1)}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        return `${Math.floor(months / 12)}y ago`;
      };

      const lastCommit = repoData.defaultBranchRef?.target?.history?.nodes?.[0]?.committedDate;

      let repoSvg: string;
      if (type === 'stars') {
        repoSvg = generateBadge('Stars', String(repoData.stargazerCount ?? 0), repoTheme, 'gold');
      } else if (type === 'forks') {
        repoSvg = generateBadge('Forks', String(repoData.forkCount ?? 0), repoTheme);
      } else if (type === 'issues') {
        repoSvg = generateBadge(
          'Open Issues',
          String(repoData.openIssues?.totalCount ?? 0),
          repoTheme
        );
      } else if (type === 'license') {
        repoSvg = generateBadge('License', repoData.licenseInfo?.spdxId || 'None', repoTheme);
      } else if (type === 'size') {
        repoSvg = generateBadge('Size', formatSize(repoData.languages?.totalSize ?? 0), repoTheme);
      } else {
        repoSvg = generateBadge('Last Commit', lastCommit ? timeAgo(lastCommit) : 'n/a', repoTheme);
      }

      return new NextResponse(repoSvg, { headers: svgHeaders(repoEtag) });
    }

    // Extract viewer context from edge headers (Vercel, Cloudflare)
    const viewer = extractViewerContext(req);
    const viewerHour = getViewerHour(viewer.timezone);

    // Fetch profile data with caching and ETag support
    const {
      data: profileData,
      etag,
      fromCache,
    } = await fetchProfileData(username, { token, userToken });

    // Check ETag for conditional request
    if (checkETag(req, etag)) {
      return createNotModifiedResponse(etag);
    }

    const theme = getTheme(themeName);

    // GitHub's GraphQL API needs a token. When the deployment token is expired
    // we get demo data back — say so instead of rendering a confident zero.
    const degraded = Boolean((profileData as any).__graphQLError);
    const unavailable = degraded ? 'n/a' : null;

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
    const days =
      calendar?.weeks?.flatMap((w: any) => w.contributionDays) ||
      demoCalendar.weeks.flatMap((w: any) => w.contributionDays);
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
      starsGiven: (profileData as any).starredRepositories?.totalCount || 0,
    };

    let badgeSvg: string;

    // ===== SHIELDS COMPATIBLE BADGES =====
    if (type === 'repos')
      badgeSvg = generateBadge(
        'Public Repos',
        unavailable ?? String(stats.publicRepos),
        theme,
        degraded ? 'red' : undefined
      );
    else if (type === 'followers')
      badgeSvg = generateBadge(
        'Followers',
        unavailable ?? String(stats.followers),
        theme,
        degraded ? 'red' : undefined
      );
    else if (type === 'following')
      badgeSvg = generateBadge(
        'Following',
        unavailable ?? String(stats.following),
        theme,
        degraded ? 'red' : undefined
      );
    else if (type === 'language')
      badgeSvg = generateBadge(
        'Top Language',
        unavailable ?? stats.topLanguage,
        theme,
        degraded ? 'red' : undefined
      );
    else if (type === 'streak')
      badgeSvg = generateBadge(
        'Streak',
        unavailable ?? `${stats.streak} days`,
        theme,
        degraded ? 'red' : 'gold'
      );
    else if (type === 'contributions')
      badgeSvg = generateBadge(
        'Contributions',
        unavailable ?? String(stats.totalContributions),
        theme,
        degraded ? 'red' : undefined
      );
    else if (type === 'stars')
      badgeSvg = generateBadge(
        'Stars Given',
        unavailable ?? String(stats.starsGiven),
        theme,
        degraded ? 'red' : undefined
      );

    // ===== RICH SVG CARDS =====
    else if (type === 'trophy')
      badgeSvg = generateTrophySvg(
        username,
        userData.public_repos,
        userData.followers,
        reposData.reduce((s, r) => s + (r.stargazerCount || 0), 0),
        theme
      );
    else if (type === 'activity')
      badgeSvg = generateActivityGraphSvg(username, demoCalendar, theme);
    else if (type === 'visitor')
      badgeSvg = generateVisitorCardSvg(
        username,
        userData.followers,
        userData.public_repos,
        stats.totalContributions,
        theme
      );
    else if (type === 'heatmap')
      badgeSvg = generateHeatmapSvg(username, demoCalendar, theme, viewer);
    else if (type === 'snake') badgeSvg = generateSnakeSvg(username, demoCalendar, theme);
    else if (type === 'typing')
      badgeSvg = generateTypingSvg(searchParams.get('name') || username, userData.bio, theme);
    else if (type === 'name-banner')
      badgeSvg = generateNameBannerSvg(searchParams.get('name') || username, theme);
    else if (type === 'star-history') badgeSvg = generateStarHistorySvg(username, reposData, theme);
    else if (type === 'repo-card') {
      const repoName = searchParams.get('repo');
      const repo = reposData.find((r: any) => r.name === repoName) || reposData[0];
      badgeSvg = repo
        ? generateRepoCardSvg(repo, theme)
        : generateBadge('Repo Card', 'No repositories', theme);
    } else if (type === 'language-donut') badgeSvg = generateLanguageDonutSvg(languagesData, theme);
    else if (type === 'skill-bubbles')
      badgeSvg = generateSkillBubblesSvg(
        [
          'TypeScript',
          'React',
          'Next.js',
          'Node.js',
          'Rust',
          'Go',
          'Python',
          'TailwindCSS',
          'PostgreSQL',
          'Docker',
          'GraphQL',
          'WebGL',
        ],
        theme
      );
    else if (type === 'ascii') {
      const text = searchParams.get('text') || username;
      badgeSvg = generateAsciiBannerSvg(text, theme);
    } else if (type === 'streak-calendar')
      badgeSvg = generateStreakCalendarSvg(
        searchParams.get('name') || username,
        demoCalendar,
        stats.streak,
        theme
      );

    // ===== NEW ANIMATED GRAPH BADGES =====
    else if (type === 'skill-radar')
      badgeSvg = generateSkillRadarSvg(
        [
          { name: 'Frontend', level: 90 },
          { name: 'Backend', level: 85 },
          { name: 'DevOps', level: 75 },
          { name: 'Architecture', level: 80 },
          { name: 'Testing', level: 70 },
          { name: 'Security', level: 65 },
        ],
        theme
      );
    else if (type === 'language-race')
      badgeSvg = generateLanguageRaceSvg(username, languagesData, theme);
    else if (type === 'repo-constellation')
      badgeSvg = generateRepoConstellationSvg(username, reposData, theme);
    else if (type === 'code-pulse') badgeSvg = generateCodePulseSvg(username, stats, theme, viewer);
    else if (type === 'contribution-mountain')
      badgeSvg = generateContributionMountainSvg(
        searchParams.get('name') || username,
        demoCalendar,
        theme
      );
    else if (type === 'tech-galaxy')
      badgeSvg = generateTechGalaxySvg(
        [
          'TypeScript',
          'React',
          'Next.js',
          'Node.js',
          'Rust',
          'Go',
          'Python',
          'PostgreSQL',
          'Docker',
          'GraphQL',
          'TailwindCSS',
          'Kubernetes',
          'AWS',
          'Redis',
          'WebGL',
        ],
        theme
      );
    else if (type === 'contribution-flow')
      badgeSvg = generateContributionFlowSvg(username, reposData, theme);
    else if (type === 'code-time-heatmap') badgeSvg = generateCodeTimeHeatmapSvg(username, theme);

    // ===== COMPOSITE CARD (NEW) =====
    else if (type === 'composite') {
      const include = searchParams.get('include')?.split(',') || [
        'stats',
        'trophies',
        'snake',
        'heatmap',
      ];
      badgeSvg = generateCompositeSvg(
        username,
        stats,
        userData,
        reposData,
        calendar || demoCalendar,
        languagesData,
        include,
        theme
      );
    }

    // ===== EXTERNAL API BADGES (Disabled until tokens provided) =====
    else if (type === 'wakatime') {
      if (!process.env.WAKATIME_API_KEY)
        badgeSvg = generateBadge('WakaTime', 'Token Required', theme, 'red');
      else badgeSvg = generateBadge('WakaTime', 'Configured ✓', theme);
    } else if (type === 'leetcode') {
      if (!process.env.LEETCODE_SESSION)
        badgeSvg = generateBadge('LeetCode', 'Token Required', theme, 'red');
      else badgeSvg = generateBadge('LeetCode', 'Configured ✓', theme);
    } else if (type === 'codeforces') {
      const handle = searchParams.get('handle') || process.env.CODEFORCES_HANDLE;
      if (!handle) badgeSvg = generateBadge('Codeforces', 'Handle Required', theme, 'red');
      else badgeSvg = generateBadge('Codeforces', 'Configured ✓', theme);
    } else if (type === 'spotify') {
      if (!process.env.SPOTIFY_REFRESH_TOKEN)
        badgeSvg = generateBadge('Spotify', 'Token Required', theme, 'red');
      else badgeSvg = generateBadge('Spotify', 'Configured ✓', theme);
    } else if (type === 'youtube') {
      if (!process.env.YOUTUBE_API_KEY)
        badgeSvg = generateBadge('YouTube', 'Token Required', theme, 'red');
      else badgeSvg = generateBadge('YouTube', 'Configured ✓', theme);
    } else if (type === 'blog') {
      badgeSvg = generateBadge('Blog Posts', 'Configured ✓', theme);
    }

    // ===== STATS JSON =====
    else {
      return createETagResponse(
        { ...stats, languages: languagesData, username, fromCache, degraded },
        etag
      );
    }

    return new NextResponse(badgeSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        ETag: etag,
        'Cache-Control': 'public, max-age=21600, stale-while-revalidate=21600', // 6 hours
        'X-Viewer-Country': viewer.country || 'unknown',
        'X-Viewer-Timezone': viewer.timezone || 'unknown',
        'X-Viewer-Hour': String(getViewerHour(viewer.timezone)),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to generate badge' },
      { status: 500 }
    );
  }
}

// Helper function moved from github.ts
function calculateLanguages(
  repos: any[]
): Array<{ name: string; percentage: number; color: string }> {
  const LANG_COLORS: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Rust: '#dea584',
    Python: '#3572A5',
    Go: '#00ADD8',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
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

  const sortedLangs = Object.entries(langCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return sortedLangs.map(([name, count]) => ({
    name,
    percentage: totalLangCount > 0 ? Number(((count / totalLangCount) * 100).toFixed(1)) : 20,
    color: LANG_COLORS[name] || '#8b5cf6',
  }));
}
