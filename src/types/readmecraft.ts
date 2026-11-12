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
}

export interface LanguageStat {
  name: string;
  percentage: number;
  color: string;
}

export interface ProfileData {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  company: string;
  location: string;
  website: string;
  twitter: string;
  githubUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  languages: LanguageStat[];
  pinnedRepos: PinnedRepo[];
  skills: string[];
  gitHoloEnabled: boolean;
  gitChronicleEnabled: boolean;
  visitorBadgeEnabled: boolean;
  githubStatsEnabled: boolean;
  githubStreakEnabled: boolean;
  topLanguagesEnabled: boolean;
}

export interface ProjectData {
  owner: string;
  repo: string;
  title: string;
  description: string;
  license: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  framework?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip';
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
}
