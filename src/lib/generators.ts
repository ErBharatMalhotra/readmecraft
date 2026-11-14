import type {
  ProfileData,
  ProjectData,
  ProfilePreset,
  ProjectPreset,
  Section,
  LanguageStat,
  PinnedRepo,
  TopRepository,
  Organization,
  Package,
  Sponsor,
  SocialAccount,
  UserStatus,
  PullRequest,
  Issue,
  Release,
} from '@/types/readmecraft';
import { getThemeById } from '@/lib/themes';

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getLanguageBadge(lang: LanguageStat, bgHex: string, accentHex: string): string {
  return `<img src="https://img.shields.io/badge/-${encodeURIComponent(lang.name)}-${bgHex}?style=flat-square&logo=${encodeURIComponent(lang.name.toLowerCase())}&logoColor=${accentHex}&labelColor=${bgHex}" alt="${lang.name} ${lang.percentage}%" />`;
}

export function getProfileSections(data: ProfileData, preset: ProfilePreset, theme: string = 'gta6'): Section[] {
  const username = data.username || 'ErBharatMalhotra';
  const name = data.name || username;
  const themeObj = getThemeById(theme);
  const themeParam = `&theme=${themeObj.id}`;
  const bgHex = themeObj.bg.replace('#', '');
  const accentHex = themeObj.emerald.replace('#', '');
  const goldHex = themeObj.gold.replace('#', '');
  const textHex = themeObj.textPrimary.replace('#', '');
  const subtextHex = themeObj.textSecondary.replace('#', '');

  // Common sections that can be used across presets
  const commonSections: Section[] = [
    // Header with rich profile data
    {
      id: 'header',
      title: 'Profile Header',
      enabled: true,
      order: 1,
      content: generateHeaderSection(data, username, name, themeObj, bgHex, accentHex, goldHex),
    },
    
    // Ecosystem widgets
    {
      id: 'ecosystem',
      title: 'Ecosystem Widgets (GitHolo & GitChronicle)',
      enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
      order: 2,
      content: generateEcosystemSection(data, username, themeObj, bgHex, accentHex),
    },

    // Status & Social
    {
      id: 'status_social',
      title: 'Status & Social Links',
      enabled: !!data.status || (data.socialAccounts?.length ?? 0) > 0,
      order: 3,
      content: generateStatusSocialSection(data, username, bgHex, accentHex),
    },

    // Detailed Stats Grid
    {
      id: 'stats_grid',
      title: 'Comprehensive GitHub Stats',
      enabled: data.githubStatsEnabled,
      order: 4,
      content: generateStatsGridSection(data, username, themeObj, bgHex, accentHex, subtextHex, themeParam),
    },

    // Languages with bytes
    {
      id: 'languages_detailed',
      title: 'Language Breakdown (Bytes)',
      enabled: (data.languages?.length ?? 0) > 0,
      order: 5,
      content: generateLanguagesDetailedSection(data, bgHex, accentHex),
    },

    // Skills from repo topics
    {
      id: 'skills_enhanced',
      title: 'Technology Skills (from Repos)',
      enabled: (data.skills?.length ?? 0) > 0,
      order: 6,
      content: generateSkillsEnhancedSection(data, bgHex, accentHex),
    },

    // Pinned repositories with full details
    {
      id: 'pinned_repos_detailed',
      title: 'Pinned Repositories (Detailed)',
      enabled: (data.pinnedRepos?.length ?? 0) > 0,
      order: 7,
      content: generatePinnedReposDetailedSection(data, bgHex, accentHex),
    },

    // Top repositories by stars
    {
      id: 'top_repos',
      title: 'Top Repositories by Stars',
      enabled: (data.topRepositories?.length ?? 0) > 0,
      order: 8,
      content: generateTopReposSection(data, bgHex, accentHex),
    },

    // Organizations
    {
      id: 'organizations',
      title: 'Organizations',
      enabled: (data.organizations?.length ?? 0) > 0,
      order: 9,
      content: generateOrganizationsSection(data, bgHex, accentHex),
    },

    // Packages
    {
      id: 'packages',
      title: 'Published Packages',
      enabled: (data.packages?.length ?? 0) > 0,
      order: 10,
      content: generatePackagesSection(data, bgHex, accentHex),
    },

    // Sponsors
    {
      id: 'sponsors',
      title: 'Sponsors & Sponsorships',
      enabled: (data.sponsors?.length ?? 0) > 0 || (data.sponsorshipsAsMaintainer?.length ?? 0) > 0,
      order: 11,
      content: generateSponsorsSection(data, bgHex, accentHex),
    },

    // Contribution details
    {
      id: 'contribution_details',
      title: 'Contribution Breakdown',
      enabled: data.githubStatsEnabled,
      order: 12,
      content: generateContributionDetailsSection(data, bgHex, accentHex),
    },

    // Repositories contributed to
    {
      id: 'repos_contributed',
      title: 'Repositories Contributed To',
      enabled: (data.repositoriesContributedTo?.length ?? 0) > 0,
      order: 13,
      content: generateReposContributedSection(data, bgHex, accentHex),
    },

    // Recent activity
    {
      id: 'recent_activity',
      title: 'Recent Pull Requests & Issues',
      enabled: (data.recentPullRequests?.length ?? 0) > 0 || (data.recentIssues?.length ?? 0) > 0,
      order: 14,
      content: generateRecentActivitySection(data, bgHex, accentHex),
    },

    // Contact
    {
      id: 'contact',
      title: 'Contact & Collaboration',
      enabled: true,
      order: 15,
      content: generateContactSection(data, username, bgHex, accentHex),
    },
  ];

  // Filter enabled sections and return
  return commonSections.filter(s => s.enabled);
}

// ============================================================================
// SECTION GENERATORS
// ============================================================================

function generateHeaderSection(data: ProfileData, username: string, name: string, themeObj: any, bgHex: string, accentHex: string, goldHex: string): string {
  const location = data.location || 'Global';
  const website = data.website || `https://github.com/${username}`;
  const twitter = data.twitter || username;
  const company = data.company ? `🏢 **${data.company}**` : '';
  const createdYear = data.createdAt ? new Date(data.createdAt).getFullYear() : '';
  const accountAge = createdYear ? ` (since ${createdYear})` : '';

  return `<div align="center">

# ${name}${accountAge}
### ${data.bio || 'Building resilient systems & high-taste developer tools.'}

${company}

<p align="center">
  <a href="https://github.com/${username}"><img src="https://img.shields.io/github/followers/${username}?label=Followers&style=for-the-badge&color=${accentHex}&labelColor=${bgHex}" alt="Followers" /></a>
  <a href="${website}"><img src="https://img.shields.io/badge/Portfolio-Live-${accentHex}?style=for-the-badge&labelColor=${bgHex}" alt="Website" /></a>
  <a href="https://twitter.com/${twitter}"><img src="https://img.shields.io/badge/Twitter-@${twitter}-${accentHex}?style=for-the-badge&labelColor=${bgHex}" alt="Twitter" /></a>
  ${data.email ? `<a href="mailto:${data.email}"><img src="https://img.shields.io/badge/Email-Contact-${accentHex}?style=for-the-badge&labelColor=${bgHex}" alt="Email" /></a>` : ''}
</p>

${data.pronouns ? `> **Pronouns:** ${data.pronouns}` : ''}

</div>

---`;
}

