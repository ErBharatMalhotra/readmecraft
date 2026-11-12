'use client';

import React, { useState } from 'react';
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
  Star,
  Menu,
  X,
} from 'lucide-react';
import { AuthButton } from '@/components/AuthButton';
import { useSession } from 'next-auth/react';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  onReset: () => void;
  onExportJson: () => void;
  onImportJson: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const REPO_OWNER = 'ErBharatMalhotra';
const REPO_NAME = 'readmecraft';

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  onReset,
  onExportJson,
  onImportJson,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { data: session, status } = useSession();
  const [starred, setStarred] = useState<boolean>(false);
  const [starring, setStarring] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleStar = async () => {
    if (!session || starring) return;
    setStarring(true);
    try {
      const res = await fetch('/api/star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: REPO_OWNER, repo: REPO_NAME }),
      });
      const data = await res.json();
      if (data.starred) setStarred(true);
      alert(data.message);
    } catch (e) {
      alert('Failed to star. Please try again.');
    } finally {
      setStarring(false);
    }
  };

  // Check starred status on mount (optional - requires extra API call)
  React.useEffect(() => {
    if (session) {
      // Skip pre-check to avoid extra API call; UI will update after star
    }
  }, [session]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1e293b] bg-[#090d16]/90 px-4 py-3 backdrop-blur-md lg:px-8">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 to-emerald-950/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="font-['Space_Grotesk'] text-lg font-bold tracking-tight text-white">
              ReadmeCraft
            </span>
            <span className="ml-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">
              v2.0
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher + Star Button */}
        <div className="flex flex-col items-center gap-3 md:flex-row md:items-center w-full md:w-auto">
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
              <span className="hidden sm:inline">Profile</span>
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
              <span className="hidden sm:inline">Repo</span>
            </button>
          </div>

          {/* Star Button - only when authenticated */}
          {status === 'authenticated' && session && (
            <button
              onClick={handleStar}
              disabled={starring || starred}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                starred
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 cursor-default'
                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500 hover:shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              }`}
              title={starred ? 'Already starred! ⭐' : 'Star ReadmeCraft on GitHub'}
            >
              <Star className={`h-4 w-4 ${starred ? 'fill-current' : ''}`} />
              <span className="hidden sm:inline">
                {starring ? 'Starring...' : starred ? 'Starred ⭐' : 'Star Repo'}
              </span>
            </button>
          )}
        </div>

        {/* Right: Auth + Overflow Menu */}
        <div className="flex items-center gap-2">
          {/* GitHub Auth Button */}
          <AuthButton />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-lg border border-[#1e293b] bg-[#0e1526] p-2 text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white"
            aria-label="More options"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Desktop: Overflow Menu */}
          <div className={`flex items-center gap-1 ${mobileMenuOpen ? 'md:hidden' : 'hidden md:flex'}`}>
            {/* Ecosystem Links */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0e1526] px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white">
                <Globe className="h-3.5 w-3.5" />
                <span>Ecosystem</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-[#1e293b] bg-[#0b101c] py-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <a href="https://githolo.bharatdn.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  GitHolo (3D Cards)
                </a>
                <a href="https://gitchronicle.bharatdn.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-amber-500/10 hover:text-amber-400">
                  <Terminal className="h-4 w-4" />
                  GitChronicle (Cadence)
                </a>
              </div>
            </div>

            {/* Import/Export/Reset */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0e1526] px-3 py-1.5 text-xs text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white">
                <Download className="h-3.5 w-3.5" />
                <span>Tools</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-[#1e293b] bg-[#0b101c] py-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onImportJson}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                >
                  <Upload className="h-4 w-4" />
                  Import JSON
                </button>
                <button
                  onClick={onExportJson}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-emerald-400"
                >
                  <Download className="h-4 w-4" />
                  Export JSON
                </button>
                <hr className="my-2 border-[#1e293b]" />
                <button
                  onClick={onReset}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Studio
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full border-t border-[#1e293b] pt-4 mt-4">
            <div className="space-y-2">
              <div className="rounded-lg border border-[#1e293b] bg-[#0e1526] p-2">
                <p className="font-mono text-xs text-slate-500 uppercase mb-2">Ecosystem</p>
                <a href="https://githolo.bharatdn.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  GitHolo (3D Cards)
                </a>
                <a href="https://gitchronicle.bharatdn.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:text-amber-400">
                  <Terminal className="h-4 w-4" />
                  GitChronicle (Cadence)
                </a>
              </div>
              <div className="rounded-lg border border-[#1e293b] bg-[#0e1526] p-2">
                <p className="font-mono text-xs text-slate-500 uppercase mb-2">Tools</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={onImportJson}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => { fileInputRef.current?.click(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:text-emerald-400"
                >
                  <Upload className="h-4 w-4" />
                  Import JSON
                </button>
                <button
                  onClick={() => { onExportJson(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-slate-300 hover:text-emerald-400"
                >
                  <Download className="h-4 w-4" />
                  Export JSON
                </button>
                <button
                  onClick={() => { onReset(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-rose-400 hover:text-rose-300"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Studio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};