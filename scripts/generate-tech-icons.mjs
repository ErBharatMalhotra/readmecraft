// Regenerates src/lib/tech-icons.ts from the `simple-icons` package.
//
// simple-icons ships ~3,500 brand SVGs (~16 MB unpacked). Importing the package
// at runtime would blow up a serverless bundle, so we bake a curated subset
// into a plain TS module and keep the dependency dev-only.
//
//   npm run gen:tech-icons
//
// Icon paths are CC0 (simple-icons). Brand marks remain trademarks of their
// owners; they are used here only to label a developer's own skills.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const ICONS_DIR = join(ROOT, 'node_modules', 'simple-icons', 'icons');
const DATA_FILE = join(ROOT, 'node_modules', 'simple-icons', 'data', 'simple-icons.json');
const OUT_FILE = join(ROOT, 'src', 'lib', 'tech-icons.ts');

// Curated set: languages, frameworks, data stores, infra, dev tooling and AI.
// Unknown slugs are skipped (and reported) so the list can drift safely.
const SLUGS = [
  // Languages
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'kotlin',
  'swift',
  'php',
  'ruby',
  'c',
  'cplusplus',
  'csharp',
  'scala',
  'haskell',
  'elixir',
  'dart',
  'lua',
  'r',
  'julia',
  'perl',
  'zig',
  'clojure',
  'erlang',
  'ocaml',
  'fortran',
  'solidity',
  'webassembly',
  'html5',
  'css',
  'sass',
  'gnubash',
  'powershell',
  'latex',
  'markdown',
  // Frontend
  'react',
  'vuedotjs',
  'angular',
  'svelte',
  'astro',
  'nuxt',
  'remix',
  'solid',
  'jquery',
  'tailwindcss',
  'bootstrap',
  'emberdotjs',
  'preact',
  'htmx',
  'webpack',
  'vite',
  'babel',
  'threedotjs',
  'd3',
  'framer',
  'redux',
  'chartdotjs',
  'storybook',
  // Backend & APIs
  'nodedotjs',
  'deno',
  'bun',
  'express',
  'nestjs',
  'fastapi',
  'django',
  'flask',
  'spring',
  'springboot',
  'dotnet',
  'laravel',
  'rubyonrails',
  'hibernate',
  'graphql',
  'apollographql',
  'trpc',
  'socketdotio',
  'grpc',
  'openapiinitiative',
  // Mobile & desktop
  'flutter',
  'react',
  'android',
  'electron',
  'tauri',
  'qt',
  'dotnet',
  'xamarin',
  // Data & storage
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'sqlite',
  'elasticsearch',
  'clickhouse',
  'apachecassandra',
  'neo4j',
  'supabase',
  'firebase',
  'prisma',
  'mongoose',
  'sequelize',
  'duckdb',
  'apachespark',
  'apachehadoop',
  'apachekafka',
  'rabbitmq',
  'natsdotio',
  // Cloud & infra
  'docker',
  'kubernetes',
  'terraform',
  'ansible',
  'amazonwebservices',
  'googlecloud',
  'microsoftazure',
  'digitalocean',
  'cloudflare',
  'vercel',
  'netlify',
  'heroku',
  'railway',
  'render',
  'nginx',
  'apache',
  'caddy',
  'traefikproxy',
  'linux',
  'ubuntu',
  'debian',
  'alpinelinux',
  'centos',
  'prometheus',
  'grafana',
  'datadog',
  'sentry',
  'jenkins',
  'githubactions',
  'gitlab',
  'circleci',
  'travisci',
  'argo',
  'pulumi',
  'vagrant',
  'packer',
  // Dev tooling
  'git',
  'github',
  'gitlab',
  'bitbucket',
  'neovim',
  'vim',
  'visualstudiocode',
  'intellijidea',
  'xcode',
  'androidstudio',
  'postman',
  'insomnia',
  'figma',
  'notion',
  'slack',
  'discord',
  'jest',
  'vitest',
  'cypress',
  'playwright',
  'selenium',
  'mocha',
  'pytest',
  'eslint',
  'prettier',
  'npm',
  'yarn',
  'pnpm',
  'vite',
  // AI / data science
  'tensorflow',
  'pytorch',
  'scikitlearn',
  'pandas',
  'numpy',
  'jupyter',
  'opencv',
  'huggingface',
  'openai',
  'anthropic',
  'langchain',
  'ollama',
  'keras',
  'matplotlib',
  'plotly',
];

