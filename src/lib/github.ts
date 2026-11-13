import type { ProfileData, ProjectData } from '@/types/readmecraft';
import { fetchProfileData, fetchRepoData, createOctokitClient } from './github-api';

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
  skills: [
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
  description:
    'The next-generation intelligent GitHub README Studio for Developer Profiles and Repositories with instant auto-detection and ecosystem interlinking.',
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

function calculateLanguages(repos: any[]): Array<{ name: string; percentage: number; color: string }> {
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
    .slice(0, 5);

  return sortedLangs.map(([name, count]) => ({
    name,
    percentage: totalLangCount > 0 ? Number(((count / totalLangCount) * 100).toFixed(1)) : 20,
    color: LANG_COLORS[name] || '#8b5cf6',
  }));
}

function calculateLanguagesFromRepoData(languages: any[]): Array<{ name: string; percentage: number; color: string }> {
  const totalSize = languages.reduce((sum, l) => sum + l.size, 0);
  if (totalSize === 0) return [];
  
  return languages.map((l) => ({
    name: l.name,
    percentage: Number(((l.size / totalSize) * 100).toFixed(1)),
    color: l.color || LANG_COLORS[l.name] || '#8b5cf6',
  }));
}

export async function fetchGitHubProfile(
  username: string,
  token?: string,
  userToken?: string
): Promise<ProfileData> {
  if (!username || username.trim() === '') {
    return SAMPLE_PROFILE;
  }

  try {
    const { data } = await fetchProfileData(username, { token, userToken });
    const userData = data;

    const repos = userData.reposList?.nodes || [];
    const languages = calculateLanguages(repos);

    let pinnedRepos = userData.pinnedItems?.nodes || [];
    if (pinnedRepos.length === 0) {
      const sortedRepos = repos
        .filter((r: any) => !r.isFork)
        .sort((a: any, b: any) => b.stargazerCount - a.stargazerCount)
        .slice(0, 3);
      pinnedRepos = sortedRepos;
    }

    const finalPinned = pinnedRepos.map((r: any) => ({
      name: r.name,
      description: r.description || 'No description provided.',
      url: r.url,
      stargazersCount: r.stargazerCount,
      language: r.primaryLanguage?.name || 'Code',
    }));

    return {
      username: userData.login,
      name: userData.name || userData.login,
      bio: userData.bio || 'Developer & Open Source Contributor',
      avatarUrl: userData.avatarUrl,
      company: userData.company || '',
      location: userData.location || '',
      website: userData.websiteUrl || '',
      twitter: userData.twitterUsername || '',
      githubUrl: userData.url,
      publicRepos: userData.repositories?.totalCount || 0,
      followers: userData.followers?.totalCount || 0,
      following: userData.following?.totalCount || 0,
      languages: languages.length > 0 ? languages : [],
      pinnedRepos: finalPinned.length > 0 ? finalPinned : [],
      skills: languages.map((l) => l.name).concat(['Git', 'Docker', 'REST APIs', 'CI/CD']),
      gitHoloEnabled: true,
      gitChronicleEnabled: true,
      visitorBadgeEnabled: true,
      githubStatsEnabled: true,
      githubStreakEnabled: true,
      topLanguagesEnabled: true,
    };
  } catch (error) {
    console.warn('Failed to fetch real GitHub profile via GraphQL, using fallback:', error);
    
    try {
      const client = createOctokitClient(token);
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };
      if (token) headers['Authorization'] = `token ${token}`;

      const userRes = await fetch(`https://api.github.com/users/${username}`, { headers });
      if (!userRes.ok) {
        if (userRes.status === 404) throw new Error(`GitHub user "${username}" not found.`);
        throw new Error(`GitHub API error: ${userRes.statusText}`);
      }
      const userData = await userRes.json();

      const reposRes = await fetch(
        `https://api.github.com/users/${username}/repos?per_page=100&sort=updated`,
        { headers }
      );
      let repos: any[] = [];
      if (reposRes.ok) repos = await reposRes.json();

      const languages = calculateLanguages(repos);

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
        languages: languages.length > 0 ? languages : [],
        pinnedRepos: pinnedRepos.length > 0 ? pinnedRepos : [],
        skills: languages.map((l) => l.name).concat(['Git', 'Docker', 'REST APIs', 'CI/CD']),
        gitHoloEnabled: true,
        gitChronicleEnabled: true,
        visitorBadgeEnabled: true,
        githubStatsEnabled: true,
        githubStreakEnabled: true,
        topLanguagesEnabled: true,
      };
    } catch (fallbackError) {
      console.warn('REST API fallback also failed, returning minimal profile:', fallbackError);
      return {
        username,
        name: username,
        bio: 'Developer & Open Source Contributor',
        avatarUrl: `https://avatars.githubusercontent.com/${username}?v=4`,
        company: '',
        location: '',
        website: '',
        twitter: '',
        githubUrl: `https://github.com/${username}`,
        publicRepos: 0,
        followers: 0,
        following: 0,
        languages: [],
        pinnedRepos: [],
        skills: ['Git', 'Docker', 'REST APIs', 'CI/CD'],
        gitHoloEnabled: true,
        gitChronicleEnabled: true,
        visitorBadgeEnabled: true,
        githubStatsEnabled: true,
        githubStreakEnabled: true,
        topLanguagesEnabled: true,
      };
    }
  }
}

