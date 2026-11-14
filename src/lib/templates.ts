import type { ProfileData, ProjectData } from '@/types/readmecraft';
import { getProfileSections, compileSectionsToMarkdown } from '@/lib/generators';

export interface CommunityTemplate {
  id: string;
  title: string;
  role: string;
  badge: string;
  icon: any;
  theme: string;
  preset: 'bento' | 'minimalist' | 'titan';
  bio: string;
  skills: string[];
  pinnedRepos: Array<{ name: string; description: string; language: string; stargazersCount: number; url: string }>;
  accentColor: string;
}

export const COMMUNITY_TEMPLATES: CommunityTemplate[] = [
  {
    id: 'fullstack-architect',
    title: 'Full-Stack Systems Architect',
    role: 'Staff / Lead Engineer',
    badge: 'Most Popular',
    icon: null,
    theme: 'gta6',
    preset: 'bento',
    bio: 'Architecting resilient distributed web platforms & real-time telemetry systems. Obsessed with zero-overhead UX.',
    skills: ['TypeScript', 'React', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'Redis', 'AWS', 'TailwindCSS'],
    pinnedRepos: [
      { name: 'hyper-stream', description: 'Ultra-low latency streaming microservice in Node.js', language: 'TypeScript', stargazersCount: 420, url: 'https://github.com' },
      { name: 'bento-design-system', description: 'Accessible Tailwind component primitives for enterprise', language: 'TypeScript', stargazersCount: 280, url: 'https://github.com' },
      { name: 'edge-cache-proxy', description: 'Distributed caching proxy with zero cold-starts', language: 'Go', stargazersCount: 195, url: 'https://github.com' },
    ],
    accentColor: '#ff6b35',
  },
  {
    id: 'aiml-researcher',
    title: 'AI / ML & LLM Engineer',
    role: 'Deep Learning & Applied GenAI',
    badge: 'Trending 🔥',
    icon: null,
    theme: 'cyberpunk2077',
    preset: 'titan',
    bio: 'Fine-tuning foundation models, optimizing multi-modal inference pipelines, and building autonomous agent swarms.',
    skills: ['Python', 'PyTorch', 'FastAPI', 'Docker', 'PostgreSQL', 'AWS', 'Linux', 'Git'],
    pinnedRepos: [
      { name: 'agent-swarm-core', description: 'Orchestration framework for hierarchical LLM agents', language: 'Python', stargazersCount: 1250, url: 'https://github.com' },
      { name: 'quant-kernel', description: 'Custom 4-bit CUDA quantization kernels for local inference', language: 'C++', stargazersCount: 890, url: 'https://github.com' },
      { name: 'eval-bench', description: 'Automated hallucination benchmark for RAG applications', language: 'Python', stargazersCount: 540, url: 'https://github.com' },
    ],
    accentColor: '#ffcc00',
  },
  {
    id: 'systems-rust',
    title: 'Rust & Systems Engineer',
    role: 'High-Performance & Low-Level Dev',
    badge: 'Cult Classic',
    icon: null,
    theme: 'elden-ring',
    preset: 'minimalist',
    bio: 'Building memory-safe database engines, zero-copy network stacks, and concurrent systems in Rust & Go.',
    skills: ['Rust', 'Go', 'C++', 'Linux', 'PostgreSQL', 'Docker', 'Kubernetes', 'WebAssembly'],
    pinnedRepos: [
      { name: 'zero-copy-db', description: 'Lock-free database engine with zero-copy reads', language: 'Rust', stargazersCount: 3200, url: 'https://github.com' },
      { name: 'async-runtime', description: 'Custom async runtime for embedded systems', language: 'Rust', stargazersCount: 1800, url: 'https://github.com' },
      { name: 'network-stack', description: 'User-space TCP/IP stack in safe Rust', language: 'Rust', stargazersCount: 950, url: 'https://github.com' },
    ],
    accentColor: '#c9a84c',
  },
  {
    id: 'devops-platform',
    title: 'DevOps & Platform Engineer',
    role: 'Infrastructure & Reliability',
    badge: 'Enterprise Ready',
    icon: null,
    theme: 'matrix',
    preset: 'bento',
    bio: 'Designing self-healing Kubernetes platforms, GitOps workflows, and observable distributed systems at scale.',
    skills: ['Kubernetes', 'Terraform', 'Go', 'Prometheus', 'Grafana', 'ArgoCD', 'Linux', 'AWS'],
    pinnedRepos: [
      { name: 'gitops-platform', description: 'Multi-cluster GitOps platform with ArgoCD', language: 'Go', stargazersCount: 2100, url: 'https://github.com' },
      { name: 'observability-stack', description: 'Batteries-included Prometheus/Grafana/Loki stack', language: 'Jsonnet', stargazersCount: 1400, url: 'https://github.com' },
      { name: 'cluster-autoscaler', description: 'Custom CA for spot-instance workloads', language: 'Go', stargazersCount: 890, url: 'https://github.com' },
    ],
    accentColor: '#00ff41',
  },
  {
    id: 'web3-builder',
    title: 'Web3 & Smart Contract Dev',
    role: 'Solidity & Protocol Engineer',
    badge: 'On-Chain Verified',
    icon: null,
    theme: 'synthwave',
    preset: 'bento',
    bio: 'Shipping audited DeFi protocols, ERC-4337 account abstraction, and MEV-resistant infrastructure.',
    skills: ['Solidity', 'Foundry', 'TypeScript', 'Rust', 'Cairo', 'Ethers.js', 'Viem', 'GraphQL'],
    pinnedRepos: [
      { name: 'account-abstraction-wallet', description: 'ERC-4337 smart wallet with session keys', language: 'Solidity', stargazersCount: 3400, url: 'https://github.com' },
      { name: 'mev-protection', description: 'MEV-resistant transaction relayer', language: 'Rust', stargazersCount: 1200, url: 'https://github.com' },
      { name: 'defi-sdk', description: 'Type-safe DeFi protocol SDK', language: 'TypeScript', stargazersCount: 980, url: 'https://github.com' },
    ],
    accentColor: '#ff00ff',
  },
  {
    id: 'cs-student',
    title: 'Computer Science Student',
    role: 'Aspiring Software Engineer',
    badge: 'Rising Star',
    icon: null,
    theme: 'tokyonight',
    preset: 'bento',
    bio: 'Passionate about algorithms, systems programming, and open source. Building projects to learn and contribute.',
    skills: ['Python', 'C++', 'JavaScript', 'Git', 'Linux', 'SQL', 'Data Structures', 'Algorithms'],
    pinnedRepos: [
      { name: 'leetcode-solutions', description: 'Clean LeetCode solutions with explanations', language: 'C++', stargazersCount: 120, url: 'https://github.com' },
      { name: 'mini-compiler', description: 'Toy compiler for a C-like language', language: 'C++', stargazersCount: 85, url: 'https://github.com' },
      { name: 'distributed-chat', description: 'P2P chat app with WebRTC', language: 'TypeScript', stargazersCount: 60, url: 'https://github.com' },
    ],
    accentColor: '#7aa2f7',
  },
  {
    id: 'react-engineer',
    title: 'React & Frontend Specialist',
    role: 'Senior Frontend Engineer',
    badge: 'UI Perfectionist',
    icon: null,
    theme: 'atom',
    preset: 'titan',
    bio: 'Crafting performant, accessible React applications with modern patterns. TypeScript, Tailwind, and testing enthusiast.',
    skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'Vitest', 'Storybook', 'Zustand', 'Framer Motion'],
    pinnedRepos: [
      { name: 'design-system', description: 'Accessible component library with 50+ primitives', language: 'TypeScript', stargazersCount: 2200, url: 'https://github.com' },
      { name: 'animations-toolkit', description: 'Framer Motion utilities for delightful UX', language: 'TypeScript', stargazersCount: 1100, url: 'https://github.com' },
      { name: 'form-validator', description: 'Zero-dependency form validation hook', language: 'TypeScript', stargazersCount: 750, url: 'https://github.com' },
    ],
    accentColor: '#61dafb',
  },
  {
    id: 'python-developer',
    title: 'Python & Backend Engineer',
    role: 'Senior Backend Engineer',
    badge: 'FastAPI Expert',
    icon: null,
    theme: 'matrix',
    preset: 'bento',
    bio: 'Building high-performance async APIs, data pipelines, and ML serving infrastructure with Python.',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'PyTorch', 'Pydantic'],
    pinnedRepos: [
      { name: 'async-api-framework', description: 'Batteries-included FastAPI starter kit', language: 'Python', stargazersCount: 1800, url: 'https://github.com' },
      { name: 'ml-serving', description: 'Low-latency model serving with batching', language: 'Python', stargazersCount: 950, url: 'https://github.com' },
      { name: 'data-pipeline', description: 'ETL pipeline with Airflow and dbt', language: 'Python', stargazersCount: 620, url: 'https://github.com' },
    ],
    accentColor: '#3776ab',
  },
];

