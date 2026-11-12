# ReadmeCraft — Product Roadmap

> **Production Target:** `https://readme.bharatdn.com`
> **Repository:** `ErBharatMalhotra/readmecraft`
> **Subdomain:** `readme.bharatdn.com`
> **Author:** Bharat Malhotra (`ErBharatMalhotra`)

---

## 🎯 Vision & Audience

**Who:** Developers, open source maintainers, and technical creators who need professional GitHub READMEs without the manual grind.

**Core Belief:** Existing generators force 50+ manual clicks or offer blank templates. ReadmeCraft eliminates typing entirely — paste a username or repo URL, get a production-ready README in 5 seconds with real GitHub data, modern layouts, and ecosystem cross-pollination built in.

**One-Sentence Pitch:** *The next-generation intelligent dual-mode GitHub README Studio that auto-fetches real profile data or inspects repo configs to generate editorially-designed, GitHub-perfect READMEs with zero typing and 1-click ecosystem embeds.*

---

## 🏗️ Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | Next.js 16 (App Router) | React 19 support, Turbopack, edge-ready, zero-config i18n |
| **Language** | TypeScript (strict) | Type safety across ingestion pipelines, generators, and UI state |
| **Styling** | Tailwind CSS v4 (@tailwindcss/postcss) | OKLCH-native, zero-config, no PostCSS config churn |
| **Markdown** | `react-markdown` + `remark-gfm` + `rehype-raw` + `rehype-highlight` | GitHub-flavored markdown parity, syntax highlighting |
| **GitHub API** | `@octokit/rest` + `@octokit/graphql` | Official, typed, rate-limit aware, supports auth tokens |
| **Icons** | `lucide-react` | Tree-shakeable, consistent 24px grid, zero runtime |
| **Animation** | `framer-motion` | Spring physics, layout animations, low bundle cost |
| **Confetti** | `canvas-confetti` | Zero-dep, configurable, performant |
| **Utilities** | `clsx` + `tailwind-merge` | ClassName composition, Tailwind conflict resolution |
| **Package Manager** | npm | Lockfile already committed, zero migration cost |
| **Deploy** | Vercel | Native Next.js support, subdomain mapping, edge functions |

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            READMECRAFT STUDIO                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────────────┐  │
│  │  PANE 1      │    │  PANE 2         │    │  PANE 3                  │  │
│  │  Section     │    │  Markdown       │    │  GitHub Preview          │  │
│  │  Manager     │───▶│  Editor         │───▶│  (Exact GitHub CSS)      │  │
│  │  (Left)      │    │  (Center)       │    │  (Right)                 │  │
│  └──────────────┘    └─────────────────┘    └──────────────────────────┘  │
│         │                    │                       │                    │
│         ▼                    ▼                       ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    STATE LAYER (React + localStorage)                │  │
│  │  • mode: 'profile' | 'project'                                       │  │
│  │  • preset: 'bento' | 'minimalist' | 'titan' | 'standard' | 'api'    │  │
│  │  • sections: Section[] (enabled, order, content)                    │  │
│  │  • profileData / projectData (fetched + user-edited)                │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
│         ┌──────────────────────────┼──────────────────────────┐          │
│         ▼                          ▼                          ▼          │
│  ┌───────────────┐        ┌───────────────┐        ┌───────────────┐  │
│  │ Profile       │        │ Project       │        │ Generators    │  │
│  │ Ingestor      │        │ Ingestor      │        │ (Templates)   │  │
│  │ (REST API)    │        │ (REST + Tree) │        │ • Profile:    │  │
│  │ • /users/:u   │        │ • /repos/:o/:r│        │   Bento       │  │
│  │ • /users/:u/repos│       │ • /contents/  │        │   Minimalist  │  │
│  │ • /rate_limit │        │   package.json│        │   Titan       │  │
│  └───────────────┘        │ • /contents/  │        │ • Project:    │  │
│                           │   Cargo.toml  │        │   Standard    │  │
│                           └───────────────┘        │   API / CLI   │  │
│                                                    └───────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                    EXPORT PIPELINE                                   │  │
│  │  • Copy Markdown (navigator.clipboard + confetti)                   │  │
│  │  • Download README.md (Blob + anchor click)                          │  │
│  │  • Export JSON (versioned state + localStorage sync)                │  │
│  │  • Import JSON (FileReader + state hydration)                       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │              ECOSYSTEM CROSS-POLLINATION                             │  │
│  │  • GitHolo 3D Card:     https://githolo.bharatdn.com                │  │
│  │  • GitChronicle Badge:  https://gitchronicle.bharatdn.com           │  │
│  │  • 1-click snippet generators in editor toolbar + export bar        │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Dual-Mode Intelligence