// GitHub language / common display names → simple-icons slug.
const ALIASES = {
  'c++': 'cplusplus',
  'c#': 'csharp',
  'f#': 'fsharp',
  'objective-c': 'apple',
  'objective-c++': 'apple',
  shell: 'gnubash',
  'shell script': 'gnubash',
  sh: 'gnubash',
  html: 'html5',
  css: 'css',
  scss: 'sass',
  sass: 'sass',
  less: 'less',
  vue: 'vuedotjs',
  'vue.js': 'vuedotjs',
  'next.js': 'nextdotjs',
  nextjs: 'nextdotjs',
  'node.js': 'nodedotjs',
  nodejs: 'nodedotjs',
  node: 'nodedotjs',
  'react native': 'react',
  'react.js': 'react',
  'tailwind css': 'tailwindcss',
  tailwind: 'tailwindcss',
  golang: 'go',
  postgres: 'postgresql',
  postgres: 'postgresql',
  mongo: 'mongodb',
  aws: 'amazonwebservices',
  'amazon web services': 'amazonwebservices',
  gcp: 'googlecloud',
  'google cloud': 'googlecloud',
  azure: 'microsoftazure',
  k8s: 'kubernetes',
  'ci/cd': 'githubactions',
  'github actions': 'githubactions',
  'three.js': 'threedotjs',
  threejs: 'threedotjs',
  'd3.js': 'd3dotjs',
  three: 'threedotjs',
  'jupyter notebook': 'jupyter',
  'jupyter notebooks': 'jupyter',
  'vim script': 'vim',
  powershell: 'powershell',
  'tensorflow.js': 'tensorflow',
  'vs code': 'visualstudiocode',
  vscode: 'visualstudiocode',
  'rest api': '',
  'rest apis': '',
  'ruby on rails': 'rails',
  'spring boot': 'springboot',
  '.net': 'dotnet',
  dotnet: 'dotnet',
  'graphql api': 'graphql',
};

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function escapeAttr(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const meta = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
const metaBySlug = new Map(meta.map((icon) => [icon.slug, icon]));

const collected = new Map();
const missing = [];

for (const slug of [...new Set(SLUGS)]) {
  const svgPath = join(ICONS_DIR, `${slug}.svg`);
  if (!existsSync(svgPath)) {
    missing.push(slug);
    continue;
  }
  const svg = readFileSync(svgPath, 'utf8');
  const paths = [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
  if (paths.length === 0) {
    missing.push(`${slug} (no path)`);
    continue;
  }
  const info = metaBySlug.get(slug);
  collected.set(slug, {
    label: info?.title || slug,
    hex: (info?.hex || '888888').toUpperCase(),
    path: paths.join(' '),
  });
}

const sorted = [...collected.entries()].sort((a, b) => a[0].localeCompare(b[0]));

const lines = [];
lines.push('// AUTO-GENERATED by scripts/generate-tech-icons.mjs — do not edit by hand.');
lines.push('// Icon paths: simple-icons (CC0-1.0). Brand marks are trademarks of their owners.');
lines.push('');
lines.push('export interface TechIcon {');
lines.push('  label: string;');
lines.push('  hex: string;');
lines.push('  path: string;');
lines.push('}');
lines.push('');
lines.push('/** Curated simple-icons subset keyed by simple-icons slug. */');
lines.push('export const TECH_ICONS: Record<string, TechIcon> = {');
for (const [slug, icon] of sorted) {
  lines.push(`  ${JSON.stringify(slug)}: {`);
  lines.push(`    label: ${JSON.stringify(icon.label)},`);
  lines.push(`    hex: ${JSON.stringify(icon.hex)},`);
  lines.push(`    path: ${JSON.stringify(icon.path)},`);
  lines.push('  },');
}
lines.push('};');
lines.push('');
lines.push('/** Display name / GitHub language name -> simple-icons slug. */');
lines.push('export const TECH_ICON_ALIASES: Record<string, string> = {');
for (const [alias, slug] of Object.entries(ALIASES).sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`  ${JSON.stringify(alias)}: ${JSON.stringify(slug)},`);
}
lines.push('};');
lines.push('');
lines.push('function key(value: string): string {');
lines.push("  return String(value || '').trim().toLowerCase();");
lines.push('}');
lines.push('');
lines.push('/** Resolves a skill / language name to an icon, or null when we have none. */');
lines.push('export function findTechIcon(name: string): { slug: string; icon: TechIcon } | null {');
lines.push('  const raw = key(name);');
lines.push('  if (!raw) return null;');
lines.push('  const aliased = TECH_ICON_ALIASES[raw];');
lines.push('  const candidates = [aliased, raw];');
lines.push('  for (const candidate of candidates) {');
lines.push('    if (!candidate) continue;');
lines.push('    const direct = TECH_ICONS[candidate];');
lines.push('    if (direct) return { slug: candidate, icon: direct };');
lines.push('    const squashed = candidate.replace(/[^a-z0-9]/g, "");');
lines.push('    const bySquashed = TECH_ICONS[squashed];');
lines.push('    if (bySquashed) return { slug: squashed, icon: bySquashed };');
lines.push('  }');
lines.push('  return null;');
lines.push('}');
lines.push('');

writeFileSync(OUT_FILE, lines.join('\n'), 'utf8');

const bytes = Buffer.byteLength(lines.join('\n'), 'utf8');
console.log(`✔ ${sorted.length} icons -> ${OUT_FILE} (${(bytes / 1024).toFixed(1)} KB)`);
if (missing.length) console.log(`⚠ skipped: ${missing.join(', ')}`);
