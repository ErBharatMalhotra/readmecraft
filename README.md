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
| **🚀 Deploy Button** | One-click GitHub App install → auto-pushes README to your profile repo |
| **🧙 Project README Wizard** | `/craft` — analyzes repo, detects type, generates tailored markdown + badges |
| **🎨 Themes System** | 9 built-in themes (tokyonight, dracula, nord, catppuccin, rosepine, github-dark, gruvbox, solarized, default) |
| **🧩 Composite Card** | `?type=composite&include=stats,trophies,snake,heatmap&theme=tokyonight` |
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

### 🎨 Themes System (9 themes)

All badges accept `&theme=` parameter:

| Theme | Preview | Description |
|-------|---------|-------------|
| `tokyonight` | 🌃 | Tokyo Night — deep blues, vibrant purples |
| `dracula` | 🧛 | Dracula — dark with cyan/pink accents |
| `nord` | ❄️ | Nord — arctic, north-bluish tones |
| `catppuccin` | ☕ | Catppuccin Mocha — warm coffee tones |
| `rosepine` | 🌹 | Rose Pine — pine/rose natural palette |
| `github-dark` | 🐙 | GitHub Dark — matches GitHub's dark mode |
| `gruvbox` | 📦 | Gruvbox — retro groove, earthy tones |
| `solarized` | ☀️ | Solarized Dark — precision colors |
| `default` | ⚫ | ReadmeCraft signature (obsidian + emerald) |

**Usage:** `https://readme.bharatdn.com/api/badges?username=ErBharatMalhotra&type=snake&theme=tokyonight`

### 🧩 Composite Card

Single endpoint for multi-badge cards:

```
https://readme.bharatdn.com/api/badges?type=composite&username=ErBharatMalhotra&include=stats,trophies,snake,heatmap&theme=tokyonight
```

**Params:**
- `include` — comma-separated: `stats`, `trophies`, `snake`, `heatmap`, `activity`, `language`, `followers`, `repos`
- `theme` — any of the 9 themes
- `layout` — `grid` (2×2) or `stack` (vertical)

**Cache-bust:** Add `&v=<timestamp>` (edge cache 6h)

---

## 🔐 GitHub OAuth Integration

### Setup (Production)

1. **GitHub OAuth App** → Settings → Developer settings → OAuth Apps
2. **Callback URL:** `https://readme.bharatdn.com/api/auth/gh-callback`
3. **Vercel Env Vars:**
   ```
   AUTH_GITHUB_ID=<client_id>
   AUTH_GITHUB_SECRET=<client_secret>
   AUTH_SECRET=<64-char-hex>  # node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   GITHUB_TOKEN=<pat>          # fallback for unauthenticated users
   ```

### Flow (Custom — not NextAuth v5)

```
User clicks "Sign in with GitHub"
    ↓
GET /api/auth/signin/github → returns HTML with GitHub OAuth URL
    ↓
GitHub OAuth consent (scopes: read:user read:org repo)
    ↓
Returns to /api/auth/gh-callback → exchanges code for token
    ↓
Creates JWT session token (HS256, 30d expiry)
    ↓
Sets HttpOnly cookie: nextauth.session-token
    ↓
Meta refresh + JS redirect to /
    ↓
Client fetches /api/auth/session → gets user data
```

### Custom Auth Client

We use a **custom auth client** (`src/lib/auth-client.tsx`) instead of NextAuth v5:

```typescript
// useAuth() hook — same API as useSession()
const { session, status, update, signOut } = useAuth();
// status: 'loading' | 'authenticated' | 'unauthenticated'
// session: { user: { id, name, email, image, login }, accessToken, expires }
```

**Why custom?**
- NextAuth v5 broke our custom PKCE + JWT cookie flow
- Vercel edge follows HTTP 302 redirects; auth routes return HTML with meta refresh + JS redirect
- PKCE with state in signed JWT cookie `nextauth.pkce`; session in `nextauth.session-token`

---

## 🚀 One-Click Deploy (GitHub App)

### User Flow

```
1. Sign in with GitHub (OAuth)
   ↓
2. Header shows green 🚀 "Deploy" button (3 locations)
   ↓
3. Click → /deploy page → Select theme + badges
   ↓
4. Click "Deploy to GitHub Profile"
   ↓
5. Redirects to GitHub App install page
   ↓
6. Select username/username (profile repo)
   ↓
7. GitHub App callback → generates README with theme-aware badge URLs
   ↓
8. Pushes README.md to profile repo via installation token
   ↓
9. Done! Profile README live
```

### GitHub App Config

