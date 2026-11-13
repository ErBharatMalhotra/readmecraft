const fs = require('fs');
const path = require('path');

const {
  USERNAME,
  REPOSITORY,
  THEME,
  BADGES,
  GITHUB_TOKEN,
  COMMIT_MESSAGE,
  BRANCH,
} = process.env;

const BASE_URL = 'https://readme.bharatdn.com/api/badges';
const THEME_PARAM = `&theme=${THEME}`;
const BADGE_LIST = BADGES.split(',').map(b => b.trim()).filter(Boolean);

async function fetchReadmeTemplate() {
  // Try to fetch existing README first
  try {
    const response = await fetch(
      `https://api.github.com/repos/${USERNAME}/${REPOSITORY}/contents/README.md?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'ReadmeCraft-Action',
        },
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
    }
  } catch (e) {
    console.log('No existing README found, generating from scratch');
  }
  return null;
}

function generateReadmeMarkdown(existingReadme) {
  const themeParam = THEME_PARAM;
  const baseUrl = BASE_URL;

  // If we have an existing README, try to preserve custom content and just update badges
  if (existingReadme) {
    return updateExistingReadme(existingReadme);
  }

  // Generate fresh README
  let markdown = `# ${USERNAME}\n`;
  markdown += '> Building resilient systems & high-taste developer tools.\n\n';
  markdown += '---\n\n';

  // Core badges
  if (BADGE_LIST.includes('composite')) {
    const include = BADGE_LIST.filter(b => b !== 'composite').join(',');
    markdown += `## 🎯 GitHub Pulse (Composite)\n\n`;
    markdown += `<img src="${baseUrl}?username=${USERNAME}&type=composite&include=${include}${themeParam}" alt="GitHub Pulse Composite" />\n\n`;
  } else {
    // Individual badges
    const badgeConfigs = [
      { id: 'stats', title: '📊 Stats' },
      { id: 'trophy', title: '🏆 Trophies' },
      { id: 'activity', title: '📈 Activity' },
      { id: 'snake', title: '🐍 Snake' },
      { id: 'heatmap', title: '🗓️ Heatmap' },
    ];

    for (const badge of badgeConfigs) {
      if (BADGE_LIST.includes(badge.id)) {
        markdown += `## ${badge.title}\n\n`;
        markdown += `<img src="${baseUrl}?username=${USERNAME}&type=${badge.id}${themeParam}" alt="${badge.title}" />\n\n`;
      }
    }
  }

  // Animated badges
  const animatedBadges = [
    { id: 'skill-radar', title: '🎯 Skill Radar' },
    { id: 'language-race', title: '🏁 Language Evolution Race' },
    { id: 'repo-constellation', title: '🌌 Repository Constellation' },
    { id: 'code-pulse', title: '💓 Code Pulse' },
    { id: 'contribution-mountain', title: '🏔️ Contribution Mountain' },
    { id: 'tech-galaxy', title: '🌌 Tech Stack Galaxy' },
    { id: 'contribution-flow', title: '🌊 Contribution Flow' },
    { id: 'code-time-heatmap', title: '🕐 Code Time Heatmap' },
  ];

  for (const badge of animatedBadges) {
    if (BADGE_LIST.includes(badge.id)) {
      markdown += `## ${badge.title}\n\n`;
      markdown += `<img src="${baseUrl}?username=${USERNAME}&type=${badge.id}${themeParam}" alt="${badge.title}" />\n\n`;
    }
  }

  markdown += '---\n\n';
  markdown += `*Last updated: ${new Date().toISOString().split('T')[0]} via [ReadmeCraft](https://readme.bharatdn.com)*\n`;

  return markdown;
}

function updateExistingReadme(existingReadme) {
  // Strategy: Replace badge images while preserving custom content
  // Find badge image patterns and update their URLs to include theme parameter
  let updated = existingReadme;

  // Update existing ReadmeCraft badge URLs to include theme if missing
  const badgeUrlPattern = /(https:\/\/readme\.bharatdn\.com\/api\/badges\?[^"\)]+)/g;
  updated = updated.replace(badgeUrlPattern, (match) => {
    // Don't double-add theme
    if (match.includes('theme=')) return match;
    return match + THEME_PARAM;
  });

  // If no ReadmeCraft badges found, append them
  if (!updated.includes('readme.bharatdn.com/api/badges')) {
    const badgeSection = '\n\n## 🎯 GitHub Pulse\n\n';
    const include = BADGE_LIST.filter(b => b !== 'composite').join(',');
    const badgeUrl = `${BASE_URL}?username=${USERNAME}&type=composite&include=${include}${THEME_PARAM}`;
    updated += badgeSection + `<img src="${badgeUrl}" alt="GitHub Pulse" />\n`;
  }

  // Update last updated timestamp
  updated = updated.replace(
    /\*Last updated: .* via \[ReadmeCraft\]/,
    `*Last updated: ${new Date().toISOString().split('T')[0]} via [ReadmeCraft]`
  );
  if (!updated.includes('Last updated:')) {
    updated += `\n\n---\n\n*Last updated: ${new Date().toISOString().split('T')[0]} via [ReadmeCraft](https://readme.bharatdn.com)*\n`;
  }

  return updated;
}

async function main() {
  console.log('🎨 ReadmeCraft Auto-Update Action');
  console.log(`👤 User: ${USERNAME}`);
  console.log(`📦 Repo: ${REPOSITORY}`);
  console.log(`🎨 Theme: ${THEME}`);
  console.log(`📦 Badges: ${BADGE_LIST.join(', ')}`);

  // Fetch existing README
  const existingReadme = await fetchReadmeTemplate();

  // Generate updated README
  const newReadme = generateReadmeMarkdown(existingReadme);

  // Write to file
  const readmePath = path.join(process.env.GITHUB_WORKSPACE, 'README.md');
  fs.writeFileSync(readmePath, newReadme);

  // Check if content changed
  let changed = false;
  if (existingReadme) {
    changed = existingReadme.trim() !== newReadme.trim();
  } else {
    changed = true; // New file
  }

  console.log(`📝 README ${changed ? 'updated' : 'unchanged'}`);
  console.log(`::set-output name=changed::${changed}`);
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});