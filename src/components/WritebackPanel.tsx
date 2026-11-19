'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileDiff, GitPullRequest, Loader2, X } from 'lucide-react';
import { diffLines, type LineDiff } from '@/lib/diff';

interface WritebackPanelProps {
  open: boolean;
  onClose: () => void;
  markdown: string;
  defaultRepo: string;
}

type Phase = 'idle' | 'loading' | 'ready' | 'writing' | 'done' | 'error';

const MAX_DIFF_ROWS = 400;

export function WritebackPanel({ open, onClose, markdown, defaultRepo }: WritebackPanelProps) {
  const [repo, setRepo] = useState(defaultRepo);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [branch, setBranch] = useState<string>('');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);

  const diff: LineDiff | null = useMemo(
    () => (current === null ? null : diffLines(current, markdown)),
    [current, markdown]
  );

  if (!open) return null;

  const reset = () => {
    setPhase('idle');
    setError(null);
    setCurrent(null);
    setPrUrl(null);
    setCommitUrl(null);
    setBranch('');
  };

  const loadCurrent = async () => {
    setPhase('loading');
    setError(null);
    try {
      const res = await fetch(`/api/writeback?repo=${encodeURIComponent(repo)}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not read the repository.');
      setCurrent(data.content ?? '');
      setBranch(data.defaultBranch ?? 'main');
      setPhase('ready');
    } catch (err: any) {
      setError(err?.message || 'Could not read the repository.');
      setPhase('error');
    }
  };

  const write = async (mode: 'pr' | 'direct') => {
    setPhase('writing');
    setError(null);
    try {
      const res = await fetch('/api/writeback', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, markdown, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'GitHub rejected the write.');

      if (data.unchanged) {
        setError('No changes: the repository README already matches this output.');
        setPhase('ready');
        return;
      }

      setPrUrl(data.prUrl ?? null);
      setCommitUrl(data.commitUrl ?? null);
      setPhase('done');
    } catch (err: any) {
      setError(err?.message || 'GitHub rejected the write.');
      setPhase('error');
    }
  };

  const visibleLines = diff ? diff.lines.slice(0, MAX_DIFF_ROWS) : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0b101c] shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#1e293b] px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-bold text-white">
              <GitPullRequest className="h-4 w-4 text-emerald-400" />
              Write back to GitHub
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Preview the exact diff first. Nothing is written until you press the button, and PR
              mode never touches your default branch directly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#1e293b] p-1.5 text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            aria-label="Close write-back panel"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <label className="mb-1 block font-mono text-[11px] tracking-wide text-slate-500 uppercase">
            Target repository
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={repo}
              onChange={(event) => {
                setRepo(event.target.value);
                reset();
              }}
              placeholder="owner/repo"
              className="flex-1 rounded-lg border border-[#1e293b] bg-[#090d16] px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-emerald-500/60"
            />
            <button
              onClick={loadCurrent}
              disabled={phase === 'loading' || phase === 'writing' || !repo.includes('/')}
              className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {phase === 'loading' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDiff className="h-3.5 w-3.5" />
              )}
              Preview diff
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {diff && phase !== 'done' && (
            <div className="mt-4">
              <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-mono text-emerald-400">+{diff.added}</span>
                <span className="font-mono text-rose-400">−{diff.removed}</span>
                {branch && <span className="text-slate-500">base: {branch}</span>}
                {diff.identical && <span className="text-slate-400">README already matches</span>}
                {diff.truncated && (
                  <span className="text-amber-300">
                    large change — showing lines unaligned, review on GitHub
                  </span>
                )}
              </div>

              <pre className="max-h-72 overflow-auto rounded-lg border border-[#1e293b] bg-[#070b14] p-3 font-mono text-[11px] leading-relaxed">
                {visibleLines.map((line, index) => (
                  <div
                    key={index}
                    className={
                      line.type === 'add'
                        ? 'text-emerald-300'
                        : line.type === 'del'
                          ? 'text-rose-300'
                          : 'text-slate-500'
                    }
                  >
                    <span className="mr-2 inline-block w-3 select-none">
                      {line.type === 'add' ? '+' : line.type === 'del' ? '−' : ' '}
                    </span>
                    {line.text || ' '}
                  </div>
                ))}
                {diff.lines.length > MAX_DIFF_ROWS && (
                  <div className="mt-2 text-slate-500">
                    … {diff.lines.length - MAX_DIFF_ROWS} more lines in the diff
                  </div>
                )}
              </pre>
            </div>
          )}

          {phase === 'done' && (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                {prUrl ? 'Pull request opened' : 'README committed'}
              </p>
              <a
                href={prUrl ?? commitUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-mono text-xs text-emerald-300 underline"
              >
                {prUrl ?? commitUrl}
              </a>
            </div>
          )}
        </div>

        <footer className="flex flex-col gap-2 border-t border-[#1e293b] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-500">
            Needs the <code className="text-slate-300">repo</code> scope. Revoke anytime in GitHub →
            Settings → Applications.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => write('direct')}
              disabled={phase !== 'ready' || !diff || diff.identical}
              className="rounded-lg border border-[#1e293b] px-3 py-2 text-xs text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Commit to {branch || 'default branch'}
            </button>
            <button
              onClick={() => write('pr')}
              disabled={phase !== 'ready' || !diff || diff.identical}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              Open pull request
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
