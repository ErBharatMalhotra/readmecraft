import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScoreEmbed } from '@/components/ScoreEmbed';
import { scoreReadmeMarkdown } from '@/lib/public-score';

export const revalidate = 3600;

const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

async function fetchProfileReadme(username: string): Promise<string | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.raw+json',
    'User-Agent': 'ReadmeCraft',
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${username}/${username}/readme`, {
      headers,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
  if (grade.startsWith('B')) return 'text-sky-400 border-sky-500/40 bg-sky-500/10';
  if (grade.startsWith('C')) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  if (grade.startsWith('D')) return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
  return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
}

function barColor(ratio: number): string {
  if (ratio >= 0.85) return 'bg-emerald-500';
  if (ratio >= 0.6) return 'bg-sky-500';
  if (ratio >= 0.4) return 'bg-amber-500';
  return 'bg-rose-500';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  if (!USERNAME_PATTERN.test(username)) return { title: 'README Score' };

  const readme = await fetchProfileReadme(username);
  const title = readme
    ? `${username}'s README scores ${scoreReadmeMarkdown(readme).score}/100`
    : `${username} has no profile README yet`;
  const score = readme ? String(scoreReadmeMarkdown(readme).score) : '0';
  const grade = readme ? scoreReadmeMarkdown(readme).grade : '—';

  return {
    title,
    description:
      'ReadmeCraft scores any GitHub profile README on structure, visuals, documentation depth and accessibility — every point derived from the markdown itself.',
    openGraph: {
      title,
      description: 'Score any GitHub profile README in seconds.',
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(`${username} · README score`)}&subtitle=${encodeURIComponent(
            'Scored by ReadmeCraft'
          )}&score=${score}&grade=${encodeURIComponent(grade)}&theme=gta6`,
        },
      ],
    },
  };
}

export default async function ScorePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (!USERNAME_PATTERN.test(username)) notFound();

  const readme = await fetchProfileReadme(username);

  if (!readme) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b14] px-4">
        <div className="w-full max-w-lg rounded-2xl border border-[#1e293b] bg-[#0b101c] p-8 text-center">
          <h1 className="text-xl font-bold text-white">No profile README found</h1>
          <p className="mt-2 text-sm text-slate-400">
            <code className="text-slate-300">@{username}</code> has no public{' '}
            <code className="text-slate-300">
              {username}/{username}
            </code>{' '}
            README to score yet.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
          >
            Build one with ReadmeCraft
          </Link>
        </div>
      </main>
    );
  }

  const result = scoreReadmeMarkdown(readme);

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-wider text-emerald-400 uppercase">
              ReadmeCraft score card
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">@{username}</h1>
            <p className="mt-1 text-sm text-slate-400">
              Scored from the live <code className="text-slate-300">README.md</code> on GitHub, not
              from a generated preview. Refreshes hourly.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono text-4xl font-black text-white">
                {result.score}
                <span className="text-lg font-medium text-slate-500">/100</span>
              </div>
              <div className="text-xs text-slate-500">README score</div>
            </div>
            <div
              className={`rounded-xl border px-3 py-2 font-mono text-xl font-bold ${gradeColor(result.grade)}`}
            >
              {result.grade}
            </div>
          </div>
        </header>

        <section className="rounded-2xl border border-[#1e293b] bg-[#0b101c] p-5">
          <h2 className="mb-4 font-mono text-xs tracking-wider text-slate-500 uppercase">
            Breakdown
          </h2>
          <div className="space-y-3">
            {result.metrics.map((metric) => (
              <div key={metric.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{metric.label}</span>
                  <span className="font-mono text-slate-500">
                    {metric.score}/{metric.max}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#1a2233]">
                  <div
                    className={`h-full rounded-full ${barColor(metric.score / metric.max)}`}
                    style={{ width: `${Math.round((metric.score / metric.max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            {[
              { label: 'words', value: result.stats.words },
              { label: 'images', value: result.stats.images },
              { label: 'badges', value: result.stats.badges },
              { label: 'code blocks', value: result.stats.codeBlocks },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-[#1e293b] bg-[#090d16] py-2"
              >
                <div className="font-mono text-sm font-bold text-slate-200">{stat.value}</div>
                <div className="text-[10px] tracking-wide text-slate-500 uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {result.suggestions.length > 0 && (
          <section className="rounded-2xl border border-[#1e293b] bg-[#0b101c] p-5">
            <h2 className="mb-3 font-mono text-xs tracking-wider text-slate-500 uppercase">
              Top fixes
            </h2>
            <ul className="space-y-3">
              {result.suggestions.map((suggestion) => (
                <li key={suggestion.title} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{suggestion.title}</div>
                    <p className="text-xs text-slate-400">{suggestion.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-[#1e293b] bg-[#0b101c] p-5">
          <h2 className="mb-3 font-mono text-xs tracking-wider text-slate-500 uppercase">
            Share this score
          </h2>
          <ScoreEmbed username={username} score={result.score} grade={result.grade} />
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `My GitHub profile README scores ${result.score}/100 on ReadmeCraft`
              )}&url=${encodeURIComponent(`https://readme.bharatdn.com/score/${username}`)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[#1e293b] px-3 py-1.5 text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
            >
              Share on X
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                `https://readme.bharatdn.com/score/${username}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[#1e293b] px-3 py-1.5 text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
            >
              Share on LinkedIn
            </a>
            <Link
              href="/"
              className="rounded-lg bg-emerald-500 px-3 py-1.5 font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              Improve it in the Studio →
            </Link>
          </div>
        </section>

        <p className="text-center text-[11px] text-slate-600">
          Score = structure 20 + visuals 20 + documentation 20 + connect 20 + hygiene 20.
        </p>
      </div>
    </main>
  );
}
