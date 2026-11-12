import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReadmeCraft | Intelligent Dual-Mode GitHub README Studio',
  description: 'The next-generation intelligent GitHub README Studio for Developer Profiles and Repositories by Bharat Malhotra (readme.bharatdn.com).',
  keywords: ['GitHub README generator', 'profile readme studio', 'project readme', 'developer portfolio', 'Bharat Malhotra', 'ReadmeCraft'],
  authors: [{ name: 'Bharat Malhotra', url: 'https://bharatdn.com' }],
  openGraph: {
    title: 'ReadmeCraft — Intelligent GitHub README Studio',
    description: 'Create world-class GitHub Profile & Repository READMEs in seconds with AI auto-detection, Bento grids, and 1-click ecosystem widgets.',
    url: 'https://readme.bharatdn.com',
    siteName: 'ReadmeCraft',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#090d16] text-[#f1f5f9] selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
