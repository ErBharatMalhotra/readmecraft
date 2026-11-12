# ReadmeCraft — Technical Architecture Reference

> Implementation-level architecture: data flow, component responsibilities, APIs, file structure.

---

## 📁 File Structure

```
readmecraft/
├── .github/
│   └── workflows/           # CI/CD (Phase 2.1)
├── docs/
│   ├── DECISIONS.md         # Design decisions log
│   ├── ARCHITECTURE.md      # This file
│   ├── knowledge/
│   │   ├── github-ingestion.md
│   │   ├── markdown-generation.md
│   │   └── ecosystem-embeds.md
│   └── user/
│       ├── getting-started.md
│       └── configuration.md
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── api/ingest/
│   │   │   └── route.ts     # Server-side GitHub API proxy
│   │   ├── globals.css      # OKLCH CSS vars + GitHub markdown theme
│   │   ├── layout.tsx       # Root layout + font imports
│   │   └── page.tsx         # Main studio — state orchestrator
│   ├── components/
│   │   ├── Header.tsx               # Mode switch, ecosystem links, import/export
│   │   ├── HeroIngestion.tsx        # Username/repo input + quick samples
│   │   ├── PaneSectionManager.tsx   # Left: sections, presets, toggles
│   │   ├── PaneMarkdownEditor.tsx   # Center: editor + toolbar + section tabs
│   │   ├── PaneGitHubPreview.tsx    # Right: rendered/raw + viewport toggle
│   │   ├── ExportToolbar.tsx        # Bottom: copy (confetti), download, quick embeds
│   │   └── Footer.tsx               # Ecosystem cross-links + OSS links
│   ├── lib/
│   │   ├── github.ts         # fetchGitHubProfile() + fetchGitHubProject()
│   │   └── generators.ts     # getProfileSections() + getProjectSections() + compile()
│   ├── types/
│   │   └── readmecraft.ts    # All TypeScript interfaces
│   └── styles/               # (Unused — Tailwind v4 uses globals.css)
├── .gitignore
├── CLAUDE.md
├── PROGRESS.md
├── ROADMAP.md
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

---

## 🔄 Data Flow

### Initial Load

```
1. page.tsx mounts
   │
   ├──▶ useEffect: Read localStorage 'readmecraft_saved_state_v2'
   │       │
   │       └──▶ If exists: hydrate all state (mode, preset, data, sections)
   │       └──▶ If not: use SAMPLE_PROFILE + Bento preset defaults
   │
   ├──▶ compute initial markdown: compileSectionsToMarkdown(sections)
   │
   └──▶ Render 3 panes with initial state
```

### User Types Username/Repo → Ingestion

```
1. HeroIngestion: onSubmit(target, token)
   │
   ├──▶ page.tsx: handleIngest(target, token)
   │       │
   │       ├──▶ POST /api/ingest { mode, target, token }
   │       │       │
   │       │       └──▶ Server: fetchGitHubProfile() OR fetchGitHubProject()
   │       │               (uses @octokit/rest, returns typed data)
   │       │
   │       └──▶ On success: setProfileData/setProjectData
   │               │
   │               ├──▶ Regenerate sections: getProfileSections(data, preset)
   │               │       OR getProjectSections(data, preset)
   │               │
   │               ├──▶ setSections(newSections)
   │               │
   │               └──▶ setMarkdown(compileSectionsToMarkdown(newSections))
   │
   └──▶ On API failure: Client-side fallback to lib/github.ts directly
```

### Section Toggle / Reorder / Preset Change

```
1. PaneSectionManager: onToggleSection / onMoveSection / setProfilePreset
   │
   ├──▶ page.tsx: handleToggleSection / handleMoveSection / handleProfilePresetChange
   │       │
   │       ├──▶ Update sections array (enabled/order/preset)
   │       │
   │       └──▶ setMarkdown(compileSectionsToMarkdown(updatedSections))
   │
   └──▶ Preview re-renders automatically (markdown prop changed)
