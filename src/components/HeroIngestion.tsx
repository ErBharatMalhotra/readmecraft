'use client';

import React, { useState } from 'react';
import { AppMode } from '@/types/readmecraft';
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
  const sampleRepos = ['ErBharatMalhotra/readmecraft', 'vercel/next.js', 'facebook/react', 'astral-sh/uv'];

  return (
    <section className="relative px-4 lg:px-8 py-6 border-b border-[#1e293b] bg-gradient-to-b from-[#090d16] via-[#0b101c] to-[#090d16]">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Anti-AI Slop Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Zero-Typing Ingestion • Anti-AI-Slop Geometry • OKLCH Obsidian</span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white font-['Space_Grotesk'] mb-3">
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

        <p className="text-slate-400 text-sm max-w-2xl mb-6">
          {mode === 'profile'
            ? 'Enter any GitHub handle to automatically pull real language percentages (from repo bytes), live contributions, pinned repos, and BharatDN ecosystem telemetry.'
            : 'Enter any repository URL or slug to auto-inspect package.json, scripts, license, architecture, and generate copy-paste GitHub documentation.'}
        </p>

        {/* Ingestion Search Box */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl relative mb-3">
          <div className="relative flex items-center bg-[#0e1526] rounded-2xl border border-[#1e293b] focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20 shadow-xl overflow-hidden transition-all">
            <div className="pl-4 text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={
                mode === 'profile'
                  ? 'Enter GitHub username (e.g. ErBharatMalhotra)'
                  : 'Enter repo URL or slug (e.g. facebook/react)'
              }
              className="w-full py-3.5 px-3 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              title="Add personal GitHub Token for rate limits / private repos"
              className={`px-3 py-2 text-xs flex items-center gap-1 border-l border-[#1e293b] transition-colors ${
                showTokenInput || token ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Token</span>
            </button>
            <button
              type="submit"
              disabled={isLoading || !target.trim()}
              className="m-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Craft</span>
                </>
              )}
            </button>
          </div>

          {/* Optional GitHub Token Panel */}
          {showTokenInput && (
            <div className="mt-2 p-3 bg-[#0e1526] border border-[#1e293b] rounded-xl text-left text-xs animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" /> GitHub Personal Access Token (Optional)
                </span>
                <span className="text-[11px] text-slate-500">Increases API rate limits</span>
              </div>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (kept 100% in browser memory)"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[#090d16] border border-[#1e293b] text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}
        </form>

        {/* Quick Demo Pill Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-500">Quick Try:</span>
          {(mode === 'profile' ? sampleProfiles : sampleRepos).map((item) => (
            <button
              key={item}
              onClick={() => {
                setTarget(item);
                onIngest(item, token.trim() || undefined);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#0e1526] hover:bg-[#131c31] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 font-mono transition-all text-[11px]"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
