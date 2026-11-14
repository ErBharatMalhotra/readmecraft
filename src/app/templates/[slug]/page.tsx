import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Brain,
  Shield,
  GraduationCap,
  Terminal,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface PersonaSEO {
  slug: string;
  title: string;
  role: string;
  description: string;
  keywords: string[];
  theme: string;
  preset: string;
  skills: string[];
  highlights: string[];
}

const PERSONAS: Record<string, PersonaSEO> = {
  'python-developer': {
    slug: 'python-developer',
    title: 'Python Developer GitHub Profile README Template',
    role: 'Python & Backend Engineer',
    description: 'High-converting GitHub profile README template for Python developers. Features FastAPI badges, PyTorch stats, and clean bento architecture.',
    keywords: ['python github profile readme', 'python developer readme template', 'fastapi github template'],
    theme: 'matrix',
    preset: 'bento',
    skills: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'Docker', 'Redis', 'AWS'],
    highlights: ['Automated test coverage badges', 'Async backend architecture diagram', 'PyPI package stats counter'],
  },
  'react-developer': {
    slug: 'react-developer',
    title: 'React & Next.js Developer GitHub Profile README Template',
    role: 'Senior Frontend / UI Engineer',
    description: 'Curated GitHub profile README template for React and Next.js developers. Showcase component libraries, lighthouse scores, and UI animations.',
    keywords: ['react github profile readme', 'nextjs readme template', 'frontend developer github profile'],
    theme: 'gta6',
    preset: 'bento',
    skills: ['React', 'Next.js', 'TypeScript', 'TailwindCSS', 'Redux', 'GraphQL', 'Jest'],
    highlights: ['Interactive UI component showcase', 'Lighthouse 100/100 score badges', 'Vercel deployment metrics'],
  },
  'fullstack-architect': {
    slug: 'fullstack-architect',
    title: 'Full-Stack Systems Architect README Template',
    role: 'Lead Systems Architect',
    description: 'Enterprise-grade GitHub profile README template for full-stack leads and systems architects with distributed telemetry widgets.',
    keywords: ['full stack readme template', 'lead engineer github profile', 'systems architect portfolio'],
    theme: 'gta6',
    preset: 'bento',
    skills: ['TypeScript', 'Next.js', 'Node.js', 'PostgreSQL', 'Docker', 'Redis', 'AWS', 'Kubernetes'],
    highlights: ['Microservice architecture graphs', 'System uptime & SLA badges', 'GitHolo 3D developer card integration'],
  },
  'rust-engineer': {
    slug: 'rust-engineer',
    title: 'Rust & Systems Engineer GitHub Profile README Template',
    role: 'Systems & Low-Level Dev',
    description: 'Minimalist high-performance GitHub profile README template for Rustaceans and low-level systems engineers.',
    keywords: ['rust github profile readme', 'systems engineer readme', 'rust developer portfolio'],
    theme: 'elden-ring',
    preset: 'minimalist',
    skills: ['Rust', 'Go', 'Linux', 'WebAssembly', 'C++', 'Docker', 'PostgreSQL'],
    highlights: ['Zero-overhead minimalist design', 'Cargo crates download counter', 'Memory-safety badge banner'],
  },
  'devops-engineer': {
    slug: 'devops-engineer',
    title: 'DevOps & Cloud Architect GitHub Profile README Template',
    role: 'SRE & Platform Engineer',
    description: 'Production-ready GitHub profile README template for DevOps, Cloud, and SRE professionals. Features Kubernetes, Terraform, and CI/CD pipelines.',
    keywords: ['devops github readme template', 'sre profile readme', 'cloud architect github portfolio'],
    theme: 'matrix',
    preset: 'bento',
    skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'Linux', 'Go', 'ArgoCD'],
    highlights: ['GitOps pipeline status badges', 'Infrastructure as Code repo cards', 'Multi-region cloud diagram'],
  },
  'web3-developer': {
    slug: 'web3-developer',
    title: 'Web3 & Smart Contract Developer README Template',
    role: 'EVM & DeFi Security Engineer',
    description: 'High-value GitHub profile README template for Solidity and Web3 developers with audit badges and gas-optimization metrics.',
    keywords: ['web3 github profile readme', 'solidity readme template', 'smart contract developer portfolio'],
    theme: 'synthwave',
    preset: 'bento',
    skills: ['Solidity', 'TypeScript', 'Foundry', 'Hardhat', 'Rust', 'Ethers.js'],
    highlights: ['Security audit pass badge', 'Total Value Locked (TVL) metric banner', 'Gas optimization benchmarks'],
  },
  'ai-ml-engineer': {
    slug: 'ai-ml-engineer',
    title: 'AI / ML & LLM Engineer GitHub Profile README Template',
    role: 'Machine Learning & GenAI Lead',
    description: 'Flagship GitHub profile README template for Deep Learning researchers and LLM engineers. Features HuggingFace and CUDA badges.',
    keywords: ['ai engineer github readme', 'machine learning profile template', 'llm engineer portfolio'],
    theme: 'cyberpunk2077',
    preset: 'titan',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'HuggingFace', 'Docker', 'CUDA'],
    highlights: ['Model benchmark leaderboards', 'HuggingFace model download badges', 'Autonomous agent swarm flowcharts'],
  },
  'cs-student': {
    slug: 'cs-student',
    title: 'CS Student & Internship Ready GitHub Profile README Template',
    role: 'CS Undergrad / Junior Developer',
    description: 'Recruiter-approved GitHub profile README template for CS students and aspiring FAANG interns with project highlights.',
    keywords: ['student github profile readme', 'internship ready github readme', 'junior developer readme'],
    theme: 'tokyonight',
    preset: 'bento',
    skills: ['Java', 'Python', 'JavaScript', 'React', 'C++', 'Git', 'SQL'],
    highlights: ['LeetCode stats card', 'Hackathon winning projects showcase', 'Clean structured coursework bento grid'],
  },
};

