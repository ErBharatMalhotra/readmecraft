'use client';

import React, { useState } from 'react';
import { Section } from '@/types/readmecraft';
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
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4));
    }, 10);
  };

  const linesCount = markdown.split('\n').length;
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charCount = markdown.length;

  return (
    <div className="flex flex-col h-full bg-[#080d1a] border-r border-[#1e293b]">
      {/* Pane Title Bar & Mode Toggle */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e293b] bg-[#0b101c]">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            2. Markdown Studio
          </span>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0e1526] border border-[#1e293b]">
          <button
            onClick={() => setEditorMode('full')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
              editorMode === 'full'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Full Doc
          </button>
          <button
            onClick={() => setEditorMode('section')}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
              editorMode === 'section'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            By Section
          </button>
        </div>
      </div>

      {/* Quick Formatting Toolbar */}
      <div className="flex items-center flex-wrap gap-1 px-3 py-2 border-b border-[#1e293b] bg-[#090d16]">
        <button
          onClick={() => insertSnippet('# ', '')}
          title="Heading 1"
          className="p-1.5 rounded hover:bg-[#131c31] text-slate-400 hover:text-white transition-colors"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('## ', '')}
          title="Heading 2"
          className="p-1.5 rounded hover:bg-[#131c31] text-slate-400 hover:text-white transition-colors"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('**', '**')}
          title="Bold"
          className="p-1.5 rounded hover:bg-[#131c31] text-slate-400 hover:text-white transition-colors"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('*', '*')}
          title="Italic"
          className="p-1.5 rounded hover:bg-[#131c31] text-slate-400 hover:text-white transition-colors"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('```typescript\n', '\n```')}
          title="Code Block"
          className="p-1.5 rounded hover:bg-[#131c31] text-slate-400 hover:text-white transition-colors"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => insertSnippet('- ', '')}
          title="List Item"
          className="p-1.5 rounded hover:bg-[#131c31] text-slate-400 hover:text-white transition-colors"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() =>
            insertSnippet(
              '| Column 1 | Column 2 |\n| :--- | :--- |\n| Value 1 | Value 2 |\n'
            )
          }
          title="Table Template"
          className="p-1.5 rounded hover:bg-[#131c31] text-slate-400 hover:text-white transition-colors"
        >
          <Table className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-[#1e293b] mx-1" />

        {/* Quick Insert Ecosystem Snippets */}
        <button
          onClick={() =>
            insertSnippet(
              `[![GitHolo 3D Card](https://githolo.vercel.app/api/og/${activeUsername})](https://githolo.bharatdn.com)\n`
            )
          }
          className="px-2 py-1 rounded bg-[#0e1526] hover:bg-[#131c31] border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
          title="Insert GitHolo 3D Card snippet"
        >
          <Box className="w-3 h-3" />
          <span>+ GitHolo</span>
        </button>

        <button
          onClick={() =>
            insertSnippet(
              `[![GitChronicle Cadence](https://gitchronicle-wheat.vercel.app/badge/${activeUsername}.svg)](https://gitchronicle.bharatdn.com)\n`
            )
          }
          className="px-2 py-1 rounded bg-[#0e1526] hover:bg-[#131c31] border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-[10px] font-mono flex items-center gap-1 transition-colors"
          title="Insert GitChronicle Cadence badge snippet"
        >
          <Shield className="w-3 h-3" />
          <span>+ GitChronicle</span>
        </button>
      </div>

      {/* Section Selector Tab (If in Section Mode) */}
      {editorMode === 'section' && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1e293b] overflow-x-auto bg-[#0a0f1d]">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-colors ${
                activeSectionId === sec.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec.title}
            </button>
          ))}
        </div>
      )}

      {/* Monospace Raw Markdown Editor Textarea */}
      <div className="flex-1 relative flex">
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
          className="w-full h-full p-4 bg-transparent text-slate-100 font-mono text-xs md:text-sm leading-relaxed resize-none focus:outline-none selection:bg-emerald-500/30"
          placeholder="# Start typing your GitHub README markdown here..."
        />
      </div>

      {/* Editor Footer Telemetry Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[#1e293b] bg-[#0b101c] text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>{linesCount} lines</span>
          <span>•</span>
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} chars</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Synced</span>
        </div>
      </div>
    </div>
  );
};