| Property | Value |
|----------|-------|
| **App Name** | ReadmeCraft Deploy |
| **App ID** | 5746827 |
| **Slug** | `readmecraft-deploy` |
| **Permissions** | `contents: write`, `metadata: read` |
| **Callback** | `https://readme.bharatdn.com/api/auth/github-app/callback` |
| **Webhook** | `https://readme.bharatdn.com/api/auth/github-app/webhook` |

### Env Vars Required

```
GITHUB_APP_ID=5746827
GITHUB_APP_CLIENT_ID=<app_client_id>
GITHUB_APP_CLIENT_SECRET=<app_client_secret>
GITHUB_APP_PRIVATE_KEY=<base64_encoded_pem>
```

---

## 🧙 Project README Wizard (`/craft`)

**Analyzes any repo → generates tailored README + badges**

| Step | Action |
|------|--------|
| 1 | Enter repo URL (`github.com/owner/repo`) |
| 2 | Auto-detects: type (Node, Python, Rust, Go, CLI, API, etc.), package.json/Cargo.toml, languages, topics |
| 3 | Picks preset: Standard / API / CLI / Library / Monorepo |
| 4 | Generates: Badge lineup, sections, ecosystem widgets |
| 5 | One-click copy/download + Deploy button |

**Detection logic:**
- `package.json` → Node/TypeScript → checks for `bin`, `main`, `exports` (CLI vs Lib)
- `Cargo.toml` → Rust → `[[bin]]` vs `[[lib]]`
- `go.mod` → Go → `main` package detection
- `pyproject.toml` / `setup.py` → Python → CLI vs Lib
- `Dockerfile` + `docker-compose.yml` → Container/Infra
- GitHub topics → ML/AI, Game, Web, Mobile, etc.

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

## 🔧 Advanced Features

### Viewer-Aware Badges

Badges detect viewer via edge headers (Vercel/Cloudflare):

| Header | Purpose |
|--------|---------|
| `x-vercel-ip-country` | Country for localized greeting |
| `x-forwarded-for` | IP for visitor count |
| `cf-ipcountry` | Cloudflare country |
| `user-agent` | Bot detection |

**Timezone-aware:** Heatmap highlights current day in viewer's timezone; code-pulse badges show localized greeting.

### Text Safety System

All 21 badge generators use comprehensive text handling:

```typescript
// Font metrics → truncation → wrapping → overflow prevention
const { lines, width, height } = measureText(text, fontSize, maxWidth);
// Auto-wraps long text, truncates with ellipsis, prevents clipping
```

### Snake Badge (Platane/snk Compatible)

- Per-segment keyframes: `sn-move-0` … `sn-move-4`
- Serpentines through contribution cells only
- Falls back to demo calendar when GraphQL rate-limited
- 18+ snake types supported

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

# GitHub App (for deploy flow)
GITHUB_APP_ID=5746827
GITHUB_APP_CLIENT_ID=<app_client_id>
GITHUB_APP_CLIENT_SECRET=<app_client_secret>
GITHUB_APP_PRIVATE_KEY=<base64_encoded_pem>
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signin/github/route.ts      # Returns GitHub OAuth URL (HTML)
│   │   │   ├── gh-callback/route.ts        # OAuth callback → JWT cookie
│   │   │   ├── session/route.ts            # Verifies JWT → returns user
│   │   │   ├── signout/route.ts            # Clears session cookie
│   │   │   └── github-app/
│   │   │       ├── install/route.ts        # GitHub App install URL
│   │   │       └── callback/route.ts       # Installation token → push README
│   │   ├── badges/route.ts                 # Native SVG badge generator (21 types)
│   │   ├── ingest/route.ts                 # GitHub profile/repo ingestion
│   │   └── star/route.ts                   # Star repo via OAuth token
│   ├── deploy/page.tsx                     # Deploy UI (theme + badge picker)
│   ├── craft/page.tsx                      # Project README Wizard
│   ├── layout.tsx                          # Root layout + AuthProvider
│   └── page.tsx                            # Main studio page
├── components/
│   ├── AuthButton.tsx                      # Sign in/out + user avatar
│   ├── AuthProvider.tsx                    # Client-side custom AuthProvider
│   ├── EcosystemWidgets.tsx                # GitHolo/GitChronicle embeds
│   ├── Header.tsx                          # Top bar with star + deploy buttons
│   ├── HeroIngestion.tsx                   # Username/repo input
│   ├── PaneGitHubPreview.tsx               # Live markdown preview
│   ├── PaneMarkdownEditor.tsx              # Raw markdown editor
│   ├── PaneSectionManager.tsx              # Sidebar: presets, toggles, sections
│   └── ExportToolbar.tsx                   # Copy/Download/Confetti
├── lib/
│   ├── auth-client.tsx                     # Custom useAuth hook + AuthContext
│   ├── auth.ts                             # JWT helpers (SignJWT, jwtVerify)
│   ├── github-api.ts                       # GraphQL + caching + ETag + dedup
│   ├── github.ts                           # fetchGitHubProfile / Project
│   ├── generators.ts                       # Section → Markdown compilers
│   ├── utils.ts                            # cn() helper
│   └── badge-generators/                   # 21 individual badge generators
└── types/
    └── readmecraft.ts                      # TypeScript interfaces
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

