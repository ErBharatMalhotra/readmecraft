import type { Metadata } from 'next';
import { StudioClient } from '@/components/StudioClient';
import { COMMUNITY_TEMPLATES } from '@/lib/templates';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ template?: string; theme?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const templateId = params.template;
  const themeId = params.theme;
  
  if (templateId) {
    const template = COMMUNITY_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      const finalTheme = themeId || template.theme;
      const url = `https://readme.bharatdn.com/?template=${templateId}&theme=${finalTheme}`;
      return {
        title: `${template.title} — ReadmeCraft`,
        description: template.bio,
        alternates: { canonical: url },
        openGraph: {
          title: `${template.title} — ReadmeCraft`,
          description: template.bio,
          url,
          type: 'website',
          images: [`/og-readmecraft.svg`],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${template.title} — ReadmeCraft`,
          description: template.bio,
          images: ['/og-readmecraft.svg'],
        },
      };
    }
  }
  
  return {
    title: 'ReadmeCraft | Intelligent Dual-Mode GitHub README Studio',
    description: 'The next-generation intelligent GitHub README Studio for Developer Profiles and Repositories. Auto-detects real data, Bento/Minimalist presets, 1-click ecosystem widgets for GitHolo & GitChronicle.',
    alternates: { canonical: 'https://readme.bharatdn.com/' },
    openGraph: {
      title: 'ReadmeCraft — Intelligent GitHub README Studio',
      description: 'Create world-class GitHub Profile & Repository READMEs in seconds with AI auto-detection, Bento grids, and 1-click ecosystem widgets.',
      url: 'https://readme.bharatdn.com',
      siteName: 'ReadmeCraft',
      type: 'website',
      locale: 'en_US',
      images: ['/og-readmecraft.svg'],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'ReadmeCraft — Intelligent GitHub README Studio',
      description: 'Create world-class GitHub Profile & Repository READMEs in seconds. Auto-detection, Bento grids, GitHolo & GitChronicle widgets.',
      images: ['/og-readmecraft.svg'],
      creator: '@ErBharatMalhotra',
      site: '@ErBharatMalhotra',
    },
  };
}

export default function Home() {
  return <StudioClient />;
}