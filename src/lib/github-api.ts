import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';

// ============================================================================
// IN-MEMORY CACHE & DEDUPLICATION
// ============================================================================

interface CacheEntry<T> {
  data: T;
  etag: string;
  timestamp: number;
}

interface DeduplicationEntry<T> {
  promise: Promise<T>;
  timestamp: number;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const DEDUP_WINDOW_MS = 60 * 1000; // 60 seconds
const CACHE_VERSION = 'v6'; // Increment to bust cache after GraphQL fixes

const cache = new Map<string, CacheEntry<any>>();
const deduplication = new Map<string, DeduplicationEntry<any>>();

function getCacheKey(username: string, type: string): string {
  return `${type}:${username.toLowerCase()}:${CACHE_VERSION}`;
}

function getETag(data: any): string {
  return `"${Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 32)}"`;
}

function isCacheFresh(entry: CacheEntry<any>): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

function isDeduplicationFresh(entry: DeduplicationEntry<any>): boolean {
  return Date.now() - entry.timestamp < DEDUP_WINDOW_MS;
}

export function clearCache(): void {
  cache.clear();
  deduplication.clear();
}

// ============================================================================
// MOCK FALLBACK DATA FOR RATE LIMIT RESILIENCE (GENERIC - NO HARDCODED USER DATA)
// ============================================================================

function getMockProfileData(username: string): ProfileDataRaw {
  return {
    login: username,
    name: username,
    bio: 'Developer & Open Source Contributor',
    bioHTML: null,
    avatarUrl: `https://avatars.githubusercontent.com/${username}?v=4`,
    company: null,
    companyHTML: null,
    location: null,
    websiteUrl: null,
    twitterUsername: null,
    email: null,
    url: `https://github.com/${username}`,
    resourcePath: `/${username}`,
    // Leave createdAt empty instead of faking "now": a fabricated date made the
    // generated README claim a wrong "(since YYYY)" whenever the API was rate
    // limited. An empty value simply omits the year.
    createdAt: '',
    updatedAt: new Date().toISOString(),
    userViewType: 'PUBLIC',
    isSponsorable: false,
    estimatedNextSponsorsPayoutInCents: 0,
    monthlyEstimatedSponsorsIncomeInCents: 0,
    hasSponsorsListing: false,
    pronouns: null,
    repositories: { totalCount: 0, totalDiskUsage: 0 },
    followers: { totalCount: 0 },
    following: { totalCount: 0 },
    starredRepositories: { totalCount: 0 },
    watching: { totalCount: 0 },
    gists: { totalCount: 0 },
    contributionsCollection: {
      totalCommitContributions: 0,
      totalIssueContributions: 0,
      totalPullRequestContributions: 0,
      totalPullRequestReviewContributions: 0,
      totalRepositoriesWithContributedCommits: 0,
      contributionCalendar: {
        totalContributions: 0,
        weeks: Array.from({ length: 53 }, (_, w) => ({
          contributionDays: Array.from({ length: 7 }, () => ({
            contributionCount: 0,
            date: new Date(Date.now() - (53 - w) * 7 * 86400000).toISOString().split('T')[0],
            weekday: 0,
          })),
        })),
      },
      commitContributionsByRepository: { nodes: [] },
      pullRequestContributionsByRepository: { nodes: [] },
    },
    reposList: { nodes: [] },
    pinnedItems: { nodes: [] },
    anyPinnableItems: null,
    repositoriesContributedTo: { nodes: [] },
    pullRequests: { nodes: [] },
    issues: { nodes: [] },
    status: null,
    socialAccounts: { nodes: [] },
    topRepositories: { nodes: [] },
    organizations: { nodes: [] },
    packages: { nodes: [] },
    sponsors: { nodes: [] },
    sponsorshipsAsMaintainer: { nodes: [] },
  };
}

// ============================================================================
// UNIFIED GRAPHQL QUERY - BALANCED (Cost: ~400 points)
// ============================================================================

const UNIFIED_PROFILE_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      login
      name
      bio
      bioHTML
      avatarUrl
      company
      companyHTML
      location
      websiteUrl
      twitterUsername
      email
      createdAt
      updatedAt
      url
      resourcePath
      repositories { totalCount totalDiskUsage }
      followers { totalCount }
      following { totalCount }
      starredRepositories { totalCount }
      watching { totalCount }
      gists { totalCount }
      organizations(first: 10) { nodes { login name avatarUrl url } }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        contributionCalendar {
          totalContributions
          weeks { contributionDays { contributionCount date weekday } }
        }
        commitContributionsByRepository(maxRepositories: 10) {
          repository { name owner { login } url primaryLanguage { name color } }
          contributions { totalCount }
        }
        pullRequestContributionsByRepository(maxRepositories: 5) {
          repository { name owner { login } url }
          contributions { totalCount }
        }
      }
      reposList: repositories(first: 30, orderBy: {field: STARGAZERS, direction: DESC}) {
        nodes {
          name
          description
          url
          stargazerCount
          forkCount
          isFork
          isArchived
          isPrivate
          primaryLanguage { name color }
          languages(first: 5) { edges { size node { name color } } }
          repositoryTopics(first: 5) { nodes { topic { name } } }
          licenseInfo { spdxId }
          homepageUrl
        }
      }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            primaryLanguage { name color }
            forkCount
            isFork
            isPrivate
            licenseInfo { spdxId }
            repositoryTopics(first: 5) { nodes { topic { name } } }
          }
        }
      }
      topRepositories(first: 10, orderBy: {field: STARGAZERS, direction: DESC}) {
        nodes { name stargazerCount url isPrivate description primaryLanguage { name color } }
      }
      status { emoji message expiresAt }
      pronouns
      userViewType
    }
  }
