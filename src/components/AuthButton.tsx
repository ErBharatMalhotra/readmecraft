'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { GitBranch, LogOut, User } from 'lucide-react';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <button className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0e1526] p-2 text-xs text-slate-500 animate-pulse">
        <GitBranch className="h-3.5 w-3.5" />
        <span>Loading...</span>
      </button>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn('github', { callbackUrl: '/' })}
        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:border-emerald-500 hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
        title="Sign in with GitHub to use your personal API token (5,000 req/hr)"
      >
        <GitBranch className="h-3.5 w-3.5" />
        <span>Sign in with GitHub</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <User className="h-3.5 w-3.5" />
        </div>
        <span className="font-mono text-xs text-emerald-300">
          {session.user?.name || session.user?.email}
        </span>
        <span className="hidden sm:inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-400">
          Authenticated
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-400 transition-all hover:bg-rose-500/20 hover:border-rose-500 hover:shadow-[0_0_12px_rgba(244,63,94,0.2)]"
        title="Sign out"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}