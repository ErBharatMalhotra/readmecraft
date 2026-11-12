import { ProfileData, ProjectData } from '@/types/readmecraft';

export const SAMPLE_PROFILE: ProfileData = {
  username: 'ErBharatMalhotra',
  name: 'Bharat Malhotra',
  bio: 'Full-stack software architect building high-performance developer tools, 3D web graphics, and scalable distributed systems.',
  avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
  company: 'BharatDN',
  location: 'New Delhi, India',
  website: 'https://bharatdn.com',
  twitter: 'ErBharatMalhotra',
  githubUrl: 'https://github.com/ErBharatMalhotra',
  publicRepos: 42,
  followers: 1337,
  following: 256,
  languages: [
    { name: 'TypeScript', percentage: 48.5, color: '#3178c6' },
    { name: 'Rust', percentage: 24.2, color: '#dea584' },
    { name: 'Python', percentage: 16.8, color: '#3572A5' },
    { name: 'Go', percentage: 10.5, color: '#00ADD8' },
  ],
  pinnedRepos: [
    {
      name: 'GitHolo',
      description: '3D Holographic GitHub Profile & Repository Cards with WebGL shaders',
      url: 'https://github.com/ErBharatMalhotra/githolo',
      stargazersCount: 842,
      language: 'TypeScript',
    },
    {
      name: 'GitChronicle',
      description: 'Live percentile cadence badges and developer commit velocity telemetry',
      url: 'https://github.com/ErBharatMalhotra/gitchronicle',
      stargazersCount: 512,
      language: 'Rust',
    },
    {
      name: 'ReadmeCraft',
      description: 'Next-generation intelligent dual-mode GitHub README Studio',
      url: 'https://github.com/ErBharatMalhotra/readmecraft',
      stargazersCount: 1205,
      language: 'TypeScript',
    },
  ],
  skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'Rust', 'Go', 'Python', 'TailwindCSS', 'PostgreSQL', 'Docker', 'GraphQL', 'WebGL'],
  gitHoloEnabled: true,
  gitChronicleEnabled: true,
  visitorBadgeEnabled: true,
  githubStatsEnabled: true,
  githubStreakEnabled: true,
  topLanguagesEnabled: true,
};

export const SAMPLE_PROJECT: ProjectData = {
  owner: 'ErBharatMalhotra',
  repo: 'readmecraft',
  title: 'ReadmeCraft',
  description: 'The next-generation intelligent GitHub README Studio for Developer Profiles and Repositories with instant auto-detection and ecosystem interlinking.',
  license: 'MIT',
  defaultBranch: 'main',
  stars: 1205,
  forks: 148,
  openIssues: 12,
  language: 'TypeScript',
  framework: 'Next.js 16',
  packageManager: 'npm',
  installCommand: 'npm install',
  runCommand: 'npm run dev',
  testCommand: 'npm test',
  features: [
    '⚡ 5-Second Zero-Typing Ingestion from GitHub Username or Repo URL',
    '🎨 Anti-AI-Slop Editorial Design with OKLCH Obsidian & Emerald Color Geometry',
    '🔄 Dual-Mode Studio supporting both Developer Profiles and Project Repositories',
    '🔗 1-Click Ecosystem Cross-Pollination Widgets (GitHolo & GitChronicle)',
    '✨ Live Pixel-Perfect GitHub Markdown Preview with Instant Copy & Download',
  ],
  techStack: ['Next.js 16', 'React 19', 'TypeScript', 'TailwindCSS v4', 'Octokit', 'Lucide Icons'],
  architectureDiagram: `┌─────────────────┬──────────────────────────┬──────────────────────────┐
│  Section Manager│    Markdown Editor       │   Live GitHub Preview    │
│  (Bento/Minimal)│    (Syntax Highlight)    │   (GitHub README CSS)    │
└─────────────────┴──────────────────────────┴──────────────────────────┘`,
  demoUrl: 'https://readme.bharatdn.com',
  gitHoloEnabled: true,
  gitChronicleEnabled: true,
};

