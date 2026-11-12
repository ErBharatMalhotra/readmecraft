# Getting Started with ReadmeCraft

> Create world-class GitHub READMEs in seconds — zero typing, real data, modern design.

---

## 🚀 Quick Start

### 1. Open ReadmeCraft

Visit **[readme.bharatdn.com](https://readme.bharatdn.com)** — no installation, no account, no login.

### 2. Choose Your Mode

| Mode                     | Use Case                                         | Input                         |
| ------------------------ | ------------------------------------------------ | ----------------------------- |
| **Developer Profile**    | Your GitHub profile README (`username/username`) | GitHub username               |
| **Project / Repository** | Any repo's `README.md`                           | Repo URL or `owner/repo` slug |

### 3. Enter Identifier & Auto-Craft

- **Profile:** Type `ErBharatMalhotra` → Click **Auto-Craft**
- **Project:** Type `facebook/react` or `https://github.com/vercel/next.js` → Click **Auto-Craft**

### 4. Watch the Magic

ReadmeCraft instantly fetches:

- **Profile:** Real top languages (by repo bytes), pinned repos, bio, socials, contributions
- **Project:** `package.json`/`Cargo.toml` inspection, install commands, framework, license, badges

### 5. Customize (Optional)

- **Switch Preset:** Bento Grid / Minimalist / Titan (Profile) | Standard / API / CLI (Project)
- **Toggle Sections:** Enable/disable any block in the left pane
- **Reorder:** Drag sections up/down
- **Add Custom:** "Add Section" → title + markdown
- **Ecosystem:** Toggle GitHolo 3D Card & GitChronicle Cadence Badge

### 6. Export

| Action                 | Shortcut | Result                  |
| ---------------------- | -------- | ----------------------- |
| **Copy Markdown**      | `⌘S`     | Clipboard + confetti 🎉 |
| **Download README.md** | —        | File download           |
| **Export JSON State**  | `⌘E`     | Full config backup      |
| **Import JSON**        | —        | Restore from backup     |

---

## 🎯 Mode Deep-Dive

### Developer Profile Mode

**Best for:** Your `username/username` repository (GitHub Profile README)

**Auto-Detected:**

- ✅ Name, bio, avatar, location, website, Twitter
- ✅ **Real language percentages** (aggregated from repo bytes, not checkmarks)
- ✅ Top 3 pinned repos (by stars)
- ✅ Followers, following, public repo count
- ✅ Live contribution streak & stats (via shields.io)

**Presets:**

| Preset         | Vibe                          | Best For                     |
| -------------- | ----------------------------- | ---------------------------- |
| **Bento Grid** | Modern editorial cards        | Most developers              |
| **Minimalist** | Linear/Vercel aesthetic       | Clean, professional          |
| **Titan**      | Badge-heavy, velocity-focused | OSS maintainers, high-output |

### Project / Repository Mode

**Best for:** Any repository's `README.md`

**Auto-Detected:**

- ✅ Repo name, description, license, stars, forks, issues
- ✅ Primary language, framework (Next.js, React, Vue, Express, Rust, etc.)
- ✅ Package manager (npm, pnpm, yarn, bun, cargo) + exact install/run/test commands
- ✅ Tech stack from dependencies
- ✅ Architecture diagram placeholder

**Presets:**

| Preset       | Target                 | Structure                                                       |
| ------------ | ---------------------- | --------------------------------------------------------------- |
| **Standard** | General libraries/apps | Hero → Features → Stack → Architecture → Install → Contributing |
| **API SDK**  | Client libraries       | Install → Quick Reference → Auth → Testing                      |
| **CLI Tool** | Command-line tools     | Quickstart → Flags → Usage → Install                            |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action                          |
| -------- | ------------------------------- |
| `⌘S`     | Copy Markdown to clipboard      |
| `⌘E`     | Export JSON state               |
| `⌘1`     | Focus Section Manager (Pane 1)  |
| `⌘2`     | Focus Markdown Editor (Pane 2)  |
| `⌘3`     | Focus GitHub Preview (Pane 3)   |
| `⌘K`     | Command Palette _(coming soon)_ |

---

## 💾 State Persistence

- **Autosave:** Every change saves to browser `localStorage` instantly
- **Survives:** Browser close, refresh, device restart
- **Export JSON:** Full backup — share with team, version control, migrate machines
- **Import JSON:** Restore exact state — presets, custom sections, toggles, data

---

## 🌌 Ecosystem Cross-Pollination

Every README includes opt-in embeds for BharatDN's developer suite:

| Widget           | What It Does                  | Embed Example                                                                                                |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **GitHolo**      | 3D WebGL holographic card     | `[![GitHolo](https://githolo.vercel.app/api/og/user)](https://githolo.bharatdn.com)`                         |
| **GitChronicle** | Live percentile cadence badge | `[![GitChronicle](https://gitchronicle-wheat.vercel.app/badge/user.svg)](https://gitchronicle.bharatdn.com)` |

**Enable in:** Section Manager → Ecosystem Toggles
**Quick-copy in:** Editor Toolbar + Export Toolbar

---

## 🔐 GitHub Token (Optional)

**Why add a token?**

- ✅ 5,000 req/hr vs 60 req/hr (unauthenticated)
- ✅ Access private repos you own
- ✅ No rate limit errors on popular accounts

**How to add:**

1. Click **Token** button in Hero Ingestion
2. Paste GitHub Personal Access Token (`ghp_...`)
3. Token stays in browser memory only — never saved to localStorage or sent to our servers

**Create token:** GitHub Settings → Developer Settings → Personal Access Tokens → Classic → `public_repo` scope

---

## 🎨 Design Philosophy

**Anti-AI-Slop Doctrine:**

- Zero generic purple/blue gradients
- OKLCH color geometry: Obsidian chassis + Electric Emerald accents
- Space Grotesk (display) + JetBrains Mono (code) typography
- GitHub-dark-mode-perfect preview
- No "generated by" footers — ever

---

## 📱 Responsive Design

| Device                  | Layout                          |
| ----------------------- | ------------------------------- |
| **Desktop (≥1024px)**   | 3-pane side-by-side             |
| **Tablet (768-1023px)** | Stacked with bottom tab bar     |
| **Mobile (<768px)**     | Single pane with bottom tab bar |

---

## 🛠️ Advanced: Local Development

```bash
# Clone
git clone https://github.com/ErBharatMalhotra/readmecraft.git
cd readmecraft

# Install
npm install

# Dev server
npm run dev
# → http://localhost:3000

# Build
npm run build

# Lint
npm run lint
```

---

## 📜 License & Credits

**MIT License** — Free forever, open source.

**Author:** Bharat Malhotra ([@ErBharatMalhotra](https://github.com/ErBharatMalhotra))

**Ecosystem:**

- 🌌 [GitHolo](https://githolo.bharatdn.com) — 3D Holographic Cards
- 📈 [GitChronicle](https://gitchronicle.bharatdn.com) — Cadence Badges
- 🛠️ **ReadmeCraft** — README Studio

---

## 🆘 Troubleshooting

| Issue                | Solution                                           |
| -------------------- | -------------------------------------------------- |
| "User not found"     | Check spelling; user may be renamed                |
| "Rate limited"       | Add GitHub token; wait 1 hour                      |
| "Repo not found"     | Use `owner/repo` format; check visibility          |
| Preview looks wrong  | Toggle Rendered/Raw; check markdown syntax         |
| Custom section lost  | Check JSON export — custom sections persist        |
| Confetti not showing | Allow clipboard permission; check browser settings |

---

## 🔗 Quick Links

- **Live App:** https://readme.bharatdn.com
- **GitHub Repo:** https://github.com/ErBharatMalhotra/readmecraft
- **Issues:** https://github.com/ErBharatMalhotra/readmecraft/issues
- **GitHolo:** https://githolo.bharatdn.com
- **GitChronicle:** https://gitchronicle.bharatdn.com
