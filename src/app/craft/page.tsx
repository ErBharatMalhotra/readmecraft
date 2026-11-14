'use client';

import { useState } from 'react';

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
  const [theme, setTheme] = useState('tokyonight');
  const [copied, setCopied] = useState(false);

  const themes = [
    { id: 'tokyonight', name: 'Tokyo Night', bg: '#1a1b26', accent: '#7aa2f7' },
    { id: 'dracula', name: 'Dracula', bg: '#282a36', accent: '#bd93f9' },
    { id: 'nord', name: 'Nord', bg: '#2e3440', accent: '#88c0d0' },
    { id: 'github', name: 'GitHub Dark', bg: '#0d1117', accent: '#58a6ff' },
    { id: 'gruvbox', name: 'Gruvbox', bg: '#282828', accent: '#8ec07c' },
    { id: 'rosePine', name: 'Rose Pine', bg: '#191724', accent: '#9ccfd8' },
    { id: 'catppuccin', name: 'Catppuccin', bg: '#1e1e2e', accent: '#89dceb' },
    { id: 'synthwave', name: 'Synthwave', bg: '#2d2a40', accent: '#f92aad' },
    { id: 'gta6', name: 'GTA VI Sunset', bg: '#0a0a0f', accent: '#ff6b35' },
    { id: 'default', name: 'Default', bg: '#090d16', accent: '#10b981' },
  ];

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
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // CLI: has bin entry or commander/yargs/oclif
      if (Object.keys(bin).length > 0) return 'cli';
      if (deps.commander || deps.yargs || deps.oclif || deps['@clack/prompts']) return 'cli';
      if (scripts.cli || scripts.start?.includes('ts-node') || scripts.dev?.includes('tsx')) return 'cli';
      
      // Web App: next.js, react, vue, svelte, remix, astro
      if (deps.next || deps.react || deps.vue || deps.svelte || deps['@remix-run/react'] || deps.astro) return 'webapp';
      
      // API: express, fastify, hono, elysia, nestjs, trpc
      if (deps.express || deps.fastify || deps.hono || deps.elysia || deps['@nestjs/core'] || deps['@trpc/server']) return 'api';
      
      // Library: has main/module/exports, no bin, not a framework
      if (packageJson.main || packageJson.module || packageJson.exports) return 'library';
    }
    
    // Check Cargo.toml
    if (cargoToml) {
      if (cargoToml.includes('[[bin]]')) return 'cli';
      if (cargoToml.includes('cdylib') || cargoToml.includes('rlib')) return 'library';
      if (cargoToml.includes('actix-web') || cargoToml.includes('axum') || cargoToml.includes('rocket') || cargoToml.includes('warp')) return 'api';
      if (cargoToml.includes('tauri') || cargoToml.includes('dioxus') || cargoToml.includes('leptos') || cargoToml.includes('yew')) return 'webapp';
    }
    
    // Check pyproject.toml
    if (pyprojectToml) {
      if (pyprojectToml.includes('console_scripts') || pyprojectToml.includes('click') || pyprojectToml.includes('typer') || pyprojectToml.includes('argparse')) return 'cli';
      if (pyprojectToml.includes('fastapi') || pyprojectToml.includes('flask') || pyprojectToml.includes('django') || pyprojectToml.includes('starlette')) return 'api';
      if (pyprojectToml.includes('django') || pyprojectToml.includes('streamlit') || pyprojectToml.includes('gradio') || pyprojectToml.includes('nicegui')) return 'webapp';
      return 'library';
    }
    
    // Check topics
    const topicStr = topics.join(' ').toLowerCase();
    if (topicStr.includes('cli') || topicStr.includes('command-line')) return 'cli';
    if (topicStr.includes('library') || topicStr.includes('sdk') || topicStr.includes('package')) return 'library';
    if (topicStr.includes('api') || topicStr.includes('backend') || topicStr.includes('microservice')) return 'api';
    if (topicStr.includes('web') || topicStr.includes('frontend') || topicStr.includes('react') || topicStr.includes('vue')) return 'webapp';
    if (topicStr.includes('mobile') || topicStr.includes('android') || topicStr.includes('ios') || topicStr.includes('flutter') || topicStr.includes('react-native')) return 'mobile';
    
    return 'unknown';
  };

  const generateBadgeUrls = (owner: string, repo: string, projectType: ProjectType, theme: string) => {
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

  const generateMarkdown = (data: RepoAnalysis, projectType: ProjectType, badges: string[], theme: string): string => {
    const { name, description, language, stars, forks, topics, packageJson, cargoToml, pyprojectToml } = data;
    const typeInfo = PROJECT_TYPES[projectType];
    const baseUrl = `https://github.com/${data.name}`;
    
    let md = `# ${name}\n\n`;
    
    // Badge row
    md += badges.map(url => `<img src="${url}" alt="Badge" />`).join(' ') + '\n\n';
    
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
      md += `\`\`\`typescript\nimport ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')} from '${name}';\n\n// Basic usage\nconst result = await ${name.split('-')[0]}();\n\`\`\`\n\n`;
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
    
    md += tech.slice(0, 10).map(t => `\`${t}\``).join(' ') + '\n\n';
    
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
    
    // License
    md += `## 📄 License\n\n`;
    md += `Distributed under the **MIT License**. See \`LICENSE\` for more information.\n\n`;
    
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
      // Fetch repo data from GitHub API
      const [repoRes, readmeRes, packageRes, cargoRes, pyprojectRes] = await Promise.allSettled([
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`),
        fetch(`https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/main/README.md`),
        fetch(`https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/main/package.json`),
        fetch(`https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/main/Cargo.toml`),
        fetch(`https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/main/pyproject.toml`),
      ]);

      const repoData = repoRes.status === 'fulfilled' && repoRes.value.ok ? await repoRes.value.json() : null;
      const readme = readmeRes.status === 'fulfilled' && readmeRes.value.ok ? await readmeRes.value.text() : '';
      const packageJson = packageRes.status === 'fulfilled' && packageRes.value.ok ? await packageRes.value.json() : null;
      const cargoToml = cargoRes.status === 'fulfilled' && cargoRes.value.ok ? await cargoRes.value.text() : '';
      const pyprojectToml = pyprojectRes.status === 'fulfilled' && pyprojectRes.value.ok ? await pyprojectRes.value.text() : '';

      if (!repoData) throw new Error('Repository not found or private');

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
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="bg-[#0b101c] border border-[#ef4444]/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-[#ef4444] mb-2">Analysis Failed</h1>
          <p className="text-[#94a3b8] mb-6">{error}</p>
          <button
            onClick={() => setStep('input')}
            className="inline-block px-6 py-3 bg-[#ef4444] text-white rounded-lg font-medium hover:bg-[#dc2626] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="bg-[#0b101c] border border-[#1e293b] rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#f1f5f9] mb-2 flex items-center justify-center gap-2">
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
              <label className="block text-sm font-medium text-[#94a3b8]">GitHub Repository URL</label>
              <div className="relative">
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full px-4 py-3 bg-[#090d16] border border-[#2a3a4f] rounded-xl text-[#f1f5f9] placeholder-[#64748b] focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] text-sm">
                  owner/repo
                </div>
              </div>
              <p className="text-xs text-[#64748b]">
                Supports: GitHub.com URLs • Public repos only • Auto-detects CLI, Library, Web App, API, Mobile
              </p>
            </div>

            {/* Theme Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[#94a3b8]">Badge Theme</label>
              <div className="flex flex-wrap gap-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                      theme === t.id
                        ? `border-${t.accent.replace('#', '')} bg-${t.accent.replace('#', '')}/20 text-${t.accent.replace('#', '')}`
                        : 'border-[#2a3a4f] text-[#94a3b8] hover:border-[#3a4a5f] hover:bg-[#161b22]'
                    }`}
                    style={{
                      borderColor: theme === t.id ? t.accent : '#2a3a4f',
                      backgroundColor: theme === t.id ? t.accent + '20' : undefined,
                      color: theme === t.id ? t.accent : '#94a3b8'
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
              className="w-full py-4 px-6 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold text-lg rounded-xl hover:from-[#059669] hover:to-[#047857] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔍 Analyze & Generate README
            </button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#10b981] border-t-transparent mb-4"></div>
            <p className="text-[#94a3b8]">Fetching repo data, detecting project type, generating README...</p>
            <p className="text-xs text-[#64748b] mt-2">This usually takes 5-10 seconds</p>
          </div>
        )}

        {step === 'result' && crafted && analysis && (
          <div className="space-y-6">
            {/* Result Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className={`text-2xl mr-2`}>{PROJECT_TYPES[crafted.projectType].icon}</span>
                <span className="text-xl font-bold text-[#f1f5f9]">{PROJECT_TYPES[crafted.projectType].label}</span>
                <span className="ml-3 px-2 py-0.5 bg-[#161b22] border border-[#2a3a4f] rounded text-xs text-[#94a3b8]">
                  {crafted.projectType.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(crafted.markdown)}
                  className="px-4 py-2 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors flex items-center gap-2"
                >
                  {copied ? '✅ Copied!' : '📋 Copy Markdown'}
                </button>
                <button
                  onClick={downloadMarkdown}
                  className="px-4 py-2 bg-[#8b5cf6] text-white rounded-lg font-medium hover:bg-[#7c3aed] transition-colors flex items-center gap-2"
                >
                  💾 Download .md
                </button>
              </div>
            </div>

            {/* Repo Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#090d16] rounded-xl border border-[#1e293b]">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#10b981]">{analysis.stars.toLocaleString()}</div>
                <div className="text-xs text-[#94a3b8]">Stars</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#8b5cf6]">{analysis.forks.toLocaleString()}</div>
                <div className="text-xs text-[#94a3b8]">Forks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#3b82f6]">{analysis.language || 'N/A'}</div>
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
                  <div key={i} className="p-3 bg-[#090d16] rounded-lg border border-[#1e293b]">
                    <img src={badge} alt="Badge" className="max-w-full h-auto" />
                  </div>
                ))}
              </div>
            </div>

            {/* Markdown Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[#f1f5f9]">Generated README</h3>
                <span className="text-xs text-[#64748b]">{crafted.markdown.length} chars • {crafted.markdown.split('\n').length} lines</span>
              </div>
              <div className="bg-[#090d16] border border-[#1e293b] rounded-xl p-4 max-h-96 overflow-auto font-mono text-sm text-[#94a3b8] whitespace-pre-wrap">
                {crafted.markdown}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[#1e293b]">
              <button
                onClick={() => copyToClipboard(crafted.markdown)}
                className="flex-1 py-3 px-4 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors"
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={downloadMarkdown}
                className="flex-1 py-3 px-4 bg-[#8b5cf6] text-white rounded-lg font-medium hover:bg-[#7c3aed] transition-colors"
              >
                💾 Download README.md
              </button>
              <a
                href={`https://github.com/${analysis.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-[#3b82f6] text-white rounded-lg font-medium hover:bg-[#2563eb] transition-colors text-center"
              >
                🔗 View Repo
              </a>
            </div>

            <p className="text-center text-xs text-[#64748b]">
              Paste the copied markdown into your repository's README.md • Badges update automatically via ReadmeCraft
            </p>
          </div>
        )}
      </div>
    </div>
  );
}