`;

const UNIFIED_REPO_QUERY = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      name
      nameWithOwner
      description
      descriptionHTML
      url
      stargazerCount
      forkCount
      openIssues: issues(states: OPEN) { totalCount }
      closedIssues: issues(states: CLOSED) { totalCount }
      primaryLanguage { name color }
      defaultBranchRef { name target { ... on Commit { history(first: 1) { nodes { committedDate } } } } }
      licenseInfo { spdxId name url }
      homepageUrl
      languages(first: 15) { nodes { name color } totalSize }
      repositoryTopics(first: 15) { nodes { topic { name } } }
      releases(first: 5, orderBy: {field: CREATED_AT, direction: DESC}) { nodes { name tagName description publishedAt url isPrerelease isDraft } }
      diskUsage
      updatedAt
      pushedAt
      createdAt
      isArchived
      isFork
      isPrivate
      isTemplate
      templateRepository { name owner { login } url }
      parent { name owner { login } url }
      securityPolicyUrl
      codeOfConduct { name url }
      fundingLinks { platform url }
      openGraphImageUrl
      shortDescriptionHTML
      hasIssuesEnabled
      hasWikiEnabled
      hasProjectsEnabled
      hasDiscussionsEnabled
    }
  }
`;

// ============================================================================
// GRAPHQL CLIENT WRAPPER
// ============================================================================

interface GitHubClientOptions {
  token?: string;
  userToken?: string;
}

function createGraphQLClient(options: GitHubClientOptions = {}) {
  const authToken = options.userToken || options.token || process.env.GITHUB_TOKEN;

  return graphql.defaults({
    headers: {
      authorization: authToken ? `Bearer ${authToken}` : undefined,
    },
  });
}

// ============================================================================
// ENHANCED RAW DATA INTERFACES (matching GraphQL query)
// ============================================================================

