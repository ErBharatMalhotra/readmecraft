# Configuration Reference

> Complete reference for all presets, sections, toggles, and customization options in ReadmeCraft.

---

## 🎛️ Profile Mode Presets

### Bento Grid (`bento`) — Default

Modern editorial card layout with holographic ecosystem widgets.

**Sections (in order):**

1. **Bento Header & Profile Intro** — Name, bio, follower/portfolio/Twitter badges
2. **Ecosystem Widgets** — GitHolo 3D Card + GitChronicle Cadence (toggled)
3. **Bento Card Grid** — About Me + Top Languages (real repo bytes)
4. **Tech Stack & Tooling** — Badge cloud (skills from languages + curated)
5. **Pinned Showcase** — GitHub stats cards for top 3 repos
6. **GitHub Velocity & Streaks** — Stats card + Streak card

**Best for:** Most developers wanting a modern, visual profile.

---

### Minimalist (`minimalist`)

Linear/Vercel aesthetic — monochrome, high contrast, generous whitespace.

**Sections (in order):**

1. **Title & Introduction** — Name, bio, location + links
2. **Ecosystem Badges** — GitHolo + GitChronicle (toggled)
3. **Focus & Engineering Creed** — Bulleted current focus areas
4. **Languages & Core Technologies** — YAML-formatted skill list
5. **Featured Repositories** — Markdown list of pinned repos
6. **Live GitHub Metrics** — Stats card + Top Languages card

**Best for:** Clean, professional profiles; minimalists.

---

### Titan (`titan`)

High-velocity OSS maintainer — badge-heavy, tables, contributor focus.

**Sections (in order):**

1. **Hero Banner & Open Source Creed** — Badge row (followers, stars, license), quote
2. **Ecosystem Telemetry** — GitHolo + GitChronicle (toggled)
3. **Flagship Open Source Projects** — Markdown table (repo, description, tech, stars)
4. **Technology Arsenal** — Shields.io badge cloud (all skills)
5. **Commit Cadence & Streaks** — GitHub streak stats card
6. **Contact & Collaboration** — Web, GitHub, Twitter links

**Best for:** Prolific OSS maintainers, sponsor-seeking developers.

---

## 📦 Project Mode Presets

### Standard (`standard`) — Default

Complete project documentation structure.

**Sections (in order):**

1. **Hero Banner & Badges** — Title, description, stars/forks/license/stack badges, demo link
2. **Core Features** — Bulleted feature list with bold labels
3. **Tech Stack & Dependencies** — Badge cloud (language, framework, tools)
4. **System Architecture** — Code-fence architecture diagram
5. **Installation & Local Development** — Prereqs + 3-step setup (clone, install, run)
6. **Ecosystem Cross-Pollination** — GitHolo + GitChronicle + ReadmeCraft links
7. **Contributing & Community** — Standard 5-step PR workflow
8. **License** — SPDX license reference

**Best for:** Most libraries, applications, full-stack projects.

---

### API SDK (`api`)

Client library / SDK documentation focus.

**Sections (in order):**

1. **API Title & Metadata** — Title, description, stars/license badges
2. **Installation & Setup** — Package manager command
3. **API Quick Reference** — TypeScript code example (client creation + usage)
4. **System Architecture** — Code-fence diagram
5. **Testing & Verification** — Test command
6. **Ecosystem Integrations** — GitHolo + GitChronicle + ReadmeCraft

**Best for:** NPM packages, SDKs, API clients, wrapper libraries.

---

### CLI Tool (`cli`)

Command-line tool quickstart focus.

**Sections (in order):**

1. **Header & Badges** — Title, description, stars/license/language badges
2. **Terminal Quickstart** — Install (global) + run commands
3. **Core Capabilities** — Bulleted feature list
4. **CLI Usage & Flags** — Code fence with flags table
5. **Ecosystem Telemetry** — GitHolo + GitChronicle + ReadmeCraft
6. **License** — SPDX license

**Best for:** CLI tools, global npm packages, dev utilities.

---

## 🧩 Section Manager Controls

### For Each Section:

| Control      | Action                                                         |
| ------------ | -------------------------------------------------------------- |
| **Checkbox** | Enable/disable — instantly adds/removes from compiled markdown |
| **↑ Up**     | Move section up (swaps `order` with previous)                  |
| **↓ Down**   | Move section down (swaps `order` with next)                    |
| **🗑 Delete** | Remove custom section (preset sections cannot be deleted)      |

### Preset Radio Group:

- Switching preset **regenerates all sections** for that preset
- Custom sections **persist** across preset switches (marked with amber "Custom" badge)
- Section toggles/enabled state **reset** to preset defaults on switch

### Add Custom Section:

