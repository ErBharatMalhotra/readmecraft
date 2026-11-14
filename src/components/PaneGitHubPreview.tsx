'use client';

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import {
  Eye,
  Code,
  Monitor,
  Tablet,
  Smartphone,
  BookOpen,
  ExternalLink,
  Award,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Sparkles,
} from 'lucide-react';
import type { AppMode, ProfileData, ProjectData, Section } from '@/types/readmecraft';
import { scoreProfileReadme, scoreProjectReadme, ScoreBreakdown } from '@/lib/score';

interface PaneGitHubPreviewProps {
  markdown: string;
  repoOrUserTitle?: string;
  mode?: AppMode;
  profileData?: ProfileData;
  projectData?: ProjectData;
  sections?: Section[];
  theme?: string;
}

export const PaneGitHubPreview: React.FC<PaneGitHubPreviewProps> = ({
  markdown,
  repoOrUserTitle = 'README.md',
  mode = 'profile',
  profileData,
  projectData,
  sections = [],
  theme = 'gta6',
}) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [deviceWidth, setDeviceWidth] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Compute live taste score
  const scoreData: ScoreBreakdown | null = useMemo(() => {
    if (mode === 'profile' && profileData) {
      return scoreProfileReadme(profileData, sections);
    } else if (mode === 'project' && projectData) {
      return scoreProjectReadme(projectData, sections);
    }
    return null;
  }, [mode, profileData, projectData, sections, markdown]);

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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 80) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Redesigned my GitHub README with @ReadmeCraft in ${theme.toUpperCase()} theme! 🚀\n\nTaste Score: ${scoreData?.score || 96}/100 (${scoreData?.grade || 'A+'})\n\nBuild yours with 50+ viral themes & animated SVGs: https://readme.bharatdn.com`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent('https://readme.bharatdn.com');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div className="flex h-full flex-col bg-[#090d16] relative">
      {/* Pane Title Bar & Controls */}
      <div className="flex items-center justify-between border-b border-[#1e293b] bg-[#0b101c] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200 uppercase">
            3. GitHub Live Preview
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Taste Score Button */}
          {scoreData && (
            <button
              onClick={() => setShowScoreModal(true)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold transition-all hover:scale-105 ${getScoreColor(
                scoreData.score
              )}`}
              title="Click to view Quality Score & recommendations"
            >
              <Award className="h-3.5 w-3.5" />
              <span>
                {scoreData.score}/100 ({scoreData.grade})
              </span>
            </button>
          )}

          {/* Viral Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1 rounded-lg border border-[#1e293b] bg-[#0e1526] px-2.5 py-1 font-mono text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
            title="Share your README"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

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

      {/* Quality Taste Score Modal */}
      {showScoreModal && scoreData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[#1e293b] bg-[#0c1220] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-400" />
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                  README Quality & Taste Score
                </h3>
              </div>
              <button
                onClick={() => setShowScoreModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div>
                <div className="font-mono text-xs text-emerald-400 uppercase font-semibold">
                  Overall Score
                </div>
                <div className="font-['Space_Grotesk'] text-3xl font-extrabold text-white">
                  {scoreData.score}
                  <span className="text-lg text-slate-400 font-normal"> / 100</span>
                </div>
              </div>
              <div className="text-right">
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-1 text-2xl font-black text-emerald-300">
                  {scoreData.grade}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-slate-400 font-mono uppercase">
                Dimension Breakdown
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Completeness</span>
                    <span>{scoreData.metrics.completeness} / 25</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${(scoreData.metrics.completeness / 25) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Visual Richness</span>
                    <span>{scoreData.metrics.visualRichness} / 25</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${(scoreData.metrics.visualRichness / 25) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Technical Depth</span>
                    <span>{scoreData.metrics.technicalDepth} / 25</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${(scoreData.metrics.technicalDepth / 25) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Social Proof</span>
                    <span>{scoreData.metrics.socialProof} / 15</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${(scoreData.metrics.socialProof / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {scoreData.suggestions.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-400 font-mono uppercase mb-2">
                  Actionable Recommendations
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {scoreData.suggestions.map((sug, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-[#1e293b] bg-[#080d18] p-2.5 text-xs"
                    >
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                        {sug.title}
                      </div>
                      <div className="text-slate-400 mt-0.5 text-[11px]">{sug.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  setShowScoreModal(false);
                  setShowShareModal(true);
                }}
                className="flex-1 rounded-xl bg-emerald-500 py-2.5 font-bold text-xs text-slate-950 hover:bg-emerald-400 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              >
                Share My Score on 𝕏 / Twitter
              </button>
              <button
                onClick={() => setShowScoreModal(false)}
                className="rounded-xl border border-[#1e293b] px-4 py-2.5 text-xs text-slate-300 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viral Social Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0c1220] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e293b]">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-emerald-400" />
                <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white">
                  Showcase Your README
                </h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-300">
              Share your redesigned GitHub profile with your developer network:
            </p>

            <div className="mt-4 rounded-xl border border-[#1e293b] bg-[#080d18] p-3 font-mono text-xs text-slate-300">
              "Redesigned my GitHub README with @ReadmeCraft in {theme.toUpperCase()} theme! 🚀
              Taste Score: {scoreData?.score || 96}/100 ({scoreData?.grade || 'A+'})
              https://readme.bharatdn.com"
            </div>

            <div className="mt-5 space-y-2">
              <button
                onClick={handleShareTwitter}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-2.5 font-bold text-xs hover:bg-slate-200 transition-colors"
              >
                <span>Share on 𝕏 (Twitter)</span>
              </button>
              <button
                onClick={handleShareLinkedIn}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0a66c2] text-white py-2.5 font-bold text-xs hover:bg-[#084e96] transition-colors"
              >
                <span>Share on LinkedIn</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('https://readme.bharatdn.com');
                  alert('ReadmeCraft link copied to clipboard!');
                }}
                className="w-full rounded-xl border border-[#1e293b] py-2 text-xs text-slate-400 hover:text-white"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