export async function generateStaticParams() {
  return Object.keys(PERSONAS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const persona = PERSONAS[slug];
  if (!persona) return { title: 'Template Not Found' };

  return {
    title: `${persona.title} | ReadmeCraft`,
    description: persona.description,
    keywords: persona.keywords,
    openGraph: {
      title: persona.title,
      description: persona.description,
      type: 'website',
      url: `https://readme.bharatdn.com/templates/${persona.slug}`,
    },
  };
}

export default async function PersonaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const persona = PERSONAS[slug];

  if (!persona) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-[#1e293b] bg-[#090d16]/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/templates" className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors">
            ← Back to All Templates
          </Link>
          <Link
            href={`/?template=${persona.slug}&theme=${persona.theme}`}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-xs font-bold text-slate-950 hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          >
            Open in Studio <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-xs font-semibold text-emerald-400 mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          {persona.role}
        </div>

        <h1 className="font-['Space_Grotesk'] text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
          {persona.title}
        </h1>

        <p className="mt-4 text-lg text-slate-300 leading-relaxed">
          {persona.description}
        </p>

        {/* Highlights */}
        <div className="mt-8 rounded-2xl border border-[#1e293b] bg-[#0c1220] p-6">
          <h2 className="font-['Space_Grotesk'] text-lg font-bold text-white mb-4">
            Included in this Template:
          </h2>
          <div className="space-y-3">
            {persona.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Preview */}
        <div className="mt-8">
          <h3 className="font-mono text-xs uppercase tracking-wider text-slate-400 mb-3">
            Pre-configured Tech Stack Badges
          </h3>
          <div className="flex flex-wrap gap-2">
            {persona.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-lg border border-[#1e293b] bg-[#0e1526] px-3 py-1 font-mono text-xs text-slate-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 to-[#0c1220] p-8 text-center">
          <h3 className="font-['Space_Grotesk'] text-2xl font-bold text-white">
            Ready to Redesign Your GitHub README?
          </h3>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            1-click launch this template in ReadmeCraft Studio with real-time Taste Score, animated SVG widgets, and 50 aesthetic themes.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/"
              className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-[0_0_16px_rgba(16,185,129,0.3)]"
            >
              Customize in Studio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}