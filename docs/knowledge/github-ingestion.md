# GitHub Ingestion — Implementation Knowledge

> Deep-dive on GitHub API patterns, rate limits, fallbacks, and data transformation used in ReadmeCraft.

---

## 🎯 Overview

ReadmeCraft ingests GitHub data via two pipelines:

1. **Profile Ingestion** — Username → user profile + repo list → computed stats
2. **Project Ingestion** — Repo URL/slug → repo metadata + package.json/Cargo.toml inspection

Both use `@octokit/rest` (REST API v3) with optional GraphQL for future optimization.

---

## 🔑 Authentication & Rate Limits

### Token Handling

```typescript
// Token passed from UI (optional)
const headers: Record<string, string> = {
  Accept: 'application/vnd.github.v3+json',
};
if (token) {
  headers['Authorization'] = `token ${token}`;
}
```

### Rate Limit Tiers

| Auth Status         | Limit         | Window           | Headers                                                           |
| ------------------- | ------------- | ---------------- | ----------------------------------------------------------------- |
| Unauthenticated     | 60 req/hr     | Per IP           | `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset` |
| Authenticated (PAT) | 5,000 req/hr  | Per token        | Same headers                                                      |
| GitHub App          | 15,000 req/hr | Per installation | Same headers                                                      |

### Rate Limit Response Handling

```typescript
// Check headers after every request
const remaining = parseInt(res.headers.get('x-ratelimit-remaining') || '0');
const resetTime = parseInt(res.headers.get('x-ratelimit-reset') || '0') * 1000;

if (remaining === 0) {
  const waitMs = resetTime - Date.now();
  // Show user: "Rate limited. Resets in X minutes."
}
```

**Current v1 Strategy:** No proactive handling — falls back to sample data silently. Phase 2.4 adds:

- 5-minute in-memory cache keyed by `mode:target`
- Remaining requests display in HeroIngestion
- Graceful "using cached data" indicator

---

## 👤 Profile Ingestion (`fetchGitHubProfile`)

### API Calls Sequence

```typescript
// 1. User profile
GET /users/{username}
// → { login, name, bio, avatar_url, company, location, blog, twitter_username, html_url, public_repos, followers, following }

// 2. User repos (for languages + pinned)
GET /users/{username}/repos?per_page=100&sort=updated&type=owner
// → Array of repo objects (max 100)
```

### Language Calculation Algorithm

```typescript
// Current v1: Count-based (repo count per language)
const langCounts: Record<string, number> = {};
let totalLangCount = 0;

repos.forEach((repo) => {
  if (repo.language && !repo.fork) {
    langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
    totalLangCount++;
  }
});

const sortedLangs = Object.entries(langCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

const languages = sortedLangs.map(([name, count]) => ({
  name,
  percentage: totalLangCount > 0 ? Number(((count / totalLangCount) * 100).toFixed(1)) : 20,
  color: LANG_COLORS[name] || '#8b5cf6',
}));
```

**Limitation:** Uses repo _count_, not _bytes_. GitHub's Linguist data requires per-repo `GET /repos/{owner}/{repo}/languages` — 100 calls = rate limit death.

**Phase 3.1 Fix:** GraphQL query with `languages(first: 10) { edges { size, node { name, color } } }` per repo, aggregated client-side.

### Pinned Repos Selection

```typescript
// Top 3 non-fork repos by stargazers_count
const sortedRepos = repos
  .filter((r) => !r.fork)
  .sort((a, b) => b.stargazers_count - a.stargazers_count)
  .slice(0, 3);

const pinnedRepos = sortedRepos.map((r) => ({
  name: r.name,
  description: r.description || 'No description provided.',
  url: r.html_url,
  stargazersCount: r.stargazers_count,
  language: r.language || 'Code',
}));
```

### Fallback Data (`SAMPLE_PROFILE`)

Used on: 404, rate limit, network error, CORS failure.

```typescript
// Intelligent fallback preserves username but uses sample data
return {
  ...SAMPLE_PROFILE,
  username: username || SAMPLE_PROFILE.username,
  name: username || SAMPLE_PROFILE.name,
};
```

