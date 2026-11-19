// ============================================================================
// ReadmeCraft — Architecture analyser
// Static analysis only: dependency manifests + the repository's top-level
// folders decide which layer (client / API / data / tooling) a technology
// belongs to. No model, no guessing, no invented boxes — anything we cannot
// back with a file we read is simply not drawn.
// ============================================================================

export type ArchLayerName = 'client' | 'api' | 'data' | 'tooling';

export interface ArchitectureModel {
  owner: string;
  repo: string;
  defaultBranch: string;
  /** Detected technologies per layer, already ordered by importance. */
  layers: Record<ArchLayerName, string[]>;
  /** Files the classification actually came from, e.g. ["package.json", "src/"]. */
  sources: string[];
  /** Manifests that were fetched successfully. */
  manifests: string[];
  /** True when no manifest could be read — the diagram must say so. */
  degraded: boolean;
}

interface Rule {
  /** Who the technology is in the stack. */
  layer: ArchLayerName;
  /** How it is drawn (nicer than the package name). */
  label: string;
}

// Ordered: the first match wins, so web frameworks beat generic utilities.
const RULES: Record<string, Rule> = {
  // ---- Client -------------------------------------------------------------
  next: { layer: 'client', label: 'Next.js' },
  nuxt: { layer: 'client', label: 'Nuxt' },
  react: { layer: 'client', label: 'React' },
  'react-dom': { layer: 'client', label: 'React' },
  vue: { layer: 'client', label: 'Vue' },
  svelte: { layer: 'client', label: 'Svelte' },
  '@sveltejs/kit': { layer: 'client', label: 'SvelteKit' },
  astro: { layer: 'client', label: 'Astro' },
  solid: { layer: 'client', label: 'Solid' },
  'solid-js': { layer: 'client', label: 'Solid' },
  angular: { layer: 'client', label: 'Angular' },
  '@angular/core': { layer: 'client', label: 'Angular' },
  remix: { layer: 'client', label: 'Remix' },
  '@remix-run/react': { layer: 'client', label: 'Remix' },
  gatsby: { layer: 'client', label: 'Gatsby' },
  expo: { layer: 'client', label: 'Expo' },
  'react-native': { layer: 'client', label: 'React Native' },
  electron: { layer: 'client', label: 'Electron' },
  tailwindcss: { layer: 'client', label: 'Tailwind' },
  'styled-components': { layer: 'client', label: 'styled' },
  '@emotion/react': { layer: 'client', label: 'Emotion' },
  '@tanstack/react-query': { layer: 'client', label: 'TanStack Query' },
  'react-query': { layer: 'client', label: 'React Query' },
  redux: { layer: 'client', label: 'Redux' },
  '@reduxjs/toolkit': { layer: 'client', label: 'Redux' },
  zustand: { layer: 'client', label: 'Zustand' },
  jotai: { layer: 'client', label: 'Jotai' },
  framer: { layer: 'client', label: 'Framer' },
  'framer-motion': { layer: 'client', label: 'Framer Motion' },
  three: { layer: 'client', label: 'Three.js' },
  'chart.js': { layer: 'client', label: 'Chart.js' },
  recharts: { layer: 'client', label: 'Recharts' },
  d3: { layer: 'client', label: 'D3' },
  vite: { layer: 'client', label: 'Vite' },

  // ---- API ----------------------------------------------------------------
  express: { layer: 'api', label: 'Express' },
  fastify: { layer: 'api', label: 'Fastify' },
  hono: { layer: 'api', label: 'Hono' },
  koa: { layer: 'api', label: 'Koa' },
  '@nestjs/core': { layer: 'api', label: 'NestJS' },
  '@hapi/hapi': { layer: 'api', label: 'hapi' },
  '@trpc/server': { layer: 'api', label: 'tRPC' },
  graphql: { layer: 'api', label: 'GraphQL' },
  'apollo-server': { layer: 'api', label: 'Apollo' },
  '@apollo/server': { layer: 'api', label: 'Apollo' },
  socket: { layer: 'api', label: 'Sockets' },
  'socket.io': { layer: 'api', label: 'Socket.IO' },
  stripe: { layer: 'api', label: 'Stripe' },
  openai: { layer: 'api', label: 'OpenAI API' },
  zod: { layer: 'api', label: 'Zod' },
  langchain: { layer: 'api', label: 'LangChain' },
  fastapi: { layer: 'api', label: 'FastAPI' },
  flask: { layer: 'api', label: 'Flask' },
  django: { layer: 'api', label: 'Django' },
  'express-graphql': { layer: 'api', label: 'GraphQL' },
  gin: { layer: 'api', label: 'Gin' },
  echo: { layer: 'api', label: 'Echo' },
  axum: { layer: 'api', label: 'Axum' },
  actix: { layer: 'api', label: 'Actix' },

  // ---- Data ---------------------------------------------------------------
  prisma: { layer: 'data', label: 'Prisma' },
  '@prisma/client': { layer: 'data', label: 'Prisma' },
  drizzle: { layer: 'data', label: 'Drizzle' },
  'drizzle-orm': { layer: 'data', label: 'Drizzle' },
  typeorm: { layer: 'data', label: 'TypeORM' },
  sequelize: { layer: 'data', label: 'Sequelize' },
  mongoose: { layer: 'data', label: 'MongoDB' },
  mongodb: { layer: 'data', label: 'MongoDB' },
  pg: { layer: 'data', label: 'PostgreSQL' },
  postgres: { layer: 'data', label: 'PostgreSQL' },
  mysql: { layer: 'data', label: 'MySQL' },
  mysql2: { layer: 'data', label: 'MySQL' },
  sqlite3: { layer: 'data', label: 'SQLite' },
  'better-sqlite3': { layer: 'data', label: 'SQLite' },
  ioredis: { layer: 'data', label: 'Redis' },
  redis: { layer: 'data', label: 'Redis' },
  '@supabase/supabase-js': { layer: 'data', label: 'Supabase' },
  '@planetscale/database': { layer: 'data', label: 'PlanetScale' },
  '@vercel/postgres': { layer: 'data', label: 'Vercel Postgres' },
  'firebase-admin': { layer: 'data', label: 'Firebase' },
  '@aws-sdk/client-s3': { layer: 'data', label: 'S3' },
  elasticsearch: { layer: 'data', label: 'Elasticsearch' },
  sqlalchemy: { layer: 'data', label: 'SQLAlchemy' },
  psycopg2: { layer: 'data', label: 'PostgreSQL' },
  'psycopg2-binary': { layer: 'data', label: 'PostgreSQL' },
  pymongo: { layer: 'data', label: 'MongoDB' },
  gorm: { layer: 'data', label: 'GORM' },
  diesel: { layer: 'data', label: 'Diesel' },
  sqlx: { layer: 'data', label: 'sqlx' },

  // ---- Tooling ------------------------------------------------------------
  typescript: { layer: 'tooling', label: 'TypeScript' },
  jest: { layer: 'tooling', label: 'Jest' },
  vitest: { layer: 'tooling', label: 'Vitest' },
  playwright: { layer: 'tooling', label: 'Playwright' },
  cypress: { layer: 'tooling', label: 'Cypress' },
  eslint: { layer: 'tooling', label: 'ESLint' },
  prettier: { layer: 'tooling', label: 'Prettier' },
  turbo: { layer: 'tooling', label: 'Turborepo' },
  nx: { layer: 'tooling', label: 'Nx' },
  webpack: { layer: 'tooling', label: 'Webpack' },
  esbuild: { layer: 'tooling', label: 'esbuild' },
  docker: { layer: 'tooling', label: 'Docker' },
  'aws-cdk-lib': { layer: 'tooling', label: 'AWS CDK' },
  wrangler: { layer: 'tooling', label: 'Wrangler' },
  '@cloudflare/workers-types': { layer: 'tooling', label: 'Cloudflare' },
  msw: { layer: 'tooling', label: 'MSW' },
  pytest: { layer: 'tooling', label: 'pytest' },
  ruff: { layer: 'tooling', label: 'Ruff' },
};