## 🛡️ Protecting Your Open Source Work

You asked how to prevent others from copying your code and claiming it as theirs. Here's a practical strategy:

### 1. **License with Teeth (Choose Wisely)**

| License | Protection Level | Best For |
|---------|------------------|----------|
| **MIT** | ⚠️ Minimal — allows commercial use, modification, private forks | Maximum adoption |
| **Apache 2.0** | ✅ Patent grant, requires attribution | Enterprise-friendly |
| **GPL v3** | ✅ **Strong** — derivatives must be open source | Preventing proprietary forks |
| **AGPL v3** | ✅ **Strongest** — covers SaaS/network use | Cloud-hosted tools |
| **BSL / SSPL** | ✅ Source available, restricts commercial SaaS | Business models |

**Recommendation for ReadmeCraft:** **AGPL v3** or **GPL v3** — forces anyone hosting a modified version as a service to share their changes.

### 2. **Trademark Your Brand**

- Register **ReadmeCraft** as a trademark (word mark + logo)
- Add `TRADEMARK.md` stating: "ReadmeCraft™ is a trademark of Bharat Malhotra"
- Prevents others from using your name/logo for their fork

### 3. **Signed Commits + Provenance**

```bash
# Enable git commit signing
git config --global commit.gpgsign true
git config --global user.signingkey <KEY_ID>

# Every commit shows "Verified" on GitHub
# Proves authorship cryptographically
```

### 4. **Supply Chain Attestation (SLSA)**

```yaml
# .github/workflows/release.yml
- uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v1.9.0
```
Generates **provenance attestations** — cryptographic proof of build source.

### 5. **Dependabot + CodeQL + Secret Scanning**

```yaml
# .github/dependabot.yml + codeql-analysis.yml
# Catches vulnerabilities + prevents secret leaks in forks
```

### 6. **Release Assets with Checksums**

```bash
# On every release
sha256sum dist/* > SHA256SUMS
gpg --clearsign SHA256SUMS
# Users verify: gpg --verify SHA256SUMS.asc && sha256sum -c SHA256SUMS
```

### 7. **Commercial License Option (Dual Licensing)**

```
README.md:
## License
This project is licensed under AGPL-3.0.
For commercial/private use without open-sourcing your modifications,
contact bharat@bharatdn.com for a commercial license.
```

### 8. **What You CAN'T Prevent**

| Myth | Reality |
|------|---------|
| "No one can copy my code" | ❌ Git is designed for forking |
| "License stops theft" | ❌ Only enforceable in court (expensive) |
| "Obfuscation helps" | ❌ JS is always readable; minification ≠ protection |

### 9. **What ACTUALLY Works**

| Strategy | Effort | Effectiveness |
|----------|--------|---------------|
| **AGPL/GPL** | Low | High — legal obligation to share changes |
| **Trademark** | Medium | High — protects brand identity |
| **Build community** | High | Highest — users prefer original |
| **Move fast** | High | High — forks lag behind |
| **Hosted SaaS** | High | Highest — code never leaves your server |

### 10. **My Recommendation for You**

```markdown
# Add to your README.md

## ⚖️ License

**AGPL-3.0** — This project is licensed under the GNU Affero General Public License v3.0.

> **What this means:** If you modify ReadmeCraft and offer it as a service (SaaS, hosted tool, API), 
> you MUST provide your modified source code to users under the same license.
> 
> For commercial/private use without open-sourcing changes, 
> [contact for a commercial license](mailto:bharat@bharatdn.com).

## 🛡️ Trademark

**ReadmeCraft™** and the **ReadmeCraft logo** are trademarks of Bharat Malhotra.
Unauthorized use in derivative works, forks, or competing services is prohibited.

## ✅ Verification

All releases are signed and include SLSA provenance attestations.
Verify with: `gpg --verify SHA256SUMS.asc && sha256sum -c SHA256SUMS`
```

---

## 📜 License

**AGPL-3.0** © Bharat Malhotra (`ErBharatMalhotra`)

> **Note:** This project was previously MIT. Changed to AGPL-3.0 to protect against commercial forks that don't contribute back. If you need a commercial license for private/proprietary use, contact `bharat@bharatdn.com`.