export interface ProfileDataRaw {
  login: string;
  name: string | null;
  bio: string | null;
  bioHTML: string | null;
  avatarUrl: string;
  company: string | null;
  companyHTML: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterUsername: string | null;
  email: string | null;
  url: string;
  resourcePath: string;
  createdAt: string;
  updatedAt: string;
  userViewType: string;
  isSponsorable: boolean;
  estimatedNextSponsorsPayoutInCents: number;
  monthlyEstimatedSponsorsIncomeInCents: number;
  hasSponsorsListing: boolean;
  pronouns: string | null;
  repositories: { totalCount: number; totalDiskUsage: number };
  followers: { totalCount: number };
  following: { totalCount: number };
  starredRepositories: { totalCount: number };
  watching: { totalCount: number };
  gists: { totalCount: number };
  contributionsCollection: {
    totalCommitContributions: number;
    totalIssueContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
    totalRepositoriesWithContributedCommits: number;
    contributionCalendar: {
      totalContributions: number;
      weeks: Array<{
        contributionDays: Array<{ contributionCount: number; date: string; weekday: number }>;
      }>;
    };
    commitContributionsByRepository: {
      nodes: Array<{
        repository: {
          name: string;
          owner: { login: string };
          url: string;
          primaryLanguage: { name: string; color: string } | null;
        };
        contributions: { totalCount: number };
      }>;
    };
    pullRequestContributionsByRepository: {
      nodes: Array<{
        repository: {
          name: string;
          owner: { login: string };
          url: string;
        };
        contributions: { totalCount: number };
      }>;
    };
  };
  reposList: {
    nodes: Array<{
      name: string;
      description: string | null;
      descriptionHTML: string | null;
      url: string;
      stargazerCount: number;
      forkCount: number;
      isFork: boolean;
      isArchived: boolean;
      isDisabled: boolean;
      isLocked: boolean;
      isMirror: boolean;
      isPrivate: boolean;
      isTemplate: boolean;
      primaryLanguage: { name: string; color: string } | null;
      languages: {
        nodes: Array<{ name: string; color: string; size: number }>;
        totalSize?: number;
      };
      repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
      licenseInfo: { spdxId: string; name: string; url: string } | null;
      defaultBranchRef: {
        name: string;
        target: { history: { nodes: Array<{ committedDate: string }> } };
      } | null;
      releases: {
        nodes: Array<{
          name: string;
          tagName: string;
          publishedAt: string;
          url: string;
          isPrerelease: boolean;
          isDraft: boolean;
        }>;
      };
      deployments: { nodes: Array<{ createdAt: string; environment: string; state: string }> };
      mergeCommitAllowed: boolean;
      rebaseMergeAllowed: boolean;
      squashMergeAllowed: boolean;
      diskUsage: number;
      updatedAt: string;
      pushedAt: string;
      homepageUrl: string | null;
    }>;
  };
  pinnedItems?: {
    nodes: Array<{
      name: string;
      description: string | null;
      descriptionHTML: string | null;
      url: string;
      stargazerCount: number;
      primaryLanguage: { name: string; color: string } | null;
      forkCount: number;
      isFork: boolean;
      licenseInfo: { spdxId: string } | null;
      repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
    }>;
  };
  anyPinnableItems?: any;
  repositoriesContributedTo?: {
    nodes: Array<{
      name: string;
      owner: { login: string };
      url: string;
      stargazerCount: number;
      primaryLanguage: { name: string; color: string } | null;
    }>;
  };
  pullRequests?: {
    nodes: Array<{
      title: string;
      url: string;
      state: string;
      mergedAt: string | null;
      repository: { name: string; owner: { login: string } };
    }>;
  };
  issues?: {
    nodes: Array<{
      title: string;
      url: string;
      state: string;
      repository: { name: string; owner: { login: string } };
    }>;
  };
  status: { emoji: string; message: string; expiresAt: string | null } | null;
  socialAccounts: { nodes: Array<{ provider: string; url: string }> };
  topRepositories: {
    nodes: Array<{
      name: string;
      stargazerCount: number;
      url: string;
      description?: string | null;
      primaryLanguage: { name: string; color: string } | null;
    }>;
  };
  organizations: {
    nodes: Array<{ login: string; name: string; avatarUrl: string; url: string }>;
  };
  packages: {
    nodes: Array<{ name: string; packageType: string; url: string; version?: string }>;
  };
  sponsors: {
    nodes: Array<{ login: string; avatarUrl: string; url: string }>;
  };
  sponsorshipsAsMaintainer: {
    nodes: Array<{
      sponsorEntity: { login: string; avatarUrl: string; name?: string; [key: string]: any };
      tier: { monthlyPriceInCents: number; name: string };
    }>;
  };
}

