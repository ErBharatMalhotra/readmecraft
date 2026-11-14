'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-client';

export default function DeployPage() {
  const { session, status } = useAuth();
  const [step, setStep] = useState<'idle' | 'installing' | 'selecting' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([
    'composite', 'snake', 'heatmap', 'trophy', 'activity',
    'skill-radar', 'language-race', 'repo-constellation',
    'code-pulse', 'contribution-mountain', 'tech-galaxy',
    'contribution-flow', 'code-time-heatmap'
  ]);
  const [theme, setTheme] = useState<string>('tokyonight');
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
    setSelectedBadges(prev => prev.includes(badge) 
      ? prev.filter(b => b !== badge) 
      : [...prev, badge]
    );
  };

  const themes = [
    { id: 'tokyonight', name: 'Tokyo Night', bg: '#1a1b26', accent: '#7aa2f7' },
    { id: 'dracula', name: 'Dracula', bg: '#282a36', accent: '#bd93f9' },
    { id: 'nord', name: 'Nord', bg: '#2e3440', accent: '#88c0d0' },
    { id: 'github', name: 'GitHub Dark', bg: '#0d1117', accent: '#58a6ff' },
    { id: 'gruvbox', name: 'Gruvbox', bg: '#282828', accent: '#8ec07c' },
    { id: 'rosePine', name: 'Rose Pine', bg: '#191724', accent: '#9ccfd8' },
    { id: 'catppuccin', name: 'Catppuccin', bg: '#1e1e2e', accent: '#89dceb' },
    { id: 'synthwave', name: 'Synthwave', bg: '#2d2a40', accent: '#f92aad' },
    { id: 'gta6', name: 'GTA VI Sunset', bg: '#0a0a0f', accent: '#ff6b35' },
    { id: 'default', name: 'Default', bg: '#090d16', accent: '#10b981' },
  ];

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="bg-[#0b101c] border border-[#1e293b] rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-[#f1f5f9] mb-2">README Deployed!</h1>
          <p className="text-[#94a3b8] mb-6">
            Your profile README has been updated with all selected badges.
          </p>
          <a
            href={`https://github.com/${username}/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors"
          >
            View Profile →
          </a>
          <p className="mt-4 text-xs text-[#64748b]">
            Deployed via <a href="https://readme.bharatdn.com" className="text-[#10b981] hover:underline">ReadmeCraft</a>
          </p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="bg-[#0b101c] border border-[#ef4444]/30 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-[#ef4444] mb-2">Deployment Failed</h1>
          <p className="text-[#94a3b8] mb-6">{error || 'Unknown error occurred'}</p>
          <button
            onClick={handleRetry}
            className="inline-block px-6 py-3 bg-[#ef4444] text-white rounded-lg font-medium hover:bg-[#dc2626] transition-colors"
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
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="bg-[#0b101c] border border-[#1e293b] rounded-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <h1 className="text-2xl font-bold text-[#f1f5f9] mb-2">Loading...</h1>
          <p className="text-[#94a3b8]">Checking your GitHub session</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show sign in prompt
  if (!username) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="bg-[#0b101c] border border-[#1e293b] rounded-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-[#f1f5f9] mb-2">Sign in to Deploy</h1>
          <p className="text-[#94a3b8] mb-6">
            Please sign in with GitHub to deploy your profile README.
          </p>
          <a
            href="/api/auth/signin/github"
            className="inline-block px-6 py-3 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors"
          >
            Sign in with GitHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="bg-[#0b101c] border border-[#1e293b] rounded-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#f1f5f9] mb-2">🚀 Deploy to GitHub Profile</h1>
          <p className="text-[#94a3b8]">
            One-click deploy your customized README to <code className="text-[#10b981] bg-[#161b22] px-1.5 py-0.5 rounded text-sm">{username}/{username}</code>
          </p>
        </div>

        {/* Theme Selector */}
        <div className="space-y-4 mb-6 p-4 bg-[#090d16] rounded-xl border border-[#1e293b]">
          <h3 className="font-medium text-[#f1f5f9] mb-3 flex items-center gap-2">
            <span>🎨</span> Theme
          </h3>
          <div className="flex flex-wrap gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border-2 ${
                  theme === t.id
                    ? `border-${t.accent.replace('#', '')} bg-${t.accent.replace('#', '')}/20 text-${t.accent.replace('#', '')}`
                    : 'border-[#2a3a4f] text-[#94a3b8] hover:border-[#3a4a5f] hover:bg-[#161b22]'
                }`}
                style={{
                  backgroundColor: theme === t.id ? t.accent + '20' : undefined,
                  borderColor: theme === t.id ? t.accent : '#2a3a4f',
                  color: theme === t.id ? t.accent : '#94a3b8'
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Selector */}
        <div className="space-y-4 mb-8 p-4 bg-[#090d16] rounded-xl border border-[#1e293b]">
          <h3 className="font-medium text-[#f1f5f9] mb-3 flex items-center gap-2">
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
                className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-all border-2 ${
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
                  {badge.recommended && <span className="text-xs px-1.5 py-0.5 bg-[#10b981] text-white rounded">Recommended</span>}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* GitHub Action Auto-Sync Option */}
        <div className="mb-6 p-4 rounded-xl border border-[#1e293b] bg-[#161b22]/40">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableAutoSync}
              onChange={(e) => setEnableAutoSync(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#1e293b] bg-[#090d16] text-[#10b981] focus:ring-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#f1f5f9]">
                  🔄 Enable Automated Daily Auto-Sync (GitHub Action)
                </span>
                <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-mono uppercase">
                  New
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                Appends a preconfigured workflow snippet to automate cache invalidation and ensure your badges & commit snake refresh automatically every 24 hours.
              </p>
            </div>
          </label>
        </div>

        <div className="p-4 bg-[#161b22]/50 border border-[#10b981]/30 rounded-xl mb-6">
          <h4 className="font-medium text-[#10b981] mb-2 flex items-center gap-2">
            <span>ℹ️</span> What happens next
          </h4>
          <ol className="text-sm text-[#94a3b8] space-y-1 list-decimal list-inside">
            <li>You'll be redirected to GitHub to install <strong>ReadmeCraft Deploy</strong></li>
            <li>Select <strong>"Only select repositories"</strong> → choose <code className="bg-[#090d16] px-1 rounded">{username}/{username}</code></li>
            <li>Click <strong>Install</strong> → you'll return here with success message</li>
          </ol>
        </div>

        <button
          onClick={handleDeploy}
          disabled={step === 'installing'}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold text-lg rounded-xl hover:from-[#059669] hover:to-[#047857] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 'installing' ? 'Redirecting to GitHub...' : '🚀 Deploy to GitHub Profile'}
        </button>

        <p className="text-center text-xs text-[#64748b] mt-4">
          By deploying, you authorize ReadmeCraft to write to your <code>username/username</code> repository.
          You can revoke access anytime in GitHub Settings → Applications.
        </p>
      </div>
    </div>
  );
}