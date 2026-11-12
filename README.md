# 🛠️ ReadmeCraft (Intelligent Dual-Mode GitHub README Studio)

> **Production Target:** `https://readme.bharatdn.com`  
> **Repository:** `ErBharatMalhotra/readmecraft`  
> **License:** MIT (100% Free & Open Source)  
> **Author:** Bharat Malhotra (`ErBharatMalhotra`)  
> **Design Philosophy:** Anti-AI-Slop Doctrine, OKLCH Color Geometry, Zero Generic Purple Gradients, High-Taste Editorial Developer UI

---

## 🎯 1. Why ReadmeCraft Exists (Market Gap)

Existing tools are fundamentally flawed:

1. **`rahuldkjain/github-profile-readme-generator` (24k ⭐):**
   - **Zero Auto-detection:** Requires manually clicking 50+ checkboxes and input fields.
   - **Dated Visuals:** Generates 2020-era centered HTML tables and flat shields.
   - **No Project Support:** Only does Profile READMEs.
2. **`octokatherine/readme.so` (4.6k ⭐):**
   - **Manual Typing:** Offers only blank markdown templates.
   - **No GitHub Awareness:** Cannot inspect a repo to auto-write install commands, license badges, or architecture.
   - **No Profile Support:** Only does Project READMEs.

### 🔥 ReadmeCraft's 10x Edge:

- **Dual-Mode Studio:** One unified tool for **Developer Profile READMEs** AND **Repository/Project READMEs**.
- **5-Second Zero-Typing Ingestion:**
  - Type username $\rightarrow$ Real top languages (by bytes), real pinned repos, live contributions, and socials auto-populated.
  - Paste repo link $\rightarrow$ `package.json`/`Cargo.toml` inspected, run scripts extracted, dependencies detected, live badges and installation commands auto-written.
- **Anti-AI-Slop Layouts:**
  - _Silicon Valley Minimalist:_ Linear/Vercel aesthetic (monochrome, high-contrast, Geist/JetBrains Mono).
  - _Bento Grid Developer:_ Modern card blocks grouping stats, tech stack, and featured projects.
  - _Open Source Titan:_ Heavy focus on releases, sponsor tiers, and contributor graphs.
- **Ecosystem Cross-Pollination:**
  - Native 1-click toggles to embed **GitHolo 3D Card** (`githolo.bharatdn.com`) and **GitChronicle Percentile Badge** (`gitchronicle.bharatdn.com`).

---

## 🏗️ 2. Architectural Blueprint

### The 3-Pane Studio Layout

````
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
````

---

## 🎨 3. Anti-AI-Slop Design Guidelines (Enforced)

- **Colors:** Deep obsidian chassis (`#090d16`), titanium borders (`#1e293b`), signal emerald accents (`#10b981`). **Zero generic violet/blue-purple gradient soups.**
- **Typography:** Space Grotesk / Geist Sans for display headings, JetBrains Mono for markdown code and badges.
- **Performance:** 100% client-side instant live markdown parsing using `react-markdown` + `remark-gfm` + `rehype-raw`.

---

## 🚀 4. Export & Sharing Actions

- **1-Click Copy Markdown** (with visual confirmation toast & confetti).
- **1-Click Download `README.md`**.
- **Export / Import JSON State** (autosaves in `localStorage` so work is never lost).

---

## 💻 5. Local Development

```bash
# Clone repository
git clone https://github.com/ErBharatMalhotra/readmecraft.git
cd readmecraft

# Install dependencies
npm install

# Start local dev server
npm run dev
```

Visit `http://localhost:3000` to access ReadmeCraft studio.

---

## 📜 License

MIT License © Bharat Malhotra (ErBharatMalhotra)
