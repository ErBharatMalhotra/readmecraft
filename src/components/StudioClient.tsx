'use client';

import React, { useState, useEffect, useTransition, Suspense, lazy } from 'react';
import { useSearchParams } from 'next/navigation';
import type {
  AppMode,
  ProfilePreset,
  ProjectPreset,
  ProfileData,
  ProjectData,
  Section,
  ReadmeState,
} from '@/types/readmecraft';
import { SAMPLE_PROFILE, SAMPLE_PROJECT } from '@/lib/github';
import {
  getProfileSections,
  getProjectSections,
  compileSectionsToMarkdown,
} from '@/lib/generators';
import { Header } from '@/components/Header';
import { HeroIngestion } from '@/components/HeroIngestion';
import { PaneSectionManager } from '@/components/PaneSectionManager';
import { PaneMarkdownEditor } from '@/components/PaneMarkdownEditor';
import { ExportToolbar } from '@/components/ExportToolbar';
import { Footer } from '@/components/Footer';
import { Layers, FileCode, Eye } from 'lucide-react';
import { COMMUNITY_TEMPLATES, applyTemplate } from '@/lib/templates';

// Code-split heavy components
const PaneGitHubPreview = lazy(() => import('@/components/PaneGitHubPreview').then(m => ({ default: m.PaneGitHubPreview })));
const CommandPalette = lazy(() => import('@/components/CommandPalette').then(m => ({ default: m.CommandPalette })));

const STORAGE_KEY = 'readmecraft_saved_state_v2';

// Helper to compute initial state from URL params (SSR-safe) or localStorage (client-only)
function getInitialState(urlTemplate: string | null, urlTheme: string | null) {
  // If we have template URL params, use them (works on both server and client)
  if (urlTemplate) {
    const templateData = applyTemplate(urlTemplate);
    if (templateData) {
      const finalTheme = urlTheme || templateData.theme;
      return {
        mode: templateData.mode,
        profilePreset: templateData.profilePreset,
        projectPreset: 'standard' as ProjectPreset, // templates don't specify project preset
        profileData: templateData.profileData,
        projectData: templateData.projectData,
        sections: templateData.sections,
        theme: finalTheme,
        hasLoaded: true,
      };
    }
  }

  // No template params - check localStorage (client-only)
  // During SSR, localStorage is not available, so we return defaults
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ReadmeState = JSON.parse(saved);
        const savedTheme = localStorage.getItem('readmecraft-theme') || 'gta6';
        return {
          mode: parsed.mode || 'profile',
          profilePreset: parsed.profilePreset || 'bento',
          projectPreset: parsed.projectPreset || 'standard',
          profileData: parsed.profileData || SAMPLE_PROFILE,
          projectData: parsed.projectData || SAMPLE_PROJECT,
          sections: parsed.sections && parsed.sections.length > 0
            ? parsed.sections
            : getProfileSections(SAMPLE_PROFILE, 'bento', 'gta6'),
          theme: savedTheme,
          hasLoaded: true,
        };
      }
    } catch (e) {
      console.warn('Failed to restore from localStorage:', e);
    }
  }

  // Defaults
  return {
    mode: 'profile' as AppMode,
    profilePreset: 'bento' as ProfilePreset,
    projectPreset: 'standard' as ProjectPreset,
    profileData: SAMPLE_PROFILE,
    projectData: SAMPLE_PROJECT,
    sections: getProfileSections(SAMPLE_PROFILE, 'bento', 'gta6'),
    theme: 'gta6',
    hasLoaded: true,
  };
}