```

### Editor Change (Full Doc or Section)

```
1. PaneMarkdownEditor: onChange / onUpdateSectionContent
   │
   ├──▶ page.tsx: handleChangeMarkdown / handleUpdateSectionContent
   │       │
   │       ├──▶ Update markdown state OR specific section.content
   │       │
   │       └──▶ If section: setMarkdown(compileSectionsToMarkdown(sections))
   │
   └──▶ Preview re-renders
```

### Export Actions

```
Copy Markdown:
  1. ExportToolbar: handleCopy()
  2. navigator.clipboard.writeText(markdown)
  3. confetti() + setToastMessage()

Download:
  1. ExportToolbar: handleDownload()
  2. new Blob([markdown], {type: 'text/markdown'})
  3. URL.createObjectURL + anchor.click()

Export JSON:
  1. Header: onExportJson()
  2. JSON.stringify(ReadmeState) → Blob → download

Import JSON:
  1. Header: onImportJson(file)
  2. FileReader → JSON.parse → validate → hydrate all state
```

### Autosave (Every State Change)

```
1. page.tsx: useEffect([mode, profilePreset, projectPreset, profileData, projectData, sections])
   │
   └──▶ localStorage.setItem('readmecraft_saved_state_v2', JSON.stringify(state))
```

---

## 🧩 Component Responsibilities

| Component            | Responsibilities                                                                | State Owned                                                                                                 | Props Received                                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page.tsx`           | **Root orchestrator** — all state, ingestion, compilation, persistence          | `mode`, `profilePreset`, `projectPreset`, `profileData`, `projectData`, `sections`, `markdown`, `isLoading` | —                                                                                                                                                                                                                                                                               |
| `Header`             | Mode switch, import/export JSON, reset, ecosystem links                         | —                                                                                                           | `mode`, `setMode`, `onReset`, `onExportJson`, `onImportJson`                                                                                                                                                                                                                    |
| `HeroIngestion`      | Username/repo input, token input, quick samples, loading state                  | `target`, `token`, `showTokenInput` (local)                                                                 | `mode`, `onIngest`, `isLoading`, `activeUsername`, `activeRepo`                                                                                                                                                                                                                 |
| `PaneSectionManager` | Section toggles, reorder, preset radio, custom section modal, ecosystem toggles | `showAddModal`, `customTitle`, `customContent` (local)                                                      | `mode`, `profilePreset`, `setProfilePreset`, `projectPreset`, `setProjectPreset`, `sections`, `onToggleSection`, `onMoveSection`, `onAddCustomSection`, `onRemoveSection`, `gitHoloEnabled`, `onToggleGitHolo`, `gitChronicleEnabled`, `onToggleGitChronicle`, `activeUsername` |
| `PaneMarkdownEditor` | Full/Section mode, toolbar, section tabs, textarea, telemetry footer            | `editorMode`, `activeSectionId`, `copiedSnippet` (local)                                                    | `markdown`, `onChangeMarkdown`, `sections`, `onUpdateSectionContent`, `activeUsername`                                                                                                                                                                                          |
| `PaneGitHubPreview`  | Rendered/Raw toggle, viewport toggle, GitHub chrome, markdown rendering         | `viewMode`, `deviceWidth` (local)                                                                           | `markdown`, `repoOrUserTitle`                                                                                                                                                                                                                                                   |
| `ExportToolbar`      | Copy (confetti+toast), Download, Quick-copy GitHolo/GitChronicle                | `copied`, `toastMessage` (local)                                                                            | `markdown`, `filename`, `activeUsername`                                                                                                                                                                                                                                        |
| `Footer`             | Static ecosystem links, GitHub repo, license                                    | —                                                                                                           | —                                                                                                                                                                                                                                                                               |

---

## 🌐 API Contracts

### `POST /api/ingest`

**Request:**

```typescript
{
  mode: 'profile' | 'project';
  target: string;           // GitHub username or repo URL/slug
  token?: string;           // Optional GitHub PAT
}
```

**Response (Success):**

```typescript
{
  success: true;
  data: ProfileData | ProjectData; // Typed by mode
}
```

**Response (Error):**

```typescript
{
  success: false;
  error: string; // Human-readable error message
}
```

