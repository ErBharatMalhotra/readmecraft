'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Copy, Download, Check, Sparkles, Share2, Box, Shield } from 'lucide-react';

interface ExportToolbarProps {
  markdown: string;
  filename?: string;
  activeUsername?: string;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  markdown,
  filename = 'README.md',
  activeUsername = 'ErBharatMalhotra',
}) => {
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      showToast('Markdown copied to clipboard! ✨');

      // Trigger high-taste electric emerald & gold confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.85 },
          colors: ['#10b981', '#34d399', '#059669', '#f59e0b', '#ffffff'],
        });
      } catch (e) {
        // Confetti fallback
      }

      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      showToast('Failed to copy. Please manually select the text.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}! 🚀`);
  };

  const handleCopyGitHolo = async () => {
    const snippet = `[![GitHolo 3D Card](https://githolo.vercel.app/api/og/${activeUsername})](https://githolo.bharatdn.com)`;
    await navigator.clipboard.writeText(snippet);
    showToast('Copied GitHolo 3D Card snippet! 🌌');
  };

  const handleCopyGitChronicle = async () => {
    const snippet = `[![GitChronicle Cadence](https://gitchronicle-wheat.vercel.app/badge/${activeUsername}.svg)](https://gitchronicle.bharatdn.com)`;
    await navigator.clipboard.writeText(snippet);
    showToast('Copied GitChronicle Cadence badge snippet! 📈');
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="animate-in slide-in-from-bottom-5 fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-[#0e1526] px-4 py-3 font-mono text-xs text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.25)] duration-300">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Bottom Action Bar */}
      <aside
        aria-label="Export Actions"
        className="sticky bottom-0 z-40 w-full border-t border-[#1e293b] bg-[#090d16]/95 px-4 py-3 backdrop-blur-md lg:px-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          {/* Quick Ecosystem Embed Badges */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden font-mono text-[11px] text-slate-500 md:inline">
              Quick Embeds:
            </span>
            <button
              onClick={handleCopyGitHolo}
              className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0e1526] px-2.5 py-1 font-mono text-xs text-slate-300 transition-colors hover:border-emerald-500/40 hover:bg-[#131c31] hover:text-emerald-400"
            >
              <Box className="h-3 w-3 text-emerald-400" />
              <span>Copy GitHolo 3D</span>
            </button>
            <button
              onClick={handleCopyGitChronicle}
              className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0e1526] px-2.5 py-1 font-mono text-xs text-slate-300 transition-colors hover:border-emerald-500/40 hover:bg-[#131c31] hover:text-emerald-400"
            >
              <Shield className="h-3 w-3 text-emerald-400" />
              <span>Copy GitChronicle</span>
            </button>
          </div>

          {/* Primary Export Actions */}
          <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
            <button
              onClick={handleDownload}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#1e293b] bg-[#0e1526] px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:border-slate-700 hover:bg-[#131c31] hover:text-white sm:flex-initial"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download README.md</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:bg-emerald-400 sm:flex-initial"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
