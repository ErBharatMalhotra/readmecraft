import type { Metadata } from 'next';
import { ScoreSearch } from '@/components/ScoreSearch';

export const metadata: Metadata = {
  title: 'README Score Card — score any GitHub profile',
  description:
    'Score any GitHub profile README out of 100 on structure, visuals, documentation depth, links and accessibility. Every point comes from the published markdown.',
  alternates: { canonical: 'https://readme.bharatdn.com/score' },
  openGraph: {
    title: 'README Score Card — score any GitHub profile',
    description: 'Score any GitHub profile README out of 100 in seconds. No sign-in needed.',
    url: 'https://readme.bharatdn.com/score',
    type: 'website',
    images: ['/og-readmecraft.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'README Score Card — score any GitHub profile',
    description: 'Score any GitHub profile README out of 100 in seconds. No sign-in needed.',
    images: ['/og-readmecraft.png'],
  },
};

export default function ScoreIndexPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b14] px-4">
      <ScoreSearch />
    </main>
  );
}