// Helper to apply template by ID
export function applyTemplate(templateId: string): {
  mode: 'profile';
  profilePreset: 'bento' | 'minimalist' | 'titan';
  profileData: ProfileData;
  projectData: ProjectData;
  sections: any[];
  theme: string;
} | null {
  const template = COMMUNITY_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const profileData: ProfileData = {
    username: 'ErBharatMalhotra',
    name: template.title,
    bio: template.bio,
    avatarUrl: 'https://avatars.githubusercontent.com/u/10000000?v=4',
    company: 'Tech Innovators',
    location: 'San Francisco, CA',
    website: 'https://readme.bharatdn.com',
    twitter: 'ReadmeCraft',
    githubUrl: 'https://github.com/ErBharatMalhotra',
    publicRepos: 32,
    followers: 240,
    following: 80,
    languages: [
      { name: template.skills[0] || 'TypeScript', percentage: 55, color: '#3178c6' },
      { name: template.skills[1] || 'Python', percentage: 30, color: '#3572A5' },
      { name: template.skills[2] || 'Rust', percentage: 15, color: '#dea584' },
    ],
    pinnedRepos: template.pinnedRepos,
    skills: template.skills,
    gitHoloEnabled: true,
    gitChronicleEnabled: true,
    visitorBadgeEnabled: true,
    githubStatsEnabled: true,
    githubStreakEnabled: true,
    topLanguagesEnabled: true,
  };

  const sections = getProfileSections(profileData, template.preset, template.theme);

  return {
    mode: 'profile',
    profilePreset: template.preset,
    profileData,
    projectData: {
      owner: 'ErBharatMalhotra',
      repo: 'flagship-project',
      title: 'Flagship Project',
      description: template.bio,
      license: 'MIT',
      defaultBranch: 'main',
      stars: 120,
      forks: 34,
      openIssues: 2,
      language: template.skills[0] || 'TypeScript',
      installCommand: 'npm install',
      runCommand: 'npm start',
      testCommand: 'npm test',
      features: ['Production Ready', 'Modern Architecture', 'High Performance'],
      techStack: template.skills.slice(0, 5),
      gitHoloEnabled: true,
      gitChronicleEnabled: true,
    },
    sections,
    theme: template.theme,
  };
}