export interface RepoDataRaw {
  name: string;
  nameWithOwner: string;
  description: string | null;
  descriptionHTML: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  openIssues: { totalCount: number };
  closedIssues: { totalCount: number };
  primaryLanguage: { name: string; color: string } | null;
  defaultBranchRef: {
    name: string;
    target: { history: { nodes: Array<{ committedDate: string }> } };
  } | null;
  licenseInfo: { spdxId: string; name: string; url: string } | null;
  homepageUrl: string | null;
  languages: { nodes: Array<{ name: string; color: string; size: number }>; totalSize: number };
  repositoryTopics: { nodes: Array<{ topic: { name: string; stargazerCount?: number } }> };
  releases: {
    nodes: Array<{
      name: string;
      tagName: string;
      description: string | null;
      publishedAt: string;
      url: string;
      isPrerelease: boolean;
      isDraft: boolean;
    }>;
  };
  deployments: {
    nodes: Array<{ createdAt: string; environment: string; state: string; payload?: string }>;
  };
  environments: {
    nodes: Array<{ name: string; url: string | null }>;
  };
  packages: {
    nodes: Array<{ name: string; packageType: string; version?: string; url: string }>;
  };
  workflows: {
    nodes: Array<{ name: string; state: string; filePath: string }>;
  };
  vulnerabilityAlerts: {
    nodes: Array<{
      securityVulnerability: { severity: string; package: { name: string; ecosystem: string } };
    }>;
  };
  dependencyGraphManifests: {
    nodes: Array<{
      filename: string;
      dependencies: {
        nodes: Array<{
          packageName: string;
          repository: { name: string; url: string } | null;
          requirements: string | null;
          hasDependencies: boolean;
        }>;
      };
    }>;
  };
  mergeCommitAllowed: boolean;
  rebaseMergeAllowed: boolean;
  squashMergeAllowed: boolean;
  deleteBranchOnMerge: boolean;
  diskUsage: number;
  updatedAt: string;
  pushedAt: string;
  createdAt: string;
  isArchived: boolean;
  isDisabled: boolean;
  isFork: boolean;
  isLocked: boolean;
  isMirror: boolean;
  isPrivate: boolean;
  isTemplate: boolean;
  templateRepository: { name: string; owner: { login: string }; url: string } | null;
  parent: { name: string; owner: { login: string }; url: string } | null;
  mentionableUsers: {
    nodes: Array<{ login: string; name: string | null; avatarUrl: string }>;
  };
  securityPolicyUrl: string | null;
  codeOfConduct: { name: string; url: string } | null;
  fundingLinks: { nodes: Array<{ platform: string; url: string }> };
  usesCustomOpenGraphImage: boolean;
  openGraphImageUrl: string | null;
  shortDescriptionHTML: string | null;
  hasIssuesEnabled: boolean;
  hasWikiEnabled: boolean;
  hasProjectsEnabled: boolean;
  hasDiscussionsEnabled: boolean;
  hasSponsorshipsEnabled: boolean;
  autoMergeAllowed: boolean;
}

async function fetchWithDeduplication<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = deduplication.get(key);
  if (existing && isDeduplicationFresh(existing)) {
    return existing.promise;
  }

  const promise = fetcher();
  deduplication.set(key, { promise, timestamp: Date.now() });

  try {
    const result = await promise;
    return result;
  } finally {
    setTimeout(() => {
      const entry = deduplication.get(key);
      if (entry && entry.promise === promise) {
        deduplication.delete(key);
      }
    }, DEDUP_WINDOW_MS);
  }
}

export async function fetchProfileData(
  username: string,
  options: GitHubClientOptions = {}
): Promise<{ data: ProfileDataRaw; etag: string; fromCache: boolean }> {
  const cacheKey = getCacheKey(username, 'profile');

  const cached = cache.get(cacheKey);
  if (cached && isCacheFresh(cached)) {
    return { data: cached.data, etag: cached.etag, fromCache: true };
  }

  const fetcher = async () => {
    try {
      const graphqlClient = createGraphQLClient(options);
      const to = new Date().toISOString();
      const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

      const result = await graphqlClient<{ user: ProfileDataRaw }>(UNIFIED_PROFILE_QUERY, {
        username,
        from,
        to,
      });

      if (!result.user) {
        throw new Error(`GitHub user "${username}" not found`);
      }

      const data = result.user;
      const etag = getETag(data);

      cache.set(cacheKey, { data, etag, timestamp: Date.now() });
      return { data, etag, fromCache: false };
    } catch (error: any) {
      const errorDetail = {
        username,
        message: error?.message,
        status: error?.status,
        response: error?.response?.data,
        errors: error?.errors,
        cause: error?.cause?.message,
        stack: error?.stack?.slice(0, 500),
      };
      console.error('GraphQL Profile Query Failed:', errorDetail);
      // Return error in data to debug - but still provide mock fallback
      const data = getMockProfileData(username);
      (data as any).__graphQLError = errorDetail;
      const etag = getETag(data);
      cache.set(cacheKey, { data, etag, timestamp: Date.now() });
      return { data, etag, fromCache: false };
    }
  };

  return fetchWithDeduplication(cacheKey, fetcher);
}