function generateEcosystemSection(data: ProfileData, username: string, themeObj: any, bgHex: string, accentHex: string): string {
  return `### 🌌 Holographic Telemetry & Live Cadence

<div align="center">

${data.gitHoloEnabled ? `[![GitHolo 3D Card](https://githolo.bharatdn.com/api/og/${username})](https://githolo.bharatdn.com)` : ''}

${data.gitChronicleEnabled ? `[![GitChronicle Cadence](https://gitchronicle.bharatdn.com/badge/${username}.svg)](https://gitchronicle.bharatdn.com)` : ''}

</div>`;
}

function generateStatusSocialSection(data: ProfileData, username: string, bgHex: string, accentHex: string): string {
  let content = `### 🎯 Current Status & Social Presence

`;

  if (data.status) {
    content += `**${data.status.emoji} ${data.status.message}**${data.status.expiresAt ? ` (expires ${formatDate(data.status.expiresAt)})` : ''}\n\n`;
  }

  if ((data.socialAccounts?.length ?? 0) > 0) {
    content += `**Social Accounts:**\n\n`;
    data.socialAccounts!.forEach(acc => {
      const icon = acc.provider === 'TWITTER' ? '𝕏' : acc.provider === 'LINKEDIN' ? '💼' : acc.provider === 'WEBSITE' ? '🌐' : '🔗';
      content += `- ${icon} [${acc.provider}](${acc.url})\n`;
    });
    content += '\n';
  }

  return content;
}

function generateStatsGridSection(data: ProfileData, username: string, themeObj: any, bgHex: string, accentHex: string, subtextHex: string, themeParam: string): string {
  const totalContributions = data.contributionCalendar?.totalContributions ?? 0;
  const currentStreak = calculateCurrentStreak(data.contributionCalendar ?? { totalContributions: 0, weeks: [] });
  const longestStreak = calculateLongestStreak(data.contributionCalendar ?? { totalContributions: 0, weeks: [] });

  return `### 📈 Velocity & Metrics

<div align="center">

![Public Repos](https://readme.bharatdn.com/api/badges?username=${username}&type=repos${themeParam})
![Followers](https://readme.bharatdn.com/api/badges?username=${username}&type=followers${themeParam})
![Following](https://readme.bharatdn.com/api/badges?username=${username}&type=following${themeParam})
![Stars Given](https://readme.bharatdn.com/api/badges?username=${username}&type=stars&label=Stars%20Given${themeParam})
${data.topLanguagesEnabled && (data.languages?.length ?? 0) > 0 ? `\n![Top Language](https://readme.bharatdn.com/api/badges?username=${username}&type=language${themeParam})` : ''}
${data.githubStreakEnabled ? `\n![Streak](https://readme.bharatdn.com/api/badges?username=${username}&type=streak${themeParam})` : ''}

</div>

<details>
<summary><b>📊 Detailed Statistics</b></summary>

| Metric | Value |
| :--- | :--- |
| **Total Contributions (1yr)** | ${formatNumber(totalContributions)} |
| **Current Streak** | ${currentStreak} days |
| **Longest Streak** | ${longestStreak} days |
| **Public Repositories** | ${formatNumber(data.publicRepos)} |
| **Total Disk Usage** | ${formatBytes(data.totalDiskUsage ?? 0)} |
| **Followers** | ${formatNumber(data.followers)} |
| **Following** | ${formatNumber(data.following)} |
| **Stars Given** | ${formatNumber(data.starredRepositoriesCount ?? 0)} |
| **Watching** | ${formatNumber(data.watchingCount ?? 0)} |
| **Public Gists** | ${formatNumber(data.gistsCount ?? 0)} |
| **Commit Contributions** | ${formatNumber(data.totalCommitContributions ?? 0)} |
| **Issue Contributions** | ${formatNumber(data.totalIssueContributions ?? 0)} |
| **PR Contributions** | ${formatNumber(data.totalPullRequestContributions ?? 0)} |
| **PR Review Contributions** | ${formatNumber(data.totalPullRequestReviewContributions ?? 0)} |
| **Repos Contributed To** | ${formatNumber(data.totalRepositoriesWithContributedCommits ?? 0)} |
| **Account Created** | ${data.createdAt ? formatDate(data.createdAt) : 'Unknown'} |
| **Profile View Type** | ${data.userViewType ?? 'Unknown'} |
| **Sponsorable** | ${data.isSponsorable ? '✅ Yes' : '❌ No'} |

</details>`;
}

function generateLanguagesDetailedSection(data: ProfileData, bgHex: string, accentHex: string): string {
  if ((data.languages?.length ?? 0) === 0) return '';

  const totalBytes = (data.languages ?? []).reduce((sum, l) => sum + (l.bytes || 0), 0);

  return `### 🔤 Language Breakdown (by Repository Bytes)

<div align="center">

${(data.languages ?? []).map(l => getLanguageBadge(l, bgHex, accentHex)).join(' ')}

</div>

<details>
<summary><b>📊 Language Statistics</b></summary>

| Language | Percentage | Estimated Bytes |
| :--- | :---: | :--- |
${(data.languages ?? []).map(l => `| **${l.name}** | ${l.percentage}% | ${l.bytes ? formatBytes(l.bytes) : 'N/A'} |`).join('\n')}
| **Total** | **100%** | ${totalBytes > 0 ? formatBytes(totalBytes) : 'N/A'} |

</details>`;
}

function generateSkillsEnhancedSection(data: ProfileData, bgHex: string, accentHex: string): string {
  if ((data.skills?.length ?? 0) === 0) return '';

  // Group skills by category
  const skills = data.skills ?? [];
  const langSkills = skills.filter(s => ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'C', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'Ruby', 'PHP', 'HTML', 'CSS', 'Shell', 'SQL', 'GraphQL'].includes(s));
  const frameworkSkills = skills.filter(s => ['React', 'Next.js', 'Vue', 'Svelte', 'Express', 'FastAPI', 'Django', 'Spring', 'Rails', 'Laravel', 'TailwindCSS', 'Node.js', 'Deno', 'Bun'].some(f => s.toLowerCase().includes(f.toLowerCase())));
  const infraSkills = skills.filter(s => ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'Ansible', 'CI/CD', 'GitHub Actions', 'GitLab CI', 'Jenkins', 'Linux', 'Nginx', 'PostgreSQL', 'Redis', 'MongoDB', 'MySQL', 'Elasticsearch', 'Kafka', 'RabbitMQ', 'Prometheus', 'Grafana', 'Jaeger'].some(f => s.toLowerCase().includes(f.toLowerCase())));
  const otherSkills = skills.filter(s => !langSkills.includes(s) && !frameworkSkills.includes(s) && !infraSkills.includes(s));

  let content = `### ⚔️ Technology Arsenal

<div align="center">

`;

  if (langSkills.length > 0) {
    content += `<details open><summary><b>🗣️ Languages (${langSkills.length})</b></summary>\n\n`;
    content += langSkills.map(s => `<img src="https://img.shields.io/badge/-${encodeURIComponent(s)}-${bgHex}?style=flat-square&logo=${encodeURIComponent(s.toLowerCase())}&logoColor=${accentHex}&labelColor=${bgHex}" alt="${s}" />`).join(' ') + '\n\n</details>\n\n';
  }

  if (frameworkSkills.length > 0) {
    content += `<details open><summary><b>⚡ Frameworks & Libraries (${frameworkSkills.length})</b></summary>\n\n`;
    content += frameworkSkills.map(s => `<img src="https://img.shields.io/badge/-${encodeURIComponent(s)}-${bgHex}?style=flat-square&logo=${encodeURIComponent(s.toLowerCase())}&logoColor=${accentHex}&labelColor=${bgHex}" alt="${s}" />`).join(' ') + '\n\n</details>\n\n';
  }

  if (infraSkills.length > 0) {
    content += `<details open><summary><b>☁️ Infrastructure & DevOps (${infraSkills.length})</b></summary>\n\n`;
    content += infraSkills.map(s => `<img src="https://img.shields.io/badge/-${encodeURIComponent(s)}-${bgHex}?style=flat-square&logo=${encodeURIComponent(s.toLowerCase())}&logoColor=${accentHex}&labelColor=${bgHex}" alt="${s}" />`).join(' ') + '\n\n</details>\n\n';
  }

  if (otherSkills.length > 0) {
    content += `<details><summary><b>🛠️ Other Skills (${otherSkills.length})</b></summary>\n\n`;
    content += otherSkills.map(s => `<img src="https://img.shields.io/badge/-${encodeURIComponent(s)}-${bgHex}?style=flat-square&logoColor=${accentHex}&labelColor=${bgHex}" alt="${s}" />`).join(' ') + '\n\n</details>\n\n';
  }

  content += `</div>`;

  return content;
}

function generatePinnedReposDetailedSection(data: ProfileData, bgHex: string, accentHex: string): string {
  if (data.pinnedRepos.length === 0) return '';

  let content = `### 🚀 Featured Repositories

<div align="center">

${data.pinnedRepos
  .map(
    (repo) => `[![${repo.name}](${repo.language ? `https://img.shields.io/badge/${repo.name}-${repo.language}-${accentHex}?style=for-the-badge&logo=github&logoColor=white&labelColor=${bgHex}` : `https://img.shields.io/badge/${repo.name}-${accentHex}?style=for-the-badge&logo=github&logoColor=white&labelColor=${bgHex}`})](${repo.url})`
  )
  .join(' ')}

</div>

${data.pinnedRepos.length > 0 ? `
<details>
<summary><b>Repository Details</b></summary>

${data.pinnedRepos
  .map(
    (repo) => '- **[' + repo.name + '](' + repo.url + ')** ' + (repo.description ? '\u2014 ' + repo.description : '') + ' ' + (repo.language ? '`' + repo.language + '`' : '') + ' ' + (repo.topics && repo.topics.length > 0 ? '[' + repo.topics.slice(0, 5).join(', ') + ']' : '') + ' \u2B50 ' + repo.stargazersCount + ' ' + (repo.forksCount ? '\uD83C\uDF74 ' + repo.forksCount : '') + ' ' + (repo.license ? '\uD83D\uDCC4 ' + repo.license : '') + ' ' + (repo.isFork ? '\uD83C\uDF74 Fork' : '') + ' ' + (repo.isArchived ? '\uD83D\uDCE6 Archived' : '') + ' ' + (repo.homepageUrl ? '\uD83D\uDD17 [Demo](' + repo.homepageUrl + ')' : '') + ' ' + (repo.releases && repo.releases.length > 0 ? '\uD83C\uDFF7\uFE0F Latest: ' + repo.releases[0].tagName : '')
  )
  .join('\n')}

</details>` : ''}`;

  return content;
}

function generateTopReposSection(data: ProfileData, bgHex: string, accentHex: string): string {
  if ((data.topRepositories?.length ?? 0) === 0) return '';

  return `### ⭐ Top Repositories by Stars

| Repository | Stars | Language | Description |
| :--- | :---: | :--- | :--- |
${(data.topRepositories ?? []).map(
    (repo) => '| **[' + repo.name + '](' + repo.url + ')** | \u2B50 ' + formatNumber(repo.stargazerCount) + ' | ' + (repo.primaryLanguage ? '`' + repo.primaryLanguage.name + '`' : '\u2014') + ' | ' + (repo.description || 'No description') + ' |'
  )
  .join('\n')}`;
}

function generateOrganizationsSection(data: ProfileData, bgHex: string, accentHex: string): string {
  if ((data.organizations?.length ?? 0) === 0) return '';

  return `### 🏢 Organizations

<div align="center">

${(data.organizations ?? []).map(
    (org) => `[![${org.name || org.login}](${org.avatarUrl}&s=64)](${org.url})`
  )
  .join(' ')}

</div>

${(data.organizations ?? []).map(
    (org) => `- **${org.name || org.login}** — [${org.login}](${org.url})`
  )
  .join('\n')}`;
}

function generatePackagesSection(data: ProfileData, bgHex: string, accentHex: string): string {
  if ((data.packages?.length ?? 0) === 0) return '';

  return `### 📦 Published Packages

| Package | Type | Version | Link |
| :--- | :--- | :--- | :--- |
${(data.packages ?? []).map(
    (pkg) => `| \`${pkg.name}\` | ${pkg.packageType} | ${pkg.version || '—'} | [View](${pkg.url}) |`
  )
  .join('\n')}`;
}

function generateSponsorsSection(data: ProfileData, bgHex: string, accentHex: string): string {
  if ((data.sponsors?.length ?? 0) === 0 && (data.sponsorshipsAsMaintainer?.length ?? 0) === 0) return '';

  let content = `### 💖 Sponsors & Sponsorships\n\n`;

  if ((data.sponsors?.length ?? 0) > 0) {
    content += `**Sponsors (${data.sponsors!.length}):**\n\n<div align="center">\n\n${data.sponsors!.map(s => `[![${s.login}](${s.avatarUrl}&s=40)](${s.url})`).join(' ')}\n\n</div>\n\n`;
  }

  if ((data.sponsorshipsAsMaintainer?.length ?? 0) > 0) {
    content += `**Sponsorships as Maintainer:**\n\n`;
    (data.sponsorshipsAsMaintainer ?? []).forEach(s => {
      const tierName = s.tier.name;
      const monthly = (s.tier.monthlyPriceInCents / 100).toFixed(2);
      content += `- **${s.sponsorEntity.name || s.sponsorEntity.login}** — ${tierName} ($${monthly}/mo)\n`;
    });
    content += '\n';
  }

  if (data.isSponsorable) {
    content += `> 💝 [Sponsor this developer](https://github.com/sponsors/${data.username})`;
  }

  return content;
}

function generateContributionDetailsSection(data: ProfileData, bgHex: string, accentHex: string): string {
  return `### 📊 Contribution Breakdown

<details>
<summary><b>Contribution Types</b></summary>

| Type | Count |
| :--- | :---: |
| **Commits** | ${formatNumber(data.totalCommitContributions ?? 0)} |
| **Issues** | ${formatNumber(data.totalIssueContributions ?? 0)} |
| **Pull Requests** | ${formatNumber(data.totalPullRequestContributions ?? 0)} |
| **PR Reviews** | ${formatNumber(data.totalPullRequestReviewContributions ?? 0)} |
| **Repositories** | ${formatNumber(data.totalRepositoriesWithContributedCommits ?? 0)} |

</details>

<details>
<summary><b>Contribution Calendar (Heatmap)</b></summary>

<div align="center">
  <img src="https://readme.bharatdn.com/api/badges?username=${data.username}&type=heatmap" alt="Contribution Heatmap" />
</div>

<div align="center">
  <img src="https://readme.bharatdn.com/api/badges?username=${data.username}&type=snake&v=14" alt="Contribution Snake" />
</div>

<details>
<summary><b>🗓️ Weekly Breakdown</b></summary>

${generateWeeklyBreakdown(data.contributionCalendar ?? { totalContributions: 0, weeks: [] })}

</details>`;
}

function generateWeeklyBreakdown(calendar: any): string {
  if (!calendar.weeks || calendar.weeks.length === 0) return 'No data available';
  
  // Show last 4 weeks
  const recentWeeks = calendar.weeks.slice(-4);
  return recentWeeks.map((week: any, i: number) => {
    const weekTotal = week.contributionDays.reduce((sum: number, d: any) => sum + (d.contributionCount || 0), 0);
    const startDate = week.contributionDays[0]?.date;
    const endDate = week.contributionDays[6]?.date;
    return `- **Week ${recentWeeks.length - i}** (${startDate} to ${endDate}): ${weekTotal} contributions`;
  }).join('\n');
}

function generateReposContributedSection(data: ProfileData, bgHex: string, accentHex: string): string {
  if ((data.repositoriesContributedTo?.length ?? 0) === 0) return '';

  return `### 🤝 Repositories Contributed To

| Repository | Owner | Stars | Language | Contributions |
| :--- | :--- | :---: | :--- | :---: |
${(data.repositoriesContributedTo ?? []).slice(0, 10).map(
    (repo) => '| **[' + repo.name + '](' + repo.url + ')** | ' + repo.owner.login + ' | \u2B50 ' + formatNumber(repo.stargazerCount) + ' | ' + (repo.primaryLanguage ? '`' + repo.primaryLanguage.name + '`' : '\u2014') + ' | ' + (repo.contributions?.totalCount || 0) + ' |'
  )
  .join('\n')}`;
}

function generateRecentActivitySection(data: ProfileData, bgHex: string, accentHex: string): string {
  let content = `### 🔄 Recent Activity\n\n`;

  if ((data.recentPullRequests?.length ?? 0) > 0) {
    content += `**Recent Pull Requests:**\n\n`;
    (data.recentPullRequests ?? []).slice(0, 5).forEach(pr => {
      const stateIcon = pr.state === 'MERGED' ? '✅' : pr.state === 'OPEN' ? '🔄' : '❌';
      content += `- ${stateIcon} **[${pr.title}](${pr.url})** in \`${pr.repository.owner.login}/${pr.repository.name}\` ${pr.mergedAt ? `(merged ${formatDate(pr.mergedAt)})` : ''}\n`;
    });
    content += '\n';
  }

  if ((data.recentIssues?.length ?? 0) > 0) {
    content += `**Recent Issues:**\n\n`;
    (data.recentIssues ?? []).slice(0, 5).forEach(issue => {
      const stateIcon = issue.state === 'OPEN' ? '🔴' : '✅';
      content += `- ${stateIcon} **[${issue.title}](${issue.url})** in \`${issue.repository.owner.login}/${issue.repository.name}\`\n`;
    });
    content += '\n';
  }

  return content;
}

function generateContactSection(data: ProfileData, username: string, bgHex: string, accentHex: string): string {
  const website = data.website || `https://github.com/${username}`;
  const twitter = data.twitter || username;

  return `### 🤝 Connect & Collaborate

- **Web:** [${website}](${website})
- **GitHub:** [@${username}](https://github.com/${username})
- **Twitter / 𝕏:** [@${twitter}](https://twitter.com/${twitter})
${data.email ? `- **Email:** [${data.email}](mailto:${data.email})` : ''}
${data.company ? `- **Company:** ${data.company}` : ''}
${data.location ? `- **Location:** ${data.location}` : ''}

---

<div align="center">
<sub>Generated with ❤️ by <a href="https://readme.bharatdn.com">ReadmeCraft</a> • Part of the <a href="https://bharatdn.com">BharatDN</a> Developer Ecosystem</sub>
</div>`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateCurrentStreak(calendar: any): number {
  if (!calendar.weeks || calendar.weeks.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check from most recent week backwards
  for (let w = calendar.weeks.length - 1; w >= 0; w--) {
    const week = calendar.weeks[w];
    for (let d = 6; d >= 0; d--) {
      const day = week.contributionDays[d];
      if (!day) continue;
      
      const dayDate = new Date(day.date);
      dayDate.setHours(0, 0, 0, 0);
      
      if (dayDate > today) continue; // Future date
      
      if (day.contributionCount > 0) {
        streak++;
      } else if (dayDate < today) {
        return streak; // Streak broken
      }
    }
  }
  
  return streak;
}

function calculateLongestStreak(calendar: any): number {
  if (!calendar.weeks || calendar.weeks.length === 0) return 0;
  
  let maxStreak = 0;
  let currentStreak = 0;
  
  for (const week of calendar.weeks) {
    for (const day of week.contributionDays) {
      if (day.contributionCount > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
  }
  
  return maxStreak;
}

// ============================================================================
// PROJECT SECTIONS (Enhanced with rich data)
// ============================================================================

export function getProjectSections(data: ProjectData, preset: ProjectPreset, theme: string = 'gta6'): Section[] {
  const themeObj = getThemeById(theme);
  const bgHex = themeObj.bg.replace('#', '');
  const accentHex = themeObj.emerald.replace('#', '');
  const goldHex = themeObj.gold.replace('#', '');
  const themeParam = `&theme=${themeObj.id}`;

  if (preset === 'cli') {
    return getCLIProjectSections(data, themeObj, bgHex, accentHex, goldHex, themeParam);
  }

  if (preset === 'api') {
    return getAPIProjectSections(data, themeObj, bgHex, accentHex, goldHex, themeParam);
  }

  return getStandardProjectSections(data, themeObj, bgHex, accentHex, goldHex, themeParam);
}

function getCLIProjectSections(data: ProjectData, themeObj: any, bgHex: string, accentHex: string, goldHex: string, themeParam: string): Section[] {
  return [
    {
      id: 'header',
      title: 'Header & Badges',
      enabled: true,
      order: 1,
      content: generateCLIHeader(data, bgHex, accentHex),
    },
    {
      id: 'quickstart',
      title: 'Terminal Quickstart',
      enabled: true,
      order: 2,
      content: generateCLIQuickstart(data),
    },
    {
      id: 'features',
      title: 'Core Capabilities',
      enabled: true,
      order: 3,
      content: generateCLIFeatures(data),
    },
    {
      id: 'usage',
      title: 'CLI Usage & Flags',
      enabled: true,
      order: 4,
      content: generateCLIUsage(data),
    },
    {
      id: 'releases',
      title: 'Release History',
      enabled: (data.releases?.length ?? 0) > 0,
      order: 5,
      content: generateReleasesSection(data, bgHex, accentHex),
    },
    {
      id: 'tech_stack',
      title: 'Tech Stack',
      enabled: true,
      order: 6,
      content: generateTechStackSection(data, bgHex, accentHex),
    },
    {
      id: 'ecosystem',
      title: 'Ecosystem Telemetry',
      enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
      order: 7,
      content: generateEcosystemProjectSection(data, bgHex, accentHex),
    },
    {
      id: 'license',
      title: 'License',
      enabled: true,
      order: 8,
      content: generateLicenseSection(data),
    },
  ];
}

function getAPIProjectSections(data: ProjectData, themeObj: any, bgHex: string, accentHex: string, goldHex: string, themeParam: string): Section[] {
  return [
    {
      id: 'header',
      title: 'API Title & Metadata',
      enabled: true,
      order: 1,
      content: generateAPIHeader(data, bgHex, accentHex),
    },
    {
      id: 'installation',
      title: 'Installation & Setup',
      enabled: true,
      order: 2,
      content: generateInstallationSection(data),
    },
    {
      id: 'api_reference',
      title: 'API Quick Reference',
      enabled: true,
      order: 3,
      content: generateAPIReferenceSection(data),
    },
    {
      id: 'architecture',
      title: 'System Architecture',
      enabled: true,
      order: 4,
      content: generateArchitectureSection(data),
    },
    {
      id: 'endpoints',
      title: 'Endpoints & Examples',
      enabled: true,
      order: 5,
      content: generateEndpointsSection(data),
    },
    {
      id: 'releases',
      title: 'Releases & Changelog',
      enabled: (data.releases?.length ?? 0) > 0,
      order: 6,
      content: generateReleasesSection(data, bgHex, accentHex),
    },
    {
      id: 'testing',
      title: 'Testing & Verification',
      enabled: true,
      order: 7,
      content: generateTestingSection(data),
    },
    {
      id: 'ecosystem',
      title: 'Ecosystem & Cross-Promotion',
      enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
      order: 8,
      content: generateEcosystemProjectSection(data, bgHex, accentHex),
    },
    {
      id: 'license',
      title: 'License',
      enabled: true,
      order: 9,
      content: generateLicenseSection(data),
    },
  ];
}

function getStandardProjectSections(data: ProjectData, themeObj: any, bgHex: string, accentHex: string, goldHex: string, themeParam: string): Section[] {
  return [
    {
      id: 'header',
      title: 'Hero Banner & Badges',
      enabled: true,
      order: 1,
      content: generateStandardHeader(data, bgHex, accentHex, themeParam),
    },
    {
      id: 'badges_detailed',
      title: 'Detailed Repository Badges',
      enabled: true,
      order: 2,
      content: generateDetailedBadgesSection(data, bgHex, accentHex, themeParam),
    },
    {
      id: 'features',
      title: 'Core Features & Value Proposition',
      enabled: true,
      order: 3,
      content: generateFeaturesSection(data),
    },
    {
      id: 'tech_stack',
      title: 'Tech Stack & Dependencies',
      enabled: true,
      order: 4,
      content: generateTechStackSection(data, bgHex, accentHex),
    },
    {
      id: 'languages_detailed',
      title: 'Language Statistics',
      enabled: (data.languages?.length ?? 0) > 0,
      order: 5,
      content: generateProjectLanguagesSection(data, bgHex, accentHex),
    },
    {
      id: 'topics',
      title: 'Repository Topics',
      enabled: (data.repositoryTopics?.length ?? 0) > 0,
      order: 6,
      content: generateTopicsSection(data, bgHex, accentHex),
    },
    {
      id: 'architecture',
      title: 'System Architecture',
      enabled: true,
      order: 7,
      content: generateArchitectureSection(data),
    },
    {
      id: 'releases',
      title: 'Releases & Changelog',
      enabled: (data.releases?.length ?? 0) > 0,
      order: 8,
      content: generateReleasesSection(data, bgHex, accentHex),
    },
    {
      id: 'deployments',
      title: 'Deployments & Environments',
      enabled: (data.deployments?.length ?? 0) > 0 || (data.environments?.length ?? 0) > 0,
      order: 9,
      content: generateDeploymentsSection(data, bgHex, accentHex),
    },
    {
      id: 'packages',
      title: 'Published Packages',
      enabled: (data.packages?.length ?? 0) > 0,
      order: 10,
      content: generateProjectPackagesSection(data, bgHex, accentHex),
    },
    {
      id: 'workflows',
      title: 'CI/CD Workflows',
      enabled: (data.workflows?.length ?? 0) > 0,
      order: 11,
      content: generateWorkflowsSection(data, bgHex, accentHex),
    },
    {
      id: 'security',
      title: 'Security & Dependencies',
      enabled: (data.vulnerabilityAlerts?.length ?? 0) > 0 || (data.dependencyGraphManifests?.length ?? 0) > 0,
      order: 12,
      content: generateSecuritySection(data, bgHex, accentHex),
    },
    {
      id: 'getting_started',
      title: 'Installation & Local Development',
      enabled: true,
      order: 13,
      content: generateGettingStartedSection(data),
    },
    {
      id: 'community',
      title: 'Community & Support',
      enabled: (data.hasIssuesEnabled ?? false) || (data.hasDiscussionsEnabled ?? false) || (data.hasWikiEnabled ?? false) || (data.fundingLinks?.length ?? 0) > 0,
      order: 14,
      content: generateCommunitySection(data, bgHex, accentHex),
    },
    {
      id: 'ecosystem',
      title: 'Ecosystem Cross-Pollination',
      enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
      order: 15,
      content: generateEcosystemProjectSection(data, bgHex, accentHex),
    },
    {
      id: 'contributing',
      title: 'Contributing & Community',
      enabled: true,
      order: 16,
      content: generateContributingSection(data),
    },
    {
      id: 'license',
      title: 'License',
      enabled: true,
      order: 17,
      content: generateLicenseSection(data),
    },
    {
      id: 'footer',
      title: 'Footer & Credits',
      enabled: true,
      order: 18,
      content: generateProjectFooter(data, bgHex, accentHex),
    },
  ];
}

// ============================================================================
// PROJECT SECTION GENERATORS
// ============================================================================

function generateCLIHeader(data: ProjectData, bgHex: string, accentHex: string): string {
  return `# ⚡ ${data.title}

> ${data.description}

[![Stars](https://img.shields.io/github/stars/${data.owner}/${data.repo}?style=flat-square&color=${accentHex}&labelColor=${bgHex})](https://github.com/${data.owner}/${data.repo})
[![License](https://img.shields.io/badge/License-${data.license}-${accentHex}?style=flat-square&labelColor=${bgHex})](https://opensource.org/licenses/${data.license})
[![Language](https://img.shields.io/badge/Language-${encodeURIComponent(data.language)}-${accentHex}?style=flat-square&labelColor=${bgHex})](https://github.com/${data.owner}/${data.repo})
[![Version](https://img.shields.io/badge/Version-Latest-${accentHex}?style=flat-square&labelColor=${bgHex})](https://github.com/${data.owner}/${data.repo}/releases)
${data.homepageUrl ? `[![Demo](https://img.shields.io/badge/Demo-Live-${accentHex}?style=flat-square&labelColor=${bgHex})](${data.homepageUrl})` : ''}`;
}

function generateCLIQuickstart(data: ProjectData): string {
  return `## 🚀 Quick Install

\`\`\`bash
# Install globally via ${data.packageManager}
${data.packageManager === 'cargo' ? `cargo install ${data.repo}` : data.packageManager === 'go' ? `go install github.com/${data.owner}/${data.repo}@latest` : data.packageManager === 'pip' ? `pip install ${data.repo}` : `npm install -g ${data.repo}`}

# Run directly
${data.repo} --help
\`\`\``;
}

function generateCLIFeatures(data: ProjectData): string {
  return `## 💎 Features

${data.features.map((f) => `- ${f}`).join('\n')}`;
}

function generateCLIUsage(data: ProjectData): string {
  return `## 💻 Usage

\`\`\`bash
# Basic run
${data.repo} start

# Custom configuration flag
${data.repo} --config ./custom.config.json --verbose

# Show version
${data.repo} --version
\`\`\``;
}

function generateAPIHeader(data: ProjectData, bgHex: string, accentHex: string): string {
  return `# 🔌 ${data.title} (Developer API)

> ${data.description}

[![Stars](https://img.shields.io/github/stars/${data.owner}/${data.repo}?style=for-the-badge&color=${accentHex}&labelColor=${bgHex})](https://github.com/${data.owner}/${data.repo})
[![License: ${data.license}](https://img.shields.io/badge/License-${data.license}-${accentHex}?style=for-the-badge&labelColor=${bgHex})](LICENSE)
[![Version](https://img.shields.io/badge/Version-Latest-${accentHex}?style=for-the-badge&labelColor=${bgHex})](https://github.com/${data.owner}/${data.repo}/releases)
${data.homepageUrl ? `[![Docs](https://img.shields.io/badge/Docs-Live-${accentHex}?style=for-the-badge&labelColor=${bgHex})](${data.homepageUrl})` : ''}`;
}

function generateInstallationSection(data: ProjectData): string {
  return `## 📦 Installation

\`\`\`bash
${data.installCommand}
\`\`\``;
}

function generateAPIReferenceSection(data: ProjectData): string {
  return `## 📖 Code Example

\`\`\`typescript
import { createClient } from '${data.repo}';

const client = createClient({
  endpoint: 'https://api.example.com',
  apiKey: process.env.API_KEY,
});

async function run() {
  const result = await client.execute();
  console.log('Result:', result);
}

run();
\`\`\``;
}

function generateEndpointsSection(data: ProjectData): string {
  return `## 🛣️ Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| \`GET\` | \`/health\` | Health check |
| \`GET\` | \`/api/v1/resources\` | List resources |
| \`POST\` | \`/api/v1/resources\` | Create resource |
| \`GET\` | \`/api/v1/resources/:id\` | Get resource |
| \`PUT\` | \`/api/v1/resources/:id\` | Update resource |
| \`DELETE\` | \`/api/v1/resources/:id\` | Delete resource |

> See [API Documentation](${data.homepageUrl || `https://github.com/${data.owner}/${data.repo}`}) for full reference.`;
}

function generateStandardHeader(data: ProjectData, bgHex: string, accentHex: string, themeParam: string): string {
  return `<div align="center">

# 🛠️ ${data.title}
> ${data.description}

[![Stars](https://img.shields.io/github/stars/${data.owner}/${data.repo}?style=for-the-badge&color=${accentHex}&labelColor=${bgHex})](https://github.com/${data.owner}/${data.repo}/stargazers)
[![Forks](https://img.shields.io/github/forks/${data.owner}/${data.repo}?style=for-the-badge&color=${accentHex}&labelColor=${bgHex})](https://github.com/${data.owner}/${data.repo}/network/members)
[![License: ${data.license}](https://img.shields.io/badge/License-${data.license}-${accentHex}?style=for-the-badge&labelColor=${bgHex})](LICENSE)
[![Built With](https://img.shields.io/badge/Stack-${encodeURIComponent(data.language)}-${accentHex}?style=for-the-badge&labelColor=${bgHex})](https://github.com/${data.owner}/${data.repo})
[![Version](https://img.shields.io/badge/Version-Latest-${accentHex}?style=for-the-badge&labelColor=${bgHex})](https://github.com/${data.owner}/${data.repo}/releases)
${data.homepageUrl ? `[**Explore Live Demo 🚀**](${data.homepageUrl})` : ''}

</div>

---`;
}

function generateDetailedBadgesSection(data: ProjectData, bgHex: string, accentHex: string, themeParam: string): string {
  return `### 📊 Repository Metrics

<div align="center">

![Stars](https://readme.bharatdn.com/api/badges?username=${data.owner}&repo=${data.repo}&type=stars${themeParam})
![Forks](https://readme.bharatdn.com/api/badges?username=${data.owner}&repo=${data.repo}&type=forks${themeParam})
![Issues](https://readme.bharatdn.com/api/badges?username=${data.owner}&repo=${data.repo}&type=issues${themeParam})
![License](https://readme.bharatdn.com/api/badges?username=${data.owner}&repo=${data.repo}&type=license${themeParam})
![Size](https://readme.bharatdn.com/api/badges?username=${data.owner}&repo=${data.repo}&type=size${themeParam})
![Last Commit](https://readme.bharatdn.com/api/badges?username=${data.owner}&repo=${data.repo}&type=last-commit${themeParam})

</div>

<details>
<summary><b>📈 Detailed Stats</b></summary>

| Metric | Value |
| :--- | :--- |
| **Stars** | ${formatNumber(data.stargazerCount ?? 0)} |
| **Forks** | ${formatNumber(data.forkCount)} |
| **Open Issues** | ${formatNumber(data.openIssues)} |
| **Closed Issues** | ${formatNumber(data.closedIssues ?? 0)} |
| **Disk Usage** | ${formatBytes(data.diskUsage ?? 0)} |
| **Total Language Size** | ${formatBytes(data.totalLanguageSize ?? 0)} |
| **Default Branch** | \`${data.defaultBranch}\` |
| **Primary Language** | ${data.primaryLanguage ? data.primaryLanguage.name : 'N/A'} |
| **Created** | ${data.createdAt ? formatDate(data.createdAt) : 'Unknown'} |
| **Last Updated** | ${data.updatedAt ? formatDate(data.updatedAt) : 'Unknown'} |
| **Last Push** | ${data.pushedAt ? formatDate(data.pushedAt) : 'Unknown'} |
| **Last Commit** | ${data.lastCommitDate ? formatDate(data.lastCommitDate) : 'Unknown'} |
| **Archived** | ${data.isArchived ? '✅ Yes' : '❌ No'} |
| **Fork** | ${data.isFork ? '✅ Yes' : '❌ No'} |
| **Template** | ${data.isTemplate ? '✅ Yes' : '❌ No'} |
| **Private** | ${data.isPrivate ? '✅ Yes' : '❌ No'} |
| **Issues Enabled** | ${data.hasIssuesEnabled ? '✅' : '❌'} |
| **Discussions Enabled** | ${data.hasDiscussionsEnabled ? '✅' : '❌'} |
| **Wiki Enabled** | ${data.hasWikiEnabled ? '✅' : '❌'} |
| **Projects Enabled** | ${data.hasProjectsEnabled ? '✅' : '❌'} |
| **Sponsorships Enabled** | ${data.hasSponsorshipsEnabled ? '✅' : '❌'} |
| **Auto Merge** | ${data.autoMergeAllowed ? '✅' : '❌'} |

</details>`;
}

function generateFeaturesSection(data: ProjectData): string {
  return `## ✨ Key Features

${data.features.map((f) => `- **${f}**`).join('\n')}`;
}

function generateTechStackSection(data: ProjectData, bgHex: string, accentHex: string): string {
  return `## 🛠️ Tech Stack

<div align="left">

${data.techStack.map((t) => `<img src="https://img.shields.io/badge/-${encodeURIComponent(t)}-${bgHex}?style=flat-square&logoColor=${accentHex}&labelColor=${bgHex}" alt="${t}" />`).join(' ')}

</div>`;
}

function generateProjectLanguagesSection(data: ProjectData, bgHex: string, accentHex: string): string {
  const totalSize = data.totalLanguageSize ?? 0;
  const languages = (data.languages ?? []).map(l => ({
    name: l.name,
    color: l.color,
    percentage: totalSize > 0 ? Number(((l.size / totalSize) * 100).toFixed(1)) : 0,
    bytes: l.size,
  }));

  return `## 🔤 Language Statistics

<div align="center">

${languages.map(l => getLanguageBadge(l, bgHex, accentHex)).join(' ')}

</div>

<details>
<summary><b>📊 Detailed Breakdown</b></summary>

| Language | Percentage | Bytes |
| :--- | :---: | :--- |
${languages.map(l => `| **${l.name}** | ${l.percentage}% | ${formatBytes(l.bytes || 0)} |`).join('\n')}
| **Total** | **100%** | ${formatBytes(data.totalLanguageSize ?? 0)} |

</details>`;
}

function generateTopicsSection(data: ProjectData, bgHex: string, accentHex: string): string {
  const topics = data.repositoryTopics ?? [];
  if (topics.length === 0) return '';

  return `## 🏷️ Repository Topics

<div align="center">

${topics
  .map(
    (topic) => `<img src="https://img.shields.io/badge/-${encodeURIComponent(topic.name)}-${bgHex}?style=flat-square&logo=github&logoColor=${accentHex}&labelColor=${bgHex}" alt="${topic.name}" />`
  )
  .join(' ')}

</div>

<details>
<summary><b>Topic Popularity</b></summary>

| Topic | GitHub Stars |
| :--- | :---: |
${topics
  .map((t) => `| ${t.name} | ${t.stargazerCount ? formatNumber(t.stargazerCount) : 'N/A'} |`)
  .join('\n')}

</details>`;
}

function generateArchitectureSection(data: ProjectData): string {
  return `## 🏗️ Architecture

\`\`\`
${data.architectureDiagram || 'Architecture Diagram'}
\`\`\``;
}

function generateReleasesSection(data: ProjectData, bgHex: string, accentHex: string): string {
  const releases = data.releases ?? [];
  if (releases.length === 0) return '';

  return `## 🏷️ Releases & Changelog

${releases
  .slice(0, 10)
  .map(
    (release) => `### ${release.tagName} ${release.isPrerelease ? '🧪 Pre-release' : ''} ${release.isDraft ? '📝 Draft' : ''}
**${release.name || release.tagName}** — ${formatDate(release.publishedAt)}

${release.description || 'No release notes provided.'}

[View Release](${release.url})`
  )
  .join('\n\n---\n\n')}`;
}

function generateDeploymentsSection(data: ProjectData, bgHex: string, accentHex: string): string {
  let content = `## 🚀 Deployments & Environments\n\n`;

  const environments = data.environments ?? [];
  if (environments.length > 0) {
    content += `### Environments\n\n`;
    environments.forEach(env => {
      content += `- **${env.name}** ${env.url ? `— [${env.url}](${env.url})` : ''}\n`;
    });
    content += '\n';
  }

  const deployments = data.deployments ?? [];
  if (deployments.length > 0) {
    content += `### Recent Deployments\n\n`;
    deployments.slice(0, 10).forEach(dep => {
      const stateIcon = dep.state === 'active' ? '🟢' : dep.state === 'success' ? '✅' : dep.state === 'failure' ? '❌' : dep.state === 'inactive' ? '⚪' : '⏳';
      content += `- ${stateIcon} **${dep.environment}** — ${formatDate(dep.createdAt)} ${dep.payload ? `(${dep.payload})` : ''}\n`;
    });
  }

  return content;
}

function generateProjectPackagesSection(data: ProjectData, bgHex: string, accentHex: string): string {
  const packages = data.packages ?? [];
  if (packages.length === 0) return '';

  return `## 📦 Published Packages

| Package | Type | Version | Link |
| :--- | :--- | :--- | :--- |
${packages
  .map(
    (pkg) => `| \`${pkg.name}\` | ${pkg.packageType} | ${pkg.version || '—'} | [View](${pkg.url}) |`
  )
  .join('\n')}`;
}

function generateWorkflowsSection(data: ProjectData, bgHex: string, accentHex: string): string {
  const workflows = data.workflows ?? [];
  if (workflows.length === 0) return '';

  return `## ⚙️ CI/CD Workflows

| Workflow | State | File |
| :--- | :--- | :--- |
${workflows
  .map(
    (w) => `| ${w.name} | ${w.state === 'active' ? '🟢 Active' : w.state === 'disabled_manually' ? '🔴 Disabled' : w.state} | \`${w.filePath}\` |`
  )
  .join('\n')}`;
}

function generateSecuritySection(data: ProjectData, bgHex: string, accentHex: string): string {
  let content = `## 🔒 Security & Dependencies\n\n`;

  const vulnAlerts = data.vulnerabilityAlerts ?? [];
  if (vulnAlerts.length > 0) {
    content += `### ⚠️ Vulnerability Alerts\n\n`;
    vulnAlerts.forEach(v => {
      const severityIcon = v.severity === 'CRITICAL' ? '🔴' : v.severity === 'HIGH' ? '🟠' : v.severity === 'MODERATE' ? '🟡' : '🔵';
      content += `- ${severityIcon} **${v.severity}** — \`${v.package.name}\` (${v.package.ecosystem})\n`;
    });
    content += '\n';
  }

  const depManifests = data.dependencyGraphManifests ?? [];
  if (depManifests.length > 0) {
    content += `### 📋 Dependency Manifests\n\n`;
    depManifests.forEach(m => {
      content += `**${m.filename}**\n\n`;
      m.dependencies.slice(0, 10).forEach(d => {
        content += `- \`${d.packageName}\` ${d.requirements ? `(${d.requirements})` : ''} ${d.repository ? `— [${d.repository.name}](${d.repository.url})` : ''}\n`;
      });
      if (m.dependencies.length > 10) content += `... and ${m.dependencies.length - 10} more\n`;
      content += '\n';
    });
  }

  if (data.securityPolicyUrl) {
    content += `### 📜 Security Policy\n\n[Security Policy](${data.securityPolicyUrl})\n\n`;
  }

  if (data.codeOfConduct) {
    content += `### 🤝 Code of Conduct\n\n[${data.codeOfConduct.name}](${data.codeOfConduct.url})\n\n`;
  }

  return content;
}

function generateGettingStartedSection(data: ProjectData): string {
  return `## 🚀 Getting Started

### Prerequisites
Make sure you have the appropriate runtime and \`${data.packageManager}\` installed.

### Setup Instructions

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/${data.owner}/${data.repo}.git
cd ${data.repo}

# 2. Install dependencies
${data.installCommand}

# 3. Start development server
${data.runCommand}
\`\`\`

${data.testCommand ? `### Testing

\`\`\`bash
${data.testCommand}
\`\`\`` : ''}

${data.demoUrl ? `Open [${data.demoUrl}](${data.demoUrl}) in your browser to view the application.` : ''}`;
}

function generateCommunitySection(data: ProjectData, bgHex: string, accentHex: string): string {
  let content = `## 🤝 Community & Support\n\n`;

  if (data.hasIssuesEnabled) {
    content += `- 🐛 **Issues:** [Report bugs or request features](https://github.com/${data.owner}/${data.repo}/issues)\n`;
  }
  if (data.hasDiscussionsEnabled) {
    content += `- 💬 **Discussions:** [Join the conversation](https://github.com/${data.owner}/${data.repo}/discussions)\n`;
  }
  if (data.hasWikiEnabled) {
    content += `- 📚 **Wiki:** [Documentation & guides](https://github.com/${data.owner}/${data.repo}/wiki)\n`;
  }
  if (data.hasProjectsEnabled) {
    content += `- 📋 **Projects:** [View project boards](https://github.com/${data.owner}/${data.repo}/projects)\n`;
  }

  const fundingLinks = data.fundingLinks ?? [];
  if (fundingLinks.length > 0) {
    content += `\n### 💖 Funding\n\n`;
    fundingLinks.forEach(f => {
      content += `- [${f.platform}](${f.url})\n`;
    });
  }

  const mentionableUsers = data.mentionableUsers ?? [];
  if (mentionableUsers.length > 0) {
    content += `\n### 👥 Maintainers\n\n`;
    mentionableUsers.forEach(u => {
      content += `- [@${u.login}](${u.avatarUrl}) ${u.name ? `(${u.name})` : ''}\n`;
    });
  }

  return content;
}

function generateEcosystemProjectSection(data: ProjectData, bgHex: string, accentHex: string): string {
  return `## 🌐 Ecosystem Cross-Pollination

<div align="center">

${data.gitHoloEnabled ? `[![GitHolo 3D Card](https://githolo.bharatdn.com/api/og/${data.repo})](https://githolo.bharatdn.com)` : ''}

${data.gitChronicleEnabled ? `[![GitChronicle Cadence](https://gitchronicle.bharatdn.com/badge/${data.repo}.svg)](https://gitchronicle.bharatdn.com)` : ''}

</div>

Discover companion developer tools by [Bharat Malhotra](https://bharatdn.com):

- 🌌 **[GitHolo](https://githolo.bharatdn.com):** 3D Interactive WebGL Holographic Cards for GitHub profiles and repositories.
- 📈 **[GitChronicle](https://gitchronicle.bharatdn.com):** Real-time commit velocity & developer percentile badges.
- 🛠️ **[ReadmeCraft](https://readme.bharatdn.com):** The next-generation intelligent README studio for profiles and repos.`;
}

function generateContributingSection(data: ProjectData): string {
  return `## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check [issues page](https://github.com/${data.owner}/${data.repo}/issues).

1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'feat: Add some AmazingFeature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

### Development Setup

\`\`\`bash
git clone https://github.com/${data.owner}/${data.repo}.git
cd ${data.repo}
${data.installCommand}
${data.testCommand}
\`\`\``;
}

function generateTestingSection(data: ProjectData): string {
  return `## 🧪 Testing

\`\`\`bash
${data.testCommand}
\`\`\`

### Test Coverage

Run tests with coverage reporting:

\`\`\`bash
${data.testCommand} --coverage
\`\`\`

### Test Types

- **Unit Tests**: Component and function-level testing
- **Integration Tests**: API and service integration testing
- **E2E Tests**: End-to-end user flow testing
`;
}

function generateLicenseSection(data: ProjectData): string {
  return `## 📜 License

This project is licensed under the **${data.license}** License - see the [LICENSE](LICENSE) file for details.

${data.licenseUrl ? `[Full License Text](${data.licenseUrl})` : ''}`;
}

function generateProjectFooter(data: ProjectData, bgHex: string, accentHex: string): string {
  return `---

<div align="center">
<sub>
Built with ❤️ by <a href="https://github.com/${data.owner}">${data.owner}</a> • 
Generated by <a href="https://readme.bharatdn.com">ReadmeCraft</a> • 
Part of the <a href="https://bharatdn.com">BharatDN</a> Developer Ecosystem
</sub>
</div>`;
}

export function compileSectionsToMarkdown(sections: Section[]): string {
  return sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.content.trim())
    .join('\n\n');
}