### Mode 1: Developer Profile README
**Input:** GitHub username (e.g., `ErBharatMalhotra`)
**Auto-fetch:**
- Real user profile: name, bio, avatar, company, location, website, twitter
- Top languages by **repo bytes** (not checkmarks) — aggregates across all non-fork repos
- Pinned repositories (top 3 by stars)
- Followers, following, public repo count
- Live contribution streak & stats via shields.io endpoints

**Presets:**
| Preset | Vibe | Key Features |
|--------|------|--------------|
| **Bento Grid** | Modern editorial cards | Grid layout, holographic cards, real-time stats blocks |
| **Minimalist** | Linear / Vercel aesthetic | Monochrome, high contrast, Geist typography, clean sections |
| **Titan** | High-velocity OSS maintainer | Badge-heavy, contributor graphs, sponsor tiers, velocity focus |

### Mode 2: Repository / Project README
**Input:** Repo URL or slug (e.g., `facebook/react` or `https://github.com/vercel/next.js`)
**Auto-inspect:**
- `package.json` → package manager (npm/pnpm/yarn/bun), framework, scripts, dependencies
- `Cargo.toml` → Rust, cargo commands
- License (SPDX from GitHub API)
- Stars, forks, open issues, primary language
- Default branch, description, homepage

**Presets:**
| Preset | Target | Key Features |
|--------|--------|--------------|
| **Standard** | General libraries/apps | Hero, features, tech stack, architecture, install, contributing |
| **API SDK** | Client libraries | Quick reference, code examples, authentication, testing |
| **CLI Tool** | Command-line tools | Terminal quickstart, flags table, install via package managers |

---

## 🎨 Anti-AI-Slop Design System

### Color Geometry (OKLCH)
```css
:root {
  --bg-chassis:     oklch(0.08 0.02 240);    /* #090d16 - Deep obsidian */
  --bg-surface:     oklch(0.10 0.02 240);    /* #0e1526 - Elevated surface */
  --bg-card:        oklch(0.12 0.02 240);    /* #131c31 - Card background */
  --border-color:   oklch(0.20 0.02 240);    /* #1e293b - Titanium borders */
  --emerald-primary:oklch(0.55 0.15 160);    /* #10b981 - Signal emerald */
  --emerald-glow:   oklch(0.55 0.15 160 / 0.15);
  --text-primary:   oklch(0.95 0.01 240);    /* #f1f5f9 */
  --text-muted:     oklch(0.55 0.01 240);    /* #94a3b8 */
}
```
**Zero generic violet/blue-purple gradients.** All accents use emerald with intentional opacity layers.

### Typography
- **Display/Headers:** `Space Grotesk` (variable 300-700) — editorial, geometric, high x-height
- **UI Labels/Monospace:** `JetBrains Mono` (variable 400-700) — code, badges, tabular nums
- **Body (fallback):** System UI stack — no external font load for body text

### Component Principles
- **No centered HTML tables** — use semantic markdown + CSS Grid/Flex
- **No flat shields without context** — badges grouped in semantic clusters
- **No "generated by" footers** — zero AI attribution anywhere
- **No decorative gradients** — color serves hierarchy, not decoration

---

## 🧩 UX Behaviors (Implementation-Ready)