export async function fetchRepoData(
  owner: string,
  repo: string,
  options: GitHubClientOptions = {}
): Promise<{ data: RepoDataRaw; etag: string; fromCache: boolean }> {
  const cacheKey = getCacheKey(`${owner}/${repo}`, 'repo');

  const cached = cache.get(cacheKey);
  if (cached && isCacheFresh(cached)) {
    return { data: cached.data, etag: cached.etag, fromCache: true };
  }

  const fetcher = async () => {
    try {
      const graphqlClient = createGraphQLClient(options);

      const result = await graphqlClient<{ repository: RepoDataRaw }>(UNIFIED_REPO_QUERY, {
        owner,
        name: repo,
      });

      if (!result.repository) {
        throw new Error(`Repository "${owner}/${repo}" not found`);
      }

      const data = result.repository;
      const etag = getETag(data);

      cache.set(cacheKey, { data, etag, timestamp: Date.now() });
      return { data, etag, fromCache: false };
    } catch (error: any) {
      const errorDetail = {
        owner,
        repo,
        message: error?.message,
        status: error?.status,
        response: error?.response?.data,
        errors: error?.errors,
        cause: error?.cause?.message,
        stack: error?.stack?.slice(0, 500),
      };
      console.error('Repo GraphQL Query Failed:', errorDetail);
      // Return error in data to debug
      const data: RepoDataRaw = {
        name: repo,
        nameWithOwner: `${owner}/${repo}`,
        description: 'Repository',
        descriptionHTML: null,
        url: `https://github.com/${owner}/${repo}`,
        stargazerCount: 0,
        forkCount: 0,
        openIssues: { totalCount: 0 },
        closedIssues: { totalCount: 0 },
        primaryLanguage: null,
        defaultBranchRef: {
          name: 'main',
          target: { history: { nodes: [{ committedDate: new Date().toISOString() }] } },
        },
        licenseInfo: null,
        homepageUrl: null,
        languages: { nodes: [], totalSize: 0 },
        repositoryTopics: { nodes: [] },
        releases: { nodes: [] },
        deployments: { nodes: [] },
        environments: { nodes: [] },
        packages: { nodes: [] },
        workflows: { nodes: [] },
        vulnerabilityAlerts: { nodes: [] },
        dependencyGraphManifests: { nodes: [] },
        mergeCommitAllowed: true,
        rebaseMergeAllowed: true,
        squashMergeAllowed: true,
        deleteBranchOnMerge: true,
        diskUsage: 0,
        updatedAt: new Date().toISOString(),
        pushedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isArchived: false,
        isDisabled: false,
        isFork: false,
        isLocked: false,
        isMirror: false,
        isPrivate: false,
        isTemplate: false,
        templateRepository: null,
        parent: null,
        mentionableUsers: { nodes: [] },
        securityPolicyUrl: null,
        codeOfConduct: null,
        fundingLinks: { nodes: [] },
        usesCustomOpenGraphImage: false,
        openGraphImageUrl: null,
        shortDescriptionHTML: null,
        hasIssuesEnabled: true,
        hasWikiEnabled: true,
        hasProjectsEnabled: true,
        hasDiscussionsEnabled: true,
        hasSponsorshipsEnabled: false,
        autoMergeAllowed: true,
      };
      (data as any).__graphQLError = errorDetail;
      const etag = getETag(data);
      cache.set(cacheKey, { data, etag, timestamp: Date.now() });
      return { data, etag, fromCache: false };
    }
  };

  return fetchWithDeduplication(cacheKey, fetcher);
}

export function createOctokitClient(token?: string): Octokit {
  const authToken = token || process.env.GITHUB_TOKEN;
  return new Octokit({ auth: authToken });
}

export function checkETag(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  return ifNoneMatch === etag;
}

export function createETagResponse(data: any, etag: string): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ETag: etag,
      'Cache-Control': 'public, max-age=21600, stale-while-revalidate=21600',
    },
  });
}

export function createNotModifiedResponse(etag: string): Response {
  return new Response(null, {
    status: 304,
    headers: {
      ETag: etag,
      'Cache-Control': 'public, max-age=21600, stale-while-revalidate=21600',
    },
  });
}
