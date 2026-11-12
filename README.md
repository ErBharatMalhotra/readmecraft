# 🛠️ ReadmeCraft

> **Production Target:** `https://readme.bharatdn.com`  
> **Repository:** `ErBharatMalhotra/readmecraft`  
> **License:** MIT (100% Free & Open Source)  
> **Author:** Bharat Malhotra (`ErBharatMalhotra`)

---

## 🎯 Overview

ReadmeCraft is a dual-mode GitHub README Studio for **Developer Profiles** and **Repositories**. It auto-detects real data from GitHub and generates production-ready READMEs in seconds.

### Key Capabilities

- **Dual-Mode Studio** — One tool for Profile READMEs AND Repository READMEs
- **Zero-Typing Ingestion** — Username → real language bytes, pinned repos, live stats; Repo URL → package.json/Cargo.toml inspection, auto-detected scripts & badges
- **6 Design Presets** — Bento Grid, Minimalist, Titan (Profile) + Standard, API, CLI (Project)
- **Ecosystem Cross-Pollination** — 1-click embeds for GitHolo 3D Cards and GitChronicle Cadence Badges
- **Export Ready** — Copy Markdown, Download README.md, JSON Import/Export with localStorage persistence

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
│ [x] Socials     │                          │  TypeScript · Next.js    │
│                 │                          │                          │
│ [+ Add Section] │  [Monospace Raw Editor]  │  [Exact GitHub Markdown] │
└─────────────────┴──────────────────────────┴──────────────────────────┘
```

---

## 🎨 Design System

- **Colors:** Deep obsidian (`#090d16`), titanium borders (`#1e293b`), signal emerald accents (`#10b981`)
- **Typography:** Space Grotesk for display, JetBrains Mono for code and badges
- **Performance:** 100% client-side live markdown parsing with `react-markdown` + `remark-gfm` + `rehype-raw`

---

## 🚀 Export & Sharing

- **1-Click Copy Markdown** — with visual confirmation toast & confetti
- **1-Click Download `README.md`**
- **Export / Import JSON State** — autosaves in `localStorage`

---

## 💻 Local Development

```bash
# Clone repository
git clone https://github.com/ErBharatMalhotra/readmecraft.git
cd readmecraft

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Visit `http://localhost:3000` to access the studio.

---

## 📜 License

MIT License © Bharat Malhotra (ErBharatMalhotra)