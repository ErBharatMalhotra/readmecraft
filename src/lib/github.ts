import type { ProfileData, ProjectData, LanguageStat, PinnedRepo, TopRepository, ContributionCalendar, RepositoryContribution, PullRequestContribution, Organization, Package, Sponsor, SponsorshipTier, SocialAccount, UserStatus, PullRequest, Issue, RepositoryLanguage, RepositoryTopic, Release, Deployment, Environment, Workflow, VulnerabilityAlert, DependencyManifest, FundingLink, MentionableUser, CodeOfConduct } from '@/types/readmecraft';
import { fetchProfileData, fetchRepoData, createOctokitClient } from './github-api';

export const SAMPLE_PROFILE: ProfileData = {
  username: 'ErBharatMalhotra',
  name: 'Bharat Malhotra',
  bio: 'Full-stack software architect building high-performance developer tools, 3D web graphics, and scalable distributed systems.',
  bioHTML: '<p>Full-stack software architect building high-performance developer tools, 3D web graphics, and scalable distributed systems.</p>',
  avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
  company: 'BharatDN',
  companyHTML: 'BharatDN',
  location: 'New Delhi, India',
  website: 'https://bharatdn.com',
  twitter: 'ErBharatMalhotra',
  email: null,
  githubUrl: 'https://github.com/ErBharatMalhotra',
  resourcePath: '/ErBharatMalhotra',
  createdAt: '2018-01-15T00:00:00Z',
  updatedAt: new Date().toISOString(),
  userViewType: 'PUBLIC',
  isSponsorable: true,
  estimatedNextSponsorsPayoutInCents: 0,
  monthlyEstimatedSponsorsIncomeInCents: 0,
  hasSponsorsListing: false,
  pronouns: null,
  publicRepos: 42,
  totalDiskUsage: 1250000,
  followers: 1337,
  following: 256,
  starredRepositoriesCount: 487,
  watchingCount: 12,
  gistsCount: 3,
  languages: [
    { name: 'TypeScript', percentage: 48.5, color: '#3178c6', bytes: 850000 },
    { name: 'Rust', percentage: 24.2, color: '#dea584', bytes: 420000 },
    { name: 'Python', percentage: 16.8, color: '#3572A5', bytes: 290000 },
    { name: 'Go', percentage: 10.5, color: '#00ADD8', bytes: 180000 },
  ],
  skills: [
    'TypeScript', 'React', 'Next.js', 'Node.js', 'Rust', 'Go', 'Python',
    'TailwindCSS', 'PostgreSQL', 'Docker', 'GraphQL', 'WebGL', 'WebAssembly',
    'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Microservices', 'System Design'
  ],
  pinnedRepos: [
    {
      name: 'GitHolo',
      description: '3D Holographic GitHub Profile & Repository Cards with WebGL shaders',
      url: 'https://github.com/ErBharatMalhotra/githolo',
      stargazersCount: 842,
      language: 'TypeScript',
      forksCount: 89,
      topics: ['webgl', 'threejs', 'github', 'visualization', '3d'],
      license: 'MIT',
      isFork: false,
      isArchived: false,
      homepageUrl: 'https://githolo.bharatdn.com',
      releases: [
        { name: 'v2.0.0', tagName: 'v2.0.0', publishedAt: '2024-01-15T00:00:00Z', url: 'https://github.com/ErBharatMalhotra/githolo/releases/tag/v2.0.0', isPrerelease: false },
        { name: 'v1.5.0', tagName: 'v1.5.0', publishedAt: '2023-08-20T00:00:00Z', url: 'https://github.com/ErBharatMalhotra/githolo/releases/tag/v1.5.0', isPrerelease: false },
      ],
    },
    {
      name: 'GitChronicle',
      description: 'Live percentile cadence badges and developer commit velocity telemetry',
      url: 'https://github.com/ErBharatMalhotra/gitchronicle',
      stargazersCount: 512,
      language: 'Rust',
      forksCount: 45,
      topics: ['rust', 'github', 'analytics', 'badges', 'telemetry'],
      license: 'MIT',
      isFork: false,
      isArchived: false,
      homepageUrl: 'https://gitchronicle.bharatdn.com',
      releases: [
        { name: 'v1.2.0', tagName: 'v1.2.0', publishedAt: '2024-02-01T00:00:00Z', url: 'https://github.com/ErBharatMalhotra/gitchronicle/releases/tag/v1.2.0', isPrerelease: false },
      ],
    },
    {
      name: 'ReadmeCraft',
      description: 'Next-generation intelligent dual-mode GitHub README Studio',
      url: 'https://github.com/ErBharatMalhotra/readmecraft',
      stargazersCount: 1205,
      language: 'TypeScript',
      forksCount: 148,
      topics: ['nextjs', 'react', 'github', 'readme', 'developer-tools', 'ai'],
      license: 'MIT',
      isFork: false,
      isArchived: false,
      homepageUrl: 'https://readme.bharatdn.com',
      releases: [
        { name: 'v3.0.0', tagName: 'v3.0.0', publishedAt: '2024-11-01T00:00:00Z', url: 'https://github.com/ErBharatMalhotra/readmecraft/releases/tag/v3.0.0', isPrerelease: false },
        { name: 'v2.5.0', tagName: 'v2.5.0', publishedAt: '2024-06-15T00:00:00Z', url: 'https://github.com/ErBharatMalhotra/readmecraft/releases/tag/v2.5.0', isPrerelease: false },
      ],
    },
  ],
  topRepositories: [
    { name: 'ReadmeCraft', stargazerCount: 1205, url: 'https://github.com/ErBharatMalhotra/readmecraft', primaryLanguage: { name: 'TypeScript', color: '#3178c6' } },
    { name: 'GitHolo', stargazerCount: 842, url: 'https://github.com/ErBharatMalhotra/githolo', primaryLanguage: { name: 'TypeScript', color: '#3178c6' } },
    { name: 'GitChronicle', stargazerCount: 512, url: 'https://github.com/ErBharatMalhotra/gitchronicle', primaryLanguage: { name: 'Rust', color: '#dea584' } },
  ],
  contributionCalendar: {
    totalContributions: 2847,
    weeks: Array.from({ length: 53 }, (_, w) => ({
      contributionDays: Array.from({ length: 7 }, (_, d) => ({
        contributionCount: Math.floor(Math.random() * 5),
        date: new Date(Date.now() - (53 - w) * 7 * 86400000 + d * 86400000).toISOString().split('T')[0],
        weekday: d,
      })),
    })),
  },
  totalCommitContributions: 2150,
  totalIssueContributions: 340,
  totalPullRequestContributions: 280,
  totalPullRequestReviewContributions: 77,
  totalRepositoriesWithContributedCommits: 28,
  commitContributionsByRepository: [
    { repository: { name: 'readmecraft', owner: { login: 'ErBharatMalhotra' }, url: 'https://github.com/ErBharatMalhotra/readmecraft', primaryLanguage: { name: 'TypeScript', color: '#3178c6' } }, contributions: { totalCount: 450 } },
    { repository: { name: 'githolo', owner: { login: 'ErBharatMalhotra' }, url: 'https://github.com/ErBharatMalhotra/githolo', primaryLanguage: { name: 'TypeScript', color: '#3178c6' } }, contributions: { totalCount: 320 } },
    { repository: { name: 'gitchronicle', owner: { login: 'ErBharatMalhotra' }, url: 'https://github.com/ErBharatMalhotra/gitchronicle', primaryLanguage: { name: 'Rust', color: '#dea584' } }, contributions: { totalCount: 280 } },
  ],
  pullRequestContributionsByRepository: [
    { repository: { name: 'readmecraft', owner: { login: 'ErBharatMalhotra' }, url: 'https://github.com/ErBharatMalhotra/readmecraft' }, contributions: { totalCount: 45 } },
    { repository: { name: 'githolo', owner: { login: 'ErBharatMalhotra' }, url: 'https://github.com/ErBharatMalhotra/githolo' }, contributions: { totalCount: 28 } },
  ],
  organizations: [
    { login: 'BharatDN', name: 'BharatDN', avatarUrl: 'https://avatars.githubusercontent.com/u/123456?v=4', url: 'https://github.com/BharatDN' },
  ],
  packages: [
    { name: '@bharatdn/githolo', packageType: 'NPM', url: 'https://github.com/ErBharatMalhotra/githolo/packages', version: '2.0.0' },
    { name: '@bharatdn/readmecraft', packageType: 'NPM', url: 'https://github.com/ErBharatMalhotra/readmecraft/packages', version: '3.0.0' },
  ],
  sponsors: [
    { login: 'sponsor1', avatarUrl: 'https://avatars.githubusercontent.com/u/111?v=4', url: 'https://github.com/sponsor1' },
    { login: 'sponsor2', avatarUrl: 'https://avatars.githubusercontent.com/u/222?v=4', url: 'https://github.com/sponsor2' },
  ],
  sponsorshipsAsMaintainer: [
    { sponsorEntity: { login: 'supporter1', avatarUrl: 'https://avatars.githubusercontent.com/u/333?v=4', name: 'Supporter One', url: 'https://github.com/supporter1' }, tier: { monthlyPriceInCents: 500, name: 'Supporter' } },
  ],
  socialAccounts: [
    { provider: 'TWITTER', url: 'https://twitter.com/ErBharatMalhotra' },
    { provider: 'LINKEDIN', url: 'https://linkedin.com/in/bharatmalhotra' },
    { provider: 'WEBSITE', url: 'https://bharatdn.com' },
  ],
  status: { emoji: '🚀', message: 'Building ReadmeCraft v3', expiresAt: null },
  recentPullRequests: [
    { title: 'feat: Add new template system', url: 'https://github.com/ErBharatMalhotra/readmecraft/pull/42', state: 'MERGED', mergedAt: '2024-11-10T00:00:00Z', repository: { name: 'readmecraft', owner: { login: 'ErBharatMalhotra' } } },
    { title: 'fix: Resolve hydration mismatch', url: 'https://github.com/ErBharatMalhotra/readmecraft/pull/41', state: 'MERGED', mergedAt: '2024-11-08T00:00:00Z', repository: { name: 'readmecraft', owner: { login: 'ErBharatMalhotra' } } },
  ],
  recentIssues: [
    { title: 'Feature request: Add more themes', url: 'https://github.com/ErBharatMalhotra/readmecraft/issues/38', state: 'OPEN', repository: { name: 'readmecraft', owner: { login: 'ErBharatMalhotra' } } },
    { title: 'Bug: Mobile layout issue', url: 'https://github.com/ErBharatMalhotra/readmecraft/issues/37', state: 'CLOSED', repository: { name: 'readmecraft', owner: { login: 'ErBharatMalhotra' } } },
  ],
  repositoriesContributedTo: [
    { name: 'next.js', owner: { login: 'vercel' }, url: 'https://github.com/vercel/next.js', stargazerCount: 120000, primaryLanguage: { name: 'TypeScript', color: '#3178c6' } },
    { name: 'rust', owner: { login: 'rust-lang' }, url: 'https://github.com/rust-lang/rust', stargazerCount: 95000, primaryLanguage: { name: 'Rust', color: '#dea584' } },
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
  name: 'readmecraft',
  nameWithOwner: 'ErBharatMalhotra/readmecraft',
  title: 'ReadmeCraft',
  description: 'The next-generation intelligent GitHub README Studio for Developer Profiles and Repositories with instant auto-detection and ecosystem interlinking.',
  descriptionHTML: '<p>The next-generation intelligent GitHub README Studio for Developer Profiles and Repositories with instant auto-detection and ecosystem interlinking.</p>',
  url: 'https://github.com/ErBharatMalhotra/readmecraft',
  homepageUrl: 'https://readme.bharatdn.com',
  shortDescriptionHTML: '<p>Next-generation intelligent GitHub README Studio</p>',
  stars: 1205,
  stargazerCount: 1205,
  forkCount: 148,
  openIssues: 12,
  closedIssues: 8,
  diskUsage: 25000,
  license: 'MIT',
  licenseName: 'MIT License',
  licenseUrl: 'https://opensource.org/licenses/MIT',
  defaultBranch: 'main',
  primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
  languages: [
    { name: 'TypeScript', color: '#3178c6', size: 180000 },
    { name: 'CSS', color: '#563d7c', size: 25000 },
    { name: 'JavaScript', color: '#f1e05a', size: 15000 },
    { name: 'HTML', color: '#e34c26', size: 8000 },
  ],
  totalLanguageSize: 228000,
  repositoryTopics: [
    { name: 'nextjs', stargazerCount: 50000 },
    { name: 'react', stargazerCount: 80000 },
    { name: 'github', stargazerCount: 30000 },
    { name: 'readme', stargazerCount: 5000 },
    { name: 'developer-tools', stargazerCount: 10000 },
    { name: 'ai', stargazerCount: 25000 },
  ],
  releases: [
    { name: 'v3.0.0', tagName: 'v3.0.0', description: 'Major release with new template system', publishedAt: '2024-11-01T00:00:00Z', url: 'https://github.com/ErBharatMalhotra/readmecraft/releases/tag/v3.0.0', isPrerelease: false, isDraft: false },
    { name: 'v2.5.0', tagName: 'v2.5.0', description: 'Performance improvements', publishedAt: '2024-06-15T00:00:00Z', url: 'https://github.com/ErBharatMalhotra/readmecraft/releases/tag/v2.5.0', isPrerelease: false, isDraft: false },
  ],
  deployments: [
    { createdAt: '2024-11-01T12:00:00Z', environment: 'production', state: 'active', payload: 'Deployed to Vercel' },
    { createdAt: '2024-10-28T10:00:00Z', environment: 'preview', state: 'success', payload: 'Preview deployment' },
  ],
  environments: [
    { name: 'production', url: 'https://readme.bharatdn.com' },
    { name: 'preview', url: 'https://readmecraft-preview.vercel.app' },
  ],
  packages: [
    { name: '@readmecraft/core', packageType: 'NPM', version: '3.0.0', url: 'https://github.com/ErBharatMalhotra/readmecraft/packages' },
  ],
  workflows: [
    { name: 'CI', state: 'active', filePath: '.github/workflows/ci.yml' },
    { name: 'Release', state: 'active', filePath: '.github/workflows/release.yml' },
    { name: 'Deploy', state: 'active', filePath: '.github/workflows/deploy.yml' },
  ],
  vulnerabilityAlerts: [],
  dependencyGraphManifests: [
    { filename: 'package.json', dependencies: [ { packageName: 'next', repository: { name: 'next.js', url: 'https://github.com/vercel/next.js' }, requirements: '^16.0.0', hasDependencies: true }, { packageName: 'react', repository: { name: 'react', url: 'https://github.com/facebook/react' }, requirements: '^19.0.0', hasDependencies: true }, { packageName: 'tailwindcss', repository: { name: 'tailwindcss', url: 'https://github.com/tailwindlabs/tailwindcss' }, requirements: '^4.0.0', hasDependencies: true } ] },
  ],
  mergeCommitAllowed: true,
  rebaseMergeAllowed: true,
  squashMergeAllowed: true,
  deleteBranchOnMerge: true,
  updatedAt: '2024-11-10T00:00:00Z',
  pushedAt: '2024-11-10T00:00:00Z',
  createdAt: '2024-01-15T00:00:00Z',
  lastCommitDate: '2024-11-10T00:00:00Z',
  isArchived: false,
  isDisabled: false,
  isFork: false,
  isLocked: false,
  isMirror: false,
  isPrivate: false,
  isTemplate: false,
  templateRepository: null,
  parent: null,
  mentionableUsers: [
    { login: 'ErBharatMalhotra', name: 'Bharat Malhotra', avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4' },
  ],
  securityPolicyUrl: 'https://github.com/ErBharatMalhotra/readmecraft/security/policy',
  codeOfConduct: { name: 'Contributor Covenant', url: 'https://github.com/ErBharatMalhotra/readmecraft/blob/main/CODE_OF_CONDUCT.md' },
  fundingLinks: [
    { platform: 'GITHUB', url: 'https://github.com/sponsors/ErBharatMalhotra' },
    { platform: 'PATREON', url: 'https://patreon.com/bharatdn' },
  ],
  usesCustomOpenGraphImage: true,
  openGraphImageUrl: 'https://githolo.bharatdn.com/api/og/ErBharatMalhotra',
  hasIssuesEnabled: true,
  hasWikiEnabled: false,
  hasProjectsEnabled: true,
  hasDiscussionsEnabled: true,
  hasSponsorshipsEnabled: true,
  autoMergeAllowed: true,
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
    '🌙 Dark-mode-first, accessible, responsive, and performant by default',
  ],
  techStack: ['Next.js 16', 'React 19', 'TypeScript', 'TailwindCSS v4', 'Octokit', 'Lucide Icons', 'Turbopack'],
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
  Dart: '#0175c2',
  Shell: '#89e051',
  Vue: '#42b883',
  Svelte: '#ff3e00',
  Zig: '#ec915c',
  Lua: '#000080',
  R: '#276dc3',
  Julia: '#9558b2',
  Elixir: '#6e4a7e',
  Erlang: '#B83998',
  Haskell: '#5e5086',
  OCaml: '#ef6c00',
  FSharp: '#b845fc',
  CSharp: '#239120',
  PowerShell: '#012456',
  Scala: '#c22d40',
  Groovy: '#e69f56',
  Perl: '#0298c3',
  ObjectiveC: '#438eff',
  Assembly: '#8b00ff',
  Vim: '#199f4b',
  Makefile: '#427819',
  Dockerfile: '#384d54',
};

function calculateLanguages(repos: any[]): LanguageStat[] {
  const langBytes: Record<string, number> = {};
  let totalBytes = 0;
  
  repos.forEach((repo) => {
    if (repo.isFork) return;
    
    if (repo.languages?.nodes) {
      repo.languages.nodes.forEach((l: any) => {
        const size = l.size || 1000;
        langBytes[l.name] = (langBytes[l.name] || 0) + size;
        totalBytes += size;
      });
    } else if (repo.primaryLanguage) {
      // Fallback: estimate from primary language
      langBytes[repo.primaryLanguage.name] = (langBytes[repo.primaryLanguage.name] || 0) + 50000;
      totalBytes += 50000;
    }
  });

  const sortedLangs = Object.entries(langBytes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (totalBytes === 0) {
    return [
      { name: 'TypeScript', percentage: 45, color: '#3178c6', bytes: 0 },
      { name: 'Python', percentage: 25, color: '#3572A5', bytes: 0 },
      { name: 'Rust', percentage: 15, color: '#dea584', bytes: 0 },
      { name: 'Go', percentage: 10, color: '#00ADD8', bytes: 0 },
      { name: 'JavaScript', percentage: 5, color: '#f1e05a', bytes: 0 },
    ];
  }

  return sortedLangs.map(([name, bytes]) => ({
    name,
    percentage: Number(((bytes / totalBytes) * 100).toFixed(1)),
    color: LANG_COLORS[name] || '#8b5cf6',
    bytes,
  }));
}

function calculateLanguagesFromRepoData(languages: any[]): LanguageStat[] {
  if (!languages || languages.length === 0) return [];
  
  const totalSize = languages.reduce((sum, l) => sum + (l.size || 0), 0);
  if (totalSize === 0) return [];
  
  return languages
    .map((l) => ({
      name: l.name,
      percentage: Number(((l.size / totalSize) * 100).toFixed(1)),
      color: l.color || LANG_COLORS[l.name] || '#8b5cf6',
      bytes: l.size,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);
}

function extractSkillsFromData(data: any, languages: LanguageStat[]): string[] {
  const skills = new Set<string>();
  
  // Add top languages as skills
  languages.slice(0, 6).forEach(l => skills.add(l.name));
  
  // Add skills from repo topics
  data.reposList?.nodes?.forEach((repo: any) => {
    repo.repositoryTopics?.nodes?.forEach((t: any) => {
      const topic = t.topic?.name || '';
      if (topic && topic.length > 1) {
        // Convert kebab-case to Title Case for skills
        skills.add(topic.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
      }
    });
  });
  
  // Add common developer skills
  const commonSkills = [
    'Git', 'Docker', 'REST APIs', 'GraphQL', 'CI/CD', 'Testing',
    'System Design', 'Microservices', 'Kubernetes', 'AWS', 'PostgreSQL',
    'Redis', 'WebSockets', 'TypeScript', 'React', 'Node.js',
    'Performance Optimization', 'Security', 'Observability'
  ];
  commonSkills.forEach(s => skills.add(s));
  
  return Array.from(skills).slice(0, 25);
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
    const skills = extractSkillsFromData(userData, languages);

    let pinnedRepos = userData.pinnedItems?.nodes || [];
    if (pinnedRepos.length === 0) {
      const sortedRepos = repos
        .filter((r: any) => !r.isFork && !r.isArchived)
        .sort((a: any, b: any) => b.stargazerCount - a.stargazerCount)
        .slice(0, 6);
      pinnedRepos = sortedRepos;
    }

    const finalPinned: PinnedRepo[] = pinnedRepos.map((r: any) => ({
      name: r.name,
      description: r.description || 'No description provided.',
      descriptionHTML: r.descriptionHTML || undefined,
      url: r.url,
      stargazersCount: r.stargazerCount,
      forksCount: r.forkCount,
      language: r.primaryLanguage?.name || 'Code',
      topics: r.repositoryTopics?.nodes?.map((n: any) => n.topic.name) || [],
      license: r.licenseInfo?.spdxId || undefined,
      isFork: r.isFork,
      isArchived: r.isArchived,
      homepageUrl: r.homepageUrl || undefined,
      releases: r.releases?.nodes?.map((rel: any) => ({
        name: rel.name,
        tagName: rel.tagName,
        publishedAt: rel.publishedAt,
        url: rel.url,
        isPrerelease: rel.isPrerelease,
      })) || [],
    }));

    // Process top repositories
    const topRepos: TopRepository[] = (userData.topRepositories?.nodes || []).map((r: any) => ({
      name: r.name,
      stargazerCount: r.stargazerCount,
      url: r.url,
      primaryLanguage: r.primaryLanguage,
    }));

    // Process contribution calendar
    const calendar = userData.contributionsCollection?.contributionCalendar || { totalContributions: 0, weeks: [] };
    const contributionCalendar: ContributionCalendar = {
      totalContributions: calendar.totalContributions || 0,
      weeks: (calendar.weeks || []).map((w: any) => ({
        contributionDays: (w.contributionDays || []).map((d: any) => ({
          date: d.date,
          contributionCount: d.contributionCount || 0,
          weekday: d.weekday ?? 0,
        })),
      })),
    };

    // Process commit contributions by repository
    const commitContribs: RepositoryContribution[] = (userData.contributionsCollection?.commitContributionsByRepository?.nodes || []).map((c: any) => ({
      repository: {
        name: c.repository.name,
        owner: { login: c.repository.owner.login },
        url: c.repository.url,
        primaryLanguage: c.repository.primaryLanguage,
      },
      contributions: { totalCount: c.contributions.totalCount },
    }));

    // Process PR contributions by repository
    const prContribs: PullRequestContribution[] = (userData.contributionsCollection?.pullRequestContributionsByRepository?.nodes || []).map((c: any) => ({
      repository: {
        name: c.repository.name,
        owner: { login: c.repository.owner.login },
        url: c.repository.url,
      },
      contributions: { totalCount: c.contributions.totalCount },
    }));

    // Process organizations
    const organizations: Organization[] = (userData.organizations?.nodes || []).map((o: any) => ({
      login: o.login,
      name: o.name,
      avatarUrl: o.avatarUrl,
      url: o.url,
    }));

    // Process packages
    const packages: Package[] = (userData.packages?.nodes || []).map((p: any) => ({
      name: p.name,
      packageType: p.packageType,
      url: p.url,
      version: p.version,
    }));

    // Process sponsors
    const sponsors: Sponsor[] = (userData.sponsors?.nodes || []).map((s: any) => ({
      login: s.login,
      avatarUrl: s.avatarUrl,
      url: s.url,
    }));

    // Process sponsorships as maintainer
    const sponsorshipsAsMaintainer = (userData.sponsorshipsAsMaintainer?.nodes || []).map((s: any) => ({
      sponsorEntity: {
        login: s.sponsorEntity.login,
        avatarUrl: s.sponsorEntity.avatarUrl,
        name: s.sponsorEntity.name,
        url: s.sponsorEntity.url,
      },
      tier: {
        monthlyPriceInCents: s.tier.monthlyPriceInCents,
        name: s.tier.name,
      },
    }));

    // Process social accounts
    const socialAccounts: SocialAccount[] = (userData.socialAccounts?.nodes || []).map((s: any) => ({
      provider: s.provider,
      url: s.url,
    }));

    // Process status
    const status: UserStatus | null = userData.status ? {
      emoji: userData.status.emoji,
      message: userData.status.message,
      expiresAt: userData.status.expiresAt,
    } : null;

    // Process recent PRs
    const recentPullRequests: PullRequest[] = (userData.pullRequests?.nodes || []).map((pr: any) => ({
      title: pr.title,
      url: pr.url,
      state: pr.state,
      mergedAt: pr.mergedAt,
      repository: { name: pr.repository.name, owner: { login: pr.repository.owner.login } },
    }));

    // Process recent issues
    const recentIssues: Issue[] = (userData.issues?.nodes || []).map((issue: any) => ({
      title: issue.title,
      url: issue.url,
      state: issue.state,
      repository: { name: issue.repository.name, owner: { login: issue.repository.owner.login } },
    }));

    // Process repositories contributed to
    const repositoriesContributedTo = (userData.repositoriesContributedTo?.nodes || []).map((r: any) => ({
      name: r.name,
      owner: { login: r.owner.login },
      url: r.url,
      stargazerCount: r.stargazerCount,
      primaryLanguage: r.primaryLanguage,
    }));

    return {
      username: userData.login,
      name: userData.name || userData.login,
      bio: userData.bio || 'Developer & Open Source Contributor',
      bioHTML: userData.bioHTML || undefined,
      avatarUrl: userData.avatarUrl,
      company: userData.company || '',
      companyHTML: userData.companyHTML || undefined,
      location: userData.location || '',
      website: userData.websiteUrl || '',
      twitter: userData.twitterUsername || '',
      email: userData.email,
      githubUrl: userData.url,
      resourcePath: userData.resourcePath || `/${userData.login}`,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      userViewType: userData.userViewType || 'PUBLIC',
      isSponsorable: userData.isSponsorable || false,
      estimatedNextSponsorsPayoutInCents: userData.estimatedNextSponsorsPayoutInCents || 0,
      monthlyEstimatedSponsorsIncomeInCents: userData.monthlyEstimatedSponsorsIncomeInCents || 0,
      hasSponsorsListing: userData.hasSponsorsListing || false,
      pronouns: userData.pronouns || null,
      publicRepos: userData.repositories?.totalCount || 0,
      totalDiskUsage: userData.repositories?.totalDiskUsage || 0,
      followers: userData.followers?.totalCount || 0,
      following: userData.following?.totalCount || 0,
      starredRepositoriesCount: userData.starredRepositories?.totalCount || 0,
      watchingCount: userData.watching?.totalCount || 0,
      gistsCount: userData.gists?.totalCount || 0,
      languages: languages.length > 0 ? languages : [],
      skills,
      pinnedRepos: finalPinned.length > 0 ? finalPinned : [],
      topRepositories: topRepos.length > 0 ? topRepos : [],
      contributionCalendar,
      totalCommitContributions: userData.contributionsCollection?.totalCommitContributions || 0,
      totalIssueContributions: userData.contributionsCollection?.totalIssueContributions || 0,
      totalPullRequestContributions: userData.contributionsCollection?.totalPullRequestContributions || 0,
      totalPullRequestReviewContributions: userData.contributionsCollection?.totalPullRequestReviewContributions || 0,
      totalRepositoriesWithContributedCommits: userData.contributionsCollection?.totalRepositoriesWithContributedCommits || 0,
      commitContributionsByRepository: commitContribs,
      pullRequestContributionsByRepository: prContribs,
      organizations,
      packages,
      sponsors,
      sponsorshipsAsMaintainer,
      socialAccounts,
      status,
      recentPullRequests,
      recentIssues,
      repositoriesContributedTo,
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

      const languages = calculateLanguagesFromRepoData(
        repos.flatMap((r: any) => r.language ? [{ name: r.language, size: r.size || 1000 }] : [])
      );
      const skills = extractSkillsFromData({ reposList: { nodes: repos } }, languages);

      const sortedRepos = repos
        .filter((r: any) => !r.fork)
        .sort((a: any, b: any) => b.stargazers_count - a.stargazers_count)
        .slice(0, 6);

      const pinnedRepos = sortedRepos.map((r: any) => ({
        name: r.name,
        description: r.description || 'No description provided.',
        url: r.html_url,
        stargazersCount: r.stargazers_count,
        forksCount: r.forks_count,
        language: r.language || 'Code',
        topics: r.topics || [],
        license: r.license?.spdx_id,
        isFork: r.fork,
        isArchived: r.archived,
        homepageUrl: r.homepage,
        releases: [],
      }));

      return {
        username: userData.login,
        name: userData.name || userData.login,
        bio: userData.bio || 'Developer & Open Source Contributor',
        bioHTML: undefined,
        avatarUrl: userData.avatar_url,
        company: userData.company || '',
        companyHTML: undefined,
        location: userData.location || '',
        website: userData.blog || '',
        twitter: userData.twitter_username || '',
        email: null,
        githubUrl: userData.html_url,
        resourcePath: `/${userData.login}`,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
        userViewType: 'PUBLIC',
        isSponsorable: false,
        estimatedNextSponsorsPayoutInCents: 0,
        monthlyEstimatedSponsorsIncomeInCents: 0,
        hasSponsorsListing: false,
        pronouns: null,
        publicRepos: userData.public_repos,
        totalDiskUsage: 0,
        followers: userData.followers,
        following: userData.following,
        starredRepositoriesCount: 0,
        watchingCount: 0,
        gistsCount: userData.public_gists || 0,
        languages: languages.length > 0 ? languages : [],
        skills,
        pinnedRepos: pinnedRepos.length > 0 ? pinnedRepos : [],
        topRepositories: [],
        contributionCalendar: { totalContributions: 0, weeks: [] },
        totalCommitContributions: 0,
        totalIssueContributions: 0,
        totalPullRequestContributions: 0,
        totalPullRequestReviewContributions: 0,
        totalRepositoriesWithContributedCommits: 0,
        commitContributionsByRepository: [],
        pullRequestContributionsByRepository: [],
        organizations: [],
        packages: [],
        sponsors: [],
        sponsorshipsAsMaintainer: [],
        socialAccounts: [],
        status: null,
        recentPullRequests: [],
        recentIssues: [],
        repositoriesContributedTo: [],
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
        bioHTML: undefined,
        avatarUrl: `https://avatars.githubusercontent.com/${username}?v=4`,
        company: '',
        companyHTML: undefined,
        location: '',
        website: '',
        twitter: '',
        email: null,
        githubUrl: `https://github.com/${username}`,
        resourcePath: `/${username}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userViewType: 'PUBLIC',
        isSponsorable: false,
        estimatedNextSponsorsPayoutInCents: 0,
        monthlyEstimatedSponsorsIncomeInCents: 0,
        hasSponsorsListing: false,
        pronouns: null,
        publicRepos: 0,
        totalDiskUsage: 0,
        followers: 0,
        following: 0,
        starredRepositoriesCount: 0,
        watchingCount: 0,
        gistsCount: 0,
        languages: [],
        skills: ['Git', 'Docker', 'REST APIs', 'CI/CD'],
        pinnedRepos: [],
        topRepositories: [],
        contributionCalendar: { totalContributions: 0, weeks: [] },
        totalCommitContributions: 0,
        totalIssueContributions: 0,
        totalPullRequestContributions: 0,
        totalPullRequestReviewContributions: 0,
        totalRepositoriesWithContributedCommits: 0,
        commitContributionsByRepository: [],
        pullRequestContributionsByRepository: [],
        organizations: [],
        packages: [],
        sponsors: [],
        sponsorshipsAsMaintainer: [],
        socialAccounts: [],
        status: null,
        recentPullRequests: [],
        recentIssues: [],
        repositoriesContributedTo: [],
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

    let packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip' | 'go' = 'npm';
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
    } else if (repoData.primaryLanguage?.name === 'Python') {
      packageManager = 'pip';
      installCommand = 'pip install -r requirements.txt';
      runCommand = 'python main.py';
      testCommand = 'pytest';
      framework = 'Python';
    } else if (repoData.primaryLanguage?.name === 'Go') {
      packageManager = 'go';
      installCommand = 'go mod tidy';
      runCommand = 'go run main.go';
      testCommand = 'go test ./...';
      framework = 'Go';
    }

    const languageStats = calculateLanguagesFromRepoData(repoData.languages?.nodes || []);
    const languages = languageStats.map(l => ({ name: l.name, color: l.color, size: l.bytes || 0 }));
    const techStack = languages.length > 0 
      ? languages.map(l => l.name) 
      : [repoData.primaryLanguage?.name || 'TypeScript', framework, 'Git', 'GitHub Actions'];

    const lastCommitDate = repoData.defaultBranchRef?.target?.history?.nodes?.[0]?.committedDate || null;

    return {
      owner,
      repo,
      name: repoData.name,
      nameWithOwner: repoData.nameWithOwner,
      title: repoData.name,
      description: repoData.description || 'High-performance open source repository.',
      descriptionHTML: repoData.descriptionHTML || undefined,
      url: repoData.url,
      homepageUrl: repoData.homepageUrl,
      shortDescriptionHTML: repoData.shortDescriptionHTML || undefined,
      stars: repoData.stargazerCount,
      stargazerCount: repoData.stargazerCount,
      forkCount: repoData.forkCount,
      openIssues: repoData.openIssues?.totalCount || 0,
      closedIssues: repoData.closedIssues?.totalCount || 0,
      diskUsage: repoData.diskUsage,
      license: repoData.licenseInfo?.spdxId || 'MIT',
      licenseName: repoData.licenseInfo?.name || undefined,
      licenseUrl: repoData.licenseInfo?.url || undefined,
      defaultBranch: repoData.defaultBranchRef?.name || 'main',
      primaryLanguage: repoData.primaryLanguage,
      languages,
      totalLanguageSize: repoData.languages?.totalSize || 0,
      repositoryTopics: (repoData.repositoryTopics?.nodes || []).map((n: any) => ({
        name: n.topic.name,
        stargazerCount: n.topic.stargazerCount,
      })),
      releases: (repoData.releases?.nodes || []).map((r: any) => ({
        name: r.name,
        tagName: r.tagName,
        description: r.description,
        publishedAt: r.publishedAt,
        url: r.url,
        isPrerelease: r.isPrerelease,
        isDraft: r.isDraft,
      })),
      deployments: (repoData.deployments?.nodes || []).map((d: any) => ({
        createdAt: d.createdAt,
        environment: d.environment,
        state: d.state,
        payload: d.payload,
      })),
      environments: (repoData.environments?.nodes || []).map((e: any) => ({
        name: e.name,
        url: e.url,
      })),
      packages: (repoData.packages?.nodes || []).map((p: any) => ({
        name: p.name,
        packageType: p.packageType,
        version: p.version,
        url: p.url,
      })),
      workflows: (repoData.workflows?.nodes || []).map((w: any) => ({
        name: w.name,
        state: w.state,
        filePath: w.filePath,
      })),
      vulnerabilityAlerts: (repoData.vulnerabilityAlerts?.nodes || []).map((v: any) => ({
        severity: v.securityVulnerability.severity,
        package: { name: v.securityVulnerability.package.name, ecosystem: v.securityVulnerability.package.ecosystem },
      })),
      dependencyGraphManifests: (repoData.dependencyGraphManifests?.nodes || []).map((m: any) => ({
        filename: m.filename,
        dependencies: (m.dependencies?.nodes || []).map((d: any) => ({
          packageName: d.packageName,
          repository: d.repository,
          requirements: d.requirements,
          hasDependencies: d.hasDependencies,
        })),
      })),
      mergeCommitAllowed: repoData.mergeCommitAllowed,
      rebaseMergeAllowed: repoData.rebaseMergeAllowed,
      squashMergeAllowed: repoData.squashMergeAllowed,
      deleteBranchOnMerge: repoData.deleteBranchOnMerge,
      updatedAt: repoData.updatedAt,
      pushedAt: repoData.pushedAt,
      createdAt: repoData.createdAt,
      lastCommitDate,
      isArchived: repoData.isArchived,
      isDisabled: repoData.isDisabled,
      isFork: repoData.isFork,
      isLocked: repoData.isLocked,
      isMirror: repoData.isMirror,
      isPrivate: repoData.isPrivate,
      isTemplate: repoData.isTemplate,
      templateRepository: repoData.templateRepository,
      parent: repoData.parent,
      mentionableUsers: (repoData.mentionableUsers?.nodes || []).map((u: any) => ({
        login: u.login,
        name: u.name,
        avatarUrl: u.avatarUrl,
      })),
      securityPolicyUrl: repoData.securityPolicyUrl,
      codeOfConduct: repoData.codeOfConduct,
      fundingLinks: (repoData.fundingLinks?.nodes || []).map((f: any) => ({
        platform: f.platform,
        url: f.url,
      })),
      usesCustomOpenGraphImage: repoData.usesCustomOpenGraphImage,
      openGraphImageUrl: repoData.openGraphImageUrl,
      hasIssuesEnabled: repoData.hasIssuesEnabled,
      hasWikiEnabled: repoData.hasWikiEnabled,
      hasProjectsEnabled: repoData.hasProjectsEnabled,
      hasDiscussionsEnabled: repoData.hasDiscussionsEnabled,
      hasSponsorshipsEnabled: repoData.hasSponsorshipsEnabled,
      autoMergeAllowed: repoData.autoMergeAllowed,
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
        repoData.hasDiscussionsEnabled ? `💬 Community discussions enabled` : '',
        repoData.hasProjectsEnabled ? `📋 Project boards for tracking` : '',
        repoData.hasWikiEnabled ? `📚 Wiki documentation available` : '',
      ].filter(Boolean),
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

      const languageStats = calculateLanguagesFromRepoData(
        repoData.language ? [{ name: repoData.language, size: repoData.size || 10000 }] : []
      );
      const languages = languageStats.map(l => ({ name: l.name, color: l.color, size: l.bytes || 0 }));

      return {
        owner,
        repo,
        name: repoData.name,
        nameWithOwner: repoData.full_name,
        title: repoData.name,
        description: repoData.description || 'High-performance open source repository.',
        descriptionHTML: undefined,
        url: repoData.html_url,
        homepageUrl: repoData.homepage,
        shortDescriptionHTML: undefined,
        stars: repoData.stargazers_count,
        stargazerCount: repoData.stargazers_count,
        forkCount: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        closedIssues: 0,
        diskUsage: repoData.size * 1024,
        license: repoData.license?.spdx_id || 'MIT',
        licenseName: repoData.license?.name ?? undefined,
        licenseUrl: repoData.license?.url ?? undefined,
        defaultBranch: repoData.default_branch || 'main',
        primaryLanguage: repoData.language ? { name: repoData.language, color: LANG_COLORS[repoData.language] || '#8b5cf6' } : null,
        languages,
        totalLanguageSize: repoData.size * 1024,
        repositoryTopics: (repoData.topics || []).map((t: string) => ({ name: t })),
        releases: [],
        deployments: [],
        environments: [],
        packages: [],
        workflows: [],
        vulnerabilityAlerts: [],
        dependencyGraphManifests: [],
        mergeCommitAllowed: repoData.allow_merge_commit,
        rebaseMergeAllowed: repoData.allow_rebase_merge,
        squashMergeAllowed: repoData.allow_squash_merge,
        deleteBranchOnMerge: repoData.delete_branch_on_merge,
        updatedAt: repoData.updated_at,
        pushedAt: repoData.pushed_at,
        createdAt: repoData.created_at,
        lastCommitDate: repoData.pushed_at,
        isArchived: repoData.archived,
        isDisabled: repoData.disabled,
        isFork: repoData.fork,
        isLocked: false,
        isMirror: false,
        isPrivate: repoData.private,
        isTemplate: repoData.is_template,
        templateRepository: repoData.template_repository ? { name: repoData.template_repository.name, owner: { login: repoData.template_repository.owner.login }, url: repoData.template_repository.html_url } : null,
        parent: repoData.parent ? { name: repoData.parent.name, owner: { login: repoData.parent.owner.login }, url: repoData.parent.html_url } : null,
        mentionableUsers: [],
        securityPolicyUrl: null,
        codeOfConduct: null,
        fundingLinks: [],
        usesCustomOpenGraphImage: false,
        openGraphImageUrl: null,
        hasIssuesEnabled: repoData.has_issues,
        hasWikiEnabled: repoData.has_wiki,
        hasProjectsEnabled: repoData.has_projects,
        hasDiscussionsEnabled: repoData.has_discussions,
        hasSponsorshipsEnabled: false,
        autoMergeAllowed: repoData.allow_auto_merge,
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
        name: repo,
        nameWithOwner: `${owner}/${repo}`,
        title: repo,
        description: 'Repository',
        descriptionHTML: undefined,
        url: `https://github.com/${owner}/${repo}`,
        homepageUrl: null,
        shortDescriptionHTML: undefined,
        stars: 0,
        stargazerCount: 0,
        forkCount: 0,
        openIssues: 0,
        closedIssues: 0,
        diskUsage: 0,
        license: 'MIT',
        licenseName: undefined,
        licenseUrl: undefined,
        defaultBranch: 'main',
        primaryLanguage: null,
        languages: [],
        totalLanguageSize: 0,
        repositoryTopics: [],
        releases: [],
        deployments: [],
        environments: [],
        packages: [],
        workflows: [],
        vulnerabilityAlerts: [],
        dependencyGraphManifests: [],
        mergeCommitAllowed: true,
        rebaseMergeAllowed: true,
        squashMergeAllowed: true,
        deleteBranchOnMerge: true,
        updatedAt: new Date().toISOString(),
        pushedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastCommitDate: null,
        isArchived: false,
        isDisabled: false,
        isFork: false,
        isLocked: false,
        isMirror: false,
        isPrivate: false,
        isTemplate: false,
        templateRepository: null,
        parent: null,
        mentionableUsers: [],
        securityPolicyUrl: null,
        codeOfConduct: null,
        fundingLinks: [],
        usesCustomOpenGraphImage: false,
        openGraphImageUrl: null,
        hasIssuesEnabled: true,
        hasWikiEnabled: false,
        hasProjectsEnabled: true,
        hasDiscussionsEnabled: true,
        hasSponsorshipsEnabled: false,
        autoMergeAllowed: true,
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