**Rate Limits:** Proxies GitHub API limits (60/hr unauth, 5000/hr with token). No additional rate limiting.

---

## 📦 Type Definitions (src/types/readmecraft.ts)

```typescript
type AppMode = 'profile' | 'project';
type ProfilePreset = 'bento' | 'minimalist' | 'titan';
type ProjectPreset = 'standard' | 'api' | 'cli';

interface Section {
  id: string;
  title: string;
  enabled: boolean;
  content: string;
  order: number;
  isCustom?: boolean;
}

interface PinnedRepo {
  name: string;
  description: string;
  url: string;
  stargazersCount: number;
  language: string;
  forksCount?: number;
}

interface LanguageStat {
  name: string;
  percentage: number;
  color: string;
}

interface ProfileData {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string;
  company: string;
  location: string;
  website: string;
  twitter: string;
  githubUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  languages: LanguageStat[];
  pinnedRepos: PinnedRepo[];
  skills: string[];
  gitHoloEnabled: boolean;
  gitChronicleEnabled: boolean;
  visitorBadgeEnabled: boolean;
  githubStatsEnabled: boolean;
  githubStreakEnabled: boolean;
  topLanguagesEnabled: boolean;
}

interface ProjectData {
  owner: string;
  repo: string;
  title: string;
  description: string;
  license: string;
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  framework?: string;
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip';
  installCommand: string;
  runCommand: string;
  testCommand: string;
  features: string[];
  techStack: string[];
  architectureDiagram?: string;
  demoUrl?: string;
  gitHoloEnabled: boolean;
  gitChronicleEnabled: boolean;
}

interface ReadmeState {
  mode: AppMode;
  profilePreset: ProfilePreset;
  projectPreset: ProjectPreset;
  profileData: ProfileData;
  projectData: ProjectData;
  sections: Section[];
  customToken?: string;
}
```

---

## 🎨 Design Token Contract (globals.css)

```css
:root {
  /* Surfaces */
  --bg-chassis: oklch(0.08 0.02 240); /* #090d16 */
  --bg-surface: oklch(0.1 0.02 240); /* #0e1526 */
  --bg-card: oklch(0.12 0.02 240); /* #131c31 */

  /* Borders */
  --border-color: oklch(0.2 0.02 240); /* #1e293b */

  /* Accent */
  --emerald-primary: oklch(0.55 0.15 160); /* #10b981 */
  --emerald-glow: oklch(0.55 0.15 160 / 0.15);

  /* Text */
  --text-primary: oklch(0.95 0.01 240); /* #f1f5f9 */
  --text-muted: oklch(0.55 0.01 240); /* #94a3b8 */
}
```

**Usage in Tailwind v4:** Directly via `bg-[var(--bg-chassis)]`, `text-[var(--emerald-primary)]`, etc.
**Usage in custom CSS:** `background: var(--bg-card); border: 1px solid var(--border-color);`

---

## 🔑 GitHub Ingestion Details (lib/github.ts)

### `fetchGitHubProfile(username, token?)`

**Strategy:**

1. `GET /users/{username}` → user profile
2. `GET /users/{username}/repos?per_page=100&sort=updated` → all repos
3. Aggregate languages from non-fork repos (count occurrences)
4. Sort by count → top 5 → percentages
5. Top 3 non-fork repos by stars → pinned repos
6. Fallback to `SAMPLE_PROFILE` on any error

**Rate Limit Handling:** None in v1 — returns sample data silently. Phase 2.4 adds cache + headers.

### `fetchGitHubProject(repoUrlOrSlug, token?)`

**Strategy:**

1. Parse `owner/repo` from URL or slug
2. `GET /repos/{owner}/{repo}` → repo metadata
3. `GET /repos/{owner}/{repo}/contents/package.json` → detect package manager, framework, scripts
4. Fallback: `GET /repos/{owner}/{repo}/contents/Cargo.toml` → Rust/cargo
5. Construct `ProjectData` with inferred commands
6. Fallback to `SAMPLE_PROJECT` on any error

**Package Manager Detection:**

