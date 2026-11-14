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
  languages: Array<{ name: string; percentage: number; color: string }>;
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
      { name: 'hyper-stream', description: 'Ultra-low latency streaming microservice in Node.js', language: 'TypeScript', stargazersCount: 420, url: 'https://github.com/ErBharatMalhotra/hyper-stream' },
      { name: 'bento-design-system', description: 'Accessible Tailwind component primitives for enterprise', language: 'TypeScript', stargazersCount: 280, url: 'https://github.com/ErBharatMalhotra/bento-design-system' },
      { name: 'edge-cache-proxy', description: 'Distributed caching proxy with zero cold-starts', language: 'Go', stargazersCount: 195, url: 'https://github.com/ErBharatMalhotra/edge-cache-proxy' },
    ],
    accentColor: '#ff6b35',
    languages: [
      { name: 'TypeScript', percentage: 55, color: '#3178c6' },
      { name: 'Go', percentage: 25, color: '#00ADD8' },
      { name: 'Rust', percentage: 20, color: '#dea584' },
    ],
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
    languages: [
      { name: 'Python', percentage: 70, color: '#3776ab' },
      { name: 'C++', percentage: 20, color: '#f34b7d' },
      { name: 'TypeScript', percentage: 10, color: '#3178c6' },
    ],
    pinnedRepos: [
      { name: 'agent-swarm-core', description: 'Orchestration framework for hierarchical LLM agents', language: 'Python', stargazersCount: 1250, url: 'https://github.com/ErBharatMalhotra/agent-swarm-core' },
      { name: 'quant-kernel', description: 'Custom 4-bit CUDA quantization kernels for local inference', language: 'C++', stargazersCount: 890, url: 'https://github.com/ErBharatMalhotra/quant-kernel' },
      { name: 'eval-bench', description: 'Automated hallucination benchmark for RAG applications', language: 'Python', stargazersCount: 540, url: 'https://github.com/ErBharatMalhotra/eval-bench' },
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
    languages: [
      { name: 'Rust', percentage: 60, color: '#dea584' },
      { name: 'Go', percentage: 25, color: '#00ADD8' },
      { name: 'C++', percentage: 15, color: '#f34b7d' },
    ],
    pinnedRepos: [
      { name: 'zero-copy-db', description: 'Lock-free database engine with zero-copy reads', language: 'Rust', stargazersCount: 3200, url: 'https://github.com/ErBharatMalhotra/zero-copy-db' },
      { name: 'async-runtime', description: 'Custom async runtime for embedded systems', language: 'Rust', stargazersCount: 1800, url: 'https://github.com/ErBharatMalhotra/async-runtime' },
      { name: 'network-stack', description: 'User-space TCP/IP stack in safe Rust', language: 'Rust', stargazersCount: 950, url: 'https://github.com/ErBharatMalhotra/network-stack' },
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
    languages: [
      { name: 'Go', percentage: 50, color: '#00ADD8' },
      { name: 'TypeScript', percentage: 30, color: '#3178c6' },
      { name: 'Jsonnet', percentage: 20, color: '#008080' },
    ],
    pinnedRepos: [
      { name: 'gitops-platform', description: 'Multi-cluster GitOps platform with ArgoCD', language: 'Go', stargazersCount: 2100, url: 'https://github.com/ErBharatMalhotra/gitops-platform' },
      { name: 'observability-stack', description: 'Batteries-included Prometheus/Grafana/Loki stack', language: 'Jsonnet', stargazersCount: 1400, url: 'https://github.com/ErBharatMalhotra/observability-stack' },
      { name: 'cluster-autoscaler', description: 'Custom CA for spot-instance workloads', language: 'Go', stargazersCount: 890, url: 'https://github.com/ErBharatMalhotra/cluster-autoscaler' },
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
    languages: [
      { name: 'Solidity', percentage: 50, color: '#363636' },
      { name: 'TypeScript', percentage: 30, color: '#3178c6' },
      { name: 'Rust', percentage: 20, color: '#dea584' },
    ],
    pinnedRepos: [
      { name: 'account-abstraction-wallet', description: 'ERC-4337 smart wallet with session keys', language: 'Solidity', stargazersCount: 3400, url: 'https://github.com/ErBharatMalhotra/account-abstraction-wallet' },
      { name: 'mev-protection', description: 'MEV-resistant transaction relayer', language: 'Rust', stargazersCount: 1200, url: 'https://github.com/ErBharatMalhotra/mev-protection' },
      { name: 'defi-sdk', description: 'Type-safe DeFi protocol SDK', language: 'TypeScript', stargazersCount: 980, url: 'https://github.com/ErBharatMalhotra/defi-sdk' },
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
    languages: [
      { name: 'Python', percentage: 40, color: '#3776ab' },
      { name: 'C++', percentage: 35, color: '#f34b7d' },
      { name: 'JavaScript', percentage: 25, color: '#f1e05a' },
    ],
    pinnedRepos: [
      { name: 'leetcode-solutions', description: 'Clean LeetCode solutions with explanations', language: 'C++', stargazersCount: 120, url: 'https://github.com/ErBharatMalhotra/leetcode-solutions' },
      { name: 'mini-compiler', description: 'Toy compiler for a C-like language', language: 'C++', stargazersCount: 85, url: 'https://github.com/ErBharatMalhotra/mini-compiler' },
      { name: 'distributed-chat', description: 'P2P chat app with WebRTC', language: 'TypeScript', stargazersCount: 60, url: 'https://github.com/ErBharatMalhotra/distributed-chat' },
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
    languages: [
      { name: 'TypeScript', percentage: 70, color: '#3178c6' },
      { name: 'JavaScript', percentage: 20, color: '#f1e05a' },
      { name: 'CSS', percentage: 10, color: '#563d7c' },
    ],
    pinnedRepos: [
      { name: 'design-system', description: 'Accessible component library with 50+ primitives', language: 'TypeScript', stargazersCount: 2200, url: 'https://github.com/ErBharatMalhotra/design-system' },
      { name: 'animations-toolkit', description: 'Framer Motion utilities for delightful UX', language: 'TypeScript', stargazersCount: 1100, url: 'https://github.com/ErBharatMalhotra/animations-toolkit' },
      { name: 'form-validator', description: 'Zero-dependency form validation hook', language: 'TypeScript', stargazersCount: 750, url: 'https://github.com/ErBharatMalhotra/form-validator' },
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
    languages: [
      { name: 'Python', percentage: 80, color: '#3776ab' },
      { name: 'TypeScript', percentage: 15, color: '#3178c6' },
      { name: 'SQL', percentage: 5, color: '#e38c00' },
    ],
    pinnedRepos: [
      { name: 'async-api-framework', description: 'Batteries-included FastAPI starter kit', language: 'Python', stargazersCount: 1800, url: 'https://github.com/ErBharatMalhotra/async-api-framework' },
      { name: 'ml-serving', description: 'Low-latency model serving with batching', language: 'Python', stargazersCount: 950, url: 'https://github.com/ErBharatMalhotra/ml-serving' },
      { name: 'open-source-ai-radar', description: 'Scores 10,200+ open-source AI repos on Impact / Velocity / Health', language: 'Python', stargazersCount: 1200, url: 'https://github.com/ErBharatMalhotra/open-source-ai-radar' },
    ],
    accentColor: '#3776ab',
  },
  {
    id: 'mobile-developer',
    title: 'Mobile App Developer',
    role: 'iOS / Android / Cross-Platform',
    badge: '📱 High Demand',
    icon: null,
    theme: 'tokyonight',
    preset: 'bento',
    bio: 'Building delightful mobile experiences across iOS, Android, and cross-platform. Native performance, beautiful UI, offline-first architecture.',
    skills: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'SwiftUI', 'Jetpack Compose', 'Firebase', 'App Store Connect'],
    languages: [
      { name: 'Swift', percentage: 35, color: '#fa7343' },
      { name: 'Kotlin', percentage: 30, color: '#7f52ff' },
      { name: 'TypeScript', percentage: 20, color: '#3178c6' },
      { name: 'Dart', percentage: 15, color: '#0175c2' },
    ],
    pinnedRepos: [
      { name: 'ios-production-app', description: 'App Store featured iOS app with SwiftUI & Combine', language: 'Swift', stargazersCount: 1800, url: 'https://github.com/ErBharatMalhotra/ios-production-app' },
      { name: 'android-architecture', description: 'Clean architecture Kotlin app with Jetpack Compose', language: 'Kotlin', stargazersCount: 1200, url: 'https://github.com/ErBharatMalhotra/android-architecture' },
      { name: 'cross-platform-kit', description: 'Shared React Native + Flutter component library', language: 'TypeScript', stargazersCount: 950, url: 'https://github.com/ErBharatMalhotra/cross-platform-kit' },
    ],
    accentColor: '#fa7343',
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist / ML Engineer',
    role: 'Analytics, MLOps & Data Platforms',
    badge: '📊 Trending',
    icon: null,
    theme: 'matrix',
    preset: 'titan',
    bio: 'Transforming raw data into actionable insights. Building scalable ML pipelines, real-time analytics, and data products that drive business decisions.',
    skills: ['Python', 'SQL', 'PySpark', 'Airflow', 'dbt', 'Pandas', 'Polars', 'Delta Lake', 'Kafka', 'MLflow'],
    languages: [
      { name: 'Python', percentage: 55, color: '#3776ab' },
      { name: 'SQL', percentage: 25, color: '#e38c00' },
      { name: 'R', percentage: 12, color: '#276dc3' },
      { name: 'Scala', percentage: 8, color: '#c22d40' },
    ],
    pinnedRepos: [
      { name: 'analytics-platform', description: 'Real-time analytics stack with ClickHouse & Grafana', language: 'Python', stargazersCount: 2400, url: 'https://github.com/ErBharatMalhotra/analytics-platform' },
      { name: 'ml-pipeline-orchestrator', description: 'End-to-end ML pipeline with Airflow & MLflow', language: 'Python', stargazersCount: 1800, url: 'https://github.com/ErBharatMalhotra/ml-pipeline-orchestrator' },
      { name: 'data-quality-framework', description: 'Automated data testing & observability with dbt', language: 'SQL', stargazersCount: 1100, url: 'https://github.com/ErBharatMalhotra/data-quality-framework' },
    ],
    accentColor: '#00ff41',
  },
  {
    id: 'security-engineer',
    title: 'Security / AppSec Engineer',
    role: 'Application & Cloud Security',
    badge: '🔒 Critical Need',
    icon: null,
    theme: 'cyberpunk2077',
    preset: 'bento',
    bio: 'Securing the software supply chain. Threat modeling, vulnerability research, DevSecOps automation, and zero-trust architecture.',
    skills: ['Burp Suite', 'SAST/DAST', 'Threat Modeling', 'OAuth/OIDC', 'Kubernetes Security', 'Go', 'Python', 'Rust', 'eBPF', 'Terraform'],
    languages: [
      { name: 'Go', percentage: 40, color: '#00ADD8' },
      { name: 'Python', percentage: 30, color: '#3776ab' },
      { name: 'TypeScript', percentage: 20, color: '#3178c6' },
      { name: 'Rust', percentage: 10, color: '#dea584' },
    ],
    pinnedRepos: [
      { name: 'vuln-scanner', description: 'Fast container & code vulnerability scanner', language: 'Go', stargazersCount: 3200, url: 'https://github.com/ErBharatMalhotra/vuln-scanner' },
      { name: 'secure-config', description: 'Security-as-Code for K8s & cloud infrastructure', language: 'TypeScript', stargazersCount: 1500, url: 'https://github.com/ErBharatMalhotra/secure-config' },
      { name: 'auth-lib', description: 'Zero-trust authentication library with FIDO2 support', language: 'Rust', stargazersCount: 890, url: 'https://github.com/ErBharatMalhotra/auth-lib' },
    ],
    accentColor: '#ff0040',
  },
  {
    id: 'game-developer',
    title: 'Game Developer',
    role: 'Unity / Unreal / Godot Engineer',
    badge: '🎮 Creative Tech',
    icon: null,
    theme: 'synthwave',
    preset: 'titan',
    bio: 'Crafting immersive interactive experiences. From indie gems to AAA systems — graphics programming, gameplay architecture, and multiplayer networking.',
    skills: ['Unity', 'C#', 'Unreal Engine', 'C++', 'Godot', 'GDScript', 'HLSL/GLSL', 'ECS/DOTS', 'Netcode', 'Shader Graph'],
    languages: [
      { name: 'C#', percentage: 50, color: '#239120' },
      { name: 'C++', percentage: 30, color: '#f34b7d' },
      { name: 'GDScript', percentage: 15, color: '#478cbf' },
      { name: 'HLSL', percentage: 5, color: '#8b00ff' },
    ],
    pinnedRepos: [
      { name: 'indie-rpg-engine', description: 'Modular 2D RPG engine with ECS architecture', language: 'C#', stargazersCount: 2100, url: 'https://github.com/ErBharatMalhotra/indie-rpg-engine' },
      { name: 'multiplayer-framework', description: 'Authoritative server framework for Unity/Godot', language: 'C#', stargazersCount: 1400, url: 'https://github.com/ErBharatMalhotra/multiplayer-framework' },
      { name: 'shader-library', description: 'Production-ready shader collection for URP/HDRP', language: 'HLSL', stargazersCount: 980, url: 'https://github.com/ErBharatMalhotra/shader-library' },
    ],
    accentColor: '#ff00ff',
  },
  {
    id: 'sre-engineer',
    title: 'Site Reliability Engineer',
    role: 'Reliability, Observability & Scale',
    badge: '📈 Production First',
    icon: null,
    theme: 'matrix',
    preset: 'bento',
    bio: 'Building systems that heal themselves. SLO-driven development, chaos engineering, distributed tracing, and incident response automation.',
    skills: ['Kubernetes', 'Prometheus', 'Grafana', 'Jaeger', 'Go', 'Python', 'Terraform', 'Helm', 'eBPF', 'SLI/SLO'],
    languages: [
      { name: 'Go', percentage: 55, color: '#00ADD8' },
      { name: 'Python', percentage: 25, color: '#3776ab' },
      { name: 'TypeScript', percentage: 12, color: '#3178c6' },
      { name: 'Bash', percentage: 8, color: '#4eaa25' },
    ],
    pinnedRepos: [
      { name: 'chaos-platform', description: 'Automated chaos engineering for K8s', language: 'Go', stargazersCount: 2800, url: 'https://github.com/ErBharatMalhotra/chaos-platform' },
      { name: 'slo-dashboard', description: 'SLO/SLI monitoring with error budgets', language: 'TypeScript', stargazersCount: 1600, url: 'https://github.com/ErBharatMalhotra/slo-dashboard' },
      { name: 'incident-runbook', description: 'Automated incident response & runbook engine', language: 'Python', stargazersCount: 950, url: 'https://github.com/ErBharatMalhotra/incident-runbook' },
    ],
    accentColor: '#00d4aa',
  },
  {
    id: 'engineering-manager',
    title: 'Engineering Manager / Tech Lead',
    role: 'People, Process & Architecture',
    badge: '👥 Leadership',
    icon: null,
    theme: 'gta6',
    preset: 'titan',
    bio: 'Scaling teams and systems. Technical strategy, developer experience, hiring excellence, and delivery without burnout. Code reviews, RFCs, and 1:1s.',
    skills: ['System Design', 'Team Building', 'Technical Strategy', 'RFC Process', 'TypeScript', 'Go', 'PostgreSQL', 'AWS', 'Kubernetes'],
    languages: [
      { name: 'TypeScript', percentage: 40, color: '#3178c6' },
      { name: 'Go', percentage: 30, color: '#00ADD8' },
      { name: 'Python', percentage: 20, color: '#3776ab' },
      { name: 'SQL', percentage: 10, color: '#e38c00' },
    ],
    pinnedRepos: [
      { name: 'eng-playbook', description: 'Engineering culture & process handbook', language: 'Markdown', stargazersCount: 4200, url: 'https://github.com/ErBharatMalhotra/eng-playbook' },
      { name: 'tech-rfc-template', description: 'RFC framework for architectural decisions', language: 'Markdown', stargazersCount: 1800, url: 'https://github.com/ErBharatMalhotra/tech-rfc-template' },
      { name: 'dev-ex-platform', description: 'Internal developer platform for productivity', language: 'Go', stargazersCount: 1200, url: 'https://github.com/ErBharatMalhotra/dev-ex-platform' },
    ],
    accentColor: '#ff6b35',
  },
  {
    id: 'embedded-engineer',
    title: 'Embedded / IoT Engineer',
    role: 'Firmware, RTOS & Edge Computing',
    badge: '🔧 Hardware Adjacent',
    icon: null,
    theme: 'elden-ring',
    preset: 'minimalist',
    bio: 'Bridging hardware and software. Bare-metal C, Rust on microcontrollers, RTOS, sensor fusion, and edge ML. Deterministic, memory-safe, power-efficient.',
    skills: ['C', 'Rust', 'C++', 'Zephyr RTOS', 'FreeRTOS', 'Embedded Linux', 'MQTT', 'Protocol Buffers', 'eBPF', 'ARM Cortex-M'],
    languages: [
      { name: 'C', percentage: 45, color: '#555555' },
      { name: 'Rust', percentage: 30, color: '#dea584' },
      { name: 'C++', percentage: 20, color: '#f34b7d' },
      { name: 'Assembly', percentage: 5, color: '#8b00ff' },
    ],
    pinnedRepos: [
      { name: 'firmware-sdk', description: 'Rust-based firmware SDK for STM32/ESP32', language: 'Rust', stargazersCount: 2400, url: 'https://github.com/ErBharatMalhotra/firmware-sdk' },
      { name: 'edge-ml-runtime', description: 'TinyML inference on Cortex-M with zero alloc', language: 'C', stargazersCount: 1100, url: 'https://github.com/ErBharatMalhotra/edge-ml-runtime' },
      { name: 'iot-protocol-stack', description: 'Memory-safe MQTT/CoAP implementation', language: 'Rust', stargazersCount: 850, url: 'https://github.com/ErBharatMalhotra/iot-protocol-stack' },
    ],
    accentColor: '#c9a84c',
  },
  {
    id: 'qa-sdet',
    title: 'QA / SDET / Test Automation',
    role: 'Quality Engineering & Reliability',
    badge: '✅ Shift Left',
    icon: null,
    theme: 'atom',
    preset: 'bento',
    bio: 'Quality is everyone\'s job — I build the tools to make it easy. Test architecture, contract testing, visual regression, performance budgets, and CI/CD quality gates.',
    skills: ['Playwright', 'Cypress', 'Vitest', 'k6', 'Pact', 'Postman', 'TypeScript', 'Python', 'GitHub Actions', 'Testcontainers'],
    languages: [
      { name: 'TypeScript', percentage: 50, color: '#3178c6' },
      { name: 'Python', percentage: 30, color: '#3776ab' },
      { name: 'Go', percentage: 15, color: '#00ADD8' },
      { name: 'Java', percentage: 5, color: '#b07219' },
    ],
    pinnedRepos: [
      { name: 'test-framework', description: 'Opinionated E2E + API + Contract test framework', language: 'TypeScript', stargazersCount: 1900, url: 'https://github.com/ErBharatMalhotra/test-framework' },
      { name: 'visual-regression', description: 'Cross-browser visual diff with pixel-perfect thresholds', language: 'TypeScript', stargazersCount: 1100, url: 'https://github.com/ErBharatMalhotra/visual-regression' },
      { name: 'perf-budget-ci', description: 'Automated performance budgets in CI/CD', language: 'Go', stargazersCount: 750, url: 'https://github.com/ErBharatMalhotra/perf-budget-ci' },
    ],
    accentColor: '#61dafb',
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

  // Calculate languages with bytes from template data
  const templateLanguages = template.languages || [
    { name: template.skills[0] || 'TypeScript', percentage: 55, color: '#3178c6' },
    { name: template.skills[1] || 'Python', percentage: 30, color: '#3572A5' },
    { name: template.skills[2] || 'Rust', percentage: 15, color: '#dea584' },
  ];

  // Add bytes to languages (estimate based on percentage)
  const totalBytes = 1000000;
  const languagesWithBytes = templateLanguages.map(l => ({
    ...l,
    bytes: Math.round((l.percentage / 100) * totalBytes),
  }));

  const profileData: ProfileData = {
    username: 'ErBharatMalhotra',
    name: template.title,
    bio: template.bio,
    bioHTML: `<p>${template.bio}</p>`,
    avatarUrl: 'https://avatars.githubusercontent.com/u/10000000?v=4',
    company: 'Tech Innovators',
    companyHTML: 'Tech Innovators',
    location: 'San Francisco, CA',
    website: 'https://readme.bharatdn.com',
    twitter: 'ReadmeCraft',
    email: 'hello@readme.bharatdn.com',
    githubUrl: 'https://github.com/ErBharatMalhotra',
    resourcePath: '/ErBharatMalhotra',
    createdAt: '2020-01-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    userViewType: 'PUBLIC',
    isSponsorable: true,
    estimatedNextSponsorsPayoutInCents: 0,
    monthlyEstimatedSponsorsIncomeInCents: 0,
    hasSponsorsListing: false,
    pronouns: 'he/him',
    publicRepos: 32,
    totalDiskUsage: 1250000,
    followers: 240,
    following: 80,
    starredRepositoriesCount: 487,
    watchingCount: 12,
    gistsCount: 3,
    languages: languagesWithBytes,
    skills: template.skills,
    pinnedRepos: template.pinnedRepos.map(r => ({
      ...r,
      forksCount: Math.round(r.stargazersCount * 0.1),
      topics: ['github', 'opensource', 'developer-tools'],
      license: 'MIT',
      isFork: false,
      isArchived: false,
      homepageUrl: undefined,
      releases: [
        { name: 'v1.0.0', tagName: 'v1.0.0', publishedAt: '2024-01-15T00:00:00Z', url: r.url + '/releases/tag/v1.0.0', isPrerelease: false },
      ],
    })),
    topRepositories: template.pinnedRepos.slice(0, 3).map(r => ({
      name: r.name,
      stargazerCount: r.stargazersCount,
      url: r.url,
      primaryLanguage: { name: r.language, color: '#3178c6' },
    })),
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
    commitContributionsByRepository: template.pinnedRepos.slice(0, 3).map(r => ({
      repository: { name: r.name, owner: { login: 'ErBharatMalhotra' }, url: r.url, primaryLanguage: { name: r.language, color: '#3178c6' } },
      contributions: { totalCount: Math.floor(r.stargazersCount / 10) },
    })),
    pullRequestContributionsByRepository: template.pinnedRepos.slice(0, 2).map(r => ({
      repository: { name: r.name, owner: { login: 'ErBharatMalhotra' }, url: r.url },
      contributions: { totalCount: Math.floor(r.stargazersCount / 50) },
    })),
    organizations: [
      { login: 'TechInnovators', name: 'Tech Innovators', avatarUrl: 'https://avatars.githubusercontent.com/u/123456?v=4', url: 'https://github.com/TechInnovators' },
    ],
    packages: [
      { name: `@techinnovators/${template.id}`, packageType: 'NPM', url: 'https://github.com/ErBharatMalhotra/' + template.id + '/packages', version: '1.0.0' },
    ],
    sponsors: [
      { login: 'supporter1', avatarUrl: 'https://avatars.githubusercontent.com/u/111?v=4', url: 'https://github.com/supporter1' },
    ],
    sponsorshipsAsMaintainer: [
      { sponsorEntity: { login: 'supporter1', avatarUrl: 'https://avatars.githubusercontent.com/u/111?v=4', name: 'Supporter One', url: 'https://github.com/supporter1' }, tier: { monthlyPriceInCents: 500, name: 'Supporter' } },
    ],
    socialAccounts: [
      { provider: 'TWITTER', url: 'https://twitter.com/ReadmeCraft' },
      { provider: 'LINKEDIN', url: 'https://linkedin.com/company/techinnovators' },
      { provider: 'WEBSITE', url: 'https://readme.bharatdn.com' },
    ],
    status: { emoji: '🚀', message: `Building ${template.title} tools`, expiresAt: null },
    recentPullRequests: [
      { title: 'feat: Add new features', url: 'https://github.com/ErBharatMalhotra/readmecraft/pull/42', state: 'MERGED', mergedAt: '2024-11-10T00:00:00Z', repository: { name: 'readmecraft', owner: { login: 'ErBharatMalhotra' } } },
    ],
    recentIssues: [
      { title: 'Feature request: More templates', url: 'https://github.com/ErBharatMalhotra/readmecraft/issues/38', state: 'OPEN', repository: { name: 'readmecraft', owner: { login: 'ErBharatMalhotra' } } },
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

  const sections = getProfileSections(profileData, template.preset, template.theme);

  return {
    mode: 'profile',
    profilePreset: template.preset,
    profileData,
    projectData: {
      owner: 'ErBharatMalhotra',
      repo: 'flagship-project',
      name: 'flagship-project',
      nameWithOwner: 'ErBharatMalhotra/flagship-project',
      title: 'Flagship Project',
      description: template.bio,
      descriptionHTML: `<p>${template.bio}</p>`,
      url: 'https://github.com/ErBharatMalhotra/flagship-project',
      homepageUrl: 'https://readme.bharatdn.com',
      shortDescriptionHTML: `<p>${template.bio}</p>`,
      stars: 120,
      stargazerCount: 120,
      forkCount: 34,
      openIssues: 2,
      closedIssues: 5,
      diskUsage: 25000,
      license: 'MIT',
      licenseName: 'MIT License',
      licenseUrl: 'https://opensource.org/licenses/MIT',
      defaultBranch: 'main',
      primaryLanguage: { name: template.skills[0] || 'TypeScript', color: '#3178c6' },
      languages: languagesWithBytes.map(l => ({ name: l.name, color: l.color, size: l.bytes || 0 })),
      totalLanguageSize: totalBytes,
      repositoryTopics: template.skills.slice(0, 5).map(s => ({ name: s, stargazerCount: 1000 })),
      releases: [
        { name: 'v1.0.0', tagName: 'v1.0.0', description: 'Initial release', publishedAt: '2024-01-15T00:00:00Z', url: 'https://github.com/ErBharatMalhotra/flagship-project/releases/tag/v1.0.0', isPrerelease: false, isDraft: false },
      ],
      deployments: [
        { createdAt: '2024-11-01T12:00:00Z', environment: 'production', state: 'active', payload: 'Deployed to Vercel' },
      ],
      environments: [
        { name: 'production', url: 'https://readme.bharatdn.com' },
      ],
      packages: [],
      workflows: [
        { name: 'CI', state: 'active', filePath: '.github/workflows/ci.yml' },
      ],
      vulnerabilityAlerts: [],
      dependencyGraphManifests: [
        { filename: 'package.json', dependencies: [ { packageName: 'next', repository: { name: 'next.js', url: 'https://github.com/vercel/next.js' }, requirements: '^16.0.0', hasDependencies: true } ] },
      ],
      mergeCommitAllowed: true,
      rebaseMergeAllowed: true,
      squashMergeAllowed: true,
      deleteBranchOnMerge: true,
      updatedAt: new Date().toISOString(),
      pushedAt: new Date().toISOString(),
      createdAt: '2024-01-15T00:00:00Z',
      lastCommitDate: new Date().toISOString(),
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
      securityPolicyUrl: 'https://github.com/ErBharatMalhotra/flagship-project/security/policy',
      codeOfConduct: { name: 'Contributor Covenant', url: 'https://github.com/ErBharatMalhotra/flagship-project/blob/main/CODE_OF_CONDUCT.md' },
      fundingLinks: [
        { platform: 'GITHUB', url: 'https://github.com/sponsors/ErBharatMalhotra' },
      ],
      usesCustomOpenGraphImage: true,
      openGraphImageUrl: 'https://githolo.bharatdn.com/api/og/ErBharatMalhotra',
      hasIssuesEnabled: true,
      hasWikiEnabled: false,
      hasProjectsEnabled: true,
      hasDiscussionsEnabled: true,
      hasSponsorshipsEnabled: true,
      autoMergeAllowed: true,
      language: template.skills[0] || 'TypeScript',
      framework: 'Next.js 16',
      packageManager: 'npm',
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