import { describe, expect, it } from 'vitest';
import { getProjectSections, getProfileSections } from '@/lib/generators';
import type { ProfileData, ProfilePreset, ProjectData, ProjectPreset } from '@/types/readmecraft';

const profile = {
  username: 'octocat',
  name: 'Octo Cat',
  bio: 'Builds developer tools.',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  company: '@github',
  location: 'San Francisco',
  website: 'https://octo.dev',
  twitter: 'octocat',
  email: 'octo@example.com',
  githubUrl: 'https://github.com/octocat',
  pronouns: null,
  publicRepos: 8,
  followers: 1200,
  following: 9,
  starredRepositoriesCount: 40,
  languages: [{ name: 'TypeScript', color: '#3178c6', size: 48000, percentage: 80, bytes: 48000 }],
  skills: ['React', 'Docker', 'PostgreSQL'],
  pinnedRepos: [
    {
      name: 'readmecraft',
      description: 'README studio',
      url: 'https://github.com/octocat/readmecraft',
      stargazersCount: 42,
      forksCount: 3,
      language: 'TypeScript',
      topics: ['readme', 'nextjs'],
    },
  ],
  socialAccounts: [{ provider: 'TWITTER', url: 'https://twitter.com/octocat' }],
  repositoryTopics: [{ name: 'readme', stargazerCount: 1200 }],
  gitHoloEnabled: true,
  gitChronicleEnabled: true,
  visitorBadgeEnabled: true,
  githubStatsEnabled: true,
  githubStreakEnabled: true,
  topLanguagesEnabled: true,
  organizations: [],
  packages: [],
  sponsors: [],
} as unknown as ProfileData;

const project = {
  owner: 'octocat',
  repo: 'readmecraft',
  name: 'readmecraft',
  title: 'ReadmeCraft',
  description: 'Build a README that looks designed.',
  url: 'https://github.com/octocat/readmecraft',
  homepageUrl: 'https://readme.bharatdn.com',
  stars: 42,
  stargazerCount: 42,
  forkCount: 3,
  openIssues: 4,
  license: 'MIT',
  licenseName: 'MIT License',
  defaultBranch: 'main',
  primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
  language: 'TypeScript',
  languages: [{ name: 'TypeScript', color: '#3178c6', size: 48000 }],
  totalLanguageSize: 48000,
  repositoryTopics: [
    { name: 'readme', stargazerCount: 1200 },
    { name: 'typescript', stargazerCount: 900 },
  ],
  packageManager: 'npm',
  installCommand: 'npm install readmecraft',
  runCommand: 'npm run dev',
  testCommand: 'npm test',
  framework: 'Next.js',
  features: ['Live preview', 'Native badges'],
  techStack: ['Next.js', 'TypeScript'],
  dependencies: [],
  devDependencies: [],
} as unknown as ProjectData;

const render = (sections: { content: string }[]) => sections.map((s) => s.content).join('\n\n');

describe('generated README badges', () => {
  it('never links to shields.io for any profile preset', () => {
    const presets: ProfilePreset[] = ['bento', 'minimalist', 'titan'];
    for (const preset of presets) {
      const markdown = render(getProfileSections(profile, preset, 'gta6'));
      expect(markdown).not.toContain('img.shields.io');
      expect(markdown).toContain('readme.bharatdn.com/api/badges');
    }
  });

  it('never links to shields.io for any project preset', () => {
    const presets: ProjectPreset[] = ['standard', 'api', 'cli'];
    for (const preset of presets) {
      const markdown = render(getProjectSections(project, preset, 'gta6'));
      expect(markdown).not.toContain('img.shields.io');
      expect(markdown).toContain('readme.bharatdn.com/api/badges');
    }
  });

  it('prints the profile header snippet for manual review', () => {
    const sections = getProfileSections(profile, 'bento', 'gta6');
    const header = sections.find((s) => s.id === 'header');
    const pinned = sections.find((s) => s.id === 'pinned_repos_detailed');
    // eslint-disable-next-line no-console
    console.log('--- profile header ---\n' + (header?.content ?? '(missing)'));
    // eslint-disable-next-line no-console
    console.log('--- pinned repos ---\n' + (pinned?.content ?? '(missing)').split('<details')[0]);

    const cli = getProjectSections(project, 'cli', 'gta6').find((s) => s.id === 'header');
    // eslint-disable-next-line no-console
    console.log('--- cli project header ---\n' + (cli?.content ?? '(missing)'));

    expect(header).toBeTruthy();
  });
});