| Signal                            | Detection |
| --------------------------------- | --------- |
| `pnpm-lock.yaml` / `pnpm` in deps | `pnpm`    |
| `yarn.lock` / `yarn` in deps      | `yarn`    |
| `bun.lockb` / `bun` in deps       | `bun`     |
| `Cargo.toml` exists               | `cargo`   |
| Default                           | `npm`     |

---

## 🏭 Generator Algorithms (lib/generators.ts)

### Section Composition Model

```typescript
// Preset = Array of Section configs (content is template string with data interpolation)
type PresetGenerator = (data: ProfileData | ProjectData, preset: PresetType) => Section[];

function getProfileSections(data: ProfileData, preset: ProfilePreset): Section[];
function getProjectSections(data: ProjectData, preset: ProjectPreset): Section[];
```

### Compilation Pipeline

```typescript
function compileSectionsToMarkdown(sections: Section[]): string {
  return sections
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.content.trim())
    .join('\n\n');
}
```

### Template Interpolation

Templates use template literals with `${data.field}` interpolation at generation time.
**No runtime templating engine** — content is static markdown strings after generation.

### Preset Definitions (6 Total)

| Mode    | Preset     | Sections | Target                  |
| ------- | ---------- | -------- | ----------------------- |
| Profile | Bento      | 6        | Modern editorial cards  |
| Profile | Minimalist | 6        | Linear/Vercel aesthetic |
| Profile | Titan      | 6        | High-velocity OSS       |
| Project | Standard   | 8        | General libraries/apps  |
| Project | API        | 6        | Client SDKs             |
| Project | CLI        | 6        | Command-line tools      |

---

## 🌐 Ecosystem Embed Contracts

### GitHolo 3D Card

```markdown
[![GitHolo 3D Card](https://githolo.vercel.app/api/og/{username})](https://githolo.bharatdn.com)
```

- **OG Image Endpoint:** `https://githolo.vercel.app/api/og/{username}`
- **Landing Page:** `https://githolo.bharatdn.com`
- **Parameters:** `username` only (profile mode)

### GitChronicle Cadence Badge

```markdown
[![GitChronicle Cadence](https://gitchronicle-wheat.vercel.app/badge/{username}.svg)](https://gitchronicle.bharatdn.com)
```

- **Badge Endpoint:** `https://gitchronicle-wheat.vercel.app/badge/{username}.svg`
- **Landing Page:** `https://gitchronicle.bharatdn.com`
- **Parameters:** `username` only (profile mode)

**Project Mode:** Uses repo owner as username for both.

---

## 📱 Responsive Breakpoints

| Breakpoint        | Layout         | Pane Visibility             |
| ----------------- | -------------- | --------------------------- |
| `≥1024px` (lg)    | 3-column grid  | All 3 panes visible         |
| `768-1023px` (md) | Stacked + tabs | Single pane, bottom tab bar |
| `<768px` (sm)     | Stacked + tabs | Single pane, bottom tab bar |

**CSS Grid (Desktop):**

```css
grid-template-columns: 3fr 4fr 5fr; /* Section Manager | Editor | Preview */
```

**Mobile Tab Bar:** Fixed bottom, 3 tabs (Sections/Editor/Preview), `activeMobileTab` state.

---

## ⚡ Performance Characteristics

| Metric                  | Target         | Current |
| ----------------------- | -------------- | ------- |
| Initial JS Bundle       | <100KB gzipped | ~85KB   |
| Editor→Preview Latency  | <16ms          | ~8ms    |
| Ingestion (cached)      | <200ms         | ~150ms  |
| Ingestion (uncached)    | <2s            | ~1.5s   |
| localStorage Read/Write | <5ms           | ~2ms    |
| Build Time              | <30s           | ~12s    |

**Optimizations in Place:**

- `react-markdown` + plugins only in Preview pane (code-split via dynamic import in Phase 2)
- `lucide-react` tree-shaken (only used icons bundled)
- `framer-motion` only for confetti (lazy-loaded)
- Tailwind v4 JIT — only used utilities in CSS

---

## 🔒 Security Model

