'use client';

import React from 'react';
import type { AppMode } from '@/types/readmecraft';
import {
  Sparkles,
  Terminal,
  Code2,
  Download,
  Upload,
  RotateCcw,
  ExternalLink,
  Globe,
} from 'lucide-react';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onReset: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  onReset,
  onExportJson,
  onImportJson,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1e293b] bg-[#090d16]/90 px-4 py-3 backdrop-blur-md lg:px-8">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        {/* Brand & Subdomain */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-950/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Space_Grotesk'] text-lg font-bold tracking-tight text-white">
                ReadmeCraft
              </span>
              <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">
                v2.0
              </span>
            </div>
            <a
              href="https://readme.bharatdn.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 font-mono text-xs text-slate-400 transition-colors hover:text-emerald-400"
            >
              readme.bharatdn.com <ExternalLink className="h-2.5 w-2.5 opacity-60" />
            </a>
          </div>
        </div>

        {/* Dual Mode Switcher */}
        <div className="flex items-center rounded-xl border border-[#1e293b] bg-[#0e1526] p-1 shadow-inner">
          <button
            onClick={() => setMode('profile')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
              mode === 'profile'
                ? 'bg-emerald-500 font-bold text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Developer Profile
          </button>
          <button
            onClick={() => setMode('project')}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
              mode === 'project'
                ? 'bg-emerald-500 font-bold text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Project / Repository
          </button>
        </div>

        {/* Ecosystem Links & Utilities */}
        <div className="flex items-center gap-2">
          {/* BharatDN Ecosystem Quick Links */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0e1526]/80 px-3 py-1 text-xs text-slate-400 xl:flex">
            <span className="font-mono text-[11px] tracking-wider text-slate-500 uppercase">
              Ecosystem:
            </span>
            <a
              href="https://githolo.bharatdn.com"
              target="_blank"
              rel="noreferrer"
              className="rounded px-2 py-0.5 font-medium text-slate-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
            >
              GitHolo (3D)
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://gitchronicle.bharatdn.com"
              target="_blank"
              rel="noreferrer"
              className="rounded px-2 py-0.5 font-medium text-slate-300 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400"
            >
              GitChronicle (Cadence)
            </a>
          </div>

          {/* Import / Export JSON buttons */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={onImportJson}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Import State JSON"
            className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0e1526] p-2 text-xs text-slate-300 transition-colors hover:bg-[#131c31] hover:text-white"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={onExportJson}
            title="Export State JSON"
            className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0e1526] p-2 text-xs text-slate-300 transition-colors hover:bg-[#131c31] hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={onReset}
            title="Reset Studio"
            className="rounded-lg border border-[#1e293b] bg-[#0e1526] p-2 text-slate-400 transition-colors hover:border-rose-800/40 hover:bg-rose-950/30 hover:text-rose-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
