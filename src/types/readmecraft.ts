export type AppMode = 'profile' | 'project';

export type ProfilePreset = 'bento' | 'minimalist' | 'titan';
export type ProjectPreset = 'standard' | 'api' | 'cli';

export interface Section {
  id: string;
  title: string;
  enabled: boolean;
  content: string;
  order: number;
  isCustom?: boolean;
}

export interface PinnedRepo {
  name: string;
  description: string;
  url: string;
  stargazersCount: number;
  language: string;
  forksCount?: number;
  topics?: string[];
  license?: string;
  isFork?: boolean;
  isArchived?: boolean;
  homepageUrl?: string;
  releases?: Array<{
    name: string;
    tagName: string;
    publishedAt: string;
    url: string;
    isPrerelease: boolean;
  }>;
}

export interface LanguageStat {
  name: string;
  percentage: number;
  color: string;
  bytes?: number;
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
  weekday: number;
}

export interface ContributionCalendar {
  totalContributions: number;
  weeks: Array<{
    contributionDays: ContributionDay[];
  }>;
}

export interface RepositoryContribution {
  repository: {
    name: string;
    owner: { login: string };
    url: string;
    primaryLanguage: { name: string; color: string } | null;
  };
  contributions: { totalCount: number };
}

export interface PullRequestContribution {
  repository: {
    name: string;
    owner: { login: string };
    url: string;
  };
  contributions: { totalCount: number };
}

export interface Organization {
  login: string;
  name: string;
  avatarUrl: string;
  url: string;
}

export interface Package {
  name: string;
  packageType: string;
  url: string;
  version?: string;
}

export interface Sponsor {
  login: string;
  avatarUrl: string;
  url: string;
  name?: string;
}

export interface SponsorshipTier {
  monthlyPriceInCents: number;
  name: string;
}

export interface SocialAccount {
  provider: string;
  url: string;
}

export interface TopRepository {
  name: string;
  stargazerCount: number;
  url: string;
  primaryLanguage: { name: string; color: string } | null;
  description?: string;
}

export interface UserStatus {
  emoji: string;
  message: string;
  expiresAt: string | null;
}

export interface PullRequest {
  title: string;
  url: string;
  state: string;
  mergedAt: string | null;
  repository: { name: string; owner: { login: string } };
}

export interface Issue {
  title: string;
  url: string;
  state: string;
  repository: { name: string; owner: { login: string } };
}

export interface RepositoryLanguage {
  name: string;
  color: string;
  size: number;
}

export interface RepositoryTopic {
  name: string;
  stargazerCount?: number;
}

export interface Release {
  name: string;
  tagName: string;
  description: string | null;
  publishedAt: string;
  url: string;
  isPrerelease: boolean;
  isDraft: boolean;
}

export interface Deployment {
  createdAt: string;
  environment: string;
  state: string;
  payload?: string;
}

export interface Environment {
  name: string;
  url: string | null;
}

export interface Workflow {
  name: string;
  state: string;
  filePath: string;
}

export interface VulnerabilityAlert {
  severity: string;
  package: { name: string; ecosystem: string };
}

export interface DependencyManifest {
  filename: string;
  dependencies: Array<{
    packageName: string;
    repository: { name: string; url: string } | null;
    requirements: string | null;
    hasDependencies: boolean;
  }>;
}

export interface FundingLink {
  platform: string;
  url: string;
}

export interface MentionableUser {
  login: string;
  name: string | null;
  avatarUrl: string;
}

export interface CodeOfConduct {
  name: string;
  url: string;
}

export interface ProfileData {
  // Core profile fields
  username: string;
  name: string;
  bio: string;
  bioHTML?: string;
  avatarUrl: string;
  company: string;
  companyHTML?: string;
  location: string;
  website: string;
  twitter: string;
  email?: string | null;
  githubUrl: string;
  resourcePath?: string;
  createdAt?: string;
  updatedAt?: string;
  userViewType?: string;
  isSponsorable?: boolean;
  estimatedNextSponsorsPayoutInCents?: number;
  monthlyEstimatedSponsorsIncomeInCents?: number;
  hasSponsorsListing?: boolean;
  pronouns?: string | null;
  
  // Counts
  publicRepos: number;
  totalDiskUsage?: number;
  followers: number;
  following: number;
  starredRepositoriesCount?: number;
  watchingCount?: number;
  gistsCount?: number;
  
  // Languages & Skills
  languages: LanguageStat[];
  skills: string[];
  
