'use client';

import React, { useState } from 'react';
import { AppMode, ProfilePreset, ProjectPreset, Section } from '@/types/readmecraft';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Box,
  Activity,
  Check,
} from 'lucide-react';

interface PaneSectionManagerProps {
  mode: AppMode;
  profilePreset: ProfilePreset;
  setProfilePreset: (preset: ProfilePreset) => void;
  projectPreset: ProjectPreset;
  setProjectPreset: (preset: ProjectPreset) => void;
  sections: Section[];
  onToggleSection: (id: string) => void;
  onMoveSection: (id: string, direction: 'up' | 'down') => void;
  onAddCustomSection: (title: string, content: string) => void;
  onRemoveSection: (id: string) => void;
  gitHoloEnabled: boolean;
  onToggleGitHolo: () => void;
  gitChronicleEnabled: boolean;
  onToggleGitChronicle: () => void;
  activeUsername?: string;
}

export const PaneSectionManager: React.FC<PaneSectionManagerProps> = ({
  mode,
  profilePreset,
  setProfilePreset,
  projectPreset,
  setProjectPreset,
  sections,
  onToggleSection,
  onMoveSection,
  onAddCustomSection,
  onRemoveSection,
  gitHoloEnabled,
  onToggleGitHolo,
  gitChronicleEnabled,
  onToggleGitChronicle,
  activeUsername = 'ErBharatMalhotra',
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    onAddCustomSection(customTitle.trim(), customContent.trim() || `### ${customTitle.trim()}\n\nAdd details here.`);
    setCustomTitle('');
    setCustomContent('');
    setShowAddModal(false);
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col h-full bg-[#090d16] border-r border-[#1e293b]">
      {/* Pane Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b] bg-[#0b101c]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            1. Layout & Sections
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {sections.filter((s) => s.enabled).length} Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Presets Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            Design Preset
          </label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {mode === 'profile' ? (
              <>
                <button
                  onClick={() => setProfilePreset('bento')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    profilePreset === 'bento'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-[#0e1526] border-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">Bento Grid</div>
                  <div className="text-[10px] opacity-70">Editorial cards</div>
                </button>
                <button
                  onClick={() => setProfilePreset('minimalist')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    profilePreset === 'minimalist'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-[#0e1526] border-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">Minimalist</div>
                  <div className="text-[10px] opacity-70">Linear / Vercel</div>
                </button>
                <button
                  onClick={() => setProfilePreset('titan')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    profilePreset === 'titan'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-[#0e1526] border-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">Titan</div>
                  <div className="text-[10px] opacity-70">High-velocity OSS</div>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setProjectPreset('standard')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    projectPreset === 'standard'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-[#0e1526] border-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">Standard</div>
                  <div className="text-[10px] opacity-70">Full Project Docs</div>
                </button>
                <button
                  onClick={() => setProjectPreset('api')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    projectPreset === 'api'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-[#0e1526] border-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">API SDK</div>
                  <div className="text-[10px] opacity-70">Client Reference</div>
                </button>
                <button
                  onClick={() => setProjectPreset('cli')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    projectPreset === 'cli'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'bg-[#0e1526] border-[#1e293b] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">CLI Tool</div>
                  <div className="text-[10px] opacity-70">Terminal Quickstart</div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Ecosystem Cross-Pollination Card */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#0c1527] to-[#090e1a] border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-['Space_Grotesk']">
              <Box className="w-3.5 h-3.5 text-emerald-400" />
              BharatDN Ecosystem
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Cross-Promo
            </span>
          </div>

          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Embed 1-click interactive widgets that funnel recruiters and developers across Bharat's flagship developer suite:
          </p>

          <div className="space-y-2">
            {/* GitHolo Embed Switch */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#090d16]/80 border border-[#1e293b] hover:border-emerald-500/40 transition-colors">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200">GitHolo 3D Card</span>
                  <a
                    href="https://githolo.bharatdn.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">githolo.bharatdn.com</span>
              </div>
              <button
                onClick={onToggleGitHolo}
                className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                  gitHoloEnabled ? 'bg-emerald-500 justify-end' : 'bg-[#1e293b] justify-start'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {/* GitChronicle Embed Switch */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#090d16]/80 border border-[#1e293b] hover:border-emerald-500/40 transition-colors">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200">GitChronicle Cadence</span>
                  <a
                    href="https://gitchronicle.bharatdn.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">gitchronicle.bharatdn.com</span>
              </div>
              <button
                onClick={onToggleGitChronicle}
                className={`w-9 h-5 flex items-center rounded-full p-1 transition-colors ${
                  gitChronicleEnabled ? 'bg-emerald-500 justify-end' : 'bg-[#1e293b] justify-start'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Section Blocks Reordering & Toggles */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              README Blocks
            </label>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono font-medium"
            >
              <Plus className="w-3 h-3" /> Add Section
            </button>
          </div>

          <div className="space-y-1.5">
            {sortedSections.map((section, index) => (
              <div
                key={section.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  section.enabled
                    ? 'bg-[#0e1526] border-[#1e293b] text-slate-200'
                    : 'bg-[#080b12] border-slate-900 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => onToggleSection(section.id)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs font-medium truncate">{section.title}</span>
                  {section.isCustom && (
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Custom
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={index === 0}
                    onClick={() => onMoveSection(section.id, 'up')}
                    className="p-1 hover:bg-[#131c31] text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === sortedSections.length - 1}
                    onClick={() => onMoveSection(section.id, 'down')}
                    className="p-1 hover:bg-[#131c31] text-slate-400 hover:text-white rounded disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {section.isCustom && (
                    <button
                      onClick={() => onRemoveSection(section.id)}
                      className="p-1 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded"
                      title="Delete Section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Custom Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 bg-[#0e1526] border border-[#1e293b] rounded-2xl shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3 font-['Space_Grotesk']">
              Add Custom README Block
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Section Title</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Sponsors, Roadmap, Benchmark Results"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-[#1e293b] text-white text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Markdown Content</label>
                <textarea
                  rows={4}
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="### Roadmap&#10;- [x] MVP Launch&#10;- [ ] Distributed caching"
                  className="w-full px-3 py-2 rounded-xl bg-[#090d16] border border-[#1e293b] text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#1e293b] text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
                >
                  Add Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
