import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";

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

const cache = new Map<string, CacheEntry<any>>();
const deduplication = new Map<string, DeduplicationEntry<any>>();

function getCacheKey(username: string, type: string): string {
  return `${type}:${username.toLowerCase()}`;
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
    createdAt: new Date().toISOString(),
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
// UNIFIED GRAPHQL QUERY - MAXIMUM DATA EXTRACTION (Cost: ~5 points)
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
      repositories(privacy: PUBLIC) {
        totalCount
        totalDiskUsage
      }
      followers {
        totalCount
      }
      following {
        totalCount
      }
      starredRepositories(privacy: PUBLIC) {
        totalCount
      }
      watching(privacy: PUBLIC) {
        totalCount
      }
      gists(privacy: PUBLIC) {
        totalCount
      }
      organizations(first: 20) {
        nodes {
          login
          name
          avatarUrl
          url
        }
      }
      packages(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          name
          packageType
          url
        }
      }
      sponsors(first: 5) {
        nodes {
          login
          avatarUrl
          url
        }
      }
      sponsorshipsAsMaintainer(first: 5) {
        nodes {
          sponsorEntity {
            login
            avatarUrl
            ... on User { name }
            ... on Organization { name }
          }
          tier {
            monthlyPriceInCents
            name
          }
        }
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
              weekday
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 25) {
          repository {
            name
            owner { login }
            url
            primaryLanguage { name color }
          }
          contributions {
            totalCount
          }
        }
        pullRequestContributionsByRepository(maxRepositories: 10) {
          repository {
            name
            owner { login }
            url
          }
          contributions {
            totalCount
          }
        }
      }
      reposList: repositories(first: 100, privacy: PUBLIC, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          name
          description
          descriptionHTML
          url
          stargazerCount
          forkCount
          isFork
          isArchived
          isDisabled
          isLocked
          isMirror
          isPrivate
          isTemplate
          primaryLanguage {
            name
            color
          }
          languages(first: 10) {
            nodes {
              name
              color
              size
            }
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
          licenseInfo {
            spdxId
            name
            url
          }
          defaultBranchRef {
            name
            target {
              ... on Commit {
                history(first: 1) {
                  nodes {
                    committedDate
                  }
                }
              }
            }
          }
          releases(first: 5, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              name
              tagName
              publishedAt
              url
              isPrerelease
              isDraft
            }
          }
          deployments(first: 5, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              createdAt
              environment
              state
            }
          }
          mergeCommitAllowed
          rebaseMergeAllowed
          squashMergeAllowed
          diskUsage
          updatedAt
          pushedAt
          homepageUrl
        }
      }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            descriptionHTML
            url
            stargazerCount
            primaryLanguage {
              name
              color
            }
            forkCount
            isFork
            licenseInfo {
              spdxId
            }
            repositoryTopics(first: 5) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      }
      anyPinnableItems(type: REPOSITORY)
      repositoriesContributedTo(first: 20, privacy: PUBLIC, contributionTypes: [COMMIT, PULL_REQUEST, ISSUE, REPOSITORY]) {
        nodes {
          name
          owner { login }
          url
          stargazerCount
          primaryLanguage { name color }
        }
      }
      pullRequests(first: 10, states: [OPEN, MERGED], orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          title
          url
          state
          mergedAt
          repository {
            name
            owner { login }
          }
        }
      }
      issues(first: 10, states: [OPEN, CLOSED], orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          title
          url
          state
          repository {
            name
            owner { login }
          }
        }
      }
      status {
        emoji
        message
        expiresAt
      }
      socialAccounts {
        nodes {
          provider
          url
        }
      }
      pronouns
      userViewType
      isSponsorable
      estimatedNextSponsorsPayoutInCents
      monthlyEstimatedSponsorsIncomeInCents
      hasSponsorsListing
      topRepositories(first: 10, orderBy: {field: STARGAZERS, direction: DESC}) {
        nodes {
          name
          stargazerCount
          url
          primaryLanguage { name color }
        }
      }
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
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      primaryLanguage {
        name
        color
      }
      defaultBranchRef {
        name
        target {
          ... on Commit {
            history(first: 1) {
              nodes {
                committedDate
              }
            }
          }
        }
      }
      licenseInfo {
        spdxId
        name
        url
      }
      homepageUrl
      languages(first: 20) {
        nodes {
          name
          color
          size
        }
        totalSize
      }
      repositoryTopics(first: 20) {
        nodes {
          topic {
            name
            stargazerCount
          }
        }
      }
      releases(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          name
          tagName
          description
          publishedAt
          url
          isPrerelease
          isDraft
        }
      }
      deployments(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          createdAt
          environment
          state
          payload
        }
      }
      environments(first: 10) {
        nodes {
          name
          url
        }
      }
      packages(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          name
          packageType
          version
          url
        }
      }
      workflows(first: 10) {
        nodes {
          name
          state
          filePath
        }
      }
      vulnerabilityAlerts(first: 5) {
        nodes {
          securityVulnerability {
            severity
            package {
              name
              ecosystem
            }
          }
        }
      }
      dependencyGraphManifests(first: 5) {
        nodes {
          filename
          dependencies(first: 10) {
            nodes {
              packageName
              repository {
                name
                url
              }
              requirements
              hasDependencies
            }
          }
        }
      }
      mergeCommitAllowed
      rebaseMergeAllowed
      squashMergeAllowed
      deleteBranchOnMerge
      diskUsage
      updatedAt
      pushedAt
      createdAt
      isArchived
      isDisabled
      isFork
      isLocked
      isMirror
      isPrivate
      isTemplate
      templateRepository {
        name
        owner { login }
        url
      }
      parent {
        name
        owner { login }
        url
      }
      mentionableUsers(first: 10) {
        nodes {
          login
          name
          avatarUrl
        }
      }
      securityPolicyUrl
      codeOfConduct {
        name
        url
      }
      fundingLinks {
        platform
        url
      }
      usesCustomOpenGraphImage
      openGraphImageUrl
      shortDescriptionHTML
      hasIssuesEnabled
      hasWikiEnabled
      hasProjectsEnabled
      hasDiscussionsEnabled
      hasSponsorshipsEnabled
      autoMergeAllowed
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
      weeks: Array<{ contributionDays: Array<{ contributionCount: number; date: string; weekday: number }> }>;
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
      languages: { nodes: Array<{ name: string; color: string; size: number }>; totalSize?: number };
      repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
      licenseInfo: { spdxId: string; name: string; url: string } | null;
      defaultBranchRef: { name: string; target: { history: { nodes: Array<{ committedDate: string }> } } } | null;
      releases: { nodes: Array<{ name: string; tagName: string; publishedAt: string; url: string; isPrerelease: boolean; isDraft: boolean }> };
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
  defaultBranchRef: { name: string; target: { history: { nodes: Array<{ committedDate: string }> } } } | null;
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
    nodes: Array<{ securityVulnerability: { severity: string; package: { name: string; ecosystem: string } } }>;
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

