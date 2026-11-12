'use client';

import React from 'react';
import { AppMode } from '@/types/readmecraft';
import { Sparkles, Terminal, Code2, Download, Upload, RotateCcw, ExternalLink, Globe } from 'lucide-react';

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
    <header className="sticky top-0 z-50 w-full border-b border-[#1e293b] bg-[#090d16]/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Subdomain */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-950/40 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white font-['Space_Grotesk']">
                ReadmeCraft
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                v2.0
              </span>
            </div>
            <a
              href="https://readme.bharatdn.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 font-mono"
            >
              readme.bharatdn.com <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          </div>
        </div>

        {/* Dual Mode Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[#0e1526] border border-[#1e293b] shadow-inner">
          <button
            onClick={() => setMode('profile')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'profile'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Developer Profile
          </button>
          <button
            onClick={() => setMode('project')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'project'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Project / Repository
          </button>
        </div>

        {/* Ecosystem Links & Utilities */}
        <div className="flex items-center gap-2">
          {/* BharatDN Ecosystem Quick Links */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0e1526]/80 border border-[#1e293b] text-xs text-slate-400">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">Ecosystem:</span>
            <a
              href="https://githolo.bharatdn.com"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300 font-medium transition-colors"
            >
              GitHolo (3D)
            </a>
            <span className="text-slate-700">•</span>
            <a
              href="https://gitchronicle.bharatdn.com"
              target="_blank"
              rel="noreferrer"
              className="px-2 py-0.5 rounded hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300 font-medium transition-colors"
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
            className="p-2 rounded-lg bg-[#0e1526] hover:bg-[#131c31] border border-[#1e293b] text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={onExportJson}
            title="Export State JSON"
            className="p-2 rounded-lg bg-[#0e1526] hover:bg-[#131c31] border border-[#1e293b] text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={onReset}
            title="Reset Studio"
            className="p-2 rounded-lg bg-[#0e1526] hover:bg-rose-950/30 border border-[#1e293b] hover:border-rose-800/40 text-slate-400 hover:text-rose-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