### 3-Pane Layout
- **Desktop (≥1024px):** Fixed 3-column grid (3fr / 4fr / 5fr) — all panes visible
- **Tablet (768-1023px):** Stackable, tabs at bottom for pane switching
- **Mobile (<768px):** Single-pane with bottom tab bar (Sections / Editor / Preview)

### Section Manager (Pane 1)
- **Toggle:** Checkbox enables/disables section instantly
- **Reorder:** Up/down arrows swap `order` values, recompiles markdown
- **Preset Switch:** Radio group instantly regenerates all sections for that preset
- **Custom Sections:** Modal → title + markdown → adds as `isCustom: true` section
- **Ecosystem Toggles:** GitHolo / GitChronicle switches regenerate embed snippets

### Markdown Editor (Pane 2)
- **Modes:** Full Document ↔ Section-by-Section (tab bar)
- **Toolbar:** H1, H2, Bold, Italic, Code Block, List, Table templates
- **Ecosystem Quick-Insert:** GitHolo 3D Card, GitChronicle Badge (inserts at cursor)
- **Live Sync:** `onChange` → updates state → triggers preview re-render (<16ms)
- **Telemetry Footer:** Line/word/char count + "Live Synced" pulse indicator

### GitHub Preview (Pane 3)
- **Rendered View:** `react-markdown` with GFM, raw HTML, syntax highlighting
- **Raw View:** Monospace raw markdown with line numbers
- **Viewport Toggle:** Desktop (100%), Tablet (768px), Mobile (375px)
- **GitHub Chrome:** Fake repo header with file size, README.md badge

### Export Toolbar (Persistent Bottom Bar)
- **Quick Embeds:** Copy GitHolo snippet / Copy GitChronicle snippet
- **Download:** `README.md` with slugified filename
- **Copy Markdown:** Clipboard API + emerald/gold confetti + toast
- **Toasts:** Fixed bottom-right, auto-dismiss 3s, emerald border + pulse dot

### State Persistence
- **Autosave:** `localStorage` key `readmecraft_saved_state_v2` on every state change
- **Versioned JSON Export:** Full state snapshot with mode, preset, data, sections
- **Import:** FileReader → JSON.parse → state hydration → recompile markdown

---

## 🚀 Implementation Phases

### Phase 1: Core Studio (COMPLETED) ✅

| Step | Scope | Status |
|------|-------|--------|
| 1.1 | Next.js 16 + TS + Tailwind v4 scaffold | ✅ |
| 1.2 | Type system (`src/types/readmecraft.ts`) | ✅ |
| 1.3 | GitHub ingestion (`src/lib/github.ts`) — REST API with token support | ✅ |
| 1.4 | Template generators (`src/lib/generators.ts`) — 6 presets, 34 sections | ✅ |
| 1.5 | API route `/api/ingest` for server-side fetch | ✅ |
| 1.6 | Header + Hero Ingestion components | ✅ |
| 1.7 | Pane 1: Section Manager with preset switch, reorder, custom sections | ✅ |
| 1.8 | Pane 2: Markdown Editor with toolbar, section tabs, live sync | ✅ |
| 1.9 | Pane 3: GitHub Preview with rendered/raw, viewport toggle | ✅ |
| 1.10 | Export Toolbar: copy (confetti), download, ecosystem quick-copy | ✅ |
| 1.11 | Footer with ecosystem cross-links | ✅ |
| 1.12 | localStorage autosave + JSON import/export | ✅ |
| 1.13 | Global styles: OKLCH CSS vars, GitHub markdown theme | ✅ |
| 1.14 | Git config + commit hygiene (ErBharatMalhotra only) | ✅ |
| 1.15 | Build verification + GitHub push | ✅ |

---

### Phase 2: Production Hardening (NEXT SESSION BATCH)