---

## 📦 Project Ingestion (`fetchGitHubProject`)

### Input Parsing

```typescript
// Accepts: "owner/repo" OR "https://github.com/owner/repo" OR "github.com/owner/repo"
let cleanSlug = repoUrlOrSlug.trim();
if (cleanSlug.includes('github.com/')) {
  const parts = cleanSlug.split('github.com/')[1].split('/');
  cleanSlug = `${parts[0]}/${parts[1]}`;
}
const [owner, repo] = cleanSlug.split('/');
```

### API Calls Sequence

```typescript
// 1. Repo metadata
GET / repos / { owner } / { repo };
// → { name, description, license, default_branch, stargazers_count, forks_count, open_issues_count, language, homepage }

// 2. package.json (if exists)
GET / repos / { owner } / { repo } / contents / package.json;
// → { content: base64, encoding: 'base64' }

// 3. Cargo.toml (fallback)
GET / repos / { owner } / { repo } / contents / Cargo.toml;
// → { content: base64, encoding: 'base64' }
```

### Package.json Inspection

```typescript
const pkgContent = JSON.parse(Buffer.from(pkgFile.content, 'base64').toString('utf8'));

// Package manager detection
let packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip' = 'npm';
let installCommand = 'npm install';
let runCommand = 'npm run dev';
let testCommand = 'npm test';

if (pkgContent.devDependencies?.pnpm || pkgContent.dependencies?.pnpm) {
  packageManager = 'pnpm';
  installCommand = 'pnpm install';
  runCommand = 'pnpm dev';
  testCommand = 'pnpm test';
} else if (pkgContent.devDependencies?.yarn || pkgContent.dependencies?.yarn) {
  packageManager = 'yarn';
  installCommand = 'yarn install';
  runCommand = 'yarn dev';
  testCommand = 'yarn test';
} else if (pkgContent.devDependencies?.bun) {
  packageManager = 'bun';
  installCommand = 'bun install';
  runCommand = 'bun dev';
  testCommand = 'bun test';
}

// Framework detection
let framework = repoData.language || 'TypeScript';
if (pkgContent.dependencies?.next) framework = 'Next.js';
else if (pkgContent.dependencies?.react) framework = 'React';
else if (pkgContent.dependencies?.vue) framework = 'Vue.js';
else if (pkgContent.dependencies?.express) framework = 'Express.js';
```

### Cargo.toml Detection

```typescript
// If package.json fails, try Cargo.toml
const cargoRes = await fetch(`/repos/${owner}/${repo}/contents/Cargo.toml`);
if (cargoRes.ok) {
  packageManager = 'cargo';
  installCommand = 'cargo build';
  runCommand = 'cargo run';
  testCommand = 'cargo test';
  framework = 'Rust';
}
```

### Fallback Data (`SAMPLE_PROJECT`)

Used on: 404, rate limit, network error, CORS failure, invalid slug.

---

## 🔄 Server-Side Proxy (`/api/ingest`)

### Purpose

- Avoid CORS issues calling `api.github.com` directly from browser
- Optional: Inject server-side token for higher rate limits
- Optional: Cache responses (Phase 2.4)

### Implementation

```typescript
// src/app/api/ingest/route.ts
export async function POST(req: NextRequest) {
  const { mode, target, token } = await req.json();

  if (mode === 'project') {
    const data = await fetchGitHubProject(target, token);
    return NextResponse.json({ success: true, data });
  } else {
    const data = await fetchGitHubProfile(target, token);
    return NextResponse.json({ success: true, data });
  }
}
```

### Client Fallback

If `/api/ingest` fails (Vercel cold start, timeout, etc.), client calls `lib/github.ts` directly:

```typescript
// In page.tsx handleIngest()
try {
  const res = await fetch('/api/ingest', { ... });
  // ...
} catch {
  // Direct client fetch (same functions, imported dynamically)
  const { fetchGitHubProfile } = await import('@/lib/github');
  // ...
}
```

---

## 📊 Data Transformation Summary