// Folder names that are worth reading even when the manifest is unhelpful.
const DIR_RULES: Record<string, Rule> = {
  apps: { layer: 'client', label: 'apps/' },
  app: { layer: 'client', label: 'app/' },
  components: { layer: 'client', label: 'components/' },
  pages: { layer: 'client', label: 'pages/' },
  public: { layer: 'client', label: 'public/' },
  styles: { layer: 'client', label: 'styles/' },
  ui: { layer: 'client', label: 'ui/' },
  api: { layer: 'api', label: 'api/' },
  server: { layer: 'api', label: 'server/' },
  backend: { layer: 'api', label: 'backend/' },
  routes: { layer: 'api', label: 'routes/' },
  controllers: { layer: 'api', label: 'controllers/' },
  handlers: { layer: 'api', label: 'handlers/' },
  graphql: { layer: 'api', label: 'graphql/' },
  db: { layer: 'data', label: 'db/' },
  database: { layer: 'data', label: 'database/' },
  prisma: { layer: 'data', label: 'prisma/' },
  migrations: { layer: 'data', label: 'migrations/' },
  models: { layer: 'data', label: 'models/' },
  schema: { layer: 'data', label: 'schema/' },
  repositories: { layer: 'data', label: 'repositories/' },
  scripts: { layer: 'tooling', label: 'scripts/' },
  '.github': { layer: 'tooling', label: '.github/' },
  tests: { layer: 'tooling', label: 'tests/' },
  __tests__: { layer: 'tooling', label: 'tests/' },
  infra: { layer: 'tooling', label: 'infra/' },
  docker: { layer: 'tooling', label: 'docker/' },
};

