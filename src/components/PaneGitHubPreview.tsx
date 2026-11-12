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
    <div className="flex flex-col h-full bg-[#090d16]">
      {/* Pane Title Bar & Controls */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e293b] bg-[#0b101c]">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
            3. GitHub Live Preview
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Responsive viewport toggle */}
          <div className="hidden sm:flex items-center gap-1 p-0.5 rounded-lg bg-[#0e1526] border border-[#1e293b]">
            <button
              onClick={() => setDeviceWidth('desktop')}
              title="Desktop View"
              className={`p-1 rounded ${
                deviceWidth === 'desktop' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDeviceWidth('tablet')}
              title="Tablet View"
              className={`p-1 rounded ${
                deviceWidth === 'tablet' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDeviceWidth('mobile')}
              title="Mobile View"
              className={`p-1 rounded ${
                deviceWidth === 'mobile' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>

          {/* Rendered vs Raw Markdown Toggle */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0e1526] border border-[#1e293b]">
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                viewMode === 'rendered'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rendered
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                viewMode === 'raw'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw
            </button>
          </div>
        </div>
      </div>

      {/* GitHub Container Simulation */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#070b14] flex justify-center">
        <div className={`w-full ${getContainerWidth()} transition-all duration-300`}>
          {/* GitHub README Box Header */}
          <div className="rounded-t-xl border border-[#1e293b] bg-[#0d1322] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200 font-mono">
                {repoOrUserTitle} / README.md
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>{Math.round(new Blob([markdown]).size / 1024 * 10) / 10} KB</span>
            </div>
          </div>

          {/* GitHub README Body */}
          <div className="rounded-b-xl border-x border-b border-[#1e293b] bg-[#090d16] p-6 sm:p-8 shadow-2xl min-h-[500px]">
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
              <pre className="text-xs font-mono text-emerald-300 whitespace-pre-wrap leading-relaxed select-all">
                {markdown}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