export async function fetchGitHubProfile(username: string, token?: string): Promise<ProfileData> {
  if (!username || username.trim() === '') {
    return SAMPLE_PROFILE;
  }

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
    if (!userRes.ok) {
      if (userRes.status === 404) {
        throw new Error(`GitHub user "${username}" not found.`);
      }
      throw new Error(`GitHub API error: ${userRes.statusText}`);
    }
    const userData = await userRes.json();

    // Fetch user repos to determine top languages and pinned-like repos
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
    let repos = [];
    if (reposRes.ok) {
      repos = await reposRes.json();
    }

    // Calculate languages from repos
    const langCounts: Record<string, number> = {};
    let totalLangCount = 0;
    repos.forEach((repo: any) => {
      if (repo.language && !repo.fork) {
        langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        totalLangCount++;
      }
    });

    const langColors: Record<string, string> = {
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

    const sortedLangs = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const languages = sortedLangs.map(([name, count]) => ({
      name,
      percentage: totalLangCount > 0 ? Number(((count / totalLangCount) * 100).toFixed(1)) : 20,
      color: langColors[name] || '#8b5cf6',
    }));

    // Fallback languages if none detected
    const finalLanguages = languages.length > 0 ? languages : SAMPLE_PROFILE.languages;

    // Get top starred repos for pinned representation
    const sortedRepos = repos
      .filter((r: any) => !r.fork)
      .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3);

    const pinnedRepos = sortedRepos.map((r: any) => ({
      name: r.name,
      description: r.description || 'No description provided.',
      url: r.html_url,
      stargazersCount: r.stargazers_count,
      language: r.language || 'Code',
    }));

    const finalPinned = pinnedRepos.length > 0 ? pinnedRepos : SAMPLE_PROFILE.pinnedRepos;

    return {
      username: userData.login,
      name: userData.name || userData.login,
      bio: userData.bio || 'Developer & Open Source Contributor',
      avatarUrl: userData.avatar_url,
      company: userData.company || '',
      location: userData.location || '',
      website: userData.blog || '',
      twitter: userData.twitter_username || '',
      githubUrl: userData.html_url,
      publicRepos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      languages: finalLanguages,
      pinnedRepos: finalPinned,
      skills: finalLanguages.map(l => l.name).concat(['Git', 'Docker', 'REST APIs', 'CI/CD']),
      gitHoloEnabled: true,
      gitChronicleEnabled: true,
      visitorBadgeEnabled: true,
      githubStatsEnabled: true,
      githubStreakEnabled: true,
      topLanguagesEnabled: true,
    };
  } catch (error) {
    console.warn('Failed to fetch real GitHub profile, using intelligent sample fallback:', error);
    return {
      ...SAMPLE_PROFILE,
      username: username || SAMPLE_PROFILE.username,
      name: username || SAMPLE_PROFILE.name,
    };
  }
}

export async function fetchGitHubProject(repoUrlOrSlug: string, token?: string): Promise<ProjectData> {
  if (!repoUrlOrSlug || repoUrlOrSlug.trim() === '') {
    return SAMPLE_PROJECT;
  }

  try {
    // Parse owner/repo from URL or slug (e.g. "facebook/react" or "https://github.com/vercel/next.js")
    let cleanSlug = repoUrlOrSlug.trim();
    if (cleanSlug.includes('github.com/')) {
      const parts = cleanSlug.split('github.com/')[1].split('/');
      cleanSlug = `${parts[0]}/${parts[1]}`;
    }

    const [owner, repo] = cleanSlug.split('/');
    if (!owner || !repo) {
      throw new Error('Invalid repository format. Use owner/repo or GitHub URL.');
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoRes.ok) {
      throw new Error(`Repository "${owner}/${repo}" not found.`);
    }
    const repoData = await repoRes.json();

    // Check package.json or cargo.toml for package manager and scripts
    let packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip' = 'npm';
    let installCommand = 'npm install';
    let runCommand = 'npm run dev';
    let testCommand = 'npm test';
    let framework = repoData.language || 'TypeScript';

    try {
      const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/package.json`, { headers });
      if (contentRes.ok) {
        const pkgFile = await contentRes.json();
        const pkgContent = JSON.parse(Buffer.from(pkgFile.content, 'base64').toString('utf8'));
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
        if (pkgContent.dependencies?.next) framework = 'Next.js';
        else if (pkgContent.dependencies?.react) framework = 'React';
        else if (pkgContent.dependencies?.vue) framework = 'Vue.js';
        else if (pkgContent.dependencies?.express) framework = 'Express.js';
      } else {
        // Check Cargo.toml
        const cargoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/Cargo.toml`, { headers });
        if (cargoRes.ok) {
          packageManager = 'cargo';
          installCommand = 'cargo build';
          runCommand = 'cargo run';
          testCommand = 'cargo test';
          framework = 'Rust';
        }
      }
    } catch (e) {
      // Ignore content inspect errors
    }

    return {
      owner,
      repo,
      title: repoData.name,
      description: repoData.description || 'High-performance open source repository.',
      license: repoData.license?.spdx_id || 'MIT',
      defaultBranch: repoData.default_branch || 'main',
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      openIssues: repoData.open_issues_count,
      language: repoData.language || 'TypeScript',
      framework,
      packageManager,
      installCommand,
      runCommand,
      testCommand,
      features: [
        `⚡ High performance and lightning fast execution`,
        `🛡️ Robust architecture built with modern standards`,
        `📦 Easy integration with ${packageManager}`,
      ],
      techStack: [repoData.language || 'TypeScript', framework, 'Git', 'GitHub Actions'],
      architectureDiagram: `┌──────────────────────────────────────────────┐
│                  ${repoData.name}            │
├──────────────────────┬───────────────────────┤
│    Core Engine       │    Interface Layer    │
└──────────────────────┴───────────────────────┘`,
      demoUrl: repoData.homepage || `https://github.com/${owner}/${repo}`,
      gitHoloEnabled: true,
      gitChronicleEnabled: true,
    };
  } catch (error) {
    console.warn('Failed to fetch real GitHub repository, using intelligent sample fallback:', error);
    return SAMPLE_PROJECT;
  }
}