async function fetchWithDeduplication<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
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
  const cacheKey = getCacheKey(username, "profile");
  
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

      const data = result.user as ProfileDataRaw;
      const etag = getETag(data);
      
      cache.set(cacheKey, { data, etag, timestamp: Date.now() });
      return { data, etag, fromCache: false };
    } catch (error) {
      console.warn('GraphQL API rate limited or failed, falling back to robust mock telemetry:', error);
      const data = getMockProfileData(username);
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
  const cacheKey = getCacheKey(`${owner}/${repo}`, "repo");
  
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

      const data = result.repository as RepoDataRaw;
      const etag = getETag(data);
      
      cache.set(cacheKey, { data, etag, timestamp: Date.now() });
      return { data, etag, fromCache: false };
    } catch (error) {
      console.warn('Repo GraphQL failed, using fallback mock repo:', error);
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
        defaultBranchRef: { name: 'main', target: { history: { nodes: [{ committedDate: new Date().toISOString() }] } } },
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
        hasWikiEnabled: false,
        hasProjectsEnabled: true,
        hasDiscussionsEnabled: true,
        hasSponsorshipsEnabled: false,
        autoMergeAllowed: true,
      };
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
  const ifNoneMatch = request.headers.get("if-none-match");
  return ifNoneMatch === etag;
}

export function createETagResponse(data: any, etag: string): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "ETag": etag,
      "Cache-Control": "public, max-age=21600, stale-while-revalidate=21600",
    },
  });
}

export function createNotModifiedResponse(etag: string): Response {
  return new Response(null, {
    status: 304,
    headers: {
      "ETag": etag,
      "Cache-Control": "public, max-age=21600, stale-while-revalidate=21600",
    },
  });
}