// ============================================================================
// ReadmeCraft — GitHub Action & Workflow Generator
// Generates .github/workflows/readme-craft-updater.yml & dynamic telemetry
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

export function generateGitHubWorkflowYaml(config: ActionConfig): string {
  const cronExpression = 
    config.updateFrequency === 'hourly' ? '0 * * * *' :
    config.updateFrequency === 'weekly' ? '0 0 * * 0' : '0 0 * * *'; // daily default

  return `name: 🚀 ReadmeCraft Auto-Updater
# Automatically updates GitHub Profile README with live stats, Wakatime, and telemetry

on:
  schedule:
    - cron: '${cronExpression}'
  workflow_dispatch: # Allows manual trigger from GitHub Actions tab
  push:
    branches:
      - main

jobs:
  update-readme:
    name: Update Profile README
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Run ReadmeCraft Telemetry Sync
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          ${config.includeWakatime ? `WAKATIME_API_KEY: \${{ secrets.WAKATIME_API_KEY }}` : '# WAKATIME_API_KEY not enabled'}
          ${config.includeBlogRss ? `RSS_FEED_URL: '${config.rssFeedUrl || 'https://blog.bharatdn.com/rss.xml'}'` : '# RSS not enabled'}
        run: |
          echo "Syncing ReadmeCraft live widgets..."
          npx readmecraft-sync --token "$GITHUB_TOKEN"

      - name: Commit & Push Changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "🤖 Auto-update README.md via ReadmeCraft Action"
          file_pattern: README.md
          commit_user_name: "ReadmeCraft Bot"
          commit_user_email: "bot@readme.bharatdn.com"
`;
}

export function generateCliReadmeSetupSnippet(): string {
  return `# Install ReadmeCraft CLI globally
npm install -g @readmecraft/cli

# Initialize automated GitHub Actions sync in your profile repo
readmecraft init --auto-sync
`;
}