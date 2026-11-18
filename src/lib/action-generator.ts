// ============================================================================
// ReadmeCraft — GitHub Action & Workflow Generator
// Generates .github/workflows/readme-craft-updater.yml that calls the
// composite action shipped in this repository (readmecraft-action/action.yml).
// ============================================================================

export interface ActionConfig {
  updateFrequency: 'hourly' | 'daily' | 'weekly';
  includeWakatime: boolean;
  includeBlogRss: boolean;
  includeGithubStats: boolean;
  includeSpotify: boolean;
  wakatimeApiKeySecret?: string;
  rssFeedUrl?: string;
}

// The action lives at `readmecraft-action/` in this public repository, so the
// composite action reference below resolves without a published npm package or
// a separate marketplace listing.
const ACTION_REF = 'ErBharatMalhotra/readmecraft/readmecraft-action@main';

export function generateGitHubWorkflowYaml(config: ActionConfig): string {
  const cronExpression =
    config.updateFrequency === 'hourly'
      ? '0 * * * *'
      : config.updateFrequency === 'weekly'
        ? '0 0 * * 0'
        : '0 0 * * *'; // daily default

  return `name: 🚀 ReadmeCraft Auto-Updater
# Regenerates your README badges from live GitHub data on a schedule.
# Uses the composite action that ships with ReadmeCraft — no npm install, no
# extra secrets beyond the default GITHUB_TOKEN.

on:
  schedule:
    - cron: '${cronExpression}'
  workflow_dispatch: # Allows manual trigger from GitHub Actions tab
  push:
    branches:
      - main

permissions:
  contents: write

jobs:
  update-readme:
    name: Update Profile README
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Regenerate README badges
        uses: ${ACTION_REF}
        with:
          username: \${{ github.repository_owner }}
          repository: \${{ github.event.repository.name }}
          token: \${{ secrets.GITHUB_TOKEN }}
          theme: 'tokyonight'
          badges: 'composite,snake,heatmap,trophy,activity'
          commit-message: '🤖 Auto-update README via ReadmeCraft'
          branch: 'main'
`;
}
