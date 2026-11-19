// ============================================================================
// ReadmeCraft — public README score card
// ============================================================================
// Scores any raw README.md, without needing the Studio's ProfileData/sections.
// Used by /score/[username], which reads the README a user actually published.
// Every number here is derived from the markdown itself — nothing is estimated.

import { getGrade, type ScoreBreakdown } from './score';

export type ScoreGrade = ScoreBreakdown['grade'];

export interface PublicScoreMetric {
  key: string;
  label: string;
  score: number;
  max: number;
}

export interface PublicScoreSuggestion {
  title: string;
  detail: string;
}

export interface PublicScoreStats {
  lines: number;
  words: number;
  headings: number;
  h1: number;
  h2: number;
  badges: number;
  images: number;
  imagesWithAlt: number;
  codeBlocks: number;
  tables: number;
  links: number;
}

export interface PublicScore {
  score: number;
  grade: ScoreGrade;
  metrics: PublicScoreMetric[];
  suggestions: PublicScoreSuggestion[];
  stats: PublicScoreStats;
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) || []).length;
}

export function scoreReadmeMarkdown(markdown: string): PublicScore {
  const md = markdown.replace(/\r\n?/g, '\n');
  const trimmed = md.trim();

  const images = countMatches(md, /!\[[^\]]*\]\([^)]+\)/g);
  const imagesWithAlt = countMatches(md, /!\[[^\]]+\]\([^)]+\)/g);
  const badges = countMatches(md, /!\[[^\]]*\]\([^)]*(?:badge|shields|api\/badges)[^)]*\)/g);
  const links = countMatches(md, /\[[^\]]+\]\(https?:\/\/[^)]+\)/g);
  const h1 = countMatches(md, /^#\s+\S/gm);
  const h2 = countMatches(md, /^##\s+\S/gm);
  const headings = h1 + h2 + countMatches(md, /^###\s+\S/gm);
  const codeBlocks = Math.floor(countMatches(md, /^```/gm) / 2);
  const tables = countMatches(md, /^\|.+\|\s*$/gm) > 0 ? 1 : 0;
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const lines = trimmed ? trimmed.split('\n').length : 0;

  const stats: PublicScoreStats = {
    lines,
    words,
    headings,
    h1,
    h2,
    badges,
    images,
    imagesWithAlt,
    codeBlocks,
    tables,
    links,
  };

  const suggestions: PublicScoreSuggestion[] = [];
  const lower = md.toLowerCase();

  // ---- 1. Structure (20) ----
  let structure = 0;
  if (h1 === 1) structure += 7;
  else if (h1 === 0) {
    suggestions.push({
      title: 'Add a single H1 title',
      detail: 'Every README should open with one `# Project name` heading.',
    });
  } else {
    suggestions.push({
      title: 'Use only one H1',
      detail: 'Multiple `#` headings break the document outline; use `##` for sections.',
    });
  }
  if (h2 >= 4) structure += 7;
  else if (h2 >= 2) structure += 4;
  else
    suggestions.push({
      title: 'Split the README into sections',
      detail: 'Add `##` headings for features, install, usage and license.',
    });
  if (words >= 150) structure += 6;
  else if (words >= 60) structure += 3;
  else
    suggestions.push({
      title: 'Explain what this project does',
      detail: 'Under 60 words leaves visitors guessing; aim for 150+ focused words.',
    });

  // ---- 2. Visuals (20) ----
  let visuals = 0;
  if (badges >= 3) visuals += 8;
  else if (badges >= 1) visuals += 5;
  else
    suggestions.push({
      title: 'Add status badges',
      detail: 'Badges for build, stars, license or language make the header scannable.',
    });
  if (images >= 1) visuals += 4;
  else
    suggestions.push({
      title: 'Include a screenshot or diagram',
      detail: 'One image (demo, architecture, terminal) raises engagement sharply.',
    });
  if (tables >= 1) visuals += 4;
  if (codeBlocks >= 1) visuals += 4;

  // ---- 3. Documentation depth (20) ----
  let depth = 0;
  if (codeBlocks >= 2) depth += 6;
  else if (codeBlocks === 1) depth += 3;
  else
    suggestions.push({
      title: 'Show runnable code blocks',
      detail: 'Install and usage snippets in fenced blocks are what visitors copy.',
    });
  const hasInstall = /\b(install|npm i|pnpm add|yarn add|pip install|cargo add|go get)\b/.test(
    lower
  );
  const hasUsage = /\b(usage|getting started|quick ?start|example)\b/.test(lower);
  if (hasInstall && hasUsage) depth += 7;
  else if (hasInstall || hasUsage) depth += 4;
  else
    suggestions.push({
      title: 'Add install and usage instructions',
      detail: 'Cover how to install the project and run the first example.',
    });
  if (words >= 300) depth += 4;
  if (links >= 2) depth += 3;

  // ---- 4. Connect & trust (20) ----
  let connect = 0;
  if (links >= 3) connect += 7;
  else if (links >= 1) connect += 4;
  else
    suggestions.push({
      title: 'Link out to demo, docs or author',
      detail: 'External links turn a description into something visitors can verify.',
    });
  const hasSocial = /(mailto:|twitter\.com|x\.com\/|linkedin\.com\/|discord\.gg|bsky\.app)/.test(
    lower
  );
  if (hasSocial) connect += 5;
  else
    suggestions.push({
      title: 'Add a way to reach you',
      detail: 'Email, X or Discord links make it easy to start a conversation.',
    });
  const hasLicense = /\blicen[cs]e\b|\bmit\b|\bapache-2\.0\b/.test(lower);
  if (hasLicense) connect += 4;
  else
    suggestions.push({
      title: 'State the license',
      detail: 'Without a license, others cannot safely reuse the code.',
    });
  const hasDemo = /\b(demo|live|website|homepage)\b/.test(lower);
  if (hasDemo) connect += 4;

  // ---- 5. Hygiene (20) ----
  let hygiene = 0;
  if (images === 0) hygiene += 4;
  else if (imagesWithAlt === images) hygiene += 8;
  else {
    hygiene += Math.round((imagesWithAlt / images) * 8);
    suggestions.push({
      title: 'Describe every image with alt text',
      detail: '`![Screenshot of the dashboard](...)` keeps the README accessible.',
    });
  }
  if (h2 >= 2) hygiene += 4;
  if (!/\[[^\]]*\]\(\s*\)/.test(md)) hygiene += 4;
  else
    suggestions.push({
      title: 'Remove empty links',
      detail: '`[text]()` renders as a dead link; point it at a real URL or drop it.',
    });
  if (!/\b(lorem ipsum|todo|coming soon)\b/.test(lower)) hygiene += 4;
  else
    suggestions.push({
      title: 'Replace placeholder text',
      detail: 'TODO/lorem/coming-soon lines make a README look unfinished.',
    });

  const metrics: PublicScoreMetric[] = [
    { key: 'structure', label: 'Structure', score: structure, max: 20 },
    { key: 'visuals', label: 'Visuals', score: visuals, max: 20 },
    { key: 'depth', label: 'Documentation', score: depth, max: 20 },
    { key: 'connect', label: 'Connect & trust', score: connect, max: 20 },
    { key: 'hygiene', label: 'Hygiene', score: hygiene, max: 20 },
  ];

  const score = Math.min(
    metrics.reduce((sum, metric) => sum + metric.score, 0),
    100
  );

  return { score, grade: getGrade(score), metrics, suggestions: suggestions.slice(0, 5), stats };
}
