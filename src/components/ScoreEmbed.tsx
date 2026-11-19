'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface ScoreEmbedProps {
  username: string;
  score: number;
  grade: string;
}

export function ScoreEmbed({ username, score, grade }: ScoreEmbedProps) {
  const [copied, setCopied] = useState(false);

  const badgeUrl = `https://readme.bharatdn.com/api/badges?type=score&value=${score}&grade=${encodeURIComponent(
    grade
  )}&label=README%20Score&theme=gta6`;

  const snippets = [
    {
      label: 'Badge (markdown)',
      value: `[![ReadmeCraft score ${score}/100](${badgeUrl})](https://readme.bharatdn.com/score/${username})`,
    },
    {
      label: 'Card link',
      value: `[README score ${score}/100](https://readme.bharatdn.com/score/${username})`,
    },
  ];

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-3">
      {snippets.map((snippet) => (
        <div key={snippet.label}>
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-wide text-slate-500 uppercase">
              {snippet.label}
            </span>
            <button
              onClick={() => copy(snippet.value)}
              className="flex items-center gap-1 rounded border border-[#1e293b] px-2 py-1 text-[11px] text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copy
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg border border-[#1e293b] bg-[#070b14] p-3 font-mono text-[11px] whitespace-pre-wrap text-slate-300">
            {snippet.value}
          </pre>
        </div>
      ))}
    </div>
  );
}
