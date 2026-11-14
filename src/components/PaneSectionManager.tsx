'use client';

import React, { useState, useMemo } from 'react';
import type { AppMode, ProfilePreset, ProjectPreset, Section } from '@/types/readmecraft';
import {
  Layers,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Sliders,
  ExternalLink,
  Box,
  Code2,
  Sparkles,
  Palette,
  Search,
  GripVertical,
  UserCheck,
} from 'lucide-react';
import { THEMES, ThemePalette } from '@/lib/themes';

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
  skills?: string[];
  onAddSkill?: (skill: string) => void;
  onRemoveSkill?: (skill: string) => void;
  theme?: string;
  setTheme?: (theme: string) => void;
  onReorderSections?: (sections: Section[]) => void;
  isHydrated?: boolean;
}

const CATEGORY_TABS: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'All 50', icon: '🎨' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'anime', label: 'Anime', icon: '⚔️' },
  { id: 'aesthetic', label: 'Aesthetic', icon: '✨' },
  { id: 'dev-classic', label: 'Dev Cult', icon: '💻' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '👾' },
  { id: 'retro', label: 'Retro', icon: '🕹️' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'minimal', label: 'Minimal', icon: '⚡' },
];

const POPULAR_SKILLS = [
  'TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'Python', 'Rust', 'Go',
  'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'TailwindCSS', 'GraphQL', 'AWS',
  'Linux', 'Git', 'MongoDB', 'Prisma', 'Solidity', 'FastAPI', 'Express', 'Vue.js'
];

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
  skills = [],
  onAddSkill,
  onRemoveSkill,
  theme = 'gta6',
  setTheme,
  onReorderSections,
  isHydrated = false,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    onAddCustomSection(
      customTitle.trim(),
      customContent.trim() || `### ${customTitle.trim()}\n\nAdd details here.`
    );
    setCustomTitle('');
    setCustomContent('');
    setShowAddModal(false);
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillInput.trim() || !onAddSkill) return;
    onAddSkill(customSkillInput.trim());
    setCustomSkillInput('');
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  // Theme filtering state
  const [themeSearch, setThemeSearch] = useState('');
  const [themeCategory, setThemeCategory] = useState<string>('all');

  // Filter themes based on search and category
  const filteredThemes = useMemo(() => {
    let themes = THEMES;
    if (themeCategory !== 'all') {
      themes = themes.filter(t => t.category === themeCategory);
    }
    if (themeSearch.trim()) {
      const query = themeSearch.toLowerCase().trim();
      themes = themes.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.id.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }
    return themes;
  }, [themeSearch, themeCategory]);

  return (
    <div className="flex h-full flex-col border-r border-[#1e293b] bg-[#090d16]">
      {/* Pane Title Bar */}
      <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0b101c] px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            1. Layout & Sections
          </span>
        </div>
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
          {sections.filter((s) => s.enabled).length} Active
        </span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {/* Presets Selector */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-slate-400 uppercase">
            <Sliders className="h-3.5 w-3.5 text-emerald-400" />
            Design Preset
          </label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {mode === 'profile' ? (
              <>
                <button
                  onClick={() => setProfilePreset('bento')}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    profilePreset === 'bento'
                      ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'border-[#1e293b] bg-[#0e1526] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">Bento Grid</div>
                  <div className="text-[10px] opacity-70">Editorial cards</div>
                </button>
                <button
                  onClick={() => setProfilePreset('minimalist')}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    profilePreset === 'minimalist'
                      ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'border-[#1e293b] bg-[#0e1526] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">Minimalist</div>
                  <div className="text-[10px] opacity-70">Linear / Vercel</div>
                </button>
                <button
                  onClick={() => setProfilePreset('titan')}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    profilePreset === 'titan'
                      ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'border-[#1e293b] bg-[#0e1526] text-slate-400 hover:text-white'
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
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    projectPreset === 'standard'
                      ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'border-[#1e293b] bg-[#0e1526] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">Standard</div>
                  <div className="text-[10px] opacity-70">Full Project Docs</div>
                </button>
                <button
                  onClick={() => setProjectPreset('api')}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    projectPreset === 'api'
                      ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'border-[#1e293b] bg-[#0e1526] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">API SDK</div>
                  <div className="text-[10px] opacity-70">Client Reference</div>
                </button>
                <button
                  onClick={() => setProjectPreset('cli')}
                  className={`rounded-xl border p-2.5 text-left transition-all ${
                    projectPreset === 'cli'
                      ? 'border-emerald-500 bg-emerald-500/10 font-bold text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'border-[#1e293b] bg-[#0e1526] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">CLI Tool</div>
                  <div className="text-[10px] opacity-70">Terminal Quickstart</div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Personas Switcher (Profile Mode Only) */}
        {mode === 'profile' && (
          <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-[#0c1527] to-[#090e1a] p-3.5 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-['Space_Grotesk'] text-xs font-bold tracking-wider text-white uppercase">
                <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                Quick Personas
              </span>
              <a
                href="/templates"
                className="font-mono text-[10px] text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                Browse All →
              </a>
            </div>
            <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
              Instantly load community persona presets & themes:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: 'Full-Stack', preset: 'bento', theme: 'gta6' },
                { name: 'AI / ML', preset: 'titan', theme: 'cyberpunk2077' },
                { name: 'Rust Eng', preset: 'minimalist', theme: 'elden-ring' },
                { name: 'DevOps', preset: 'bento', theme: 'matrix' },
                { name: 'Web3', preset: 'bento', theme: 'synthwave' },
                { name: 'Student', preset: 'bento', theme: 'tokyonight' },
              ].map((p) => (
                <button
                  key={p.name}
                  onClick={() => {
                    setProfilePreset(p.preset as ProfilePreset);
                    if (setTheme) setTheme(p.theme);
                  }}
                  className="rounded-lg border border-[#1e293b] bg-[#090d16] px-2 py-1.5 text-center font-mono text-[11px] text-slate-300 transition-colors hover:border-emerald-500/50 hover:bg-[#121b2d] hover:text-emerald-300"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Theme Engine Selector (50 Curated Viral Themes) */}
        <div className="rounded-xl border border-[#1e293b] bg-[#0e1526] p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase">
              <Palette className="h-3.5 w-3.5 text-emerald-400" />
              Theme Engine (50 Themes)
            </label>
            <span className="font-mono text-[10px] text-emerald-400" suppressHydrationWarning>
              {THEMES.find((t) => t.id === theme)?.name || theme}
            </span>
          </div>
          <p className="mb-2.5 text-[11px] text-slate-400">
            Select from 50 viral aesthetic themes (applies instantly to all badges & icons):
          </p>

          {/* Search Bar */}
          <div className="relative mb-2.5">
            <label htmlFor="theme-search" className="visually-hidden">Search themes</label>
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <input
              id="theme-search"
              type="text"
              value={themeSearch}
              onChange={(e) => setThemeSearch(e.target.value)}
              placeholder="Search 50 themes (e.g. gta6, matrix, tokyo)..."
              className="w-full rounded-lg border border-[#1e293b] bg-[#090d16] py-1.5 pl-8 pr-3 font-mono text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="mb-2.5 flex gap-1 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_TABS.map((tab) => {
              const active = themeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setThemeCategory(tab.id)}
                  className={`shrink-0 rounded-lg px-2 py-1 font-mono text-[10px] transition-all ${
                    active
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-[#090d16] border border-[#1e293b] text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </div>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto p-0.5" suppressHydrationWarning={!isHydrated}>
            {filteredThemes.length === 0 ? (
              <div className="py-6 text-center font-mono text-xs text-slate-500">
                No themes found matching "{themeSearch}"
              </div>
            ) : (
              filteredThemes.map((t) => {
                const isSelected = isHydrated && theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme && setTheme(t.id)}
                    className={`group flex items-center justify-between rounded-lg border p-2.5 text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 font-bold text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                        : 'border-[#1e293b] bg-[#090d16] text-slate-300 hover:border-slate-700 hover:bg-[#121824]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="h-4 w-4 shrink-0 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: t.emerald }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-mono text-xs font-semibold">{t.name}</span>
                          <span className="rounded bg-slate-800/80 px-1 py-0.2 font-mono text-[9px] text-slate-400 uppercase">
                            {t.category}
                          </span>
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {t.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="shrink-0 font-mono text-[10px] font-bold text-emerald-400">
                        ACTIVE
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Tech Stack / Icon Quick Picker (Only in Profile Mode) */}
        {mode === 'profile' && onAddSkill && onRemoveSkill && (
          <div className="rounded-xl border border-[#1e293b] bg-[#0e1526] p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <label className="flex items-center gap-1.5 font-mono text-xs font-semibold tracking-wider text-slate-300 uppercase">
                <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                Tech Stack Quick Picker
              </label>
              <span className="font-mono text-[10px] text-emerald-400">{skills.length} Selected</span>
            </div>
            <p className="mb-2.5 text-[11px] text-slate-400">
              Click to toggle tech stack badges on your profile:
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {POPULAR_SKILLS.map((skill) => {
                const isSelected = isHydrated && skills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => (isSelected ? onRemoveSkill(skill) : onAddSkill(skill))}
                    className={`rounded-lg px-2.5 py-1 font-mono text-[11px] transition-all ${
                      isSelected
                        ? 'border border-emerald-500/50 bg-emerald-500/20 font-bold text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                        : 'border border-[#1e293b] bg-[#090d16] text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {skill}
                  </button>
                );
              })}
            </div>
            <form onSubmit={handleAddCustomSkill} className="mt-2.5 flex gap-1.5">
              <label htmlFor="custom-skill-input" className="visually-hidden">Add custom tech skill</label>
              <input
                id="custom-skill-input"
                type="text"
                placeholder="Add custom tech..."
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                className="flex-1 rounded-lg border border-[#1e293b] bg-[#090d16] px-2.5 py-1 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
              >
                Add
              </button>
            </form>
          </div>
        )}

        {/* Ecosystem Cross-Pollination Card */}
        <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-[#0c1527] to-[#090e1a] p-3.5 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-['Space_Grotesk'] text-xs font-bold tracking-wider text-white uppercase">
              <Box className="h-3.5 w-3.5 text-emerald-400" />
              BharatDN Ecosystem
            </span>
            <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
              Cross-Promo
            </span>
          </div>

          <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
            Embed 1-click interactive widgets that funnel recruiters and developers across Bharat's
            flagship developer suite:
          </p>

          <div className="space-y-2">
            {/* GitHolo Embed Switch */}
            <div className="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#090d16]/80 p-2 transition-colors hover:border-emerald-500/40">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200">GitHolo 3D Card</span>
                  <a
                    href="https://githolo.bharatdn.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 transition-colors hover:text-emerald-400"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <span className="font-mono text-[10px] text-slate-500">githolo.bharatdn.com</span>
              </div>
              <button
                onClick={onToggleGitHolo}
                className={`flex h-5 w-9 items-center rounded-full p-1 transition-colors ${
                  gitHoloEnabled ? 'justify-end bg-emerald-500' : 'justify-start bg-[#1e293b]'
                }`}
              >
                <div className="h-3 w-3 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {/* GitChronicle Embed Switch */}
            <div className="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#090d16]/80 p-2 transition-colors hover:border-emerald-500/40">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200">GitChronicle Cadence</span>
                  <a
                    href="https://gitchronicle.bharatdn.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 transition-colors hover:text-emerald-400"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  gitchronicle.bharatdn.com
                </span>
              </div>
              <button
                onClick={onToggleGitChronicle}
                className={`flex h-5 w-9 items-center rounded-full p-1 transition-colors ${
                  gitChronicleEnabled ? 'justify-end bg-emerald-500' : 'justify-start bg-[#1e293b]'
                }`}
              >
                <div className="h-3 w-3 rounded-full bg-white shadow-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* Section Blocks Reordering & Toggles */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="font-mono text-xs font-semibold tracking-wider text-slate-400 uppercase">
              README Blocks
            </label>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 font-mono text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
            >
              <Plus className="h-3 w-3" /> Add Section
            </button>
          </div>

          <div className="space-y-1.5">
            {sortedSections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverIndex !== index) setDragOverIndex(index);
                }}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIndex === null || draggedIndex === index) return;
                  const newItems = [...sortedSections];
                  const [removed] = newItems.splice(draggedIndex, 1);
                  newItems.splice(index, 0, removed);
                  if (onReorderSections) {
                    onReorderSections(newItems);
                  }
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`flex items-center justify-between rounded-xl border p-2.5 transition-all ${
                  dragOverIndex === index
                    ? 'border-emerald-400 bg-emerald-500/15 scale-[1.02]'
                    : section.enabled
                    ? 'border-[#1e293b] bg-[#0e1526] text-slate-200'
                    : 'border-slate-900 bg-[#080b12] text-slate-600 opacity-60'
                } ${draggedIndex === index ? 'opacity-40' : ''}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing p-0.5"
                    title="Drag to reorder"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>
                  <label htmlFor={`section-toggle-${section.id}`} className="visually-hidden">
                    Toggle section: {section.title}
                  </label>
                  <input
                    id={`section-toggle-${section.id}`}
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => onToggleSection(section.id)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span className="truncate text-xs font-medium">{section.title}</span>
                  {section.isCustom && (
                    <span className="py-0.2 rounded border border-amber-500/30 bg-amber-500/10 px-1 text-[9px] text-amber-400 uppercase">
                      Custom
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    disabled={index === 0}
                    onClick={() => onMoveSection(section.id, 'up')}
                    className="rounded p-1 text-slate-400 hover:bg-[#131c31] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    disabled={index === sortedSections.length - 1}
                    onClick={() => onMoveSection(section.id, 'down')}
                    className="rounded p-1 text-slate-400 hover:bg-[#131c31] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Move Down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {section.isCustom && (
                    <button
                      onClick={() => onRemoveSection(section.id)}
                      className="rounded p-1 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400"
                      title="Delete Section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0e1526] p-5 shadow-2xl">
            <h3 className="mb-3 font-['Space_Grotesk'] text-base font-bold text-white">
              Add Custom README Block
            </h3>
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Section Title</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Sponsors, Roadmap, Benchmark Results"
                  className="w-full rounded-xl border border-[#1e293b] bg-[#090d16] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Markdown Content</label>
                <textarea
                  rows={4}
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="### Roadmap&#10;- [x] MVP Launch&#10;- [ ] Distributed caching"
                  className="w-full rounded-xl border border-[#1e293b] bg-[#090d16] px-3 py-2 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-[#1e293b] px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
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
