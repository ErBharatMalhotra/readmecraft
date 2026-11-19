import { describe, expect, it } from 'vitest';
import { getProfileSections } from '@/lib/generators';
import { SAMPLE_PROFILE } from '@/lib/github';
import type { ProfileData } from '@/types/readmecraft';

function markdownFor(profile: ProfileData): string {
  return getProfileSections(profile, 'bento', 'gta6')
    .map((section) => section.content)
    .join('\n');
}

describe('degraded profile statistics', () => {
  it('prints n/a instead of fake zeros when REST supplied no contribution data', () => {
    const md = markdownFor({
      ...SAMPLE_PROFILE,
      statsUnavailable: true,
      contributionCalendar: { totalContributions: 0, weeks: [] },
      totalCommitContributions: 0,
      totalIssueContributions: 0,
      totalPullRequestContributions: 0,
      totalPullRequestReviewContributions: 0,
      totalRepositoriesWithContributedCommits: 0,
      starredRepositoriesCount: 0,
      watchingCount: 0,
    });

    expect(md).toContain('| **Total Contributions (1yr)** | n/a |');
    expect(md).toContain('| **Current Streak** | n/a |');
    expect(md).toContain('| **Longest Streak** | n/a |');
    expect(md).toContain('| **Stars Given** | n/a |');
    expect(md).toContain('| **Commits (1yr)** | n/a |');
    expect(md).toContain('| **PR Reviews (1yr)** | n/a |');
    expect(md).not.toContain('| **Total Contributions (1yr)** | 0 |');
    expect(md).not.toContain('| **Current Streak** | 0 days |');

    // Metrics REST does provide stay numeric.
    expect(md).toContain('| **Followers** |');
    expect(md).toContain('| **Public Repositories** |');
  });

  it('renders both animated header badges by default', () => {
    const md = markdownFor({ ...SAMPLE_PROFILE });

    expect(md).toContain('type=name-banner');
    expect(md).toContain('type=typing');
    // Banner first, typing line under it, both above the `# Name` heading.
    expect(md.indexOf('type=name-banner')).toBeLessThan(md.indexOf('type=typing'));
    expect(md.indexOf('type=typing')).toBeLessThan(md.indexOf('# Bharat Malhotra'));
  });

  it('keeps the contact section without an email and renders it when one exists', () => {
    // The GraphQL `email` field is scope-gated, so most tokens return none.
    // Losing it must not remove the section, only the optional Email lines.
    const withoutEmail = markdownFor({ ...SAMPLE_PROFILE, email: null });
    expect(withoutEmail).toContain('🤝 Connect & Collaborate');
    expect(withoutEmail).not.toContain('mailto:');

    const withEmail = markdownFor({ ...SAMPLE_PROFILE, email: 'dev@example.com' });
    expect(withEmail).toContain('- **Email:** [dev@example.com](mailto:dev@example.com)');
    expect(withEmail).toContain('mailto:dev@example.com');
  });

  it('keeps numeric statistics for a full GraphQL profile', () => {
    const md = markdownFor({ ...SAMPLE_PROFILE, statsUnavailable: false });

    expect(md).not.toContain('| **Total Contributions (1yr)** | n/a |');
    expect(md).toContain('| **Total Contributions (1yr)** |');
  });
});
