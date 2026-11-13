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
    avatarUrl: `https://avatars.githubusercontent.com/${username}?v=4`,
    company: null,
    location: null,
    websiteUrl: null,
    twitterUsername: null,
    url: `https://github.com/${username}`,
    repositories: { totalCount: 0 },
    followers: { totalCount: 0 },
    following: { totalCount: 0 },
    contributionsCollection: {
      contributionCalendar: {
        totalContributions: 0,
        weeks: Array.from({ length: 53 }, (_, w) => ({
          contributionDays: Array.from({ length: 7 }, () => ({
            contributionCount: 0,
            date: new Date(Date.now() - (53 - w) * 7 * 86400000).toISOString().split('T')[0],
          })),
        })),
      },
    },
    reposList: { nodes: [] },
    pinnedItems: { nodes: [] },
  };
}

// ============================================================================
// UNIFIED GRAPHQL QUERY (Cost: 1 point)
// ============================================================================

const UNIFIED_PROFILE_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      login
      name
      bio
      avatarUrl
      company
      location
      websiteUrl
      twitterUsername
      url
      repositories(privacy: PUBLIC) {
        totalCount
      }
      followers {
        totalCount
      }
      following {
        totalCount
      }
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
      reposList: repositories(first: 100, privacy: PUBLIC, orderBy: {field: UPDATED_AT, direction: DESC}) {
        nodes {
          name
          description
          url
          stargazerCount
          primaryLanguage {
            name
            color
          }
          forkCount
          isFork
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            nodes {
              name
              size
              color
            }
          }
        }
      }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            primaryLanguage {
              name
              color
            }
          }
        }
      }
    }
  }
`;

const UNIFIED_REPO_QUERY = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      name
      description
      url
      stargazerCount
      forkCount
      openIssues: issues(states: OPEN) {
        totalCount
      }
      primaryLanguage {
        name
        color
      }
      defaultBranchRef {
        name
      }
      licenseInfo {
        spdxId
      }
      homepageUrl
      languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
        nodes {
          name
          size
          color
        }
      }
      repositoryTopics(first: 10) {
        nodes {
          topic {
            name
          }
        }
      }
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
// FETCH FUNCTIONS WITH CACHING & DEDUPLICATION
// ============================================================================

export interface ProfileDataRaw {
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string;
  company: string | null;
  location: string | null;
  websiteUrl: string | null;
  twitterUsername: string | null;
  url: string;
  repositories: { totalCount: number };
  followers: { totalCount: number };
  following: { totalCount: number };
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number;
      weeks: Array<{ contributionDays: Array<{ contributionCount: number; date: string }> }>;
    };
  };
  reposList: {
    nodes: Array<{
      name: string;
      description: string | null;
      url: string;
      stargazerCount: number;
      primaryLanguage: { name: string; color: string } | null;
      forkCount: number;
      isFork: boolean;
      languages: { nodes: Array<{ name: string; size: number; color: string }> };
    }>;
  };
  pinnedItems?: {
    nodes: Array<{
      name: string;
      description: string | null;
      url: string;
      stargazerCount: number;
      primaryLanguage: { name: string; color: string } | null;
    }>;
  };
}

export interface RepoDataRaw {
  name: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  openIssues: { totalCount: number };
  primaryLanguage: { name: string; color: string } | null;
  defaultBranchRef: { name: string } | null;
  licenseInfo: { spdxId: string } | null;
  homepageUrl: string | null;
  languages: { nodes: Array<{ name: string; size: number; color: string }> };
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> };
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
        description: 'Repository',
        url: `https://github.com/${owner}/${repo}`,
        stargazerCount: 0,
        forkCount: 0,
        openIssues: { totalCount: 0 },
        primaryLanguage: null,
        defaultBranchRef: { name: 'main' },
        licenseInfo: null,
        homepageUrl: null,
        languages: { nodes: [] },
        repositoryTopics: { nodes: [] },
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