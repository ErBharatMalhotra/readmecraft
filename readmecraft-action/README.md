# ReadmeCraft Auto-Update Action

GitHub Action to automatically update your profile README with live, theme-aware badges from [ReadmeCraft](https://readme.bharatdn.com).

## Features

- 🎨 **9 Themes** — Tokyo Night, Dracula, Nord, GitHub Dark, Gruvbox, Rose Pine, Catppuccin, Synthwave, Default
- 🔄 **Auto-updates** — Scheduled daily runs keep your README fresh
- 📦 **20+ Badge Types** — Composite card, Snake animation, Heatmap, Trophies, Skill Radar, Language Race, and more
- 🛡️ **Zero Dependencies** — Pure SVG badges, no external image services
- ⚡ **Edge Cached** — 6-hour cache with cache-busting support

## Quick Start

### 1. Add the workflow to your profile repository (`.github/workflows/readmecraft.yml`)

```yaml
name: 'ReadmeCraft Auto-Update'

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 02:00 UTC
  workflow_dispatch:     # Manual trigger

permissions:
  contents: write

jobs:
  update-readme:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - uses: ErBharatMalhotra/readmecraft-action@v1
        with:
          username: ${{ github.repository_owner }}
          token: ${{ secrets.GITHUB_TOKEN }}
          theme: 'tokyonight'
          badges: 'composite,snake,heatmap,trophy,activity'
```

### 2. Ensure you have a profile repository

Create a **public** repository named exactly like your username (e.g., `ErBharatMalhotra/ErBharatMalhotra`).

### 3. Enable workflow permissions

Go to **Settings → Actions → General → Workflow permissions** → Select "Read and write permissions".

## Configuration

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `username` | ✅ | - | GitHub username (repo owner) |
| `repository` | ❌ | `username` | Repository name (defaults to username for profile README) |
| `token` | ✅ | - | `GITHUB_TOKEN` with repo write access |
| `theme` | ❌ | `tokyonight` | Badge theme (see themes below) |
| `badges` | ❌ | `composite,snake,heatmap,trophy,activity` | Comma-separated badge types |
| `commit-message` | ❌ | `🎨 Update profile README via ReadmeCraft` | Custom commit message |
| `branch` | ❌ | `main` | Target branch |

## Available Badges

| Badge ID | Description |
|----------|-------------|
| `composite` | 🎯 All-in-one 2×2 grid (stats, trophies, snake, heatmap) |
| `stats` | 📊 Basic stats (repos, followers, language, streak) |
| `snake` | 🐍 Contribution snake animation (v13, matches Platane/snk) |
| `heatmap` | 📅 GitHub-style contribution calendar |
| `trophy` | 🏆 Developer trophies card |
| `activity` | 📈 30-day commit activity graph |
| `skill-radar` | 🎯 Animated spider/radar chart |
| `language-race` | 🏁 Animated bar chart race |
| `repo-constellation` | 🌌 Force-directed repo graph |
| `code-pulse` | 💓 Real-time activity heartbeat |
| `contribution-mountain` | 🏔️ 3D isometric contribution mountain |
| `tech-galaxy` | 🌌 Orbiting tech stack planets |
| `contribution-flow` | 🌊 Sankey diagram (time → language → repo) |
| `code-time-heatmap` | 🕐 Hour × Day coding intensity |

## Themes

| Theme | Preview |
|-------|---------|
| `tokyonight` | ![Tokyo Night](https://img.shields.io/badge/Tokyo_Night-1a1b26?style=flat&logo=tokyonight) |
| `dracula` | ![Dracula](https://img.shields.io/badge/Dracula-282a36?style=flat&logo=dracula) |
| `nord` | ![Nord](https://img.shields.io/badge/Nord-2e3440?style=flat&logo=nord) |
| `github` | ![GitHub Dark](https://img.shields.io/badge/GitHub_Dark-0d1117?style=flat&logo=github) |
| `gruvbox` | ![Gruvbox](https://img.shields.io/badge/Gruvbox-282828?style=flat&logo=gruvbox) |
| `rosePine` | ![Rose Pine](https://img.shields.io/badge/Rose_Pine-191724?style=flat&logo=rosepine) |
| `catppuccin` | ![Catppuccin](https://img.shields.io/badge/Catppuccin-1e1e2e?style=flat&logo=catppuccin) |
| `synthwave` | ![Synthwave](https://img.shields.io/badge/Synthwave-2d2a40?style=flat&logo=synthwave) |
| `default` | ![Default](https://img.shields.io/badge/Default-090d16?style=flat) |

## Cache Busting

Badges are cached at the edge for 6 hours. To force refresh, add a version query parameter:

```markdown
<img src="https://readme.bharatdn.com/api/badges?username=YOUR_USER&type=snake&theme=tokyonight&v=13" />
```

## Manual Trigger

You can manually trigger the workflow from the **Actions** tab in your repository, with custom theme and badge selections.

## License

MIT © [ErBharatMalhotra](https://github.com/ErBharatMalhotra)