1. Click **"Add Section"** button
2. Enter **Section Title** (e.g., "Sponsors", "Roadmap", "Benchmarks")
3. Enter **Markdown Content** (supports full markdown)
4. Click **"Add Block"** → appears at bottom, fully editable

---

## 🌌 Ecosystem Toggles

Located in **Section Manager → Ecosystem Cross-Pollination Card**

| Toggle                   | Effect When Enabled                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **GitHolo 3D Card**      | Adds `[![GitHolo 3D Card](https://githolo.vercel.app/api/og/{user})](https://githolo.bharatdn.com)` to ecosystem section                         |
| **GitChronicle Cadence** | Adds `[![GitChronicle Cadence](https://gitchronicle-wheat.vercel.app/badge/{user}.svg)](https://gitchronicle.bharatdn.com)` to ecosystem section |

**State:** Persisted per-mode in localStorage — survives preset switches.

---

## ✏️ Markdown Editor Modes

### Full Document Mode

- Single textarea with **entire compiled markdown**
- Toolbar operates on full document
- Best for: Global edits, copy/paste large chunks

### Section-by-Section Mode

- Tab bar with **each section title**
- Click tab → edit only that section's markdown
- Toolbar inserts at cursor within active section
- Best for: Focused editing, preserving section structure

**Switch:** Radio buttons in Editor header bar.

---

## ⌨️ Editor Toolbar Buttons

| Button             | Shortcut | Inserts                          |
| ------------------ | -------- | -------------------------------- |
| **H1**             | —        | `# Heading`                      |
| **H2**             | —        | `## Heading`                     |
| **Bold**           | `⌘B`     | `**bold**`                       |
| **Italic**         | `⌘I`     | `*italic*`                       |
| **Code Block**     | —        | `\`\`\`typescript\ncode\n\`\`\`` |
| **List**           | —        | `- item`                         |
| **Table**          | —        | Markdown table template          |
| **+ GitHolo**      | —        | GitHolo 3D Card snippet          |
| **+ GitChronicle** | —        | GitChronicle Badge snippet       |

---

## 👁️ Preview Pane Controls

### View Mode Toggle

| Mode         | Description                                       |
| ------------ | ------------------------------------------------- |
| **Rendered** | Full GitHub-flavored markdown rendering (default) |
| **Raw**      | Monospace raw markdown with line wrapping         |

### Viewport Toggle

| Viewport    | Width                     | Use Case                    |
| ----------- | ------------------------- | --------------------------- |
| **Desktop** | 100% (max ~980px content) | Default GitHub README width |
| **Tablet**  | 768px                     | Tablet readability check    |
| **Mobile**  | 375px                     | Mobile README view          |

---

## 📤 Export Toolbar Actions

### Primary Actions (Right Side)

| Button                 | Shortcut | Action                                 |
| ---------------------- | -------- | -------------------------------------- |
| **Download README.md** | —        | Downloads `slugified-title-README.md`  |
| **Copy Markdown**      | `⌘S`     | Copies to clipboard + confetti + toast |

### Quick Embed Copies (Left Side)

| Button                | Action                                            |
| --------------------- | ------------------------------------------------- |
| **Copy GitHolo 3D**   | Copies GitHolo snippet for current user/repo      |
| **Copy GitChronicle** | Copies GitChronicle snippet for current user/repo |

### Toast Notifications

- Appear bottom-right on copy/download
- Auto-dismiss after 3 seconds
- Emerald border + pulse indicator

---

## 💾 JSON State Schema

### Export Format (`readmecraft-<mode>-<timestamp>.json`)

```json
{
  "mode": "profile",
  "profilePreset": "bento",
  "projectPreset": "standard",
  "profileData": {/* ProfileData object */},
  "projectData": {/* ProjectData object */},
  "sections": [/* Section[] array */]
}
```

### Import Validation

- All fields optional — missing fields use defaults
- `sections` array validated for required fields (`id`, `title`, `enabled`, `content`, `order`)
- Invalid JSON → alert, no state change

### Use Cases

- **Backup:** Before major edits
- **Share Config:** Send JSON to teammate for identical setup
- **Version Control:** Commit JSON alongside repo for reproducible README
- **Migrate:** Move config between machines/browsers

---

## 🔐 GitHub Token Configuration

### Where to Add

**Hero Ingestion → Token button** (key icon)

### Token Requirements

| Scope         | Purpose                                                |
| ------------- | ------------------------------------------------------ |
| `public_repo` | Read public repo data (languages, stars, package.json) |
| `repo`        | Full repo access (includes private repos you own)      |
| `read:user`   | Read user profile (bio, socials)                       |

### Security

- Token stored **only in component state** (React `useState`)
- **Never** written to localStorage
- **Never** sent to our servers (only to `api.github.com` via `/api/ingest` proxy)
- Cleared on page refresh

### Creating a Token