| Source                           | Transform           | Output Field                                                                 |
| -------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `user.login`                     | Direct              | `username`                                                                   |
| `user.name` \|\| `user.login`    | Coalesce            | `name`                                                                       |
| `user.bio` \|\| default          | Coalesce            | `bio`                                                                        |
| `user.avatar_url`                | Direct              | `avatarUrl`                                                                  |
| `user.company`                   | Direct              | `company`                                                                    |
| `user.location`                  | Direct              | `location`                                                                   |
| `user.blog`                      | Direct              | `website`                                                                    |
| `user.twitter_username`          | Direct              | `twitter`                                                                    |
| `user.html_url`                  | Direct              | `githubUrl`                                                                  |
| `user.public_repos`              | Direct              | `publicRepos`                                                                |
| `user.followers`                 | Direct              | `followers`                                                                  |
| `user.following`                 | Direct              | `following`                                                                  |
| Repo list → language aggregation | Count + percentage  | `languages[]`                                                                |
| Repo list → top 3 by stars       | Sort + slice        | `pinnedRepos[]`                                                              |
| `repo.license.spdx_id`           | Direct              | `license`                                                                    |
| `repo.default_branch`            | Direct              | `defaultBranch`                                                              |
| `package.json` scripts/fields    | Heuristic detection | `packageManager`, `installCommand`, `runCommand`, `testCommand`, `framework` |

---

## 🧪 Testing Patterns

### Mock GitHub API (MSW)

```typescript
// tests/mocks/github.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.github.com/users/:username', ({ params }) => {
    return HttpResponse.json({
      login: params.username,
      name: 'Test User',
      bio: 'Test bio',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
      // ... rest of profile
    });
  }),

  http.get('https://api.github.com/users/:username/repos', () => {
    return HttpResponse.json([
      {
        name: 'repo1',
        language: 'TypeScript',
        stargazers_count: 100,
        fork: false,
        html_url: '...',
        description: 'Desc',
      },
      {
        name: 'repo2',
        language: 'Rust',
        stargazers_count: 50,
        fork: false,
        html_url: '...',
        description: 'Desc',
      },
    ]);
  }),

  http.get('https://api.github.com/repos/:owner/:repo', ({ params }) => {
    return HttpResponse.json({
      name: params.repo,
      description: 'Test repo',
      license: { spdx_id: 'MIT' },
      default_branch: 'main',
      stargazers_count: 100,
      forks_count: 20,
      open_issues_count: 5,
      language: 'TypeScript',
      homepage: 'https://example.com',
    });
  }),
];
```

### Test Cases to Cover

- ✅ Successful profile fetch with real data
- ✅ Successful project fetch with package.json
- ✅ Successful project fetch with Cargo.toml
- ✅ 404 user → fallback to sample
- ✅ 404 repo → fallback to sample
- ✅ Rate limit (403) → fallback to sample
- ✅ Network error → fallback to sample
- ✅ Invalid slug format → fallback to sample
- ✅ Private repo (with token) → works
- ✅ Private repo (without token) → 404 → fallback

---

## 🔮 Future Enhancements (Phase 3+)

1. **GraphQL Unified Query** — Single round-trip for profile + repos + languages
2. **Repo Tree Inspection** — Detect mono-repos (pnpm/yarn/npm workspaces)
3. **CI/CD Detection** — Scan `.github/workflows/*.yml` for badge generation
4. **Contributor Graph** — `GET /repos/{owner}/{repo}/contributors` for Titan preset
5. **Sponsor Tiers** — GitHub GraphQL `sponsorshipsAsMaintainer` for sponsor section
6. **Dependency Graph** — `GET /repos/{owner}/{repo}/dependency-graph/snapshots` for supply chain badges
7. **Release Data** — `GET /repos/{owner}/{repo}/releases/latest` for version badge

---

## 📚 Reference Links

- [GitHub REST API v3](https://docs.github.com/en/rest)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [GitHub Rate Limiting](https://docs.github.com/en/rest/overview/rate-limits)
- [Repository Content API](https://docs.github.com/en/rest/repos/contents)
