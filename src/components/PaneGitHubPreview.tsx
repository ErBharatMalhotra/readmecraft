'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { Eye, Code, Monitor, Tablet, Smartphone, BookOpen, ExternalLink } from 'lucide-react';

interface PaneGitHubPreviewProps {
  markdown: string;
  repoOrUserTitle?: string;
}

export const PaneGitHubPreview: React.FC<PaneGitHubPreviewProps> = ({
  markdown,
  repoOrUserTitle = 'README.md',
}) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [deviceWidth, setDeviceWidth] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const getContainerWidth = () => {
    switch (deviceWidth) {
      case 'mobile':
        return 'max-w-md';
      case 'tablet':
        return 'max-w-2xl';
      default:
        return 'max-w-none';
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#090d16]">
      {/* Pane Title Bar & Controls */}
      <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0b101c] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            3. GitHub Live Preview
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Responsive viewport toggle */}
          <div className="hidden items-center gap-1 rounded-lg border border-[#1e293b] bg-[#0e1526] p-0.5 sm:flex">
            <button
              onClick={() => setDeviceWidth('desktop')}
              title="Desktop View"
              className={`rounded p-1 ${
                deviceWidth === 'desktop'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="h-3 w-3" />
            </button>
            <button
              onClick={() => setDeviceWidth('tablet')}
              title="Tablet View"
              className={`rounded p-1 ${
                deviceWidth === 'tablet'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="h-3 w-3" />
            </button>
            <button
              onClick={() => setDeviceWidth('mobile')}
              title="Mobile View"
              className={`rounded p-1 ${
                deviceWidth === 'mobile'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="h-3 w-3" />
            </button>
          </div>

          {/* Rendered vs Raw Markdown Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[#1e293b] bg-[#0e1526] p-0.5">
            <button
              onClick={() => setViewMode('rendered')}
              className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
                viewMode === 'rendered'
                  ? 'bg-emerald-500 font-bold text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rendered
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`rounded px-2.5 py-1 font-mono text-[11px] transition-colors ${
                viewMode === 'raw'
                  ? 'bg-emerald-500 font-bold text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw
            </button>
          </div>
        </div>
      </div>

      {/* GitHub Container Simulation */}
      <div className="flex flex-1 justify-center overflow-y-auto bg-[#070b14] p-4 sm:p-6">
        <div className={`w-full ${getContainerWidth()} transition-all duration-300`}>
          {/* GitHub README Box Header */}
          <div className="flex items-center justify-between rounded-t-xl border border-[#1e293b] bg-[#0d1322] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-slate-400" />
              <span className="font-mono text-xs font-semibold text-slate-200">
                {repoOrUserTitle} / README.md
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
              <span>{Math.round((new Blob([markdown]).size / 1024) * 10) / 10} KB</span>
            </div>
          </div>

          {/* GitHub README Body */}
          <div className="min-h-[500px] rounded-b-xl border-x border-b border-[#1e293b] bg-[#090d16] p-6 shadow-2xl sm:p-8">
            {viewMode === 'rendered' ? (
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeHighlight]}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            ) : (
              <pre className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-emerald-300 select-all">
                {markdown}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