1. GitHub → Settings → Developer Settings → Personal Access Tokens → **Tokens (classic)**
2. **Generate new token (classic)**
3. Name: `ReadmeCraft`
4. Expiration: 90 days (recommended)
5. Scopes: ✅ `public_repo` (minimum), ✅ `repo` (for private), ✅ `read:user`
6. **Copy immediately** — never shown again

---

## 🎨 Design Token Reference (CSS Variables)

Available in `globals.css` — use in custom sections if needed:

```css
:root {
  --bg-chassis: #090d16; /* Deepest background */
  --bg-surface: #0e1526; /* Card/panel background */
  --bg-card: #131c31; /* Elevated card */
  --border-color: #1e293b; /* Borders, dividers */
  --emerald-primary: #10b981; /* Primary accent */
  --emerald-glow: rgba(16, 185, 129, 0.15);
  --text-primary: #f1f5f9; /* Primary text */
  --text-muted: #94a3b8; /* Secondary text */
}
```

**Tailwind Usage:** `bg-[var(--bg-chassis)]`, `text-[var(--emerald-primary)]`, `border-[var(--border-color)]`

---

## ⌨️ Complete Keyboard Shortcuts

| Shortcut    | Context | Action                      |
| ----------- | ------- | --------------------------- |
| `⌘S`        | Global  | Copy Markdown               |
| `⌘E`        | Global  | Export JSON                 |
| `⌘1`        | Global  | Focus Section Manager       |
| `⌘2`        | Global  | Focus Markdown Editor       |
| `⌘3`        | Global  | Focus GitHub Preview        |
| `⌘K`        | Global  | Command Palette _(planned)_ |
| `⌘B`        | Editor  | Bold                        |
| `⌘I`        | Editor  | Italic                      |
| `Tab`       | Editor  | Indent (native)             |
| `Shift+Tab` | Editor  | Outdent (native)            |
| `Enter`     | Editor  | New line (native)           |
| `Escape`    | Modal   | Close modal                 |

---

## 📱 Mobile-Specific Behavior

### Bottom Tab Bar (replaces 3-pane)

| Tab          | Icon     | Pane            |
| ------------ | -------- | --------------- |
| **Sections** | Layers   | Section Manager |
| **Editor**   | FileCode | Markdown Editor |
| **Preview**  | Eye      | GitHub Preview  |

### Touch Optimizations

- All buttons ≥44px touch target
- Swipe not used (tab bar only)
- Textarea uses native mobile keyboard
- Viewport toggle hidden on mobile (always 100% width)

---

## 🔧 Advanced: Custom Section Patterns

### Sponsors Section

```markdown
### 💝 Sponsors

Thank you to my sponsors!

<table>
<tr>
<td align="center"><a href="https://github.com/sponsors/user"><img src="https://github.com/sponsors/user/badge.svg" /></a></td>
</tr>
</table>
```

### Roadmap Section

```markdown
### 🗺️ Roadmap

- [x] MVP Launch
- [ ] v1.0 Stable API
- [ ] Plugin System
- [ ] Multi-language Support
```

### Benchmarks Section

```markdown
### ⚡ Benchmarks

| Operation | Time  | vs Baseline |
| --------- | ----- | ----------- |
| Parse     | 2.3ms | 1.0x        |
| Transform | 5.1ms | 1.2x        |
| Render    | 1.8ms | 0.9x        |

_Run with `npm run bench` on M2 MacBook Pro_
```

### Badge Cluster Section

```markdown
### 🏷️ Badges

![Version](https://img.shields.io/npm/v/package?style=flat-square&color=10b981)
![Downloads](https://img.shields.io/npm/dm/package?style=flat-square&color=10b981)
![License](https://img.shields.io/npm/l/package?style=flat-square&color=10b981)
![CI](https://img.shields.io/github/actions/workflow/status/owner/repo/ci.yml?style=flat-square&color=10b981)
```

---

## 📋 Checklist: Before Publishing README

- [ ] **Profile Mode:** Username correct? Avatar loads? Bio accurate?
- [ ] **Project Mode:** Repo URL correct? Install commands match package.json?
- [ ] **Preset:** Right vibe for your audience?
- [ ] **Sections:** All relevant enabled? Irrelevant disabled?
- [ ] **Order:** Logical flow (intro → features → install → contributing)?
- [ ] **Ecosystem:** GitHolo/GitChronicle toggles as desired?
- [ ] **Preview:** Rendered view looks correct on Desktop/Tablet/Mobile?
- [ ] **Raw:** No markdown syntax errors?
- [ ] **Export:** Copy Markdown → paste into GitHub → preview there?
- [ ] **Backup:** Export JSON saved locally?

---

## 🔗 Related Pages

- [Getting Started](getting-started.md) — Quick start guide
- [Architecture](../ARCHITECTURE.md) — Technical reference
- [Decisions](../DECISIONS.md) — Design rationale
