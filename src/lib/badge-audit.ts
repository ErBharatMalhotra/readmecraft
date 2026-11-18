// ============================================================================
// ReadmeCraft — Badge Auditor
// Pure analysis of a README: finds badges that are dead, silently broken, or
// single points of failure, and proposes a native ReadmeCraft replacement.
// No network access here — the caller supplies the markdown.
// ============================================================================

export type AuditSeverity = 'dead' | 'risky' | 'native' | 'unknown';

export interface AuditFix {
  /** Native badge URL that replaces the original. */
  url: string;
  /** One-line explanation shown in the report. */
  reason: string;
}

export interface AuditFinding {
  url: string;
  host: string;
  service: string;
  severity: AuditSeverity;
  detail: string;
  fix?: AuditFix;
}

export interface AuditReport {
  username: string;
  readmeUrl: string | null;
  readmeFound: boolean;
  badgeCount: number;
  counts: { dead: number; risky: number; native: number; unknown: number };
  score: number;
  findings: AuditFinding[];
  /** README with every found fix applied, or null when nothing could be fixed. */
  fixedMarkdown: string | null;
  fixedCount: number;
}

const BADGE_API = 'https://readme.bharatdn.com/api/badges';

const MD_IMAGE = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g;
const HTML_IMAGE = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;

/** Pulls every http(s) image URL out of markdown or HTML, in document order. */
export function extractImageUrls(markdown: string): string[] {
  const found: { index: number; url: string }[] = [];
  const text = String(markdown || '');
  for (const regex of [MD_IMAGE, HTML_IMAGE]) {
    for (const match of text.matchAll(regex)) {
      const url = match[1]?.trim();
      if (!url) continue;
      found.push({ index: match.index ?? 0, url });
    }
  }
  found.sort((a, b) => a.index - b.index);
  const seen = new Set<string>();
  return found
    .map((entry) => entry.url)
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function safePath(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return '';
  }
}

function queryValue(url: string, key: string): string | null {
  try {
    return new URL(url).searchParams.get(key);
  } catch {
    return null;
  }
}

function themeOf(url: string): string {
  const theme = queryValue(url, 'theme');
  return theme && /^[a-zA-Z0-9-]+$/.test(theme) ? theme : 'gta6';
}

function nativeUrl(params: Record<string, string | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return `${BADGE_API}?${search.toString()}`;
}

function usernameOf(url: string, fallback: string): string {
  return queryValue(url, 'username') || queryValue(url, 'user') || fallback;
}

// ---------------------------------------------------------------------------
// shields.io static chips: /badge/<label>-<message>-<color>?logo=<slug>
// Our native skill chip only needs the display name.
// ---------------------------------------------------------------------------
function shieldsChipName(url: string): string | null {
  let path: string;
  try {
    // Keep the original casing: chip names are display text, not route keys.
    path = new URL(url).pathname;
  } catch {
    return null;
  }
  if (!path.toLowerCase().startsWith('/badge/')) return null;
  const body = decodeURIComponent(path.slice('/badge/'.length));
  if (!body) return null;
  // `/badge/-React-61DAFB` -> ['', 'React', '61DAFB'] (logo-only chips)
  const parts = body.split('-');
  const candidate = parts.length >= 3 ? parts[1] : parts[0];
  const name = candidate.replace(/_/g, ' ').trim();
  if (!name || name.length > 28 || /^https?:/.test(name)) return null;
  return name;
}