export async function fetchGitHubProject(
  repoUrlOrSlug: string,
  token?: string,
  userToken?: string
): Promise<ProjectData> {
  if (!repoUrlOrSlug || repoUrlOrSlug.trim() === '') {
    return SAMPLE_PROJECT;
  }

  let cleanSlug = repoUrlOrSlug.trim();
  if (cleanSlug.includes('github.com/')) {
    const parts = cleanSlug.split('github.com/')[1].split('/');
    cleanSlug = `${parts[0]}/${parts[1]}`;
  }

  const [owner, repo] = cleanSlug.split('/');
  if (!owner || !repo) {
    throw new Error('Invalid repository format. Use owner/repo or GitHub URL.');
  }

  try {

    const { data } = await fetchRepoData(owner, repo, { token, userToken });
    const repoData = data;

    let packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip' = 'npm';
    let installCommand = 'npm install';
    let runCommand = 'npm run dev';
    let testCommand = 'npm test';
    let framework = repoData.primaryLanguage?.name || 'TypeScript';

    const topics = repoData.repositoryTopics?.nodes?.map((n: any) => n.topic.name) || [];
    if (topics.includes('pnpm') || topics.includes('package-manager-pnpm')) {
      packageManager = 'pnpm';
      installCommand = 'pnpm install';
      runCommand = 'pnpm dev';
      testCommand = 'pnpm test';
    } else if (topics.includes('yarn') || topics.includes('package-manager-yarn')) {
      packageManager = 'yarn';
      installCommand = 'yarn install';
      runCommand = 'yarn dev';
      testCommand = 'yarn test';
    } else if (topics.includes('bun')) {
      packageManager = 'bun';
      installCommand = 'bun install';
      runCommand = 'bun dev';
      testCommand = 'bun test';
    } else if (repoData.primaryLanguage?.name === 'Rust') {
      packageManager = 'cargo';
      installCommand = 'cargo build';
      runCommand = 'cargo run';
      testCommand = 'cargo test';
      framework = 'Rust';
    }

    const languages = calculateLanguagesFromRepoData(repoData.languages?.nodes || []);
    const techStack = languages.length > 0 
      ? languages.map(l => l.name) 
      : [repoData.primaryLanguage?.name || 'TypeScript', framework, 'Git', 'GitHub Actions'];

    return {
      owner,
      repo,
      title: repoData.name,
      description: repoData.description || 'High-performance open source repository.',
      license: repoData.licenseInfo?.spdxId || 'MIT',
      defaultBranch: repoData.defaultBranchRef?.name || 'main',
      stars: repoData.stargazerCount,
      forks: repoData.forkCount,
      openIssues: repoData.openIssues?.totalCount || 0,
      language: repoData.primaryLanguage?.name || 'TypeScript',
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
      techStack,
      architectureDiagram: `┌──────────────────────────────────────────────┐
│                  ${repoData.name}            │
├──────────────────────┬───────────────────────┤
│    Core Engine       │    Interface Layer    │
└──────────────────────┴───────────────────────┘`,
      demoUrl: repoData.homepageUrl || `https://github.com/${owner}/${repo}`,
      gitHoloEnabled: true,
      gitChronicleEnabled: true,
    };
  } catch (error) {
    console.warn('Failed to fetch real GitHub repository via GraphQL, using fallback:', error);
    
    try {
      let cleanSlug = repoUrlOrSlug.trim();
      if (cleanSlug.includes('github.com/')) {
        const parts = cleanSlug.split('github.com/')[1].split('/');
        cleanSlug = `${parts[0]}/${parts[1]}`;
      }
      const [owner, repo] = cleanSlug.split('/');
      if (!owner || !repo) throw new Error('Invalid repository format.');

      const client = createOctokitClient(token);
      const { data: repoData } = await client.rest.repos.get({ owner, repo });

      let packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip' = 'npm';
      let installCommand = 'npm install';
      let runCommand = 'npm run dev';
      let testCommand = 'npm test';
      let framework = repoData.language || 'TypeScript';

      try {
        const contentRes = await client.rest.repos.getContent({
          owner,
          repo,
          path: 'package.json',
        });
        if ('content' in contentRes.data) {
          const pkgContent = JSON.parse(Buffer.from(contentRes.data.content, 'base64').toString('utf8'));
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
        }
      } catch (e) {
        // Ignore
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
    } catch (fallbackError) {
      console.warn('REST API fallback also failed, returning minimal project:', fallbackError);
      return {
        owner,
        repo,
        title: repo,
        description: 'Repository',
        license: 'MIT',
        defaultBranch: 'main',
        stars: 0,
        forks: 0,
        openIssues: 0,
        language: 'TypeScript',
        framework: 'TypeScript',
        packageManager: 'npm',
        installCommand: 'npm install',
        runCommand: 'npm run dev',
        testCommand: 'npm test',
        features: [],
        techStack: ['TypeScript', 'Git', 'GitHub Actions'],
        architectureDiagram: '',
        demoUrl: `https://github.com/${owner}/${repo}`,
        gitHoloEnabled: true,
        gitChronicleEnabled: true,
      };
    }
  }
}