| Step | Scope | Dependencies |
|------|-------|--------------|
| 2.1 | Add ESLint + Prettier config, run on CI | 1.x |
| 2.2 | Unit tests for generators (Vitest) — snapshot markdown output | 1.4 |
| 2.3 | Integration test for ingestion (MSW mocking GitHub API) | 1.3 |
| 2.4 | Rate limit handling: show remaining, cache 5min, graceful fallback | 1.3 |
| 2.5 | Error boundaries per pane + global error UI | 1.6-1.10 |
| 2.6 | Keyboard shortcuts: `⌘S` copy, `⌘E` export JSON, `⌘1/2/3` pane focus | 1.7-1.9 |
| 2.7 | Accessibility audit: ARIA labels, focus management, color contrast | All |
| 2.8 | SEO: meta tags, OG image, sitemap, robots.txt | 1.13 |
| 2.9 | Vercel deployment config + `readme.bharatdn.com` domain mapping | — |
| 2.10 | Analytics (privacy-friendly): page views, mode usage, export actions | — |

---

### Phase 3: Intelligence & Polish

| Step | Scope | Dependencies |
|------|-------|--------------|
| 3.1 | GraphQL unified query for profile (single round-trip) | 1.3 |
| 3.2 | Repo tree inspection for mono-repos (detect multiple package.json) | 1.4 |
| 3.3 | Auto-detect CI/CD (GitHub Actions, GitLab, CircleCI) → badge generation | 1.4 |
| 3.4 | Contributor graph fetch + "Open Source Titan" preset enhancement | 2.4 |
| 3.5 | Sponsor tier detection → dynamic sponsor section | 2.4 |
| 3.6 | Custom domain verification for `website` field | 1.3 |
| 3.7 | Dark/light mode toggle (GitHub light theme preview) | 1.13 |
| 3.8 | Command Palette (`⌘K`) for all actions | 2.6 |

---

### Phase 4: Ecosystem Expansion

| Step | Scope | Dependencies |
|------|-------|--------------|
| 4.1 | GitHolo iframe embed preview in Pane 3 | 3.x |
| 4.2 | GitChronicle live badge preview (fetch actual SVG) | 3.x |
| 4.3 | "Share to X/Twitter" with generated OG image | 2.8 |
| 4.4 | Embed code generator for any site (not just GitHub) | 1.10 |
| 4.5 | BharatDN suite landing page cross-links | — |

---

### Phase 5: Future Exploration (Non-Goals for v1)

- [ ] Real-time collaborative editing (multi-user)
- [ ] AI-assisted section rewriting (opt-in, local model)
- [ ] Template marketplace (community presets)
- [ ] VS Code extension for in-IDE README editing
- [ ] GitHub Action to auto-update profile README on push
- [ ] Multi-language i18n (README content translation)

---

## ❌ Non-Goals (v1)

- No backend database — 100% client-side + GitHub API
- No user accounts / auth — anonymous, stateless
- No server-side rendering of READMEs — static export ready
- No paid tiers — 100% free, MIT licensed
- No telemetry beyond localStorage — privacy first

---

## 📋 Session Hygiene Checklist (Per Implementation Batch)

```
□ Implement steps
□ Add/update tests for changes
□ Run build (npm run build)
□ Run lint (npm run lint)
□ Run /simplify on touched files
□ Update/create docs in docs/user/ and docs/knowledge/
□ Update PROGRESS.md with completion status
□ Commit with conventional message (feat:/fix:/chore:)
```

---

## 📁 Key Documents Index

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | Implementation guide for agents — start here |
| `PROGRESS.md` | Step-by-step progress tracker |
| `docs/DECISIONS.md` | All design decisions with rationale |
| `docs/ARCHITECTURE.md` | Technical reference, data flow, component map |
| `docs/knowledge/github-ingestion.md` | GitHub API patterns, rate limits, GraphQL queries |
| `docs/knowledge/markdown-generation.md` | Template algorithms, section composition, sanitization |
| `docs/knowledge/ecosystem-embeds.md` | GitHolo/GitChronicle snippet formats, OG image URLs |
| `docs/user/getting-started.md` | User onboarding guide |
| `docs/user/configuration.md` | Presets, sections, ecosystem toggles reference |