// Inner component that uses useSearchParams (requires Suspense boundary)
function HomeInner() {
  const searchParams = useSearchParams();
  const urlTemplate = searchParams.get('template');
  const urlTheme = searchParams.get('theme');

  // Compute initial state synchronously (works during SSR)
  const initialState = getInitialState(urlTemplate, urlTheme);

  const [mode, setMode] = useState<AppMode>(initialState.mode);
  const [profilePreset, setProfilePreset] = useState<ProfilePreset>(initialState.profilePreset);
  const [projectPreset, setProjectPreset] = useState<ProjectPreset>(initialState.projectPreset);
  const [profileData, setProfileData] = useState<ProfileData>(initialState.profileData);
  const [projectData, setProjectData] = useState<ProjectData>(initialState.projectData);
  const [theme, setTheme] = useState<string>(initialState.theme);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(initialState.hasLoaded);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>(initialState.sections);
  const [markdown, setMarkdown] = useState<string>(() =>
    compileSectionsToMarkdown(initialState.sections)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'sections' | 'editor' | 'preview'>(
    'preview'
  );

  const activeUsername = mode === 'profile' ? profileData.username : projectData.owner;
  const activeTitle =
    mode === 'profile' ? profileData.name || profileData.username : projectData.repo;

  // Sync theme from localStorage after hydration (client-only)
  useEffect(() => {
    setIsHydrated(true);
    try {
      const savedTheme = localStorage.getItem('readmecraft-theme');
      if (savedTheme) setTheme(savedTheme);
    } catch (e) {}
  }, []);

  // Effect 2: Watch for template URL param changes (client-side navigation)
  // Only applies if we have a template param
  useEffect(() => {
    if (!urlTemplate) return;

    const templateData = applyTemplate(urlTemplate);
    if (templateData) {
      setMode(templateData.mode);
      setProfilePreset(templateData.profilePreset);
      setProfileData(templateData.profileData);
      setProjectData(templateData.projectData);
      setSections(templateData.sections);
      setMarkdown(compileSectionsToMarkdown(templateData.sections));
      const finalTheme = urlTheme || templateData.theme;
      setTheme(finalTheme);
      try {
        localStorage.setItem('readmecraft-theme', finalTheme);
      } catch (e) {}
    }
    setHasLoaded(true);
  }, [urlTemplate, urlTheme]); // Re-run when template params change

  // Autosave state to localStorage (only after initial load)
  useEffect(() => {
    if (!hasLoaded) return;
    try {
      const stateToSave: ReadmeState = {
        mode,
        profilePreset,
        projectPreset,
        profileData,
        projectData,
        sections,
        theme,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [hasLoaded, mode, profilePreset, projectPreset, profileData, projectData, sections, theme]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K, Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-README.md`;
        link.click();
        URL.revokeObjectURL(url);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markdown, activeTitle]);

  // Handler: Change Badge Theme
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('readmecraft-theme', newTheme);
    } catch (e) {}
    if (mode === 'profile') {
      const newSecs = getProfileSections(profileData, profilePreset, newTheme);
      setSections(newSecs);
      setMarkdown(compileSectionsToMarkdown(newSecs));
    } else {
      const newSecs = getProjectSections(projectData, projectPreset, newTheme);
      setSections(newSecs);
      setMarkdown(compileSectionsToMarkdown(newSecs));
    }
  };

  // Handler: Switch App Mode
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === 'profile') {
      const newSecs = getProfileSections(profileData, profilePreset, theme);
      setSections(newSecs);
      setMarkdown(compileSectionsToMarkdown(newSecs));
    } else {
      const newSecs = getProjectSections(projectData, projectPreset, theme);
      setSections(newSecs);
      setMarkdown(compileSectionsToMarkdown(newSecs));
    }
  };

  // Handler: Change Profile Preset
  const handleProfilePresetChange = (preset: ProfilePreset) => {
    setProfilePreset(preset);
    const newSecs = getProfileSections(profileData, preset, theme);
    setSections(newSecs);
    setMarkdown(compileSectionsToMarkdown(newSecs));
  };

  // Handler: Change Project Preset
  const handleProjectPresetChange = (preset: ProjectPreset) => {
    setProjectPreset(preset);
    const newSecs = getProjectSections(projectData, preset, theme);
    setSections(newSecs);
    setMarkdown(compileSectionsToMarkdown(newSecs));
  };

  // Handler: Ingest data from GitHub API
  const handleIngest = async (target: string, token?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, target, token }),
      });

      if (!res.ok) {
        throw new Error('API ingestion failed');
      }

      const resData = await res.json();
      if (resData.success && resData.data) {
        if (mode === 'profile') {
          setProfileData(resData.data);
          const newSecs = getProfileSections(resData.data, profilePreset, theme);
          setSections(newSecs);
          setMarkdown(compileSectionsToMarkdown(newSecs));
        } else {
          setProjectData(resData.data);
          const newSecs = getProjectSections(resData.data, projectPreset, theme);
          setSections(newSecs);
          setMarkdown(compileSectionsToMarkdown(newSecs));
        }
      }
    } catch (error) {
      console.warn('API route failed, falling back to client fetch:', error);
      // Fallback directly on client
      if (mode === 'profile') {
        const { fetchGitHubProfile } = await import('@/lib/github');
        const data = await fetchGitHubProfile(target, token);
        setProfileData(data);
        const newSecs = getProfileSections(data, profilePreset, theme);
        setSections(newSecs);
        setMarkdown(compileSectionsToMarkdown(newSecs));
      } else {
        const { fetchGitHubProject } = await import('@/lib/github');
        const data = await fetchGitHubProject(target, token);
        setProjectData(data);
        const newSecs = getProjectSections(data, projectPreset, theme);
        setSections(newSecs);
        setMarkdown(compileSectionsToMarkdown(newSecs));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Toggle Section
  const handleToggleSection = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setSections(updated);
    setMarkdown(compileSectionsToMarkdown(updated));
  };

  // Handler: Move Section Up/Down
  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === id);
    if (index < 0) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const temp = sorted[index].order;
    sorted[index].order = sorted[targetIndex].order;
    sorted[targetIndex].order = temp;

    setSections(sorted);
    setMarkdown(compileSectionsToMarkdown(sorted));
  };

  // Handler: Reorder Sections (Drag & Drop)
  const handleReorderSections = (reorderedSections: Section[]) => {
    const updated = reorderedSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(updated);
    setMarkdown(compileSectionsToMarkdown(updated));
  };

  // Handler: Add Custom Section
  const handleAddCustomSection = (title: string, content: string) => {
    const newSection: Section = {
      id: `custom_${Date.now()}`,
      title,
      content,
      enabled: true,
      order: sections.length + 1,
      isCustom: true,
    };
    const updated = [...sections, newSection];
    setSections(updated);
    setMarkdown(compileSectionsToMarkdown(updated));
  };

  // Handler: Remove Custom Section
  const handleRemoveSection = (id: string) => {
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    setMarkdown(compileSectionsToMarkdown(updated));
  };

  // Handler: Update specific section content from editor
  const handleUpdateSectionContent = (id: string, content: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, content } : s));
    setSections(updated);
    setMarkdown(compileSectionsToMarkdown(updated));
  };

  // Handler: Raw full document markdown change
  const handleChangeMarkdown = (val: string) => {
    setMarkdown(val);
  };

  // Ecosystem Toggles
  const handleToggleGitHolo = () => {
    if (mode === 'profile') {
      const updatedProfile = { ...profileData, gitHoloEnabled: !profileData.gitHoloEnabled };
      setProfileData(updatedProfile);
      const newSecs = getProfileSections(updatedProfile, profilePreset, theme);
      setSections(newSecs);
      setMarkdown(compileSectionsToMarkdown(newSecs));
    } else {
      const updatedProject = { ...projectData, gitHoloEnabled: !projectData.gitHoloEnabled };
      setProjectData(updatedProject);
      const newSecs = getProjectSections(updatedProject, projectPreset);
      setSections(newSecs);
      setMarkdown(compileSectionsToMarkdown(newSecs));
    }
  };

  const handleToggleGitChronicle = () => {
    if (mode === 'profile') {
      const updatedProfile = {
        ...profileData,
        gitChronicleEnabled: !profileData.gitChronicleEnabled,
      };
      setProfileData(updatedProfile);
      const newSecs = getProfileSections(updatedProfile, profilePreset, theme);
      setSections(newSecs);
      setMarkdown(compileSectionsToMarkdown(newSecs));
    } else {
      const updatedProject = {
        ...projectData,
        gitChronicleEnabled: !projectData.gitChronicleEnabled,
      };
      setProjectData(updatedProject);
      const newSecs = getProjectSections(updatedProject, projectPreset);
      setSections(newSecs);
      setMarkdown(compileSectionsToMarkdown(newSecs));
    }
  };

  // Skill Handlers for Tech Stack Quick Picker
  const handleAddSkill = (skill: string) => {
    if (profileData.skills.includes(skill)) return;
    const updatedSkills = [...profileData.skills, skill];
    const updatedProfile = { ...profileData, skills: updatedSkills };
    setProfileData(updatedProfile);
    const newSecs = getProfileSections(updatedProfile, profilePreset, theme);
    setSections(newSecs);
    setMarkdown(compileSectionsToMarkdown(newSecs));
  };

  const handleRemoveSkill = (skill: string) => {
    const updatedSkills = profileData.skills.filter((s) => s !== skill);
    const updatedProfile = { ...profileData, skills: updatedSkills };
    setProfileData(updatedProfile);
    const newSecs = getProfileSections(updatedProfile, profilePreset, theme);
    setSections(newSecs);
    setMarkdown(compileSectionsToMarkdown(newSecs));
  };

  // Reset Studio
  const handleReset = () => {
    if (window.confirm('Reset ReadmeCraft to default state? Any unsaved edits will be cleared.')) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('readmecraft-theme');
      setMode('profile');
      setProfilePreset('bento');
      setProjectPreset('standard');
      setProfileData(SAMPLE_PROFILE);
      setProjectData(SAMPLE_PROJECT);
      setTheme('gta6');
      const newSecs = getProfileSections(SAMPLE_PROFILE, 'bento', 'gta6');
      setSections(newSecs);
      setMarkdown(compileSectionsToMarkdown(newSecs));
    }
  };

  // Export JSON state
  const handleExportJson = () => {
    const state: ReadmeState = {
      mode,
      profilePreset,
      projectPreset,
      profileData,
      projectData,
      sections,
      theme,
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readmecraft-${mode}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON state
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed: ReadmeState = JSON.parse(event.target?.result as string);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.profilePreset) setProfilePreset(parsed.profilePreset);
        if (parsed.projectPreset) setProjectPreset(parsed.projectPreset);
        if (parsed.profileData) setProfileData(parsed.profileData);
        if (parsed.projectData) setProjectData(parsed.projectData);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.sections) {
          setSections(parsed.sections);
          setMarkdown(compileSectionsToMarkdown(parsed.sections));
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#090d16] font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header Navbar */}
      <Header
        mode={mode}
        setMode={handleModeChange}
        onReset={handleReset}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Hero Ingestion Banner */}
      <HeroIngestion
        mode={mode}
        onIngest={handleIngest}
        isLoading={isLoading}
        activeUsername={profileData.username}
        activeRepo={`${projectData.owner}/${projectData.repo}`}
      />

      {/* Mobile / Tablet View Switcher Tab Bar */}
      <div className="flex items-center justify-around border-b border-[#1e293b] bg-[#0b101c] p-2 lg:hidden">
        <button
          onClick={() => setActiveMobileTab('sections')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
            activeMobileTab === 'sections'
              ? 'bg-emerald-500 font-bold text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>1. Sections</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('editor')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
            activeMobileTab === 'editor'
              ? 'bg-emerald-500 font-bold text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="h-3.5 w-3.5" />
          <span>2. Editor</span>
        </button>
        <button
          onClick={() => setActiveMobileTab('preview')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
            activeMobileTab === 'preview'
              ? 'bg-emerald-500 font-bold text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>3. Preview</span>
        </button>
      </div>

      {/* The 3-Pane Studio Layout */}
      <main id="main-content" className="grid min-h-[750px] w-full flex-1 grid-cols-1 lg:grid-cols-12">
        {/* Pane 1: Section Manager */}
        <div
          className={`h-full overflow-hidden lg:col-span-3 xl:col-span-3 ${
            activeMobileTab === 'sections' ? 'block' : 'hidden lg:block'
          }`}
        >
          <PaneSectionManager
            mode={mode}
            profilePreset={profilePreset}
            setProfilePreset={handleProfilePresetChange}
            projectPreset={projectPreset}
            setProjectPreset={handleProjectPresetChange}
            sections={sections}
            onToggleSection={handleToggleSection}
            onMoveSection={handleMoveSection}
            onReorderSections={handleReorderSections}
            onAddCustomSection={handleAddCustomSection}
            onRemoveSection={handleRemoveSection}
            gitHoloEnabled={
              mode === 'profile' ? profileData.gitHoloEnabled : projectData.gitHoloEnabled
            }
            onToggleGitHolo={handleToggleGitHolo}
            gitChronicleEnabled={
              mode === 'profile' ? profileData.gitChronicleEnabled : projectData.gitChronicleEnabled
            }
            onToggleGitChronicle={handleToggleGitChronicle}
            activeUsername={activeUsername}
            skills={profileData.skills}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            isHydrated={isHydrated}
            theme={theme}
            setTheme={handleThemeChange}
          />
        </div>

        {/* Pane 2: Markdown Editor */}
        <div
          className={`h-full overflow-hidden lg:col-span-4 xl:col-span-4 ${
            activeMobileTab === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          <PaneMarkdownEditor
            markdown={markdown}
            onChangeMarkdown={handleChangeMarkdown}
            sections={sections}
            onUpdateSectionContent={handleUpdateSectionContent}
            activeUsername={activeUsername}
          />
        </div>

        {/* Pane 3: GitHub Markdown Preview */}
        <div
          className={`h-full overflow-hidden lg:col-span-5 xl:col-span-5 ${
            activeMobileTab === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          <Suspense fallback={<div className="flex h-full items-center justify-center bg-[#090d16]"><div className="text-center text-slate-500 font-mono text-sm">Loading preview…</div></div>}>
            <PaneGitHubPreview
              markdown={markdown}
              repoOrUserTitle={activeTitle}
              mode={mode}
              profileData={profileData}
              projectData={projectData}
              sections={sections}
              theme={theme}
              onApplyMarkdown={setMarkdown}
            />
          </Suspense>
        </div>
      </main>

      {/* Persistent Export Toolbar */}
      <ExportToolbar
        markdown={markdown}
        filename={`${activeTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-README.md`}
        activeUsername={activeUsername}
      />

      {/* Cross-Promotion Ecosystem Footer */}
      <Footer />

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <Suspense fallback={null}>
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          mode={mode}
          setMode={handleModeChange}
          setTheme={handleThemeChange}
          setProfilePreset={handleProfilePresetChange}
          setProjectPreset={handleProjectPresetChange}
          onDownload={() => {
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${activeTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}-README.md`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          onCopyMarkdown={() => {
            navigator.clipboard.writeText(markdown);
          }}
        />
      </Suspense>
    </div>
  );
}

// Client component wrapper with Suspense for useSearchParams
export function StudioClient() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#090d16] font-sans text-slate-100">
          <Header
            mode="profile"
            setMode={() => {}}
            onReset={() => {}}
            onExportJson={() => {}}
            onImportJson={() => {}}
            onOpenCommandPalette={() => {}}
          />
          <HeroIngestion
            mode="profile"
            onIngest={async () => {}}
            isLoading={false}
            activeUsername="ErBharatMalhotra"
            activeRepo="ErBharatMalhotra/readmecraft"
          />
          <main id="main-content" className="grid min-h-[750px] w-full flex-1 grid-cols-1 lg:grid-cols-12">
            <div className="h-full overflow-hidden lg:col-span-3 xl:col-span-3 border-r border-[#1e293b] bg-[#090d16]">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0b101c] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">1. Layout & Sections</span>
                  </div>
                </div>
                <div className="flex-1 space-y-5 overflow-y-auto p-4">
                  <div className="text-center py-12 text-slate-500 font-mono text-sm">Loading sections…</div>
                </div>
              </div>
            </div>
            <div className="h-full overflow-hidden lg:col-span-4 xl:col-span-4 border-r border-[#1e293b] bg-[#080d1a]">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0b101c] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">2. Markdown Studio</span>
                  </div>
                </div>
                <div className="relative flex flex-1">
                  <label htmlFor="readme-editor" className="visually-hidden">Markdown editor</label>
                  <textarea
                    id="readme-editor"
                    className="h-full w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-100 selection:bg-emerald-500/30 focus:outline-none md:text-sm"
                    placeholder="# Start typing your GitHub README markdown here..."
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="h-full overflow-hidden lg:col-span-5 xl:col-span-5">
              <div className="flex h-full flex-col">
                <div className="flex h-full items-center justify-center bg-[#090d16]">
                  <div className="text-center text-slate-500 font-mono text-sm">Loading preview…</div>
                </div>
              </div>
            </div>
          </main>
          <ExportToolbar
            markdown=""
            filename="README.md"
            activeUsername="ErBharatMalhotra"
          />
          <Footer />
        </div>
      }
    >
      <HomeInner />
    </Suspense>
  );
}