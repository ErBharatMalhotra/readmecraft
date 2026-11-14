import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: {
    default: 'ReadmeCraft | Intelligent Dual-Mode GitHub README Studio',
    template: '%s | ReadmeCraft',
  },
  description:
    'The next-generation intelligent GitHub README Studio for Developer Profiles and Repositories. Auto-detects real data, Bento/Minimalist presets, 1-click ecosystem widgets for GitHolo & GitChronicle.',
  keywords: [
    'GitHub README generator',
    'profile readme studio',
    'project readme',
    'developer portfolio',
    'Bharat Malhotra',
    'ReadmeCraft',
    'githolo',
    'gitchronicle',
  ],
  authors: [{ name: 'Bharat Malhotra', url: 'https://bharatdn.com' }],
  creator: 'Bharat Malhotra',
  publisher: 'BharatDN',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'ReadmeCraft — Intelligent GitHub README Studio',
    description:
      'Create world-class GitHub Profile & Repository READMEs in seconds with AI auto-detection, Bento grids, and 1-click ecosystem widgets.',
    url: 'https://readme.bharatdn.com',
    siteName: 'ReadmeCraft',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-readmecraft.svg',
        width: 1200,
        height: 630,
        alt: 'ReadmeCraft — Intelligent GitHub README Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReadmeCraft — Intelligent GitHub README Studio',
    description:
      'Create world-class GitHub Profile & Repository READMEs in seconds. Auto-detection, Bento grids, GitHolo & GitChronicle widgets.',
    images: ['/og-readmecraft.svg'],
    creator: '@ErBharatMalhotra',
    site: '@ErBharatMalhotra',
  },
  icons: {
    icon: [
      { url: '/icon-readmecraft.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icon-readmecraft.svg', type: 'image/svg+xml', sizes: '32x32' },
      { url: '/icon-readmecraft.svg', type: 'image/svg+xml', sizes: '16x16' },
    ],
    shortcut: '/icon-readmecraft.svg',
    apple: '/apple-touch-icon.svg',
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon.svg',
      },
    ],
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#090d16',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'ReadmeCraft',
              applicationCategory: 'DeveloperApplication',
              operatingSystem: 'Cloud',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                availability: 'https://schema.org/InStock',
              },
              author: {
                '@type': 'Person',
                name: 'Bharat Malhotra',
                url: 'https://bharatdn.com',
                sameAs: ['https://github.com/ErBharatMalhotra', 'https://twitter.com/ErBharatMalhotra'],
              },
              featureList: [
                'Dual-Mode: Profile & Repository READMEs',
                'Real-time GitHub data auto-detection',
                'Bento Grid & Minimalist presets',
                '3-pane live markdown studio',
                'GitHolo 3D Card & GitChronicle Cadence widgets',
                'Export: Copy, Download, JSON Import/Export',
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-[#090d16] text-[#f1f5f9] selection:bg-emerald-500/30 selection:text-emerald-300 antialiased">
        {/* Skip link for keyboard accessibility (WCAG 2.4.1) */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}