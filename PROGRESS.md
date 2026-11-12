# ReadmeCraft — Implementation Progress Tracker

> **Instructions:** Check off steps as completed. Add notes for blockers, decisions, or things to revisit. New sessions read this first.

---

## ✅ Phase 1: Core Studio (COMPLETED)

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 1.1 | Next.js 16 + TS + Tailwind v4 scaffold | ✅ Done | `npm init`, installed deps, `tsconfig.json`, `postcss.config.mjs` |
| 1.2 | Type system (`src/types/readmecraft.ts`) | ✅ Done | `AppMode`, `ProfilePreset`, `ProjectPreset`, `Section`, `ProfileData`, `ProjectData`, `ReadmeState` |
| 1.3 | GitHub ingestion (`src/lib/github.ts`) | ✅ Done | `fetchGitHubProfile()` + `fetchGitHubProject()` with REST API, token support, intelligent fallbacks |
| 1.4 | Template generators (`src/lib/generators.ts`) | ✅ Done | 6 presets (bento/minimalist/titan + standard/api/cli), 34 sections, `compileSectionsToMarkdown()` |
| 1.5 | API route `/api/ingest` | ✅ Done | Server-side proxy for GitHub API, avoids CORS |
| 1.6 | Header + Hero Ingestion | ✅ Done | Mode switch, ecosystem links, import/export, username/repo input with quick samples |
| 1.7 | Pane 1: Section Manager | ✅ Done | Toggle, reorder, preset switch, custom sections modal, GitHolo/GitChronicle toggles |
| 1.8 | Pane 2: Markdown Editor | ✅ Done | Full/Section modes, toolbar (H1-H2, bold, italic, code, list, table), ecosystem quick-insert, telemetry footer |
| 1.9 | Pane 3: GitHub Preview | ✅ Done | Rendered/Raw toggle, Desktop/Tablet/Mobile viewport, GitHub chrome header |
| 1.10 | Export Toolbar | ✅ Done | Copy (confetti + toast), Download, Quick-copy GitHolo/GitChronicle snippets |
| 1.11 | Footer | ✅ Done | Ecosystem cross-links, GitHub repo, MIT license |
| 1.12 | localStorage autosave + JSON import/export | ✅ Done | `readmecraft_saved_state_v2` key, versioned export, FileReader import |
| 1.13 | Global styles + GitHub markdown theme | ✅ Done | OKLCH CSS vars, `.markdown-body` matching GitHub dark mode |
| 1.14 | Git config + commit hygiene | ✅ Done | `ErBharatMalhotra <mr.bharatmalhotra@gmail.com>`, conventional commits, no AI attribution |
| 1.15 | Build verification + GitHub push | ✅ Done | `npm run build` passes, pushed to `ErBharatMalhotra/readmecraft` |

---

## 🔄 Phase 2: Production Hardening (NEXT BATCH)

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 2.1 | ESLint + Prettier config, CI integration | ⬜ Pending | Add `.eslintrc.json`, `.prettierrc`, GitHub Actions workflow |
| 2.2 | Unit tests for generators (Vitest) | ⬜ Pending | Snapshot test `compileSectionsToMarkdown()` output for all 6 presets |
| 2.3 | Integration test for ingestion (MSW) | ⬜ Pending | Mock GitHub REST endpoints, test success/error/rate-limit paths |
| 2.4 | Rate limit handling | ⬜ Pending | Show remaining, 5min cache, graceful fallback to sample data |
| 2.5 | Error boundaries per pane | ⬜ Pending | React error boundaries for each pane + global fallback UI |
| 2.6 | Keyboard shortcuts | ⬜ Pending | `⌘S` copy, `⌘E` export JSON, `⌘1/2/3` pane focus, `⌘K` command palette (stretch) |
| 2.7 | Accessibility audit | ⬜ Pending | ARIA labels, focus management, color contrast (WCAG AA), keyboard nav |
| 2.8 | SEO: meta, OG, sitemap, robots | ⬜ Pending | Dynamic OG image for generated READMEs, `next-sitemap` |
| 2.9 | Vercel deploy + domain mapping | ⬜ Pending | `vercel.json`, map `readme.bharatdn.com`, env vars for GitHub token |
| 2.10 | Privacy-friendly analytics | ⬜ Pending | Plausible or Umami self-hosted, track mode usage, export actions |

---

## 🧠 Phase 3: Intelligence & Polish

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 3.1 | GraphQL unified query for profile | ⬜ Pending | Single round-trip: user + repos + languages + pinned |
| 3.2 | Mono-repo detection (tree inspection) | ⬜ Pending | Recurse `package.json` in workspaces, detect pnpm/yarn/npm workspaces |
| 3.3 | CI/CD badge auto-generation | ⬜ Pending | Detect `.github/workflows/*.yml`, GitLab CI, CircleCI → badges |
| 3.4 | Contributor graph + Titan preset | ⬜ Pending | Fetch contributors, enhance Titan preset with graphs |
| 3.5 | Sponsor tier detection | ⬜ Pending | GitHub Sponsors API → dynamic sponsor section |
| 3.6 | Custom domain verification | ⬜ Pending | Verify `website` field resolves, show verified badge |
| 3.7 | Light mode preview toggle | ⬜ Pending | GitHub light theme CSS vars, toggle in Pane 3 |
| 3.8 | Command Palette (`⌘K`) | ⬜ Pending | Fuzzy search all actions: sections, export, presets, shortcuts |

---

## 🌐 Phase 4: Ecosystem Expansion

| Step | Description | Status | Notes |
|------|-------------|--------|-------|
| 4.1 | GitHolo iframe embed preview | ⬜ Pending | Live 3D card in Pane 3 when GitHolo enabled |
| 4.2 | GitChronicle live badge preview | ⬜ Pending | Fetch actual SVG from `gitchronicle-wheat.vercel.app` |
| 4.3 | Share to X/Twitter with OG image | ⬜ Pending | Generate OG image via Vercel OG or custom endpoint |
| 4.4 | Universal embed code generator | ⬜ Pending | Copy-paste snippet for any site (not just GitHub) |
| 4.5 | BharatDN suite landing cross-links | ⬜ Pending | Coordinate with githolo.bharatdn.com, gitchronicle.bharatdn.com |

---

## 📝 Notes & Blockers

### Current Blockers
- None — Phase 1 complete and deployed to GitHub

### Decisions Made (Reference `docs/DECISIONS.md`)
1. **Client-side only** — No backend, all GitHub API calls from browser (with server proxy for CORS)
2. **REST over GraphQL for v1** — Simpler, sufficient for current needs; GraphQL in Phase 3.1
3. **localStorage for state** — No database, privacy-first; JSON import/export for portability
4. **OKLCH CSS variables** — Tailwind v4 native, no config file needed
4. **No AI attribution** — Hard rule: zero "generated by" text anywhere
5. **Conventional commits only** — Enforced via git config

### Things to Revisit
- [ ] Mono-repo detection strategy (Phase 3.2) — may need `package.json` workspaces field parsing
- [ ] Sponsor tier API requires user OAuth — evaluate if PAT with `read:user` scope suffices
- [ ] OG image generation — consider `@vercel/og` vs custom Canvas endpoint
- [ ] Command palette library — `cmdk` vs custom implementation

### Session Handoff Template
```
Session: [number]
Date: [date]
Completed: [step numbers]
Blockers: [any]
Next: [next step number]
Notes: [any context for next session]
```