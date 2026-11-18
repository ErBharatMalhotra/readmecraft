'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';
import { THEME_LIST } from '@/lib/themes';

export default function DeployPage() {
  const { session, status } = useAuth();
  const [step, setStep] = useState<'idle' | 'installing' | 'selecting' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([
    'composite',
    'snake',
    'heatmap',
    'trophy',
    'activity',
    'skill-radar',
    'language-race',
    'repo-constellation',
    'code-pulse',
    'contribution-mountain',
    'tech-galaxy',
    'contribution-flow',
    'code-time-heatmap',
  ]);
  const [theme, setTheme] = useState<string>('gta6');
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [enableAutoSync, setEnableAutoSync] = useState<boolean>(false);

  // Get username from session
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUsername((session.user as any).login || '');
    } else if (status === 'unauthenticated') {
      setUsername('');
    }
    setLoading(false);
  }, [session, status]);

  const handleDeploy = () => {
    if (!username) {
      setError('Please sign in with GitHub first');
      return;
    }
    // Save config to localStorage for callback
    const config = {
      username,
      template: 'bento',
      badges: selectedBadges,
      theme: theme,
      autoSync: enableAutoSync,
    };
    localStorage.setItem('readmecraft-deploy-config', JSON.stringify(config));

    // Redirect to install endpoint with badges
    const badgesParam = selectedBadges.join(',');
    const autoSyncParam = enableAutoSync ? '&autosync=true' : '';
    window.location.href = `/api/auth/github-app/install?username=${username}&theme=${theme}&badges=${badgesParam}${autoSyncParam}`;
  };

  const handleRetry = () => {
    setStep('idle');
    setError(null);
    handleDeploy();
  };

  const toggleBadge = (badge: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badge) ? prev.filter((b) => b !== badge) : [...prev, badge]
    );
  };

  const themes = THEME_LIST;

  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#1e293b] bg-[#0b101c] p-8 text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h1 className="mb-2 text-2xl font-bold text-[#f1f5f9]">README Deployed!</h1>
          <p className="mb-6 text-[#94a3b8]">
            Your profile README has been updated with all selected badges.
          </p>
          <a
            href={`https://github.com/${username}/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-[#10b981] px-6 py-3 font-medium text-white transition-colors hover:bg-[#059669]"
          >
            View Profile →
          </a>
          <p className="mt-4 text-xs text-[#64748b]">
            Deployed via{' '}
            <a href="https://readme.bharatdn.com" className="text-[#10b981] hover:underline">
              ReadmeCraft
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[#ef4444]/30 bg-[#0b101c] p-8 text-center">
          <div className="mb-4 text-4xl">❌</div>
          <h1 className="mb-2 text-2xl font-bold text-[#ef4444]">Deployment Failed</h1>
          <p className="mb-6 text-[#94a3b8]">{error || 'Unknown error occurred'}</p>
          <button
            onClick={handleRetry}
            className="inline-block rounded-lg bg-[#ef4444] px-6 py-3 font-medium text-white transition-colors hover:bg-[#dc2626]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state while fetching session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-[#1e293b] bg-[#0b101c] p-8 text-center">
          <div className="mb-4 animate-spin text-4xl">⏳</div>
          <h1 className="mb-2 text-2xl font-bold text-[#f1f5f9]">Loading...</h1>
          <p className="text-[#94a3b8]">Checking your GitHub session</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show sign in prompt
  if (!username) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-[#1e293b] bg-[#0b101c] p-8 text-center">
          <div className="mb-4 text-4xl">🔐</div>
          <h1 className="mb-2 text-2xl font-bold text-[#f1f5f9]">Sign in to Deploy</h1>
          <p className="mb-6 text-[#94a3b8]">
            Please sign in with GitHub to deploy your profile README.
          </p>
          <a
            href="/api/auth/signin/github"
            className="inline-block rounded-lg bg-[#10b981] px-6 py-3 font-medium text-white transition-colors hover:bg-[#059669]"
          >
            Sign in with GitHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[#1e293b] bg-[#0b101c] p-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-[#f1f5f9]">🚀 Deploy to GitHub Profile</h1>
          <p className="text-[#94a3b8]">
            One-click deploy your customized README to{' '}
            <code className="rounded bg-[#161b22] px-1.5 py-0.5 text-sm text-[#10b981]">
              {username}/{username}
            </code>
          </p>
        </div>

        {/* Theme Selector */}
        <div className="mb-6 space-y-4 rounded-xl border border-[#1e293b] bg-[#090d16] p-4">
          <h3 className="mb-3 flex items-center justify-between font-medium text-[#f1f5f9]">
            <span className="flex items-center gap-2">
              <span>🎨</span> Theme (50 Curated Themes)
            </span>
            <span className="font-mono text-xs text-emerald-400 capitalize">{theme}</span>
          </h3>
          <div className="flex max-h-52 flex-wrap gap-2 overflow-y-auto rounded-lg border border-[#1e293b]/50 p-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                  theme === t.id
                    ? `border-${t.accent.replace('#', '')} bg-${t.accent.replace('#', '')}/20 text-${t.accent.replace('#', '')}`
                    : 'border-[#2a3a4f] text-[#94a3b8] hover:border-[#3a4a5f] hover:bg-[#161b22]'
                }`}
                style={{
                  backgroundColor: theme === t.id ? t.accent + '20' : undefined,
                  borderColor: theme === t.id ? t.accent : '#2a3a4f',
                  color: theme === t.id ? t.accent : '#94a3b8',
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Selector */}
        <div className="mb-8 space-y-4 rounded-xl border border-[#1e293b] bg-[#090d16] p-4">
          <h3 className="mb-3 flex items-center gap-2 font-medium text-[#f1f5f9]">
            <span>📦</span> Select Badges ({selectedBadges.length} selected)
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'composite', label: '🎯 Composite Card (All-in-One)', recommended: true },
              { id: 'stats', label: '📊 Stats Card' },
              { id: 'snake', label: '🐍 Snake v13' },
              { id: 'heatmap', label: '📅 Heatmap' },
              { id: 'trophy', label: '🏆 Trophies' },
              { id: 'activity', label: '📈 Activity Graph' },
              { id: 'skill-radar', label: '🎯 Skill Radar' },
              { id: 'language-race', label: '🏁 Language Race' },
              { id: 'repo-constellation', label: '🌌 Repo Constellation' },
              { id: 'code-pulse', label: '💓 Code Pulse' },
              { id: 'contribution-mountain', label: '🏔️ Contribution Mountain' },
              { id: 'tech-galaxy', label: '🌌 Tech Galaxy' },
              { id: 'contribution-flow', label: '🌊 Contribution Flow' },
              { id: 'code-time-heatmap', label: '🕐 Code Time Heatmap' },
            ].map((badge) => (
              <label
                key={badge.id}
                className={`cursor-pointer rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                  selectedBadges.includes(badge.id)
                    ? `border-[#10b981] bg-[#10b981]/10 text-[#10b981]`
                    : 'border-[#2a3a4f] text-[#94a3b8] hover:border-[#3a4a5f] hover:bg-[#161b22]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedBadges.includes(badge.id)}
                  onChange={() => toggleBadge(badge.id)}
                  className="mr-2 hidden"
                />
                <span className="flex items-center gap-2">
                  {badge.label}
                  {badge.recommended && (
                    <span className="rounded bg-[#10b981] px-1.5 py-0.5 text-xs text-white">
                      Recommended
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* GitHub Action Auto-Sync Option */}
        <div className="mb-6 rounded-xl border border-[#1e293b] bg-[#161b22]/40 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={enableAutoSync}
              onChange={(e) => setEnableAutoSync(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#1e293b] bg-[#090d16] text-[#10b981] focus:ring-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#f1f5f9]">
                  🔄 Enable Automated Daily Auto-Sync (GitHub Action)
                </span>
                <span className="py-0.2 rounded border border-emerald-500/30 bg-emerald-500/20 px-1.5 font-mono text-[10px] text-emerald-400 uppercase">
                  New
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#94a3b8]">
                Appends a preconfigured workflow snippet to automate cache invalidation and ensure
                your badges & commit snake refresh automatically every 24 hours.
              </p>
            </div>
          </label>
        </div>

        <div className="mb-6 rounded-xl border border-[#10b981]/30 bg-[#161b22]/50 p-4">
          <h4 className="mb-2 flex items-center gap-2 font-medium text-[#10b981]">
            <span>ℹ️</span> What happens next
          </h4>
          <ol className="list-inside list-decimal space-y-1 text-sm text-[#94a3b8]">
            <li>
              You'll be redirected to GitHub to install <strong>ReadmeCraft Deploy</strong>
            </li>
            <li>
              Select <strong>"Only select repositories"</strong> → choose{' '}
              <code className="rounded bg-[#090d16] px-1">
                {username}/{username}
              </code>
            </li>
            <li>
              Click <strong>Install</strong> → you'll return here with success message
            </li>
          </ol>
        </div>

        <button
          onClick={handleDeploy}
          disabled={step === 'installing'}
          className="w-full rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] px-6 py-4 text-lg font-bold text-white transition-all hover:from-[#059669] hover:to-[#047857] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {step === 'installing' ? 'Redirecting to GitHub...' : '🚀 Deploy to GitHub Profile'}
        </button>

        <p className="mt-4 text-center text-xs text-[#64748b]">
          By deploying, you authorize ReadmeCraft to write to your <code>username/username</code>{' '}
          repository. You can revoke access anytime in GitHub Settings → Applications.
        </p>
      </div>
    </div>
  );
}
