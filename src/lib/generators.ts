import type {
  ProfileData,
  ProjectData,
  ProfilePreset,
  ProjectPreset,
  Section,
} from '@/types/readmecraft';

export function getProfileSections(data: ProfileData, preset: ProfilePreset): Section[] {
  const username = data.username || 'ErBharatMalhotra';
  const name = data.name || username;

  if (preset === 'minimalist') {
    return [
      {
        id: 'header',
        title: 'Title & Introduction',
        enabled: true,
        order: 1,
        content: `# ${name}
> ${data.bio || 'Building resilient systems & high-taste developer tools.'}

---
📍 **${data.location || 'Global'}** &nbsp;•&nbsp; 🌐 [Portfolio](${data.website || `https://github.com/${username}`}) &nbsp;•&nbsp; 𝕏 [@${data.twitter || username}](https://twitter.com/${data.twitter || username})`,
      },
      {
        id: 'ecosystem',
        title: 'Ecosystem Badges (GitHolo & GitChronicle)',
        enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
        order: 2,
        content: `### 🌐 Developer Telemetry & Hologram

<div align="center">

${data.gitHoloEnabled ? `[![GitHolo 3D Card](https://githolo.vercel.app/api/og/${username})](https://githolo.bharatdn.com)` : ''}

${data.gitChronicleEnabled ? `[![GitChronicle Cadence](https://gitchronicle-wheat.vercel.app/badge/${username}.svg)](https://gitchronicle.bharatdn.com)` : ''}

</div>`,
      },
      {
        id: 'about',
        title: 'Focus & Engineering Creed',
        enabled: true,
        order: 3,
        content: `### ⚡ Current Focus

- 🔭 Architecting scalable distributed systems and developer tooling.
- 🌱 Exploring low-level systems programming and real-time graphics.
- 💬 Ask me about **${data.skills.slice(0, 3).join(', ')}** or modern web architecture.
- ⚡ Fun fact: Anti-slop enthusiast committed to minimal, high-taste interfaces.`,
      },
      {
        id: 'skills',
        title: 'Languages & Core Technologies',
        enabled: true,
        order: 4,
        content: `### 🛠️ Core Stack

\`\`\`yaml
languages: [ ${data.languages.map((l) => l.name).join(', ')} ]
frameworks: [ Next.js, React, Node.js, TailwindCSS ]
infrastructure: [ Docker, Linux, CI/CD, Cloudflare ]
architecture: [ Event-Driven, Microservices, Zero-Latency UX ]
\`\`\``,
      },
      {
        id: 'featured',
        title: 'Featured Repositories',
        enabled: true,
        order: 5,
        content: `### 🚀 Selected Works

${data.pinnedRepos.map((repo) => `- **[${repo.name}](${repo.url})** — ${repo.description} \`★ ${repo.stargazersCount}\``).join('\n')}`,
      },
      {
        id: 'stats',
        title: 'Live GitHub Metrics',
        enabled: data.githubStatsEnabled,
        order: 6,
        content: `### 📊 Live GitHub Activity

<div align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=${username}&show_icons=true&theme=tokyonight&hide_border=true&bg_color=090d16&title_color=10b981&icon_color=10b981&text_color=94a3b8" alt="GitHub Stats" width="48%" />
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${username}&layout=compact&theme=tokyonight&hide_border=true&bg_color=090d16&title_color=10b981&text_color=94a3b8" alt="Top Languages" width="48%" />
</div>`,
      },
    ];
  }

  if (preset === 'titan') {
    return [
      {
        id: 'header',
        title: 'Hero Banner & Open Source Creed',
        enabled: true,
        order: 1,
        content: `<div align="center">

# ⚡ ${name}
### Open Source Architect & Systems Engineer

[![Followers](https://img.shields.io/github/followers/${username}?label=Followers&style=flat-square&color=10b981&labelColor=090d16)](https://github.com/${username})
[![Stars](https://img.shields.io/badge/Stars-Earned-10b981?style=flat-square&labelColor=090d16)](https://github.com/${username})
[![License](https://img.shields.io/badge/License-MIT-10b981?style=flat-square&labelColor=090d16)](https://opensource.org/licenses/MIT)

> "${data.bio || 'Designing high-impact software, maintaining mission-critical tools.'}"

</div>

---`,
      },
      {
        id: 'ecosystem',
        title: 'Ecosystem Telemetry (GitHolo & GitChronicle)',
        enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
        order: 2,
        content: `### 🌐 Developer Telemetry & Hologram

<div align="center">

${data.gitHoloEnabled ? `[![GitHolo 3D Card](https://githolo.vercel.app/api/og/${username})](https://githolo.bharatdn.com)` : ''}

${data.gitChronicleEnabled ? `[![GitChronicle Cadence](https://gitchronicle-wheat.vercel.app/badge/${username}.svg)](https://gitchronicle.bharatdn.com)` : ''}

</div>`,
      },
      {
        id: 'pinned',
        title: 'Flagship Open Source Projects',
        enabled: true,
        order: 3,
        content: `### 🏛️ Flagship Repositories

| Repository | Focus & Impact | Primary Tech | Stars |
| :--- | :--- | :--- | :--- |
${data.pinnedRepos.map((r) => `| **[${r.name}](${r.url})** | ${r.description} | \`${r.language}\` | ⭐ ${r.stargazersCount} |`).join('\n')}`,
      },
      {
        id: 'skills',
        title: 'Technology Arsenal',
        enabled: true,
        order: 4,
        content: `### ⚔️ Technology Arsenal

<p align="left">
${data.skills.map((s) => `<img src="https://img.shields.io/badge/-${encodeURIComponent(s)}-090d16?style=flat-square&logo=${encodeURIComponent(s.toLowerCase())}&logoColor=10b981&labelColor=090d16" alt="${s}" />`).join(' ')}
</p>`,
      },
      {
        id: 'stats',
        title: 'Commit Cadence & Stats',
        enabled: true,
        order: 5,
        content: `### 📈 Commit Cadence & Streak

<div align="center">
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=${username}&theme=tokyonight&hide_border=true&background=090d16&ring=10b981&fire=10b981&currStreakLabel=10b981" alt="GitHub Streak" width="70%" />
</div>`,
      },
      {
        id: 'connect',
        title: 'Contact & Collaboration',
        enabled: true,
        order: 6,
        content: `### 🤝 Connect & Collaborate

- **Web:** [${data.website || `https://github.com/${username}`}](${data.website || `https://github.com/${username}`})
- **GitHub:** [@${username}](https://github.com/${username})
- **Twitter / 𝕏:** [@${data.twitter || username}](https://twitter.com/${data.twitter || username})`,
      },
    ];
  }

  // Bento Grid (Default Preset)
  return [
    {
      id: 'header',
      title: 'Bento Header & Profile Intro',
      enabled: true,
      order: 1,
      content: `<div align="center">

# Hey there, I'm ${name} 👋
### ${data.bio || 'Architecting Modern Web & Distributed Infrastructure'}

<p align="center">
  <a href="https://github.com/${username}"><img src="https://img.shields.io/github/followers/${username}?label=Followers&style=for-the-badge&color=10b981&labelColor=090d16" alt="Followers" /></a>
  <a href="${data.website || `https://github.com/${username}`}"><img src="https://img.shields.io/badge/Portfolio-Live-10b981?style=for-the-badge&labelColor=090d16" alt="Website" /></a>
  <a href="https://twitter.com/${data.twitter || username}"><img src="https://img.shields.io/badge/Twitter-@${data.twitter || username}-10b981?style=for-the-badge&labelColor=090d16" alt="Twitter" /></a>
</p>

</div>

---`,
    },
    {
      id: 'ecosystem',
      title: 'Ecosystem Widgets (GitHolo 3D Card & GitChronicle)',
      enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
      order: 2,
      content: `### 🌌 Holographic Telemetry & Live Cadence

<div align="center">

${data.gitHoloEnabled ? `[![GitHolo 3D Card](https://githolo.bharatdn.com/api/og/${username})](https://githolo.bharatdn.com)` : ''}

${data.gitChronicleEnabled ? `[![GitChronicle Cadence](https://gitchronicle.bharatdn.com/badge/${username}.svg)](https://gitchronicle.bharatdn.com)` : ''}

</div>`,
    },
    {
      id: 'bento_grid',
      title: 'Bento Card Grid: Highlights & Real-time Stats',
      enabled: true,
      order: 3,
      content: `### 📦 Developer Bento Grid

<table>
  <tr>
    <td width="50%" valign="top">
      <h4>⚡ About Me</h4>
      <ul>
        <li>🔭 Working on high-performance web applications</li>
        <li>💡 Exploring next-gen developer tools & graphics</li>
        <li>🎯 Committed to clean, high-taste typography and code</li>
        <li>📫 Reach me at: <b>${data.twitter ? `@${data.twitter}` : username}</b></li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>🔥 Top Languages (Real Repo Bytes)</h4>
      ${data.languages.map((l) => `- **${l.name}** \`${l.percentage}%\``).join('\n      ')}
    </td>
  </tr>
</table>`,
    },
    {
      id: 'tech_stack',
      title: 'Tech Stack & Tooling',
      enabled: true,
      order: 4,
      content: `### 🛠️ Tech Stack & Tooling

<div align="center">

${data.skills.map((s) => `<img src="https://img.shields.io/badge/${encodeURIComponent(s)}-090d16?style=for-the-badge&logo=${encodeURIComponent(s.toLowerCase())}&logoColor=10b981&labelColor=090d16" alt="${s}" />`).join(' ')}

</div>`,
    },
    {
      id: 'pinned_projects',
      title: 'Pinned Showcase Projects',
      enabled: true,
      order: 5,
      content: `### 🚀 Featured Repositories

<div align="center">

${data.pinnedRepos
  .map(
    (repo) => `[![${repo.name}](${repo.language ? `https://img.shields.io/badge/${repo.name}-${repo.language}-10b981?style=for-the-badge&logo=github&logoColor=white&labelColor=090d16` : `https://img.shields.io/badge/${repo.name}-10b981?style=for-the-badge&logo=github&logoColor=white&labelColor=090d16`})](${repo.url})`
  )
  .join(' ')}

</div>

${data.pinnedRepos.length > 0 ? `
<details>
<summary><b>Repository Details</b></summary>

${data.pinnedRepos
  .map(
    (repo) => `- **[${repo.name}](${repo.url})** ${repo.description ? `— ${repo.description}` : ''} ${repo.language ? `\`${repo.language}\`` : ''} ⭐ ${repo.stargazersCount}`
  )
  .join('\n')}

</details>` : ''}`,
    },
    {
      id: 'github_metrics',
      title: 'GitHub Velocity & Streaks',
      enabled: data.githubStatsEnabled,
      order: 6,
      content: `### 📈 Velocity & Metrics

<div align="center">

![Public Repos](https://readme.bharatdn.com/api/badges?username=${username}&type=repos)
![Followers](https://readme.bharatdn.com/api/badges?username=${username}&type=followers)
![Following](https://readme.bharatdn.com/api/badges?username=${username}&type=following)
${data.topLanguagesEnabled && data.languages.length > 0 ? `\n![Top Language](https://readme.bharatdn.com/api/badges?username=${username}&type=language)` : ''}
${data.githubStreakEnabled ? `\n![Streak](https://readme.bharatdn.com/api/badges?username=${username}&type=streak)` : ''}

</div>

<details>
<summary><b>Contribution Breakdown</b></summary>

- **Public Repositories:** ${data.publicRepos}
- **Followers:** ${data.followers}
- **Following:** ${data.following}
${data.topLanguagesEnabled && data.languages.length > 0 ? `- **Top Language:** ${data.languages[0].name} (${data.languages[0].percentage}%)` : ''}
${data.githubStreakEnabled ? `- **Current Streak:** Powered by [ReadmeCraft Badges API](https://readme.bharatdn.com/api/badges?username=${username}&type=streak)` : ''}

</details>`,
    },
    {
      id: 'trophy_card',
      title: 'Developer Trophies',
      enabled: data.githubStatsEnabled,
      order: 7,
      content: `### 🏆 Developer Trophies

<div align="center">
  <img src="https://readme.bharatdn.com/api/badges?username=${username}&type=trophy" alt="Developer Trophies" />
</div>`,
    },
    {
      id: 'activity_graph',
      title: 'Commit Activity Graph',
      enabled: data.githubStatsEnabled,
      order: 8,
      content: `### 📊 Commit Activity Graph

<div align="center">
  <img src="https://readme.bharatdn.com/api/badges?username=${username}&type=activity" alt="Commit Activity" />
</div>`,
    },
    {
      id: 'visitor_card',
      title: 'Visitor Analytics',
      enabled: data.githubStatsEnabled,
      order: 9,
      content: `### 👀 Visitor Analytics

<div align="center">
  <img src="https://readme.bharatdn.com/api/badges?username=${username}&type=visitor" alt="Visitor Analytics" />
</div>`,
    },
    {
      id: 'contribution_heatmap',
      title: 'Contribution Heatmap',
      enabled: data.githubStatsEnabled,
      order: 10,
      content: `### 🗓️ Contribution Heatmap

<div align="center">
  <img src="https://readme.bharatdn.com/api/badges?username=${username}&type=heatmap" alt="Contribution Heatmap" />
</div>`,
    },
    {
      id: 'snake_animation',
      title: 'Contribution Snake',
      enabled: data.githubStatsEnabled,
      order: 11,
      content: `### 🐍 Contribution Snake

<div align="center">
  <img src="https://readme.bharatdn.com/api/badges?username=${username}&type=snake" alt="Contribution Snake" />
</div>`,
    },
  ];
}

export function getProjectSections(data: ProjectData, preset: ProjectPreset): Section[] {
  const {
    owner,
    repo,
    title,
    description,
    license,
    stars,
    language,
    installCommand,
    runCommand,
    testCommand,
    packageManager,
  } = data;

  if (preset === 'cli') {
    return [
      {
        id: 'header',
        title: 'Header & Badges',
        enabled: true,
        order: 1,
        content: `# ⚡ ${title}

> ${description}

[![Stars](https://img.shields.io/github/stars/${owner}/${repo}?style=flat-square&color=10b981&labelColor=090d16)](https://github.com/${owner}/${repo})
[![License](https://img.shields.io/badge/License-${license}-10b981?style=flat-square&labelColor=090d16)](https://opensource.org/licenses/${license})
[![Language](https://img.shields.io/badge/Language-${encodeURIComponent(language)}-10b981?style=flat-square&labelColor=090d16)](https://github.com/${owner}/${repo})`,
      },
      {
        id: 'quickstart',
        title: 'Terminal Quickstart',
        enabled: true,
        order: 2,
        content: `## 🚀 Quick Install

\`\`\`bash
# Install globally via ${packageManager || 'npm'}
${packageManager === 'cargo' ? `cargo install ${repo}` : `npm install -g ${repo}`}

# Run directly
${repo} --help
\`\`\``,
      },
      {
        id: 'features',
        title: 'Core Capabilities',
        enabled: true,
        order: 3,
        content: `## 💎 Features

${data.features.map((f) => `- ${f}`).join('\n')}`,
      },
      {
        id: 'usage',
        title: 'CLI Usage & Flags',
        enabled: true,
        order: 4,
        content: `## 💻 Usage

\`\`\`bash
# Basic run
${repo} start

# Custom configuration flag
${repo} --config ./custom.config.json --verbose
\`\`\``,
      },
      {
        id: 'ecosystem',
        title: 'Ecosystem Telemetry',
        enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
        order: 5,
        content: `## 🌐 Ecosystem

Part of the **BharatDN** open source developer suite:
- 🌌 **[GitHolo](https://githolo.bharatdn.com):** 3D Interactive Card visualization for this repo.
- 📈 **[GitChronicle](https://gitchronicle.bharatdn.com):** Telemetry & commit velocity badges.
- 🛠️ **[ReadmeCraft](https://readme.bharatdn.com):** Intelligent dual-mode README studio.`,
      },
      {
        id: 'license',
        title: 'License',
        enabled: true,
        order: 6,
        content: `## 📜 License

Distributed under the **${license}** License. See \`LICENSE\` for more details.`,
      },
    ];
  }

  if (preset === 'api') {
    return [
      {
        id: 'header',
        title: 'API Title & Metadata',
        enabled: true,
        order: 1,
        content: `# 🔌 ${title} (Developer API)

> ${description}

[![Stars](https://img.shields.io/github/stars/${owner}/${repo}?style=for-the-badge&color=10b981&labelColor=090d16)](https://github.com/${owner}/${repo})
[![License: ${license}](https://img.shields.io/badge/License-${license}-10b981?style=for-the-badge&labelColor=090d16)](LICENSE)`,
      },
      {
        id: 'installation',
        title: 'Installation & Setup',
        enabled: true,
        order: 2,
        content: `## 📦 Installation

\`\`\`bash
${installCommand}
\`\`\``,
      },
      {
        id: 'api_reference',
        title: 'API Quick Reference',
        enabled: true,
        order: 3,
        content: `## 📖 Code Example

\`\`\`typescript
import { createClient } from '${repo}';

const client = createClient({
  endpoint: 'https://api.example.com',
  apiKey: process.env.API_KEY,
});

async function run() {
  const result = await client.execute();
  console.log('Result:', result);
}

run();
\`\`\``,
      },
      {
        id: 'architecture',
        title: 'System Architecture',
        enabled: true,
        order: 4,
        content: `## 🏗️ Architecture

\`\`\`
${data.architectureDiagram || 'Architecture Diagram'}
\`\`\``,
      },
      {
        id: 'testing',
        title: 'Testing & Verification',
        enabled: true,
        order: 5,
        content: `## 🧪 Testing

\`\`\`bash
${testCommand}
\`\`\``,
      },
      {
        id: 'ecosystem',
        title: 'Ecosystem & Cross-Promotion',
        enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
        order: 6,
        content: `## 🔗 Ecosystem Integrations

- **[GitHolo 3D](https://githolo.bharatdn.com):** Render real-time 3D interactive repository badges.
- **[GitChronicle](https://gitchronicle.bharatdn.com):** Track commit velocity and cadence stats.
- **[ReadmeCraft](https://readme.bharatdn.com):** Generate production-ready READMEs in seconds.`,
      },
    ];
  }

  // Standard Modern Project README
  return [
    {
      id: 'header',
      title: 'Hero Banner & Badges',
      enabled: true,
      order: 1,
      content: `<div align="center">

# 🛠️ ${title}
> ${description}

[![Stars](https://img.shields.io/github/stars/${owner}/${repo}?style=for-the-badge&color=10b981&labelColor=090d16)](https://github.com/${owner}/${repo}/stargazers)
[![Forks](https://img.shields.io/github/forks/${owner}/${repo}?style=for-the-badge&color=10b981&labelColor=090d16)](https://github.com/${owner}/${repo}/network/members)
[![License: ${license}](https://img.shields.io/badge/License-${license}-10b981?style=for-the-badge&labelColor=090d16)](LICENSE)
[![Built With](https://img.shields.io/badge/Stack-${encodeURIComponent(language)}-10b981?style=for-the-badge&labelColor=090d16)](https://github.com/${owner}/${repo})

${data.demoUrl ? `[**Explore Live Demo 🚀**](${data.demoUrl})` : ''}

</div>

---`,
    },
    {
      id: 'features',
      title: 'Core Features & Value Proposition',
      enabled: true,
      order: 2,
      content: `## ✨ Key Features

${data.features.map((f) => `- **${f}**`).join('\n')}`,
    },
    {
      id: 'tech_stack',
      title: 'Tech Stack & Dependencies',
      enabled: true,
      order: 3,
      content: `## 🛠️ Tech Stack

<div align="left">

${data.techStack.map((t) => `<img src="https://img.shields.io/badge/-${encodeURIComponent(t)}-090d16?style=flat-square&logoColor=10b981&labelColor=090d16" alt="${t}" />`).join(' ')}

</div>`,
    },
    {
      id: 'architecture',
      title: 'System Architecture',
      enabled: true,
      order: 4,
      content: `## 🏗️ Architecture

\`\`\`
${data.architectureDiagram || 'Architecture Diagram'}
\`\`\``,
    },
    {
      id: 'getting_started',
      title: 'Installation & Local Development',
      enabled: true,
      order: 5,
      content: `## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js 18+ and \`${packageManager || 'npm'}\` installed.

### Setup Instructions

\`\`\`bash
# 1. Clone the repository
git clone https://github.com/${owner}/${repo}.git
cd ${repo}

# 2. Install dependencies
${installCommand}

# 3. Start development server
${runCommand}
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.`,
    },
    {
      id: 'ecosystem',
      title: 'Ecosystem & Cross-Pollination',
      enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
      order: 6,
      content: `## 🌐 Ecosystem Cross-Pollination

<div align="center">

${data.gitHoloEnabled ? `[![GitHolo 3D Card](https://githolo.bharatdn.com/api/og/${repo})](https://githolo.bharatdn.com)` : ''}

${data.gitChronicleEnabled ? `[![GitChronicle Cadence](https://gitchronicle.bharatdn.com/badge/${repo}.svg)](https://gitchronicle.bharatdn.com)` : ''}

</div>

Discover companion developer tools by [Bharat Malhotra](https://bharatdn.com):

- 🌌 **[GitHolo](https://githolo.bharatdn.com):** 3D Interactive WebGL Holographic Cards for GitHub profiles and repositories.
- 📈 **[GitChronicle](https://gitchronicle.bharatdn.com):** Real-time commit velocity & developer percentile badges.
- 🛠️ **[ReadmeCraft](https://readme.bharatdn.com):** The next-generation intelligent README studio for profiles and repos.`,
    },
    {
      id: 'contributing',
      title: 'Contributing & Community',
      enabled: true,
      order: 7,
      content: `## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check [issues page](https://github.com/${owner}/${repo}/issues).

1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'feat: Add some AmazingFeature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request`,
    },
    {
      id: 'license',
      title: 'License',
      enabled: true,
      order: 8,
      content: `## 📜 License

This project is licensed under the **${license}** License - see the [LICENSE](LICENSE) file for details.`,
    },
  ];
}

export function compileSectionsToMarkdown(sections: Section[]): string {
  return sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.content.trim())
    .join('\n\n');
}
