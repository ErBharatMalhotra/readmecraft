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
    expect(md).toContain('| **Commit Contributions** | n/a |');
    expect(md).toContain('| **PR Review Contributions** | n/a |');
    expect(md).not.toContain('| **Total Contributions (1yr)** | 0 |');
    expect(md).not.toContain('| **Current Streak** | 0 days |');

    // Metrics REST does provide stay numeric.
    expect(md).toContain('| **Followers** |');
    expect(md).toContain('| **Public Repositories** |');
  });

  it('omits the animated typing intro unless the profile opts in', () => {
    expect(markdownFor({ ...SAMPLE_PROFILE })).not.toContain('type=typing');
    expect(markdownFor({ ...SAMPLE_PROFILE, typingIntroEnabled: false })).not.toContain('type=typing');
    expect(markdownFor({ ...SAMPLE_PROFILE, typingIntroEnabled: true })).toContain('type=typing');
  });

  it('keeps numeric statistics for a full GraphQL profile', () => {
    const md = markdownFor({ ...SAMPLE_PROFILE, statsUnavailable: false });

    expect(md).not.toContain('| **Total Contributions (1yr)** | n/a |');
    expect(md).toContain('| **Total Contributions (1yr)** |');
  });
});
