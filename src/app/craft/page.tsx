'use client';

import { useState } from 'react';
import { THEME_LIST } from '@/lib/themes';

type ProjectType = 'cli' | 'library' | 'webapp' | 'api' | 'mobile' | 'unknown';

interface RepoAnalysis {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  topics: string[];
  packageJson?: any;
  cargoToml?: string;
  pyprojectToml?: string;
  readme?: string;
  license?: { spdxId?: string | null; name?: string | null } | null;
}

interface CraftedReadme {
  markdown: string;
  badges: string[];
  projectType: ProjectType;
}

const PROJECT_TYPES: Record<ProjectType, { label: string; icon: string; color: string }> = {
  cli: { label: 'CLI Tool', icon: '💻', color: '#10b981' },
  library: { label: 'Library/SDK', icon: '📦', color: '#8b5cf6' },
  webapp: { label: 'Web Application', icon: '🌐', color: '#3b82f6' },
  api: { label: 'API Service', icon: '🔌', color: '#f59e0b' },
  mobile: { label: 'Mobile App', icon: '📱', color: '#ec4899' },
  unknown: { label: 'Unknown', icon: '❓', color: '#64748b' },
};

export default function CraftPage() {
  const [step, setStep] = useState<'input' | 'analyzing' | 'result' | 'error'>('input');
  const [repoUrl, setRepoUrl] = useState('');
  const [analysis, setAnalysis] = useState<RepoAnalysis | null>(null);
  const [crafted, setCrafted] = useState<CraftedReadme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState('gta6');
  const [copied, setCopied] = useState(false);

  const themes = THEME_LIST;

  const parseGithubUrl = (url: string): { owner: string; repo: string } | null => {
    const patterns = [
      /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/,
      /github\.com\/([^/]+)\/([^/]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
    }
    return null;
  };

  const detectProjectType = (data: RepoAnalysis): ProjectType => {
    const { packageJson, cargoToml, pyprojectToml, topics, language } = data;

    // Check package.json for CLI indicators
    if (packageJson) {
      const bin = packageJson.bin || {};
      const scripts = packageJson.scripts || {};
      // Runtime dependencies decide what the package *is*; devDependencies only
      // say what it is tested with (got lists express in devDeps and was being
      // classified as an API service instead of a library).
      const deps = packageJson.dependencies || {};

      // CLI: has bin entry or commander/yargs/oclif
      if (Object.keys(bin).length > 0) return 'cli';
      if (deps.commander || deps.yargs || deps.oclif || deps['@clack/prompts']) return 'cli';
      if (scripts.cli || scripts.start?.includes('ts-node') || scripts.dev?.includes('tsx'))
        return 'cli';

      // Web App: next.js, react, vue, svelte, remix, astro
      if (
        deps.next ||
        deps.react ||
        deps.vue ||
        deps.svelte ||
        deps['@remix-run/react'] ||
        deps.astro
      )
        return 'webapp';

      // API: express, fastify, hono, elysia, nestjs, trpc
      if (
        deps.express ||
        deps.fastify ||
        deps.hono ||
        deps.elysia ||
        deps['@nestjs/core'] ||
        deps['@trpc/server']
      )
        return 'api';

      // Library: has main/module/exports, no bin, not a framework
      if (packageJson.main || packageJson.module || packageJson.exports) return 'library';
    }

    // Check Cargo.toml
    if (cargoToml) {
      if (cargoToml.includes('[[bin]]')) return 'cli';
      if (cargoToml.includes('cdylib') || cargoToml.includes('rlib')) return 'library';
      if (
        cargoToml.includes('actix-web') ||
        cargoToml.includes('axum') ||
        cargoToml.includes('rocket') ||
        cargoToml.includes('warp')
      )
        return 'api';
      if (
        cargoToml.includes('tauri') ||
        cargoToml.includes('dioxus') ||
        cargoToml.includes('leptos') ||
        cargoToml.includes('yew')
      )
        return 'webapp';
    }

    // Check pyproject.toml
    if (pyprojectToml) {
      if (
        pyprojectToml.includes('console_scripts') ||
        pyprojectToml.includes('click') ||
        pyprojectToml.includes('typer') ||
        pyprojectToml.includes('argparse')
      )
        return 'cli';
      if (
        pyprojectToml.includes('fastapi') ||
        pyprojectToml.includes('flask') ||
        pyprojectToml.includes('django') ||
        pyprojectToml.includes('starlette')
      )
        return 'api';
      if (
        pyprojectToml.includes('django') ||
        pyprojectToml.includes('streamlit') ||
        pyprojectToml.includes('gradio') ||
        pyprojectToml.includes('nicegui')
      )
        return 'webapp';
      return 'library';
    }

    // Check topics
    const topicStr = topics.join(' ').toLowerCase();
    if (topicStr.includes('cli') || topicStr.includes('command-line')) return 'cli';
    if (topicStr.includes('library') || topicStr.includes('sdk') || topicStr.includes('package'))
      return 'library';
    if (
      topicStr.includes('api') ||
      topicStr.includes('backend') ||
      topicStr.includes('microservice')
    )
      return 'api';
    if (
      topicStr.includes('web') ||
      topicStr.includes('frontend') ||
      topicStr.includes('react') ||
      topicStr.includes('vue')
    )
      return 'webapp';
    if (
      topicStr.includes('mobile') ||
      topicStr.includes('android') ||
      topicStr.includes('ios') ||
      topicStr.includes('flutter') ||
      topicStr.includes('react-native')
    )
      return 'mobile';

    return 'unknown';
  };

  const generateBadgeUrls = (
    owner: string,
    repo: string,
    projectType: ProjectType,
    theme: string
  ) => {
    const base = 'https://readme.bharatdn.com/api/badges';
    const themeParam = `&theme=${theme}`;
    const badges = [
      `${base}?username=${owner}&type=composite&include=stats,trophies,snake,heatmap${themeParam}`,
    ];

    // Add project-specific badges
    switch (projectType) {
      case 'cli':
        badges.push(
          `${base}?username=${owner}&type=code-pulse${themeParam}`,
          `${base}?username=${owner}&type=contribution-mountain${themeParam}`
        );
        break;
      case 'library':
        badges.push(
          `${base}?username=${owner}&type=skill-radar${themeParam}`,
          `${base}?username=${owner}&type=repo-constellation${themeParam}`
        );
        break;
      case 'webapp':
        badges.push(
          `${base}?username=${owner}&type=tech-galaxy${themeParam}`,
          `${base}?username=${owner}&type=contribution-flow${themeParam}`
        );
        break;
      case 'api':
        badges.push(
          `${base}?username=${owner}&type=code-time-heatmap${themeParam}`,
          `${base}?username=${owner}&type=language-race${themeParam}`
        );
        break;
    }

    return badges;
  };

  const generateMarkdown = (
    data: RepoAnalysis,
    projectType: ProjectType,
    badges: string[],
    theme: string
  ): string => {
    const {
      name,
      description,
      language,
      stars,
      forks,
      topics,
      packageJson,
      cargoToml,
      pyprojectToml,
    } = data;
    const typeInfo = PROJECT_TYPES[projectType];
    const baseUrl = `https://github.com/${data.name}`;

    let md = `# ${name}\n\n`;

    // Badge row
    md += badges.map((url) => `<img src="${url}" alt="Badge" />`).join(' ') + '\n\n';

    md += `> ${description || 'No description provided.'}\n\n`;
    md += `---\n\n`;

    // Quick links
    md += `## 🔗 Quick Links\n\n`;
    md += `- [📖 Documentation](${baseUrl}#readme)\n`;
    md += `- [🐛 Report Bug](${baseUrl}/issues)\n`;
    md += `- [💡 Request Feature](${baseUrl}/issues/new)\n`;
    if (packageJson?.homepage) md += `- [🌐 Homepage](${packageJson.homepage})\n`;
    md += `\n`;

    // Install section (varies by type)
    md += `## 📥 Installation\n\n`;
    if (projectType === 'cli') {
      md += `\`\`\`bash\n# npm\nnpm install -g ${name}\n\n# or npx (no install needed)\nnpx ${name} --help\n\n# pnpm\npnpm add -g ${name}\n\n# yarn\nyarn global add ${name}\n\`\`\`\n\n`;
      if (packageJson?.bin) {
        md += `**Binary name:** \`${Object.keys(packageJson.bin)[0]}\`\n\n`;
      }
    } else if (projectType === 'library') {
      md += `\`\`\`bash\n# npm\nnpm install ${name}\n\n# pnpm\npnpm add ${name}\n\n# yarn\nyarn add ${name}\n\`\`\`\n\n`;
    } else if (projectType === 'api') {
      md += `\`\`\`bash\n# Docker\ndocker pull ghcr.io/${name}:latest\n\`\`\`\n\n`;
      md += `\`\`\`bash\n# Or run locally\nnpm install\nnpm run dev\n\`\`\`\n\n`;
    } else if (projectType === 'webapp') {
      md += `\`\`\`bash\n# Clone & install\ngit clone ${baseUrl}.git\ncd ${name}\npm install\n\n# Development\nnpm run dev\n\n# Build\nnpm run build\n\`\`\`\n\n`;
    } else {
      md += `\`\`\`bash\ngit clone ${baseUrl}.git\ncd ${name}\n# Follow setup instructions\n\`\`\`\n\n`;
    }

    // Usage section
    md += `## 🚀 Quick Start\n\n`;
    if (projectType === 'cli') {
      md += `\`\`\`bash\n${Object.keys(packageJson?.bin || {})[0] || name} --help\n\n# Or with npx\nnpx ${name} --help\n\`\`\`\n\n`;
      md += `### Commands\n\n`;
      if (packageJson?.bin) {
        const binName = Object.keys(packageJson.bin)[0];
        md += `- \`${binName} --help\` - Show help\n`;
        md += `- \`${binName} --version\` - Show version\n`;
      }
      md += `\n`;
    } else if (projectType === 'library') {
      md += `\`\`\`typescript\nimport ${name
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(
          ''
        )} from '${name}';\n\n// Basic usage\nconst result = await ${name.split('-')[0]}();\n\`\`\`\n\n`;
      md += `See [API Documentation](${baseUrl}/blob/main/docs/API.md) for full reference.\n\n`;
    } else if (projectType === 'api') {
      md += `### Base URL\n\n\`\`\`\nhttps://api.${name.replace(/[^a-z0-9]/gi, '')}.com/v1\n\`\`\`\n\n`;
      md += `### Authentication\n\n\`\`\`bash\ncurl -H "Authorization: Bearer YOUR_TOKEN" \\\n  https://api.example.com/v1/resource\n\`\`\`\n\n`;
      md += `### Endpoints\n\n| Method | Endpoint | Description |\n|--------|----------|-------------|\n| GET    | /health  | Health check |\n| GET    | /v1/resource | List resources |\n| POST   | /v1/resource | Create resource |\n\n`;
    } else if (projectType === 'webapp') {
      md += `Visit the deployed app: [${name}](${packageJson?.homepage || baseUrl})\n\n`;
      md += `### Environment Variables\n\n\`\`\`bash\n# Copy example\ncp .env.example .env\n\n# Edit with your values\n# DATABASE_URL=...\n# NEXT_PUBLIC_API_URL=...\n\`\`\`\n\n`;
    }

    // Configuration (for library/api/cli)
    if (['cli', 'library', 'api'].includes(projectType)) {
      md += `## ⚙️ Configuration\n\n`;
      if (projectType === 'cli' && packageJson) {
        md += `Configure via \`${name}.config.js\` or environment variables:\n\n`;
        md += `\`\`\`js\n// ${name}.config.js\nexport default {\n  // your config\n};\n\`\`\`\n\n`;
      } else if (projectType === 'api') {
        md += `| Variable | Required | Default | Description |\n|----------|----------|---------|-------------|\n| PORT | No | 3000 | Server port |\n| DATABASE_URL | Yes | - | Database connection |\n| JWT_SECRET | Yes | - | JWT signing secret |\n\n`;
      }
    }

    // Development
    md += `## 🛠️ Development\n\n`;
    md += `\`\`\`bash\n# Install dependencies\nnpm install\n\n# Run tests\nnpm test\n\n# Lint\nnpm run lint\n\n# Type check\nnpm run typecheck\n\`\`\`\n\n`;

    // Tech Stack
    md += `## 🧰 Tech Stack\n\n`;
    const tech: string[] = [];
    if (language) tech.push(language);
    if (packageJson) {
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      if (deps.typescript) tech.push('TypeScript');
      if (deps.react) tech.push('React');
      if (deps.next) tech.push('Next.js');
      if (deps.tailwindcss) tech.push('Tailwind CSS');
      if (deps.prisma) tech.push('Prisma');
      if (deps.trpc) tech.push('tRPC');
      if (deps.zod) tech.push('Zod');
    }
    if (cargoToml) tech.push('Rust');
    if (pyprojectToml) tech.push('Python');
    if (topics.length) tech.push(...topics.slice(0, 5));

    // The language often reappears as a repo topic ("javascript" + "JavaScript"),
    // so collapse case-insensitive duplicates before rendering the stack.
    const uniqueTech = [...new Map(tech.map((t) => [t.trim().toLowerCase(), t.trim()])).values()];
    md +=
      uniqueTech
        .slice(0, 10)
        .map((t) => `\`${t}\``)
        .join(' ') + '\n\n';

    // Project Structure
    md += `## 📁 Project Structure\n\n`;
    md += `\`\`\`\n${name}/\n`;
    if (projectType === 'cli') {
      md += `├── src/\n│   ├── commands/     # CLI commands\n│   ├── utils/        # Helpers\n│   └── index.ts      # Entry point\n├── bin/              # Binary entry\n├── tests/\n└── package.json\n`;
    } else if (projectType === 'library') {
      md += `├── src/\n│   ├── index.ts      # Main export\n│   ├── types/        # TypeScript types\n│   └── utils/\n├── tests/\n├── docs/\n└── package.json\n`;
    } else if (projectType === 'api') {
      md += `├── src/\n│   ├── routes/       # API routes\n│   ├── middleware/   # Auth, validation\n│   ├── services/     # Business logic\n│   └── index.ts      # Server entry\n├── prisma/           # Database schema\n├── tests/\n└── package.json\n`;
    } else if (projectType === 'webapp') {
      md += `├── app/              # Next.js App Router\n│   ├── (auth)/       # Auth routes\n│   └── dashboard/\n├── components/       # React components\n├── lib/              # Utilities\n├── hooks/            # Custom hooks\n├── public/           # Static assets\n└── package.json\n`;
    } else {
      md += `├── src/\n├── tests/\n├── docs/\n└── package.json / Cargo.toml / pyproject.toml\n`;
    }
    md += `\`\`\`\n\n`;

    // Contributing
    md += `## 🤝 Contributing\n\n`;
    md += `1. Fork the repository\n`;
    md += `2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)\n`;
    md += `3. Commit your changes (\`git commit -m 'feat: add amazing feature'\`)\n`;
    md += `4. Push to the branch (\`git push origin feature/amazing-feature\`)\n`;
    md += `5. Open a Pull Request\n\n`;

    // License — only when GitHub reports one. A hardcoded "MIT" used to be
    // printed for every repo, including AGPL projects.
    const licenceName =
      data.license?.spdxId && data.license.spdxId !== 'NOASSERTION'
        ? data.license.spdxId
        : data.license?.name;
    if (licenceName) {
      md += `## 📄 License\n\n`;
      md += `Distributed under the **${licenceName}** licence. See \`LICENSE\` for more information.\n\n`;
    }

    // Footer
    md += `---\n\n`;
    md += `<div align="center">\n`;
    md += `  <sub>Built with ❤️ by <a href="https://github.com/${data.name.split('/')[0]}">${data.name.split('/')[0]}</a> • `;
    md += `Generated with <a href="https://readme.bharatdn.com">ReadmeCraft</a></sub>\n`;
    md += `</div>\n`;

    return md;
  };

  const handleAnalyze = async () => {
    const parsed = parseGithubUrl(repoUrl);
    if (!parsed) {
      setError('Invalid GitHub URL. Use format: https://github.com/owner/repo');
      setStep('error');
      return;
    }

    setStep('analyzing');
    setError(null);

    try {
      // Fetch repo data from GitHub API first so manifest reads use the repo's
      // real default branch (hardcoded `main` missed every `master` repo).
      const repoRes = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
      const repoData = repoRes.ok ? await repoRes.json() : null;

      if (!repoData) throw new Error('Repository not found or private');

      const branch = repoData.default_branch || 'main';
      const rawUrl = (file: string) =>
        `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${file}`;
      const [readmeRes, packageRes, cargoRes, pyprojectRes] = await Promise.allSettled([
        fetch(rawUrl('README.md')),
        fetch(rawUrl('package.json')),
        fetch(rawUrl('Cargo.toml')),
        fetch(rawUrl('pyproject.toml')),
      ]);

      const readme =
        readmeRes.status === 'fulfilled' && readmeRes.value.ok ? await readmeRes.value.text() : '';
      const packageJson =
        packageRes.status === 'fulfilled' && packageRes.value.ok
          ? await packageRes.value.json()
          : null;
      const cargoToml =
        cargoRes.status === 'fulfilled' && cargoRes.value.ok ? await cargoRes.value.text() : '';
      const pyprojectToml =
        pyprojectRes.status === 'fulfilled' && pyprojectRes.value.ok
          ? await pyprojectRes.value.text()
          : '';

      const analysisData: RepoAnalysis = {
        name: `${parsed.owner}/${parsed.repo}`,
        description: repoData.description || '',
        language: repoData.language || '',
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        topics: repoData.topics || [],
        packageJson,
        cargoToml: cargoToml || undefined,
        pyprojectToml: pyprojectToml || undefined,
        readme: readme || undefined,
        // Real SPDX value from the repo, so the generated README never claims a
        // licence the project does not ship.
        license: repoData.license
          ? { spdxId: repoData.license.spdx_id, name: repoData.license.name }
          : null,
      };

      setAnalysis(analysisData);

      // Detect project type
      const projectType = detectProjectType(analysisData);

      // Generate badge URLs
      const badges = generateBadgeUrls(parsed.owner, parsed.repo, projectType, theme);

      // Generate markdown
      const markdown = generateMarkdown(analysisData, projectType, badges, theme);

      setCrafted({ markdown, badges, projectType });
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze repository');
      setStep('error');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!crafted) return;
    const blob = new Blob([crafted.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#ef4444]/30 bg-[#0b101c] p-8 text-center">
          <div className="mb-4 text-4xl">❌</div>
          <h1 className="mb-2 text-2xl font-bold text-[#ef4444]">Analysis Failed</h1>
          <p className="mb-6 text-[#94a3b8]">{error}</p>
          <button
            onClick={() => setStep('input')}
            className="inline-block rounded-lg bg-[#ef4444] px-6 py-3 font-medium text-white transition-colors hover:bg-[#dc2626]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#1e293b] bg-[#0b101c] p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 flex items-center justify-center gap-2 text-3xl font-bold text-[#f1f5f9]">
            <span>📝</span> Project README Wizard
          </h1>
          <p className="text-[#94a3b8]">
            Paste a GitHub repo URL → Get a production-ready README with live badges
          </p>
        </div>

        {step === 'input' && (
          <div className="space-y-6">
            {/* Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#94a3b8]">
                GitHub Repository URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full rounded-xl border border-[#2a3a4f] bg-[#090d16] px-4 py-3 text-[#f1f5f9] placeholder-[#64748b] focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] focus:outline-none"
                />
                <div className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-[#64748b]">
                  owner/repo
                </div>
              </div>
              <p className="text-xs text-[#64748b]">
                Supports: GitHub.com URLs • Public repos only • Auto-detects CLI, Library, Web App,
                API, Mobile
              </p>
            </div>

            {/* Theme Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-[#94a3b8]">
                  Badge Theme ({themes.length} Themes)
                </label>
                <span className="font-mono text-xs text-emerald-400 capitalize">{theme}</span>
              </div>
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto rounded-lg border border-[#1e293b]/50 p-1">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                      theme === t.id
                        ? `border-${t.accent.replace('#', '')} bg-${t.accent.replace('#', '')}/20 text-${t.accent.replace('#', '')}`
                        : 'border-[#2a3a4f] text-[#94a3b8] hover:border-[#3a4a5f] hover:bg-[#161b22]'
                    }`}
                    style={{
                      borderColor: theme === t.id ? t.accent : '#2a3a4f',
                      backgroundColor: theme === t.id ? t.accent + '20' : undefined,
                      color: theme === t.id ? t.accent : '#94a3b8',
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={!repoUrl.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] px-6 py-4 text-lg font-bold text-white transition-all hover:from-[#059669] hover:to-[#047857] disabled:cursor-not-allowed disabled:opacity-50"
            >
              🔍 Analyze & Generate README
            </button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="py-12 text-center">
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#10b981] border-t-transparent"></div>
            <p className="text-[#94a3b8]">
              Fetching repo data, detecting project type, generating README...
            </p>
            <p className="mt-2 text-xs text-[#64748b]">This usually takes 5-10 seconds</p>
          </div>
        )}

        {step === 'result' && crafted && analysis && (
          <div className="space-y-6">
            {/* Result Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className={`mr-2 text-2xl`}>{PROJECT_TYPES[crafted.projectType].icon}</span>
                <span className="text-xl font-bold text-[#f1f5f9]">
                  {PROJECT_TYPES[crafted.projectType].label}
                </span>
                <span className="ml-3 rounded border border-[#2a3a4f] bg-[#161b22] px-2 py-0.5 text-xs text-[#94a3b8]">
                  {crafted.projectType.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(crafted.markdown)}
                  className="flex items-center gap-2 rounded-lg bg-[#10b981] px-4 py-2 font-medium text-white transition-colors hover:bg-[#059669]"
                >
                  {copied ? '✅ Copied!' : '📋 Copy Markdown'}
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="flex items-center gap-2 rounded-lg bg-[#8b5cf6] px-4 py-2 font-medium text-white transition-colors hover:bg-[#7c3aed]"
                >
                  💾 Download .md
                </button>
              </div>
            </div>

            {/* Repo Info */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#1e293b] bg-[#090d16] p-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#10b981]">
                  {analysis.stars.toLocaleString()}
                </div>
                <div className="text-xs text-[#94a3b8]">Stars</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8b5cf6]">
                  {analysis.forks.toLocaleString()}
                </div>
                <div className="text-xs text-[#94a3b8]">Forks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#3b82f6]">
                  {analysis.language || 'N/A'}
                </div>
                <div className="text-xs text-[#94a3b8]">Language</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#f59e0b]">{analysis.topics.length}</div>
                <div className="text-xs text-[#94a3b8]">Topics</div>
              </div>
            </div>

            {/* Badge Preview */}
            <div className="space-y-3">
              <h3 className="font-medium text-[#f1f5f9]">Live Badge Preview</h3>
              <div className="space-y-2">
                {crafted.badges.map((badge, i) => (
                  <div key={i} className="rounded-lg border border-[#1e293b] bg-[#090d16] p-3">
                    <img src={badge} alt="Badge" className="h-auto max-w-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Markdown Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#f1f5f9]">Generated README</h3>
                <span className="text-xs text-[#64748b]">
                  {crafted.markdown.length} chars • {crafted.markdown.split('\n').length} lines
                </span>
              </div>
              <div className="max-h-96 overflow-auto rounded-xl border border-[#1e293b] bg-[#090d16] p-4 font-mono text-sm whitespace-pre-wrap text-[#94a3b8]">
                {crafted.markdown}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-[#1e293b] pt-4">
              <button
                onClick={() => copyToClipboard(crafted.markdown)}
                className="flex-1 rounded-lg bg-[#10b981] px-4 py-3 font-medium text-white transition-colors hover:bg-[#059669]"
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={downloadMarkdown}
                className="flex-1 rounded-lg bg-[#8b5cf6] px-4 py-3 font-medium text-white transition-colors hover:bg-[#7c3aed]"
              >
                💾 Download README.md
              </button>
              <a
                href={`https://github.com/${analysis.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-[#3b82f6] px-4 py-3 text-center font-medium text-white transition-colors hover:bg-[#2563eb]"
              >
                🔗 View Repo
              </a>
            </div>

            <p className="text-center text-xs text-[#64748b]">
              Paste the copied markdown into your repository's README.md • Badges update
              automatically via ReadmeCraft
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