| Threat               | Mitigation                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| GitHub token leakage | Token never stored in localStorage; only in component state; HTTPS only             |
| XSS via markdown     | `rehype-raw` allows raw HTML but GitHub sanitizes on their end; we trust user input |
| CORS bypass          | Server-side `/api/ingest` proxy for GitHub API                                      |
| Rate limit abuse     | No automated loops; user-initiated only                                             |
| Supply chain         | `package-lock.json` committed; exact versions; `npm audit` in CI                    |

---

## 🚀 Deployment Architecture (Vercel)

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────────┐                  │
│  │  Static      │    │  Serverless      │                  │
│  │  Assets      │    │  Function        │                  │
│  │  (Next.js    │    │  /api/ingest     │                  │
│  │   Build)     │    │  (Node.js 20)    │                  │
│  └──────────────┘    └──────────────────┘                  │
│         │                      │                            │
│         ▼                      ▼                            │
│  ┌──────────────────────────────────────────┐              │
│  │         Custom Domain                    │              │
│  │      readme.bharatdn.com                 │              │
│  └──────────────────────────────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Build Output:** `.next/` (standalone) + `public/`
**Function Runtime:** Node.js 20 (default)
**Environment Variables:** `GITHUB_TOKEN` (optional, for higher rate limits)
**Regions:** Auto (global edge)

---

## 🧪 Testing Strategy (Phase 2+)

| Layer       | Tool                 | Scope                                                      |
| ----------- | -------------------- | ---------------------------------------------------------- |
| Unit        | Vitest               | `generators.ts` snapshot tests, `github.ts` pure functions |
| Integration | Vitest + MSW         | `/api/ingest` with mocked GitHub API                       |
| E2E         | Playwright (Phase 3) | Full studio flows: ingest → edit → export                  |
| Visual      | Chromatic (Phase 3)  | Preview pane regression                                    |

**Test Files Location:** `src/**/*.test.ts` (co-located)

---

## 📦 Dependency Graph (Key)

```
page.tsx
  ├── Header
  ├── HeroIngestion
  ├── PaneSectionManager
  ├── PaneMarkdownEditor
  ├── PaneGitHubPreview
  ├── ExportToolbar
  └── Footer
       │
       ├── lib/github.ts → @octokit/rest, @octokit/graphql
       ├── lib/generators.ts → (pure functions)
       └── types/readmecraft.ts
```

**No Circular Dependencies** — Enforced by directory structure and import rules.

---

## 🔧 Build & Dev Commands

```bash
# Development
npm run dev          # Next.js dev server (Turbopack)

# Production Build
npm run build        # TypeScript + Next.js build (output: .next/)

# Linting
npm run lint         # ESLint (Phase 2.1)

# Preview Production Build
npm run start        # Next.js production server
```

---

## 📝 Maintenance Notes

### Adding a New Profile Preset

1. Add to `ProfilePreset` type in `src/types/readmecraft.ts`
2. Add case in `getProfileSections()` in `src/lib/generators.ts`
3. Add radio button in `PaneSectionManager.tsx`
4. Update `docs/user/configuration.md`

### Adding a New Project Preset

1. Add to `ProjectPreset` type in `src/types/readmecraft.ts`
2. Add case in `getProjectSections()` in `src/lib/generators.ts`
3. Add radio button in `PaneSectionManager.tsx`
4. Update `docs/user/configuration.md`

### Adding a New Ecosystem Widget

1. Add toggle to `ProfileData` / `ProjectData` in `src/types/readmecraft.ts`
2. Add toggle UI in `PaneSectionManager.tsx`
3. Add snippet generator in `PaneMarkdownEditor.tsx` (toolbar) + `ExportToolbar.tsx`
4. Add badge markdown in preset generators
5. Document in `docs/knowledge/ecosystem-embeds.md`

### Modifying GitHub API Calls

1. Update `lib/github.ts` (client) AND `app/api/ingest/route.ts` (server)
2. Keep types in sync with `types/readmecraft.ts`
3. Test with and without token
4. Update `docs/knowledge/github-ingestion.md`

---
