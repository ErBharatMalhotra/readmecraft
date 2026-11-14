'use client';

import React, { useState } from 'react';
import type { AppMode } from '@/types/readmecraft';
import { Search, Sparkles, Loader2, Key, HelpCircle, CheckCircle2 } from 'lucide-react';

interface HeroIngestionProps {
  mode: AppMode;
  onIngest: (target: string, token?: string) => Promise<void>;
  isLoading: boolean;
  activeUsername?: string;
  activeRepo?: string;
}

export const HeroIngestion: React.FC<HeroIngestionProps> = ({
  mode,
  onIngest,
  isLoading,
  activeUsername,
  activeRepo,
}) => {
  const [target, setTarget] = useState('');
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;
    onIngest(target.trim(), token.trim() || undefined);
  };

  const sampleProfiles = ['ErBharatMalhotra', 'shadcn', 'antfu', 'leerob'];
  const sampleRepos = [
    'ErBharatMalhotra/readmecraft',
    'vercel/next.js',
    'facebook/react',
    'astral-sh/uv',
  ];

  return (
    <section className="relative border-b border-[#1e293b] bg-gradient-to-b from-[#090d16] via-[#0b101c] to-[#090d16] px-4 py-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        {/* Design Tag */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Zero-Typing Ingestion • High-Taste Geometry • OKLCH Obsidian</span>
        </div>

        <h1 className="mb-3 font-['Space_Grotesk'] text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl">
          {mode === 'profile' ? (
            <>
              Craft World-Class <span className="text-emerald-400">Developer Profile</span> READMEs
            </>
          ) : (
            <>
              Intelligent <span className="text-emerald-400">Repository & Project</span> Studio
            </>
          )}
        </h1>

        <p className="mb-6 max-w-2xl text-sm text-slate-400">
          {mode === 'profile'
            ? 'Enter any GitHub handle to automatically pull real language percentages (from repo bytes), live contributions, pinned repos, and BharatDN ecosystem telemetry.'
            : 'Enter any repository URL or slug to auto-inspect package.json, scripts, license, architecture, and generate copy-paste GitHub documentation.'}
        </p>

        {/* Ingestion Search Box */}
        <form onSubmit={handleSubmit} className="relative mb-3 w-full max-w-2xl">
          <div className="relative flex items-center overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0e1526] shadow-xl transition-all focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20">
            <label htmlFor="github-target" className="visually-hidden">
              {mode === 'profile' ? 'GitHub username' : 'Repository URL or slug'}
            </label>
            <div className="pl-4 text-slate-500">
              <Search className="h-5 w-5" aria-hidden="true" />
            </div>
            <input
              id="github-target"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={
                mode === 'profile'
                  ? 'Enter GitHub username (e.g. ErBharatMalhotra)'
                  : 'Enter repo URL or slug (e.g. facebook/react)'
              }
              className="w-full bg-transparent px-3 py-3.5 font-mono text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              title="Add personal GitHub Token for rate limits / private repos"
              className={`flex items-center gap-1 border-l border-[#1e293b] px-3 py-2 text-xs transition-colors ${
                showTokenInput || token
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Token</span>
            </button>
            <button
              type="submit"
              disabled={isLoading || !target.trim()}
              className="m-1.5 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold tracking-wider text-slate-950 uppercase shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  <span>Ingesting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Auto-Craft</span>
                </>
              )}
            </button>
          </div>

          {/* Optional GitHub Token Panel */}
          {showTokenInput && (
            <div className="animate-in fade-in mt-2 rounded-xl border border-[#1e293b] bg-[#0e1526] p-3 text-left text-xs duration-200">
              <div className="mb-1 flex items-center justify-between font-medium text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Key className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> GitHub Personal Access Token
                  (Optional)
                </span>
                <span className="text-[11px] text-slate-500">Increases API rate limits</span>
              </div>
              <label htmlFor="github-token" className="visually-hidden">GitHub Personal Access Token</label>
              <input
                id="github-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (kept 100% in browser memory)"
                className="mt-1 w-full rounded-lg border border-[#1e293b] bg-[#090d16] px-3 py-1.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}
        </form>

        {/* Quick Demo Pill Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-500">Quick Try:</span>
          <button
            onClick={() => {
              const demo = mode === 'profile' ? 'ErBharatMalhotra' : 'ErBharatMalhotra/readmecraft';
              setTarget(demo);
              onIngest(demo, token.trim() || undefined);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-mono text-[11px] font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:bg-emerald-500/25 transition-all"
          >
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>⚡ 1-Click Fast Demo: {mode === 'profile' ? '@ErBharatMalhotra' : 'readmecraft'}</span>
          </button>
          {(mode === 'profile' ? sampleProfiles.slice(1) : sampleRepos.slice(1)).map((item) => (
            <button
              key={item}
              onClick={() => {
                setTarget(item);
                onIngest(item, token.trim() || undefined);
              }}
              className="rounded-lg border border-[#1e293b] bg-[#0e1526] px-2.5 py-1 font-mono text-[11px] text-slate-300 transition-all hover:border-emerald-500/40 hover:bg-[#131c31] hover:text-emerald-400"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
