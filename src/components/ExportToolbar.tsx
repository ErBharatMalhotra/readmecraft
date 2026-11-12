'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Copy,
  Download,
  Check,
  Sparkles,
  Share2,
  Box,
  Shield,
} from 'lucide-react';

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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-[#0e1526] border border-emerald-500/40 text-emerald-300 text-xs font-mono shadow-[0_0_25px_rgba(16,185,129,0.25)] animate-in slide-in-from-bottom-5 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Bottom Action Bar */}
      <aside aria-label="Export Actions" className="sticky bottom-0 z-40 w-full border-t border-[#1e293b] bg-[#090d16]/95 backdrop-blur-md px-4 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Quick Ecosystem Embed Badges */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-[11px] text-slate-500 hidden md:inline">Quick Embeds:</span>
            <button
              onClick={handleCopyGitHolo}
              className="px-2.5 py-1 rounded-lg bg-[#0e1526] hover:bg-[#131c31] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-colors text-xs flex items-center gap-1.5 font-mono"
            >
              <Box className="w-3 h-3 text-emerald-400" />
              <span>Copy GitHolo 3D</span>
            </button>
            <button
              onClick={handleCopyGitChronicle}
              className="px-2.5 py-1 rounded-lg bg-[#0e1526] hover:bg-[#131c31] border border-[#1e293b] hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 transition-colors text-xs flex items-center gap-1.5 font-mono"
            >
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>Copy GitChronicle</span>
            </button>
          </div>

          {/* Primary Export Actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#0e1526] hover:bg-[#131c31] border border-[#1e293b] hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download README.md</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
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
