'use client';

import React, { useState } from 'react';
import type { Section } from '@/types/readmecraft';
import {
  Code,
  Heading1,
  Heading2,
  Bold,
  Italic,
  List,
  Table,
  Shield,
  FileCode,
  Box,
  Copy,
  Check,
  Undo2,
} from 'lucide-react';

interface PaneMarkdownEditorProps {
  markdown: string;
  onChangeMarkdown: (val: string) => void;
  sections: Section[];
  onUpdateSectionContent: (id: string, content: string) => void;
  activeUsername?: string;
}

export const PaneMarkdownEditor: React.FC<PaneMarkdownEditorProps> = ({
  markdown,
  onChangeMarkdown,
  sections,
  onUpdateSectionContent,
  activeUsername = 'ErBharatMalhotra',
}) => {
  const [editorMode, setEditorMode] = useState<'full' | 'section'>('full');
  const [activeSectionId, setActiveSectionId] = useState<string>(sections[0]?.id || 'header');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  const insertSnippet = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('readme-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    if (editorMode === 'full') {
      onChangeMarkdown(newContent);
    } else if (activeSection) {
      onUpdateSectionContent(activeSection.id, newContent);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4)
      );
    }, 10);
  };

  const linesCount = markdown.split('\n').length;
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charCount = markdown.length;

  return (
    <div className="flex h-full flex-col border-r border-[#1e293b] bg-[#080d1a]">
      {/* Pane Title Bar & Mode Toggle */}
      <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0b101c] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            2. Markdown Studio
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-[#1e293b] bg-[#0e1526] p-0.5">
          <button
            onClick={() => setEditorMode('full')}
            className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
              editorMode === 'full'
                ? 'bg-emerald-500 font-bold text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Full Doc
          </button>
          <button
            onClick={() => setEditorMode('section')}
            className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
              editorMode === 'section'
                ? 'bg-emerald-500 font-bold text-slate-950'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            By Section
          </button>
        </div>
      </div>

      {/* Quick Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#1e293b] bg-[#090d16] px-3 py-2">
        <button
          onClick={() => insertSnippet('# ', '')}
          title="Heading 1"
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('## ', '')}
          title="Heading 2"
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('**', '**')}
          title="Bold"
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('*', '*')}
          title="Italic"
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('```typescript\n', '\n```')}
          title="Code Block"
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white"
        >
          <Code className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('- ', '')}
          title="List Item"
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() =>
            insertSnippet('| Column 1 | Column 2 |\n| :--- | :--- |\n| Value 1 | Value 2 |\n')
          }
          title="Table Template"
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-[#131c31] hover:text-white"
        >
          <Table className="h-3.5 w-3.5" />
        </button>

        <span className="mx-1 h-4 w-px bg-[#1e293b]" />

        {/* Quick Insert Ecosystem Snippets */}
        <button
          onClick={() =>
            insertSnippet(
              `[![GitHolo 3D Card](https://githolo.bharatdn.com/api/og/${activeUsername})](https://githolo.bharatdn.com)\n`
            )
          }
          className="flex items-center gap-1 rounded border border-emerald-500/30 bg-[#0e1526] px-2 py-1 font-mono text-[10px] text-emerald-400 transition-colors hover:bg-[#131c31] hover:text-emerald-300"
          title="Insert GitHolo 3D Card snippet"
        >
          <Box className="h-3 w-3" />
          <span>+ GitHolo</span>
        </button>

        <button
          onClick={() =>
            insertSnippet(
              `[![GitChronicle Cadence](https://gitchronicle.bharatdn.com/badge/${activeUsername}.svg)](https://gitchronicle.bharatdn.com)\n`
            )
          }
          className="flex items-center gap-1 rounded border border-emerald-500/30 bg-[#0e1526] px-2 py-1 font-mono text-[10px] text-emerald-400 transition-colors hover:bg-[#131c31] hover:text-emerald-300"
          title="Insert GitChronicle Cadence badge snippet"
        >
          <Shield className="h-3 w-3" />
          <span>+ GitChronicle</span>
        </button>
      </div>

      {/* Section Selector Tab (If in Section Mode) */}
      {editorMode === 'section' && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-[#1e293b] bg-[#0a0f1d] px-3 py-2">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`rounded-lg px-2.5 py-1 font-mono text-xs whitespace-nowrap transition-colors ${
                activeSectionId === sec.id
                  ? 'border border-emerald-500/40 bg-emerald-500/20 font-bold text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec.title}
            </button>
          ))}
        </div>
      )}

      {/* Monospace Raw Markdown Editor Textarea */}
      <div className="relative flex flex-1">
        <textarea
          id="readme-editor"
          value={editorMode === 'full' ? markdown : activeSection?.content || ''}
          onChange={(e) => {
            if (editorMode === 'full') {
              onChangeMarkdown(e.target.value);
            } else if (activeSection) {
              onUpdateSectionContent(activeSection.id, e.target.value);
            }
          }}
          spellCheck={false}
          className="h-full w-full resize-none bg-transparent p-4 font-mono text-xs leading-relaxed text-slate-100 selection:bg-emerald-500/30 focus:outline-none md:text-sm"
          placeholder="# Start typing your GitHub README markdown here..."
        />
      </div>

      {/* Editor Footer Telemetry Bar */}
      <div className="flex items-center justify-between border-t border-[#1e293b] bg-[#0b101c] px-4 py-2 font-mono text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>{linesCount} lines</span>
          <span>•</span>
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} chars</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span>Live Synced</span>
        </div>
      </div>
    </div>
  );
};
