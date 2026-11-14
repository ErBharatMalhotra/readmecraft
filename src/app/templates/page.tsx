'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Check,
  Copy,
  Terminal,
  Code2,
  Cpu,
  Brain,
  Shield,
  GraduationCap,
  Layers,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { getProfileSections, compileSectionsToMarkdown } from '@/lib/generators';

interface CommunityTemplate {
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

const TEMPLATES: CommunityTemplate[] = [
  {
    id: 'fullstack-architect',
    title: 'Full-Stack Systems Architect',
    role: 'Staff / Lead Engineer',
    badge: 'Most Popular',
    icon: Code2,
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
    icon: Brain,
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
    icon: Cpu,
    theme: 'elden-ring',
    preset: 'minimalist',
    bio: 'Building memory-safe database engines, zero-copy network stacks, and concurrent systems in Rust & Go.',
    skills: ['Rust', 'Go', 'Linux', 'Docker', 'Kubernetes', 'Git'],
    pinnedRepos: [
      { name: 'iron-kv', description: 'LSM-tree embedded key-value store with ACID transactions in Rust', language: 'Rust', stargazersCount: 820, url: 'https://github.com' },
      { name: 'zero-wire', description: 'Zero-copy high throughput UDP packet processor', language: 'Rust', stargazersCount: 410, url: 'https://github.com' },
    ],
    accentColor: '#c9a84c',
  },
  {
    id: 'devops-infra',
    title: 'DevOps & Cloud Architect',
    role: 'Site Reliability & Infrastructure',
    badge: 'Production Grade',
    icon: Terminal,
    theme: 'matrix',
    preset: 'bento',
    bio: 'Automating multi-region Kubernetes clusters, GitOps CI/CD pipelines, and zero-trust infrastructure as code.',
    skills: ['Kubernetes', 'Docker', 'AWS', 'Linux', 'Go', 'Python', 'Git'],
    pinnedRepos: [
      { name: 'gitops-fleet', description: 'Production Terraform & ArgoCD templates for resilient clouds', language: 'HCL', stargazersCount: 630, url: 'https://github.com' },
      { name: 'k8s-cost-watcher', description: 'Autonomous pod autoscaler based on real-time AWS spot pricing', language: 'Go', stargazersCount: 390, url: 'https://github.com' },
    ],
    accentColor: '#00ff00',
  },
  {
    id: 'web3-security',
    title: 'Web3 & Smart Contract Dev',
    role: 'EVM & DeFi Security Auditor',
    badge: 'High Value',
    icon: Shield,
    theme: 'synthwave',
    preset: 'bento',
    bio: 'Developing gas-optimized smart contracts, formal verification test suites, and audited decentralized liquidity protocols.',
    skills: ['Solidity', 'TypeScript', 'React', 'Rust', 'Node.js', 'Next.js'],
    pinnedRepos: [
      { name: 'vault-protocol', description: 'Gas-optimized ERC-4626 multi-asset yield vault', language: 'Solidity', stargazersCount: 740, url: 'https://github.com' },
      { name: 'sol-security-lint', description: 'Static analysis rules for re-entrancy and arithmetic anomalies', language: 'Rust', stargazersCount: 310, url: 'https://github.com' },
    ],
    accentColor: '#f92aad',
  },
  {
    id: 'student-faang',
    title: 'Student & Open Source Contributor',
    role: 'CS Undergrad / Internship Ready',
    badge: 'Hire Ready 🎓',
    icon: GraduationCap,
    theme: 'tokyonight',
    preset: 'bento',
    bio: 'Computer Science sophomore passionate about web applications, data structures, and contributing to open source.',
    skills: ['JavaScript', 'TypeScript', 'React', 'Python', 'Node.js', 'PostgreSQL', 'Git', 'TailwindCSS'],
    pinnedRepos: [
      { name: 'dev-portfolio-v3', description: 'Modern dark-mode portfolio built with Next.js and Tailwind', language: 'TypeScript', stargazersCount: 180, url: 'https://github.com' },
      { name: 'algorithm-visualizer', description: 'Interactive visualizer for pathfinding and sorting algorithms', language: 'JavaScript', stargazersCount: 290, url: 'https://github.com' },
    ],
    accentColor: '#7aa2f7',
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleApplyTemplate = (template: CommunityTemplate) => {
    const profileData = {
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
    const stateToSave = {
      mode: 'profile',
      profilePreset: template.preset,
      projectPreset: 'standard',
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

    try {
      localStorage.setItem('readmecraft_saved_state_v2', JSON.stringify(stateToSave));
      localStorage.setItem('readmecraft-theme', template.theme);
    } catch (e) {}

    router.push('/');
  };

  const handleCopyMarkdown = (template: CommunityTemplate) => {
    const profileData = {
      username: 'ErBharatMalhotra',
      name: template.title,
      bio: template.bio,
      avatarUrl: 'https://avatars.githubusercontent.com/u/10000000?v=4',
      company: 'Tech',
      location: 'Global',
      website: 'https://readme.bharatdn.com',
      twitter: 'ReadmeCraft',
      githubUrl: 'https://github.com/ErBharatMalhotra',
      publicRepos: 25,
      followers: 180,
      following: 50,
      languages: [
        { name: template.skills[0] || 'TypeScript', percentage: 60, color: '#3178c6' },
        { name: template.skills[1] || 'Python', percentage: 40, color: '#3572A5' },
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
    const md = compileSectionsToMarkdown(sections);
    navigator.clipboard.writeText(md);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-[#1e293b] bg-[#090d16]/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-['Space_Grotesk'] text-lg font-bold tracking-tight text-white">
                ReadmeCraft
              </span>
              <span className="ml-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 uppercase">
                Templates
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-[#1e293b] bg-[#0e1526] px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white transition-all"
            >
              Open Studio
            </Link>
            <Link
              href="/deploy"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              1-Click Deploy
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative overflow-hidden border-b border-[#1e293b] bg-gradient-to-b from-[#0b101c] to-[#070b14] py-16 px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            Community Persona Showcase
          </div>
          <h1 className="font-['Space_Grotesk'] text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
            Curated GitHub Profile Templates
          </h1>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            Hand-crafted, viral aesthetic README templates for engineers, researchers, and students.
            1-click load into ReadmeCraft studio with 50+ viral themes and animated SVGs.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            const isCopied = copiedId === tmpl.id;

            return (
              <div
                key={tmpl.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-[#1e293b] bg-[#0c1220] p-6 transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_24px_rgba(16,185,129,0.12)]"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10"
                      style={{ backgroundColor: `${tmpl.accentColor}15`, color: tmpl.accentColor }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-[#1e293b] bg-[#121929] px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-300">
                      {tmpl.badge}
                    </span>
                  </div>

                  {/* Title & Role */}
                  <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {tmpl.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 font-mono text-xs text-slate-400">
                    <span>{tmpl.role}</span>
                    <span>•</span>
                    <span className="capitalize text-emerald-400">{tmpl.theme} theme</span>
                  </div>

                  {/* Bio Preview */}
                  <p className="mt-3.5 text-xs text-slate-300 leading-relaxed">
                    "{tmpl.bio}"
                  </p>

                  {/* Skills Pills */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tmpl.skills.slice(0, 6).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-[#1e293b] bg-[#070b14] px-2 py-0.5 font-mono text-[10px] text-slate-400"
                      >
                        {skill}
                      </span>
                    ))}
                    {tmpl.skills.length > 6 && (
                      <span className="rounded-md border border-[#1e293b] bg-[#070b14] px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                        +{tmpl.skills.length - 6}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-6 flex items-center gap-2 pt-4 border-t border-[#1e293b]/60">
                  <button
                    onClick={() => handleApplyTemplate(tmpl)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 px-3 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  >
                    <span>Use Template</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => handleCopyMarkdown(tmpl)}
                    title="Copy Raw Markdown"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e293b] bg-[#090d16] text-slate-400 hover:border-slate-700 hover:text-white transition-colors"
                  >
                    {isCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}