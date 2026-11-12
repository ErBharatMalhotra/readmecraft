'use client';

import { useState } from 'react';
import { ExternalLink, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EcosystemWidgetProps {
  username: string;
  repoName?: string;
  mode: 'profile' | 'project';
}

export function EcosystemWidgets({ username, repoName, mode }: EcosystemWidgetProps) {
  const [gitHoloEnabled, setGitHoloEnabled] = useState(true);
  const [gitChronicleEnabled, setGitChronicleEnabled] = useState(true);

  const target = mode === 'profile' ? username : repoName || username;

  return (
    <div className="space-y-4">
      {/* GitHolo Toggle */}
      <label className="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#0b101c] p-4 transition-colors hover:border-emerald-500/30 cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-white">GitHolo 3D Card</p>
            <p className="font-mono text-xs text-slate-500">Interactive WebGL holographic profile/repo card</p>
          </div>
        </div>
        <span className="ml-auto flex items-center gap-2">
          <input
            type="checkbox"
            checked={gitHoloEnabled}
            onChange={(e) => setGitHoloEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-[#1e293b] bg-[#090d16] text-emerald-500 focus:ring-emerald-500"
          />
          {gitHoloEnabled && (
            <a
              href={`https://githolo.bharatdn.com${mode === 'profile' ? `/${target}` : `/repo/${target}`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3 inline" />
            </a>
          )}
        </span>
      </label>

      {/* GitChronicle Toggle */}
      <label className="flex items-center gap-3 rounded-lg border border-[#1e293b] bg-[#0b101c] p-4 transition-colors hover:border-emerald-500/30 cursor-pointer">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-white">GitChronicle Cadence</p>
            <p className="font-mono text-xs text-slate-500">Live commit velocity & percentile badges</p>
          </div>
        </div>
        <span className="ml-auto flex items-center gap-2">
          <input
            type="checkbox"
            checked={gitChronicleEnabled}
            onChange={(e) => setGitChronicleEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-[#1e293b] bg-[#090d16] text-amber-500 focus:ring-amber-500"
          />
          {gitChronicleEnabled && (
            <a
              href={`https://gitchronicle.bharatdn.com${mode === 'profile' ? `/${target}` : `/repo/${target}`}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <ExternalLink className="h-3 w-3 inline" />
            </a>
          )}
        </span>
      </label>

      {/* Embed Code Preview */}
      {(gitHoloEnabled || gitChronicleEnabled) && (
        <details className="group rounded-lg border border-[#1e293b] bg-[#0b101c] p-4">
          <summary className="flex items-center justify-between cursor-pointer list-none font-mono text-sm text-slate-300">
            <span>Embed Markdown Snippets</span>
            <span className="text-xs text-slate-500">Click to copy</span>
          </summary>
          <div className="mt-3 space-y-3 font-mono text-xs">
            {gitHoloEnabled && (
              <div className="rounded bg-[#090d16] p-3 text-slate-300">
                <code className="text-emerald-400">
                  {`[![GitHolo 3D Card](https://githolo.bharatdn.com/api/og/${target})](https://githolo.bharatdn.com)`}
                </code>
              </div>
            )}
            {gitChronicleEnabled && (
              <div className="rounded bg-[#090d16] p-3 text-slate-300">
                <code className="text-amber-400">
                  {`[![GitChronicle Cadence](https://gitchronicle.bharatdn.com/badge/${target}.svg)](https://gitchronicle.bharatdn.com)`}
                </code>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

interface EcosystemBadgesProps {
  username: string;
  repoName?: string;
  mode: 'profile' | 'project';
  gitHoloEnabled?: boolean;
  gitChronicleEnabled?: boolean;
}

export function EcosystemBadges({ username, repoName, mode, gitHoloEnabled = true, gitChronicleEnabled = true }: EcosystemBadgesProps) {
  const target = mode === 'profile' ? username : repoName || username;
  const githoloUrl = `https://githolo.bharatdn.com/api/og/${target}`;
  const gitchronicleUrl = `https://gitchronicle.bharatdn.com/badge/${target}.svg`;

  if (!gitHoloEnabled && !gitChronicleEnabled) return null;

  return (
    <div className="flex flex-col items-center gap-4">
      {gitHoloEnabled && (
        <a href={`https://githolo.bharatdn.com${mode === 'profile' ? `/${target}` : `/repo/${target}`}`} target="_blank" rel="noopener noreferrer">
          <img 
            src={githoloUrl} 
            alt="GitHolo 3D Card" 
            className="rounded-lg border border-[#1e293b] max-w-full h-auto transition-transform hover:scale-[1.02]"
            width={400}
            height={225}
          />
        </a>
      )}
      {gitChronicleEnabled && (
        <a href={`https://gitchronicle.bharatdn.com${mode === 'profile' ? `/${target}` : `/repo/${target}`}`} target="_blank" rel="noopener noreferrer">
          <img 
            src={gitchronicleUrl} 
            alt="GitChronicle Cadence Badge" 
            className="rounded-lg border border-[#1e293b] max-w-full h-auto"
            width={400}
            height={120}
          />
        </a>
      )}
    </div>
  );
}