const MANIFESTS = [
  'package.json',
  'requirements.txt',
  'pyproject.toml',
  'go.mod',
  'Cargo.toml',
  'composer.json',
  'Gemfile',
];

const MAX_PER_LAYER = 4;

function pushUnique(list: string[], value: string) {
  if (list.length < MAX_PER_LAYER && !list.includes(value)) list.push(value);
}

function lookup(name: string): Rule | undefined {
  // Strip a trailing version spec ("fastapi>=0.100") but keep scoped names
  // intact ("@tanstack/react-query"). Exact match only — never substrings.
  const normalized = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[<>=!~;,\s].*$/, '');
  if (!normalized) return undefined;
  return RULES[normalized];
}

/**
 * Pulls package names out of a manifest by parsing its syntax, never by
 * substring-matching the whole file. Substring matching produced nonsense like
 * "Expo" on a Python repo and "Gin" inside the word "logging".
 */
function namesFromManifest(name: string, content: string): string[] {
  const names: string[] = [];
  const lower = name.toLowerCase();

  if (lower === 'requirements.txt') {
    for (const raw of content.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#') || line.startsWith('-')) continue;
      const match = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)/);
      if (match) names.push(match[1]);
    }
    return names;
  }

  if (lower === 'go.mod') {
    for (const raw of content.split(/\r?\n/)) {
      const match = raw.trim().match(/^(?:require\s+)?([a-z0-9.-]+\.[a-z]{2,}\/[^\s]+)\s+v/);
      if (match) names.push(match[1].split('/').pop() || '');
    }
    return names;
  }

  if (lower === 'composer.json') {
    try {
      const pkg = JSON.parse(content) as {
        require?: Record<string, string>;
        'require-dev'?: Record<string, string>;
      };
      for (const key of Object.keys({ ...pkg.require, ...pkg['require-dev'] })) {
        names.push(key.split('/').pop() || '');
      }
    } catch {
      // Unparseable composer file: treat as empty rather than guessing.
    }
    return names;
  }

  // pyproject.toml, Cargo.toml, Gemfile: line-oriented declarations.
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    // pyproject/poetry: "fastapi>=0.115",
    const quoted = line.match(/^["']([A-Za-z0-9][A-Za-z0-9._-]*)["']\s*([<>=!~;,\]]|$)/);
    if (quoted) {
      names.push(quoted[1]);
      continue;
    }
    // Cargo/setup: serde = { version = "1" }
    const assigned = line.match(/^([A-Za-z0-9][A-Za-z0-9._-]*)\s*=/);
    if (assigned) {
      names.push(assigned[1]);
      continue;
    }
    // Gemfile: gem "rails"
    const gem = line.match(/^gem\s+["']([A-Za-z0-9._-]+)["']/);
    if (gem) names.push(gem[1]);
  }
  return names;
}

export interface ManifestInput {
  packageJson?: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  text?: { name: string; content: string };
}

/**
 * Pure classifier: turns manifests + folder names into the four layers.
 * Exported so it can be tested without any network access.
 */
export function analyzeArchitecture(input: {
  owner: string;
  repo: string;
  defaultBranch?: string;
  packageJson?: ManifestInput['packageJson'];
  files?: Array<{ name: string; content: string }>;
  directories?: string[];
}): ArchitectureModel {
  const layers: Record<ArchLayerName, string[]> = {
    client: [],
    api: [],
    data: [],
    tooling: [],
  };
  const sources: string[] = [];
  const manifests: string[] = [];
  const seen = new Set<string>();

  const add = (rule: Rule, source: string) => {
    if (seen.has(rule.label)) return;
    const bucket = layers[rule.layer];
    if (bucket.length >= MAX_PER_LAYER) return;
    seen.add(rule.label);
    bucket.push(rule.label);
    if (!sources.includes(source)) sources.push(source);
  };

  if (input.packageJson) {
    manifests.push('package.json');
    const deps = {
      ...(input.packageJson.dependencies || {}),
      ...(input.packageJson.devDependencies || {}),
    };
    for (const name of Object.keys(deps)) {
      const rule = lookup(name);
      if (rule) add(rule, 'package.json');
    }
  }

  for (const file of input.files || []) {
    if (!file.content) continue;
    manifests.push(file.name);
    for (const name of namesFromManifest(file.name, file.content)) {
      const rule = name ? lookup(name) : undefined;
      if (rule) add(rule, file.name);
    }
  }

  for (const dir of input.directories || []) {
    const rule = DIR_RULES[dir.toLowerCase()];
    if (rule) add(rule, `${dir}/`);
  }

  return {
    owner: input.owner,
    repo: input.repo,
    defaultBranch: input.defaultBranch || 'main',
    layers,
    sources,
    manifests: [...new Set(manifests)],
    degraded: manifests.length === 0,
  };
}

// ---------------------------------------------------------------------------
// Fetching (public repos, unauthenticated-friendly with a token when present)
//
// Request budget on a cold cache: one REST call (the root contents listing) plus
// one raw `package.json` probe, fired in parallel. The default branch comes from
// the listing's download_url instead of a separate /repos call, and every other
// manifest is fetched only when package.json failed to explain the stack — and
// only if the root listing proved the file exists. A typical Node repo therefore
// costs 2 calls, not 9, and we never 404-probe manifests that are not there.
// ---------------------------------------------------------------------------

interface RootEntry {
  name: string;
  type: string;
  download_url?: string | null;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
// A degraded model means "we could not read anything", which is often a
// transient 403/rate-limit rather than the truth about the repo. Cache it for
// minutes, not hours, so a hiccup does not blank the diagram all day.
const DEGRADED_TTL_MS = 2 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const MAX_FALLBACK_MANIFESTS = 3;

const cache = new Map<string, { model: ArchitectureModel; timestamp: number }>();
// Cold concurrent requests for the same repo share one in-flight fetch instead
// of each spending their own GitHub calls.
const inflight = new Map<string, Promise<ArchitectureModel>>();

function githubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'readmecraft-architecture',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function getJson(url: string, headers: Record<string, string>): Promise<any> {
  try {
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (res.status === 401 || res.status === 403) {
      // A revoked deployment token should not blank a public diagram.
      const retry = await fetch(url, { headers: githubHeaders(), cache: 'no-store' });
      if (!retry.ok) return null;
      return await retry.json();
    }
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

/** raw.githubusercontent.com accepts `HEAD` as a ref, so we can probe the
 * manifest before (and in parallel with) the branch-aware contents listing. */
function rawUrl(owner: string, repo: string, ref: string, path: string) {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;
}

/** The listing's download_url bakes in the default branch, so parsing it saves
 * a whole /repos call. Returns null when the URL is missing or unrecognised. */
function branchFromEntry(entry?: RootEntry): string | null {
  const url = entry?.download_url;
  if (!url) return null;
  const match = url.match(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/(.+)$/);
  if (!match) return null;
  const parts = match[1].split('/');
  parts.pop(); // the file name
  return parts.join('/') || null;
}

function readCache(key: string): ArchitectureModel | null {
  const hit = cache.get(key);
  if (!hit) return null;
  const ttl = hit.model.degraded ? DEGRADED_TTL_MS : CACHE_TTL_MS;
  if (Date.now() - hit.timestamp >= ttl) {
    cache.delete(key);
    return null;
  }
  return hit.model;
}

function writeCache(key: string, model: ArchitectureModel) {
  if (!cache.has(key) && cache.size >= MAX_CACHE_ENTRIES) {
    // Insertion order = FIFO; drop the oldest entry to keep memory flat.
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { model, timestamp: Date.now() });
}

export async function fetchArchitectureModel(
  owner: string,
  repo: string,
  options: { token?: string; userToken?: string } = {}
): Promise<ArchitectureModel> {
  const token = options.userToken || options.token || process.env.GITHUB_TOKEN;
  const key = `${owner}/${repo}`.toLowerCase();

  const cached = readCache(key);
  if (cached) return cached;
  const running = inflight.get(key);
  if (running) return running;

  const job = loadModel(owner, repo, token)
    .then((model) => {
      writeCache(key, model);
      return model;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, job);
  return job;
}

async function loadModel(owner: string, repo: string, token?: string): Promise<ArchitectureModel> {
  const [rootContents, packageJsonRaw] = await Promise.all([
    getJson(`https://api.github.com/repos/${owner}/${repo}/contents/`, githubHeaders(token)),
    getText(rawUrl(owner, repo, 'HEAD', 'package.json')),
  ]);

  const entries: RootEntry[] = Array.isArray(rootContents)
    ? rootContents.filter(
        (entry: any): entry is RootEntry =>
          entry && typeof entry.name === 'string' && typeof entry.type === 'string'
      )
    : [];

  const directories = entries.filter((entry) => entry.type === 'dir').map((entry) => entry.name);
  const packageEntry = entries.find(
    (entry) => entry.type === 'file' && entry.name.toLowerCase() === 'package.json'
  );
  const defaultBranch = branchFromEntry(packageEntry) || 'main';

  let packageJson: ManifestInput['packageJson'];
  if (packageJsonRaw) {
    try {
      packageJson = JSON.parse(packageJsonRaw);
    } catch {
      packageJson = undefined;
    }
  }

  const packageDeps = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };
  // Only pay for extra manifests when package.json explained nothing — a
  // polyglot root with eslint-only deps still gets its Python/Go layers found.
  const packageExplainsStack = Object.keys(packageDeps).some((name) => Boolean(lookup(name)));

  const files: Array<{ name: string; content: string }> = [];
  if (!packageExplainsStack) {
    const candidates = entries
      .filter(
        (entry) =>
          entry.type === 'file' &&
          entry.name.toLowerCase() !== 'package.json' &&
          MANIFESTS.includes(entry.name)
      )
      .slice(0, MAX_FALLBACK_MANIFESTS);

    const fetched = await Promise.all(
      candidates.map(async (entry) => ({
        name: entry.name,
        // download_url keeps the real branch even when we had to guess 'main'.
        content: await getText(
          entry.download_url || rawUrl(owner, repo, defaultBranch, entry.name)
        ),
      }))
    );
    files.push(
      ...fetched.filter((entry): entry is { name: string; content: string } =>
        Boolean(entry.content)
      )
    );
  }

  return analyzeArchitecture({
    owner,
    repo,
    defaultBranch,
    packageJson,
    files,
    directories,
  });
}

/** Test/ops helper: drop the in-memory cache and any in-flight fetches. */
export function clearArchitectureCache() {
  cache.clear();
  inflight.clear();
}
