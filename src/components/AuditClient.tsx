'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { AuditFinding, AuditReport } from '@/lib/badge-audit';

const SEVERITY_STYLE: Record<AuditFinding['severity'], { label: string; className: string }> = {
  dead: { label: 'Dead', className: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
  risky: { label: 'Risky', className: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
  native: {
    label: 'Native',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
  unknown: { label: 'Unchecked', className: 'border-slate-600 bg-slate-700/20 text-slate-300' },
};

export default function AuditClient() {
  const [username, setUsername] = useState('');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const runAudit = useCallback(async (raw: string) => {
    const value = raw.trim().replace(/^@/, '');
    if (!value) return;
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch(`/api/audit?username=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Audit failed.');
      } else {
        setReport(data as AuditReport);
        window.history.replaceState(null, '', `/audit?u=${encodeURIComponent(value)}`);
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('u');
    if (initial) {
      setUsername(initial);
      void runAudit(initial);
    }
  }, [runAudit]);

  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      <header className="sticky top-0 z-50 border-b border-[#1e293b] bg-[#090d16]/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-['Space_Grotesk'] text-lg font-bold tracking-tight text-white">
                ReadmeCraft
              </span>
              <span className="ml-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 uppercase">
                Audit
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-[#1e293b] bg-[#0e1526] px-4 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-slate-700 hover:text-white"
            >
              Open Studio
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-[#1e293b] bg-gradient-to-b from-[#0b101c] to-[#070b14] px-6 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 font-mono text-xs font-semibold text-emerald-400">
            <ScanSearch className="h-3.5 w-3.5" />
            Free badge health check
          </div>
          <h1 className="font-['Space_Grotesk'] text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Find the dead badges on any GitHub profile
          </h1>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            Enter a username. We read the profile README and flag badges that no longer render,
            hosts that have shut down, and images that silently break — then hand you the fixed
            markdown.
          </p>

          <form
            className="mx-auto mt-6 flex max-w-xl items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void runAudit(username);
            }}
          >
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#1e293b] bg-[#0c1220] px-3 py-2.5 focus-within:border-emerald-500/60">
              <span className="font-mono text-sm text-slate-500">@</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="octocat"
                aria-label="GitHub username"
                className="w-full bg-transparent font-mono text-sm text-white placeholder:text-slate-600 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !username.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
              Audit
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        {!report && !loading && !error && (
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: XCircle,
                title: 'Dead hosts',
                body: 'Paused readme-stats, retired Heroku dynos, travis-ci.org.',
              },
              {
                icon: AlertTriangle,
                title: 'Silent breakages',
                body: 'Workflow badges that 404 after a rename, stale package versions.',
              },
              {
                icon: ShieldCheck,
                title: 'Native replacements',
                body: 'Every fix maps to a badge ReadmeCraft renders itself.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-[#1e293b] bg-[#0c1220] p-5">
                <Icon className="h-5 w-5 text-emerald-400" />
                <h2 className="mt-3 font-['Space_Grotesk'] text-sm font-bold text-white">
                  {title}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 text-sm text-rose-200">
            {error}
          </div>
        )}

        {report && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#1e293b] bg-[#0c1220] p-5">
              <div>
                <p className="font-mono text-xs text-slate-500 uppercase">GitHub profile</p>
                <p className="font-['Space_Grotesk'] text-xl font-bold text-white">
                  @{report.username}
                </p>
              </div>
              <div className="flex items-center gap-5 font-mono text-xs">
                <span className="text-rose-300">{report.counts.dead} dead</span>
                <span className="text-amber-300">{report.counts.risky} risky</span>
                <span className="text-emerald-300">{report.counts.native} native</span>
                <span className="text-slate-400">{report.counts.unknown} unchecked</span>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-slate-500 uppercase">Health</p>
                <p className="font-['Space_Grotesk'] text-2xl font-extrabold text-white">
                  {report.score}
                  <span className="text-sm text-slate-500">/100</span>
                </p>
              </div>
            </div>

            {report.badgeCount === 0 ? (
              <div className="rounded-2xl border border-[#1e293b] bg-[#0c1220] p-5 text-sm text-slate-300">
                No badge images found in this README. Nothing to audit — add some badges, or build a
                new README in the{' '}
                <Link href="/" className="text-emerald-400 underline">
                  studio
                </Link>
                .
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-[#1e293b]">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead className="bg-[#0b101c] font-mono text-[10px] tracking-wider text-slate-500 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Badge</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Why</th>
                      <th className="px-4 py-2.5 text-right">Fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.findings.map((finding) => {
                      const style = SEVERITY_STYLE[finding.severity];
                      return (
                        <tr key={finding.url} className="border-t border-[#1e293b] bg-[#090d16]">
                          <td className="max-w-[240px] px-4 py-3">
                            <p className="truncate font-mono text-[11px] text-slate-300">
                              {finding.service}
                            </p>
                            <p
                              className="truncate font-mono text-[10px] text-slate-600"
                              title={finding.url}
                            >
                              {finding.url.replace(/^https?:\/\//, '')}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${style.className}`}
                            >
                              {style.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] leading-relaxed text-slate-400">
                            {finding.detail}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {finding.fix ? (
                              <button
                                onClick={() =>
                                  copy(
                                    `<img src="${finding.fix!.url}" alt="${finding.service}" />`,
                                    `${finding.url}-fix`
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-300 hover:bg-emerald-500/20"
                                title={finding.fix.reason}
                              >
                                {copied === `${finding.url}-fix` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                Copy
                              </button>
                            ) : (
                              <span className="font-mono text-[10px] text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {report.fixedMarkdown && (
                <button
                  onClick={() => copy(report.fixedMarkdown!, 'full')}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400"
                >
                  {copied === 'full' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy fixed README ({report.fixedCount} replaced)
                </button>
              )}
              {report.readmeUrl && (
                <a
                  href={report.readmeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-[#1e293b] bg-[#0e1526] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-slate-700 hover:text-white"
                >
                  View source README
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <p className="font-mono text-[10px] leading-relaxed text-slate-600">
              Rules are static and evidence-based: hosts that shut down (Heroku free dynos,
              travis-ci.org), the paused github-readme-stats instance, and badges that 404 silently.
              Unlisted hosts show as &quot;unchecked&quot; rather than being guessed at.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
