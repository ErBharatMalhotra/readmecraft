# 🛠️ ReadmeCraft

> **Production:** `https://readme.bharatdn.com`  
> **Ecosystem:** `githolo.bharatdn.com` · `gitchronicle.bharatdn.com`  
> **Repository:** `ErBharatMalhotra/readmecraft`  
> **License:** MIT  
> **Author:** Bharat Malhotra (`ErBharatMalhotra`)

---

## 🎯 Overview

**ReadmeCraft** is a dual-mode GitHub README Studio for **Developer Profiles** and **Repositories**. Enter a GitHub username or repo URL → get a production-ready README in seconds with real data, native SVG badges, and 1-click ecosystem cross-pollination.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **Dual-Mode Studio** | Profile READMEs + Repository READMEs in one tool |
| **Zero-Typing Ingestion** | Username → real language bytes, pinned repos, live stats; Repo URL → package.json/Cargo.toml inspection |
| **6 Design Presets** | Bento Grid, Minimalist, Titan (Profile) · Standard, API, CLI (Project) |
| **Native SVG Badges** | 11 badge types via `/api/badges` — no external deps, zero rate-limit issues |
| **GitHub OAuth** | "Sign in with GitHub" → your personal 5,000 req/hr token used automatically |
| **Star Button** | Native "Star Repo" in header — direct API call, no redirect |
| **Ecosystem Widgets** | 1-click GitHolo 3D Cards + GitChronicle Cadence badges |
| **Export Ready** | Copy Markdown, Download README.md, JSON Import/Export, localStorage persistence |

---

## 🏗️ Architecture

### 3-Pane Studio Layout

```
┌─────────────────┬──────────────────────────┬──────────────────────────┐
│  PANE 1: BLOCKS │      PANE 2: EDITOR      │     PANE 3: PREVIEW      │
│                 │                          │                          │
│ [x] Bio/Header  │  ### Hi, I'm Bharat 👋   │  Hi, I'm Bharat 👋       │
│ [x] Tech Stack  │                          │                          │
│ [x] Pinned Repos│  ```ts                   │  ┌────────────────────┐  │
│ [x] GitHolo Card│  const skills = [..]     │  │ GitHolo 3D Card    │  │
│ [x] GitChronicle│  ```                     │  └────────────────────┘  │
│ [x] Native Badges│                          │  TypeScript · Next.js    │
│                 │                          │                          │
│ [+ Add Section] │  [Monospace Raw Editor]  │  [Exact GitHub Markdown] │
└─────────────────┴──────────────────────────┴──────────────────────────┘
```

### Rate-Limit Survival Strategy (Bulletproof)

| Layer | Implementation |
|-------|----------------|
| **OAuth Priority** | User's personal token (5,000 req/hr) > Server PAT fallback |
| **Unified GraphQL** | Single query (cost: 1) fetches profile, repos, languages, contributions, pinned |
| **Request Deduplication** | 60s in-memory cache prevents duplicate lookups |
| **Edge Caching** | 6-hour TTL + `stale-while-revalidate` on all badge/profile responses |
| **ETag / 304** | `If-None-Match` conditional requests → 0 cost on cache hit |
| **Mock Fallback** | Deterministic telemetry when GitHub API is rate-limited |

---

## 🎨 Design System

| Property | Value |
|----------|-------|
| **Background** | `#090d16` (Deep Obsidian) |
| **Borders** | `#1e293b` (Titanium) |
| **Accent** | `#10b981` (Signal Emerald) |
| **Gold Accent** | `#f59e0b` (Amber) |
| **Display Font** | Space Grotesk |
| **Mono Font** | JetBrains Mono |
| **UI Font** | Verdana / system |

---

## 📦 Native Badge API (`/api/badges`)

All badges are **self-contained SVGs** — no shields.io, no external dependencies.

| Type | Endpoint | Description |
|------|----------|-------------|
| `repos` | `?username=X&type=repos` | Public repo count |
| `followers` | `?username=X&type=followers` | Follower count |
| `following` | `?username=X&type=following` | Following count |
| `language` | `?username=X&type=language` | Top language |
| `streak` | `?username=X&type=streak` | Contribution streak |
| `contributions` | `?username=X&type=contributions` | Total contributions |
| `trophy` | `?username=X&type=trophy` | 🏆 Developer trophies card |
| `activity` | `?username=X&type=activity` | 📈 30-day commit activity graph |
| `visitor` | `?username=X&type=visitor` | 👀 Visitor analytics card |
| `heatmap` | `?username=X&type=heatmap` | 🗓️ GitHub-style contribution calendar |
| `snake` | `?username=X&type=snake` | 🐍 Animated contribution snake |
| `typing` | `?username=X&type=typing` | ⌨️ Animated typing SVG |
| `star-history` | `?username=X&type=star-history` | ⭐ Star history graph |
| `repo-card` | `?username=X&type=repo-card&repo=Y` | 📦 Rich repo embed card |
| `language-donut` | `?username=X&type=language-donut` | 🍩 Animated language donut |
| `skill-bubbles` | `?username=X&type=skill-bubbles` | 🫧 Animated tech stack bubbles |
| `ascii` | `?username=X&type=ascii&text=Y` | 🎨 ASCII banner generator |
| `streak-calendar` | `?username=X&type=streak-calendar` | 🔥 Compact streak calendar |

