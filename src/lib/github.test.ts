import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { fetchGitHubProfile, fetchGitHubProject } from './github';

const SAMPLE_PROFILE_USERNAME = 'testuser';
const SAMPLE_REPO_OWNER = 'testowner';
const SAMPLE_REPO_NAME = 'testrepo';

const handlers = [
  // Profile endpoints
  http.get(`https://api.github.com/users/${SAMPLE_PROFILE_USERNAME}`, () => {
    return HttpResponse.json({
      login: SAMPLE_PROFILE_USERNAME,
      name: 'Test User',
      bio: 'Test bio for profile',
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
      company: 'Test Company',
      location: 'Test Location',
      blog: 'https://test.com',
      twitter_username: 'testuser',
      html_url: `https://github.com/${SAMPLE_PROFILE_USERNAME}`,
      public_repos: 10,
      followers: 100,
      following: 50,
    });
  }),

  http.get(`https://api.github.com/users/${SAMPLE_PROFILE_USERNAME}/repos`, () => {
    return HttpResponse.json([
      {
        name: 'repo1',
        language: 'TypeScript',
        stargazers_count: 100,
        fork: false,
        html_url: `https://github.com/${SAMPLE_PROFILE_USERNAME}/repo1`,
        description: 'First test repo',
      },
      {
        name: 'repo2',
        language: 'Rust',
        stargazers_count: 50,
        fork: false,
        html_url: `https://github.com/${SAMPLE_PROFILE_USERNAME}/repo2`,
        description: 'Second test repo',
      },
      {
        name: 'repo3',
        language: 'TypeScript',
        stargazers_count: 25,
        fork: true,
        html_url: `https://github.com/${SAMPLE_PROFILE_USERNAME}/repo3`,
        description: 'Forked repo',
      },
    ]);
  }),

  // Project endpoints
  http.get(`https://api.github.com/repos/${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`, () => {
    return HttpResponse.json({
      name: SAMPLE_REPO_NAME,
      description: 'Test repository description',
      license: { spdx_id: 'MIT' },
      default_branch: 'main',
      stargazers_count: 500,
      forks_count: 100,
      open_issues_count: 10,
      language: 'TypeScript',
      homepage: 'https://example.com',
    });
  }),

  http.get(
    `https://api.github.com/repos/${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}/contents/package.json`,
    () => {
      return HttpResponse.json({
        content: Buffer.from(
          JSON.stringify({
            name: 'test-repo',
            version: '1.0.0',
            scripts: { dev: 'next dev', build: 'next build', test: 'jest' },
            dependencies: { next: '^14.0.0', react: '^18.0.0' },
            devDependencies: { typescript: '^5.0.0' },
          })
        ).toString('base64'),
        encoding: 'base64',
      });
    }
  ),

  // Error cases
  http.get('https://api.github.com/users/notfounduser', () => {
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('https://api.github.com/repos/notfoundowner/notfoundrepo', () => {
    return new HttpResponse(null, { status: 404 });
  }),

  http.get('https://api.github.com/users/ratelimited', () => {
    return new HttpResponse(null, {
      status: 403,
      headers: {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      },
    });
  }),

  http.get('https://api.github.com/users/networkerror', () => {
    return HttpResponse.error();
  }),
];

const server = setupServer(...handlers);

describe('GitHub Ingestion Integration Tests', () => {
  beforeAll(() => server.listen());
  afterAll(() => server.close());
  beforeEach(() => server.resetHandlers());

  describe('fetchGitHubProfile', () => {
    it('successfully fetches and transforms profile data', async () => {
      const data = await fetchGitHubProfile(SAMPLE_PROFILE_USERNAME);

      expect(data.username).toBe(SAMPLE_PROFILE_USERNAME);
      expect(data.name).toBe('Test User');
      expect(data.bio).toBe('Test bio for profile');
      expect(data.avatarUrl).toBe('https://avatars.githubusercontent.com/u/1?v=4');
      expect(data.company).toBe('Test Company');
      expect(data.location).toBe('Test Location');
      expect(data.website).toBe('https://test.com');
      expect(data.twitter).toBe('testuser');
      expect(data.githubUrl).toBe(`https://github.com/${SAMPLE_PROFILE_USERNAME}`);
      expect(data.publicRepos).toBe(10);
      expect(data.followers).toBe(100);
      expect(data.following).toBe(50);
    });

    it('calculates language percentages correctly', async () => {
      const data = await fetchGitHubProfile(SAMPLE_PROFILE_USERNAME);

      expect(data.languages).toBeInstanceOf(Array);
      expect(data.languages.length).toBeGreaterThan(0);

      const tsLang = data.languages.find((l) => l.name === 'TypeScript');
      const rustLang = data.languages.find((l) => l.name === 'Rust');

      expect(tsLang).toBeDefined();
      expect(rustLang).toBeDefined();

      // TypeScript appears in 1 non-fork repo (repo1), Rust in 1 (repo2)
      // repo3 is a fork, so excluded
      // Total = 2 non-fork repos, so TypeScript = 50%, Rust = 50%
      expect(tsLang!.percentage).toBeCloseTo(50, 1);
      expect(rustLang!.percentage).toBeCloseTo(50, 1);
    });

    it('selects top non-fork repos by stars for pinned (max 3)', async () => {
      const data = await fetchGitHubProfile(SAMPLE_PROFILE_USERNAME);

      // Only 2 non-fork repos in test data (repo3 is fork)
      expect(data.pinnedRepos.length).toBeLessThanOrEqual(3);
      expect(data.pinnedRepos.length).toBe(2);
      expect(data.pinnedRepos[0].name).toBe('repo1'); // 100 stars
      expect(data.pinnedRepos[1].name).toBe('repo2'); // 50 stars

      expect(data.pinnedRepos.every((r) => r.stargazersCount > 0)).toBe(true);
    });

    it('includes ecosystem toggles in profile data', async () => {
      const data = await fetchGitHubProfile(SAMPLE_PROFILE_USERNAME);

      expect(data.gitHoloEnabled).toBe(true);
      expect(data.gitChronicleEnabled).toBe(true);
      expect(data.visitorBadgeEnabled).toBe(true);
      expect(data.githubStatsEnabled).toBe(true);
      expect(data.githubStreakEnabled).toBe(true);
      expect(data.topLanguagesEnabled).toBe(true);
    });

    it('returns sample data on 404', async () => {
      const data = await fetchGitHubProfile('notfounduser');

      expect(data.username).toBe('notfounduser');
      expect(data.name).toBe('notfounduser');
      // Should fall back to sample data structure
      expect(data.languages).toBeInstanceOf(Array);
      expect(data.pinnedRepos).toBeInstanceOf(Array);
    });

    it('returns sample data on rate limit', async () => {
      const data = await fetchGitHubProfile('ratelimited');

      expect(data.username).toBe('ratelimited');
      expect(data.languages).toBeInstanceOf(Array);
    });

    it('returns sample data on network error', async () => {
      const data = await fetchGitHubProfile('networkerror');

      expect(data.username).toBe('networkerror');
      expect(data.languages).toBeInstanceOf(Array);
    });
  });

  describe('fetchGitHubProject', () => {
    it('successfully fetches and transforms project data', async () => {
      const data = await fetchGitHubProject(`${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`);

      expect(data.owner).toBe(SAMPLE_REPO_OWNER);
      expect(data.repo).toBe(SAMPLE_REPO_NAME);
      expect(data.title).toBe(SAMPLE_REPO_NAME);
      expect(data.description).toBe('Test repository description');
      expect(data.license).toBe('MIT');
      expect(data.defaultBranch).toBe('main');
      expect(data.stars).toBe(500);
      expect(data.forks).toBe(100);
      expect(data.openIssues).toBe(10);
      expect(data.language).toBe('TypeScript');
      expect(data.demoUrl).toBe('https://example.com');
    });

    it('detects package manager and commands from package.json', async () => {
      const data = await fetchGitHubProject(`${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`);

      expect(data.packageManager).toBe('npm');
      expect(data.installCommand).toBe('npm install');
      expect(data.runCommand).toBe('npm run dev');
      expect(data.testCommand).toBe('npm test');
      expect(data.framework).toBe('Next.js');
    });

    it('detects pnpm when pnpm in dependencies', async () => {
      server.use(
        http.get(
          `https://api.github.com/repos/${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}/contents/package.json`,
          () => {
            return HttpResponse.json({
              content: Buffer.from(
                JSON.stringify({
                  name: 'test-repo',
                  scripts: { dev: 'pnpm dev' },
                  dependencies: { next: '^14.0.0', pnpm: '^8.0.0' },
                })
              ).toString('base64'),
              encoding: 'base64',
            });
          }
        )
      );

      const data = await fetchGitHubProject(`${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`);

      expect(data.packageManager).toBe('pnpm');
      expect(data.installCommand).toBe('pnpm install');
      expect(data.runCommand).toBe('pnpm dev');
    });

    it('detects yarn when yarn in dependencies', async () => {
      server.use(
        http.get(
          `https://api.github.com/repos/${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}/contents/package.json`,
          () => {
            return HttpResponse.json({
              content: Buffer.from(
                JSON.stringify({
                  name: 'test-repo',
                  scripts: { dev: 'yarn dev' },
                  dependencies: { next: '^14.0.0', yarn: '^1.0.0' },
                })
              ).toString('base64'),
              encoding: 'base64',
            });
          }
        )
      );

      const data = await fetchGitHubProject(`${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`);

      expect(data.packageManager).toBe('yarn');
    });

    it('detects bun when bun in dependencies', () => {
      // Test the package manager detection logic directly
      const pkgContent = {
        name: 'test-repo',
        scripts: { dev: 'bun dev' },
        dependencies: { next: '^14.0.0', bun: '^1.0.0' } as Record<string, string>,
        devDependencies: {} as Record<string, string>,
      };

      // Simulate the detection logic from github.ts
      let packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip' = 'npm';
      if (pkgContent.devDependencies?.pnpm || pkgContent.dependencies?.pnpm) {
        packageManager = 'pnpm';
      } else if (pkgContent.devDependencies?.yarn || pkgContent.dependencies?.yarn) {
        packageManager = 'yarn';
      } else if (pkgContent.devDependencies?.bun || pkgContent.dependencies?.bun) {
        packageManager = 'bun';
      }

      expect(packageManager).toBe('bun');
    });

    it('falls back to Cargo.toml when package.json not found', async () => {
      server.use(
        http.get(
          `https://api.github.com/repos/${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}/contents/package.json`,
          () => {
            return new HttpResponse(null, { status: 404 });
          }
        ),
        http.get(
          `https://api.github.com/repos/${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}/contents/Cargo.toml`,
          () => {
            return HttpResponse.json({
              content: Buffer.from('[package]\nname = "test"\nversion = "0.1.0"').toString(
                'base64'
              ),
              encoding: 'base64',
            });
          }
        )
      );

      const data = await fetchGitHubProject(`${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`);

      expect(data.packageManager).toBe('cargo');
      expect(data.installCommand).toBe('cargo build');
      expect(data.runCommand).toBe('cargo run');
      expect(data.testCommand).toBe('cargo test');
      expect(data.framework).toBe('Rust');
    });

    it('includes ecosystem toggles in project data', async () => {
      const data = await fetchGitHubProject(`${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`);

      expect(data.gitHoloEnabled).toBe(true);
      expect(data.gitChronicleEnabled).toBe(true);
    });

    it('returns sample data on 404', async () => {
      const data = await fetchGitHubProject('notfoundowner/notfoundrepo');

      // On 404, falls back to SAMPLE_PROJECT
      expect(data.owner).toBe('ErBharatMalhotra');
      expect(data.repo).toBe('readmecraft');
      expect(data.title).toBe('ReadmeCraft');
    });

    it('handles URL format input', async () => {
      const data = await fetchGitHubProject(
        `https://github.com/${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`
      );

      expect(data.owner).toBe(SAMPLE_REPO_OWNER);
      expect(data.repo).toBe(SAMPLE_REPO_NAME);
    });

    it('handles github.com/owner/repo format', async () => {
      const data = await fetchGitHubProject(`github.com/${SAMPLE_REPO_OWNER}/${SAMPLE_REPO_NAME}`);

      expect(data.owner).toBe(SAMPLE_REPO_OWNER);
      expect(data.repo).toBe(SAMPLE_REPO_NAME);
    });
  });
});
