import type { Metadata } from 'next';
import AuditClient from '@/components/AuditClient';

export const metadata: Metadata = {
  title: 'Badge Auditor — find dead README badges',
  description:
    'Free audit for GitHub profile READMEs: detect dead badges (paused github-readme-stats, retired Heroku hosts, travis-ci.org), silent breakages and stale package badges, then copy a fixed README.',
  alternates: { canonical: '/audit' },
  openGraph: {
    title: 'Badge Auditor — find dead README badges',
    description:
      'Paste a GitHub username and see which README badges no longer render, with native replacements you can copy.',
    url: '/audit',
    type: 'website',
  },
};

export default function AuditPage() {
  return <AuditClient />;
}