**External APIs (disabled until tokens provided):** `wakatime`, `leetcode`, `codeforces`, `spotify`, `youtube`, `blog`

---

## 🔐 GitHub OAuth Integration

### Setup (Production)

1. **GitHub OAuth App** → Settings → Developer settings → OAuth Apps
2. **Callback URL:** `https://readme.bharatdn.com/api/auth/callback/github`
3. **Vercel Env Vars:**
   ```
   AUTH_GITHUB_ID=<client_id>
   AUTH_GITHUB_SECRET=<client_secret>
   AUTH_SECRET=<64-char-hex>  # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   GITHUB_TOKEN=<pat>          # fallback for unauthenticated users
   ```

### Flow

```
User clicks "Sign in with GitHub"
    ↓
GitHub OAuth consent (scopes: read:user read:org repo)
    ↓
Returns to /api/auth/callback/github → session created
    ↓
session.accessToken stored in NextAuth JWT
    ↓
All API calls use user's token automatically (5,000 req/hr)
```

---

## ⭐ Native Star Button

**Header shows "Star Repo" button when authenticated** — one click, direct API call:

```typescript
// POST /api/star
{ "owner": "ErBharatMalhotra", "repo": "readmecraft" }
→ Uses session.accessToken → PUT /user/starred/owner/repo
→ Returns { starred: true, message: "Starred! Thanks ⭐" }
```

**No redirect, no iframe, instant.** Button updates to "Starred ⭐" (emerald, disabled).

---

## 🌐 Ecosystem Cross-Pollination

| Widget | URL | Embed Code |
|--------|-----|------------|
| **GitHolo 3D Card** | `githolo.bharatdn.com` | `[![GitHolo 3D Card](https://githolo.bharatdn.com/api/og/username)](https://githolo.bharatdn.com)` |
| **GitChronicle Cadence** | `gitchronicle.bharatdn.com` | `[![GitChronicle Cadence](https://gitchronicle.bharatdn.com/badge/username.svg)](https://gitchronicle.bharatdn.com)` |

**Sidebar toggles** (Pane 1) enable/disable each widget → auto-generates embed Markdown.

---

## 🚀 Local Development

```bash
git clone https://github.com/ErBharatMalhotra/readmecraft.git
cd readmecraft
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Environment (`.env.local`)

```env
AUTH_GITHUB_ID=<client_id>
AUTH_GITHUB_SECRET=<client_secret>
AUTH_SECRET=<64-char-hex>
GITHUB_TOKEN=<pat>  # optional, for unauthenticated fallback
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth.js v5 handler
│   │   ├── badges/route.ts               # Native SVG badge generator
│   │   ├── ingest/route.ts               # GitHub profile/repo ingestion
│   │   └── star/route.ts                 # Star repo via OAuth token
│   ├── layout.tsx                        # Root layout + AuthProvider
│   └── page.tsx                          # Main studio page
├── components/
│   ├── AuthButton.tsx                    # Sign in/out + user avatar
│   ├── AuthProvider.tsx                  # Client-side SessionProvider
│   ├── EcosystemWidgets.tsx              # GitHolo/GitChronicle embeds
│   ├── Header.tsx                        # Top bar with star button + menus
│   ├── HeroIngestion.tsx                 # Username/repo input
│   ├── PaneGitHubPreview.tsx             # Live markdown preview
│   ├── PaneMarkdownEditor.tsx            # Raw markdown editor
│   ├── PaneSectionManager.tsx            # Sidebar: presets, toggles, sections
│   └── ExportToolbar.tsx                 # Copy/Download/Confetti
├── lib/
│   ├── github-api.ts                     # GraphQL + caching + ETag + dedup
│   ├── github.ts                         # fetchGitHubProfile / Project
│   ├── generators.ts                     # Section → Markdown compilers
│   ├── utils.ts                          # cn() helper
│   └── auth.ts                           # NextAuth config
└── types/
    └── readmecraft.ts                    # TypeScript interfaces
```

---

## 🧠 Sidebar (Pane 1) — Layout & Sections

| Area | Contents |
|------|----------|
| **Presets** | Bento / Minimalist / Titan (Profile) · Standard / API / CLI (Project) |
| **Ecosystem Card** | GitHolo + GitChronicle toggles with external links |
| **README Blocks** | Draggable, toggleable, deletable sections (checkbox + up/down + trash) |
| **Add Custom** | Modal for custom title + Markdown content |

---

## 📜 License

MIT License © Bharat Malhotra (`ErBharatMalhotra`)