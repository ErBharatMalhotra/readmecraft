'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Palette,
  Sliders,
  Sparkles,
  Rocket,
  Code2,
  Terminal,
  Download,
  Copy,
  Brain,
  X,
  Keyboard,
} from 'lucide-react';
import { THEMES } from '@/lib/themes';
import type { AppMode, ProfilePreset, ProjectPreset } from '@/types/readmecraft';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  setTheme: (theme: string) => void;
  setProfilePreset: (preset: ProfilePreset) => void;
  setProjectPreset: (preset: ProjectPreset) => void;
  onDownload: () => void;
  onCopyMarkdown: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  mode,
  setMode,
  setTheme,
  setProfilePreset,
  setProjectPreset,
  onDownload,
  onCopyMarkdown,
}) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredThemes = THEMES.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.category.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const handleSelectTheme = (themeId: string) => {
    setTheme(themeId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md pt-[15vh] px-4">
      <div className="w-full max-w-xl rounded-2xl border border-emerald-500/30 bg-[#0c1220] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-[#1e293b] px-4 py-3.5 bg-[#090d16]">
          <Search className="h-5 w-5 text-emerald-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, 50 themes, presets, actions... (ESC to close)"
            className="w-full bg-transparent font-mono text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          <div>
            <div className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Navigation & Actions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onCopyMarkdown();
                  onClose();
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-[#131b2e] hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Copy className="h-4 w-4 text-emerald-400" />
                  <span>Copy Raw Markdown to Clipboard</span>
                </div>
                <kbd className="font-mono text-[10px] bg-[#1e293b] px-1.5 py-0.5 rounded text-slate-400">
                  Ctrl+C
                </kbd>
              </button>

              <button
                onClick={() => {
                  onDownload();
                  onClose();
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-[#131b2e] hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>Download README.md</span>
                </div>
                <kbd className="font-mono text-[10px] bg-[#1e293b] px-1.5 py-0.5 rounded text-slate-400">
                  Ctrl+S
                </kbd>
              </button>

              <button
                onClick={() => {
                  router.push('/deploy');
                  onClose();
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-[#131b2e] hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Rocket className="h-4 w-4 text-emerald-400" />
                  <span>1-Click Deploy to GitHub Profile</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">/deploy</span>
              </button>

              <button
                onClick={() => {
                  router.push('/templates');
                  onClose();
                }}
                className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs text-slate-300 hover:bg-[#131b2e] hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  <span>Explore Community Persona Templates</span>
                </div>
                <span className="font-mono text-[10px] text-emerald-400">/templates</span>
              </button>
            </div>
          </div>

          {/* Mode Switch */}
          <div>
            <div className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Studio Mode
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-1">
              <button
                onClick={() => {
                  setMode('profile');
                  onClose();
                }}
                className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold transition-all ${
                  mode === 'profile'
                    ? 'border border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border border-[#1e293b] bg-[#090d16] text-slate-400 hover:text-white'
                }`}
              >
                <Code2 className="h-4 w-4 text-emerald-400" />
                <span>Developer Profile Mode</span>
              </button>
              <button
                onClick={() => {
                  setMode('project');
                  onClose();
                }}
                className={`flex items-center gap-2 rounded-xl p-2.5 text-xs font-semibold transition-all ${
                  mode === 'project'
                    ? 'border border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border border-[#1e293b] bg-[#090d16] text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span>Repository Project Mode</span>
              </button>
            </div>
          </div>

          {/* 50 Curated Themes Quick Select */}
          <div>
            <div className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
              50 Viral Themes ({filteredThemes.length} matches)
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-1">
              {filteredThemes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  className="flex items-center justify-between rounded-xl border border-[#1e293b] bg-[#090d16] p-2 text-left text-xs text-slate-300 hover:border-emerald-500/50 hover:bg-[#131b2e] hover:text-white transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: t.emerald }}
                    />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500 uppercase shrink-0">
                    {t.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="border-t border-[#1e293b] bg-[#090d16] px-4 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <Keyboard className="h-3.5 w-3.5 text-emerald-400" />
            <span>Navigation: ESC to close • Enter to select</span>
          </div>
          <span>50 Themes Ready</span>
        </div>
      </div>
    </div>
  );
};