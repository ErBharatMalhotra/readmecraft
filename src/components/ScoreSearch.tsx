'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ScoreSearch() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = username.trim().replace(/^@/, '');
    if (clean) router.push(`/score/${clean}`);
  };

  return (
    <div className="w-full max-w-lg rounded-2xl border border-[#1e293b] bg-[#0b101c] p-8">
      <p className="font-mono text-[11px] tracking-wider text-emerald-400 uppercase">
        ReadmeCraft score card
      </p>
      <h1 className="mt-1 text-2xl font-bold text-white">Score any GitHub profile README</h1>
      <p className="mt-2 text-sm text-slate-400">
        We read the published <code className="text-slate-300">README.md</code> and score its
        structure, visuals, documentation, links and accessibility. No sign-in needed.
      </p>
      <form onSubmit={submit} className="mt-6 flex gap-2">
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="github username"
          aria-label="GitHub username"
          className="flex-1 rounded-lg border border-[#1e293b] bg-[#090d16] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/60"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
        >
          Score
        </button>
      </form>
      <Link
        href="/score/ErBharatMalhotra"
        className="mt-4 inline-block text-xs text-slate-500 transition-colors hover:text-emerald-400"
      >
        See an example →
      </Link>
    </div>
  );
}