function classify(url: string, owner: string): AuditFinding {
  const host = safeHost(url);
  const path = safePath(url);

  // ---- Ours -------------------------------------------------------------
  if (host === 'readme.bharatdn.com') {
    return {
      url,
      host,
      service: 'ReadmeCraft (native)',
      severity: 'native',
      detail: 'Rendered by ReadmeCraft itself — no third-party image host involved.',
    };
  }

  // ---- Dead: paused / deprecated readme-stats instance -------------------
  if (host === 'github-readme-stats.vercel.app') {
    const user = usernameOf(url, owner);
    const theme = themeOf(url);
    let fix: AuditFix;
    if (path.includes('top-langs')) {
      fix = {
        url: nativeUrl({ username: user, type: 'language-donut', theme }),
        reason: 'Native language donut from your real repository bytes.',
      };
    } else if (path.includes('pin')) {
      const repo = queryValue(url, 'repo') || '';
      fix = repo
        ? {
            url: nativeUrl({ username: user, repo, type: 'repo-card', theme }),
            reason: 'Native repository card.',
          }
        : {
            url: nativeUrl({ username: user, type: 'stats', theme }),
            reason: 'Native stats card.',
          };
    } else {
      fix = {
        url: nativeUrl({ username: user, type: 'stats', theme }),
        reason: 'Native stats card, computed from the GitHub API on our edge.',
      };
    }
    return {
      url,
      host,
      service: 'github-readme-stats',
      severity: 'dead',
      detail:
        'The public instance is paused (503 DEPLOYMENT_PAUSED) and the project is deprecated, so this image is blank for most visitors.',
      fix,
    };
  }

  // ---- Dead: Heroku free dynos retired (streak stats, typing svg, activity graph)
  if (host.endsWith('herokuapp.com')) {
    const user = usernameOf(url, owner);
    const theme = themeOf(url);
    let fix: AuditFix = {
      url: nativeUrl({ username: user, type: 'stats', theme }),
      reason: 'Native stats card.',
    };
    if (host.startsWith('github-readme-streak-stats') || path.includes('streak')) {
      fix = {
        url: nativeUrl({ username: user, type: 'streak', theme }),
        reason: 'Native streak badge from your contribution calendar.',
      };
    } else if (host.startsWith('readme-typing-svg')) {
      fix = {
        url: nativeUrl({ username: user, type: 'typing', theme, name: user }),
        reason: 'Native animated typing intro.',
      };
    } else if (path.includes('graph')) {
      fix = {
        url: nativeUrl({ username: user, type: 'activity', theme }),
        reason: 'Native 30-day activity graph.',
      };
    }
    return {
      url,
      host,
      service: host,
      severity: 'dead',
      detail: 'Heroku retired its free dynos, so *.herokuapp.com badge hosts are offline.',
      fix,
    };
  }

  // ---- Dead: travis-ci.org shut down in 2021 ------------------------------
  if (host === 'travis-ci.org') {
    return {
      url,
      host,
      service: 'Travis CI (legacy)',
      severity: 'dead',
      detail: 'travis-ci.org was shut down in 2021, so this build badge no longer resolves.',
      fix: {
        url: nativeUrl({ username: owner, type: 'activity', theme: 'gta6' }),
        reason: 'Native activity card instead of a dead CI badge.',
      },
    };
  }

  // ---- Risky: third-party hosts that can blank a profile ------------------
  if (host === 'img.shields.io') {
    const skill = shieldsChipName(url);
    return {
      url,
      host,
      service: skill ? `shields.io · ${skill}` : 'shields.io',
      severity: 'risky',
      detail:
        'Works today, but every chip is an extra request to a third-party service; when it is slow the whole row flickers.',
      fix: skill
        ? {
            url: nativeUrl({ type: 'skill', name: skill, theme: themeOf(url) }),
            reason: 'Same chip rendered by our own engine (curated simple-icons).',
          }
        : undefined,
    };
  }

  // Self-hosted / forked readme-stats instances: same code, same class of
  // failure the public instance hit.
  if (host.startsWith('github-readme-stats') && host.endsWith('.vercel.app')) {
    return {
      url,
      host,
      service: 'github-readme-stats (self-hosted)',
      severity: 'risky',
      detail:
        'A private readme-stats deployment — it stays up only as long as whoever owns it keeps paying and patching it.',
      fix: {
        url: nativeUrl({
          username: usernameOf(url, owner),
          type: path.includes('top-langs') ? 'language-donut' : 'stats',
          theme: themeOf(url),
        }),
        reason: 'Native card with no deployment to maintain.',
      },
    };
  }

  if (host === 'github-profile-trophy.vercel.app') {
    return {
      url,
      host,
      service: 'github-profile-trophy',
      severity: 'risky',
      detail:
        'Community-run Vercel instance — no uptime guarantee, and it breaks silently when GitHub rate-limits it.',
      fix: {
        url: nativeUrl({ username: usernameOf(url, owner), type: 'trophy', theme: themeOf(url) }),
        reason: 'Native trophy shelf.',
      },
    };
  }

  if (host === 'github.com' && path.includes('/actions/workflows/') && path.endsWith('badge.svg')) {
    return {
      url,
      host,
      service: 'GitHub Actions badge',
      severity: 'risky',
      detail:
        'Breaks silently when the workflow file is renamed or moved — the image 404s with no warning.',
    };
  }

  if (host === 'badge.fury.io' || (host === 'img.shields.io' && path.startsWith('/npm/'))) {
    return {
      url,
      host,
      service: 'package version badge',
      severity: 'risky',
      detail: 'Version badges drift out of date and point at a package that may be unpublished.',
    };
  }

  if (host === 'codecov.io' || host === 'coveralls.io') {
    return {
      url,
      host,
      service: 'coverage badge',
      severity: 'risky',
      detail: 'Requires a CI upload token; when it lapses the badge shows "unknown" forever.',
    };
  }

  if (host === 'komarev.com' || host === 'visitor-badge.laobi.icu') {
    return {
      url,
      host,
      service: 'visitor counter',
      severity: 'risky',
      detail: 'Third-party hit counter with no uptime guarantee.',
    };
  }

  return {
    url,
    host: host || 'invalid',
    service: host || 'unknown host',
    severity: 'unknown',
    detail: 'Not covered by the auditor rules — check this one by hand.',
  };
}

export interface AuditOptions {
  username: string;
  readmeUrl?: string | null;
  readmeFound?: boolean;
  markdown: string;
}

export function auditReadme(options: AuditOptions): AuditReport {
  const markdown = String(options.markdown || '');
  const urls = extractImageUrls(markdown);
  const findings = urls.map((url) => classify(url, options.username));

  const counts = { dead: 0, risky: 0, native: 0, unknown: 0 };
  for (const finding of findings) counts[finding.severity] += 1;

  // Dead badges are what actually makes a profile look abandoned; risky ones
  // only cost reliability, so they weigh far less.
  const score = Math.max(
    0,
    Math.min(100, 100 - counts.dead * 18 - counts.risky * 4 - counts.unknown * 1)
  );

  let fixedMarkdown = markdown;
  let fixedCount = 0;
  for (const finding of findings) {
    if (!finding.fix) continue;
    const variants = [finding.url, finding.url.replace(/&/g, '&amp;')];
    for (const variant of variants) {
      if (!fixedMarkdown.includes(variant)) continue;
      fixedMarkdown = fixedMarkdown.split(variant).join(finding.fix.url);
      fixedCount += 1;
    }
  }

  return {
    username: options.username,
    readmeUrl: options.readmeUrl ?? null,
    readmeFound: options.readmeFound ?? false,
    badgeCount: urls.length,
    counts,
    score,
    findings,
    fixedMarkdown: fixedCount > 0 ? fixedMarkdown : null,
    fixedCount,
  };
}