  // Pinned & Top repos
  pinnedRepos: PinnedRepo[];
  topRepositories?: TopRepository[];
  
  // Contributions
  contributionCalendar?: ContributionCalendar;
  totalCommitContributions?: number;
  totalIssueContributions?: number;
  totalPullRequestContributions?: number;
  totalPullRequestReviewContributions?: number;
  totalRepositoriesWithContributedCommits?: number;
  commitContributionsByRepository?: RepositoryContribution[];
  pullRequestContributionsByRepository?: PullRequestContribution[];
  
  // Organizations
  organizations?: Organization[];
  
  // Packages
  packages?: Package[];
  
  // Sponsors
  sponsors?: Sponsor[];
  sponsorshipsAsMaintainer?: Array<{
    sponsorEntity: Sponsor;
    tier: SponsorshipTier;
  }>;
  
  // Social
  socialAccounts?: SocialAccount[];
  status?: UserStatus | null;
  
  // Activity
  recentPullRequests?: PullRequest[];
  recentIssues?: Issue[];
  repositoriesContributedTo?: Array<{
    name: string;
    owner: { login: string };
    url: string;
    stargazerCount: number;
    primaryLanguage: { name: string; color: string } | null;
    contributions?: { totalCount: number };
  }>;
  
  // Feature flags
  gitHoloEnabled: boolean;
  gitChronicleEnabled: boolean;
  visitorBadgeEnabled: boolean;
  githubStatsEnabled: boolean;
  githubStreakEnabled: boolean;
  topLanguagesEnabled: boolean;
}

export interface ProjectData {
  // Core repo fields
  owner: string;
  repo: string;
  name: string;
  nameWithOwner?: string;
  title: string;
  description: string;
  descriptionHTML?: string;
  url: string;
  homepageUrl?: string | null;
  shortDescriptionHTML?: string;
  
  // Stats
  stars: number;
  stargazerCount?: number;
  forkCount: number;
  openIssues: number;
  closedIssues?: number;
  diskUsage?: number;
  
  // Metadata
  license: string;
  licenseName?: string;
  licenseUrl?: string;
  defaultBranch: string;
  primaryLanguage: { name: string; color: string } | null;
  languages?: RepositoryLanguage[];
  totalLanguageSize?: number;
  repositoryTopics?: RepositoryTopic[];
  
  // Dates
  createdAt?: string;
  updatedAt?: string;
  pushedAt?: string;
  lastCommitDate?: string | null;
  
  // Flags
  isArchived?: boolean;
  isDisabled?: boolean;
  isFork?: boolean;
  isLocked?: boolean;
  isMirror?: boolean;
  isPrivate?: boolean;
  isTemplate?: boolean;
  mergeCommitAllowed?: boolean;
  rebaseMergeAllowed?: boolean;
  squashMergeAllowed?: boolean;
  deleteBranchOnMerge?: boolean;
  autoMergeAllowed?: boolean;
  hasIssuesEnabled?: boolean;
  hasWikiEnabled?: boolean;
  hasProjectsEnabled?: boolean;
  hasDiscussionsEnabled?: boolean;
  hasSponsorshipsEnabled?: boolean;
  usesCustomOpenGraphImage?: boolean;
  openGraphImageUrl?: string | null;
  
  // Relations
  templateRepository?: { name: string; owner: { login: string }; url: string } | null;
  parent?: { name: string; owner: { login: string }; url: string } | null;
  mentionableUsers?: MentionableUser[];
  
  // Releases & Deployments
  releases?: Release[];
  deployments?: Deployment[];
  environments?: Environment[];
  
  // Packages
  packages?: Package[];
  
  // Workflows & Security
  workflows?: Workflow[];
  vulnerabilityAlerts?: VulnerabilityAlert[];
  dependencyGraphManifests?: DependencyManifest[];
  
  // Security & Community
  securityPolicyUrl?: string | null;
  codeOfConduct?: CodeOfConduct | null;
  fundingLinks?: FundingLink[];
  
  // Derived/computed
  language: string;
  framework?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip' | 'go';
  installCommand: string;
  runCommand: string;
  testCommand: string;
  features: string[];
  techStack: string[];
  architectureDiagram?: string;
  demoUrl?: string;
  gitHoloEnabled: boolean;
  gitChronicleEnabled: boolean;
}

export interface ReadmeState {
  mode: AppMode;
  profilePreset: ProfilePreset;
  projectPreset: ProjectPreset;
  profileData: ProfileData;
  projectData: ProjectData;
  sections: Section[];
  customToken?: string;
  theme?: string;
}