'use client';

import React from 'react';
import { Sparkles, ExternalLink, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#1e293b] bg-[#070b14] px-4 lg:px-8 py-10 text-slate-400">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-white font-['Space_Grotesk']">ReadmeCraft</span>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
              readme.bharatdn.com
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            The next-generation intelligent dual-mode GitHub README Studio. Zero-typing profile ingestion, real repo-byte language detection, and modern anti-slop layouts.
          </p>
          <div className="text-xs text-slate-500 font-mono">
            Architected by{' '}
            <a
              href="https://github.com/ErBharatMalhotra"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Bharat Malhotra (@ErBharatMalhotra)
            </a>
          </div>
        </div>

        {/* BharatDN Ecosystem Links */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono mb-3">
            Ecosystem Suite
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://githolo.bharatdn.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <span>🌌 GitHolo</span>
                <span className="text-[10px] text-slate-500 font-mono">(3D Card Studio)</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            </li>
            <li>
              <a
                href="https://gitchronicle.bharatdn.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <span>📈 GitChronicle</span>
                <span className="text-[10px] text-slate-500 font-mono">(Cadence & Velocity)</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            </li>
            <li>
              <a
                href="https://readme.bharatdn.com"
                className="text-emerald-400 font-medium flex items-center gap-1.5"
              >
                <span>🛠️ ReadmeCraft</span>
                <span className="text-[10px] text-emerald-500/70 font-mono">(Active)</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Resources & Open Source */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono mb-3">
            Open Source
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <a
                href="https://github.com/ErBharatMalhotra/readmecraft"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub Repository</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            </li>
            <li>
              <a
                href="https://github.com/ErBharatMalhotra/readmecraft/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-400 transition-colors"
              >
                MIT License
              </a>
            </li>
            <li>
              <span className="text-slate-500 text-[11px] font-mono">
                OKLCH Geometry • Zero AI Slop
              </span>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};
