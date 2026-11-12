# ReadmeCraft — Implementation Guide for Agents

> **Production Target:** `https://readme.bharatdn.com`
> **Repository:** `ErBharatMalhotra/readmecraft`
> **Author:** Bharat Malhotra (`ErBharatMalhotra`)

---

## 📖 What Is This Project?

ReadmeCraft is a **dual-mode intelligent GitHub README Studio** that runs entirely in the browser. Users paste a GitHub username (Profile Mode) or repository URL (Project Mode), and the app auto-fetches real data from GitHub's API to generate production-ready README markdown with modern layouts. It features a 3-pane responsive studio (Section Manager | Markdown Editor | GitHub Preview), anti-AI-slop design (OKLCH obsidian/emerald, Space Grotesk + JetBrains Mono), and 1-click ecosystem cross-pollination widgets for GitHolo (3D cards) and GitChronicle (cadence badges).

**Key Differentiator:** Zero typing. Real repo-byte language analysis (not checkmarks). Bento/Minimalist/Titan presets for profiles; Standard/API/CLI for repos. Export: Copy (confetti), Download, JSON Import/Export.

---

## 📚 Key Documents & Their Purpose

| File                                    | Purpose                                                    | When to Read                                             |
| --------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------- |
| `ROADMAP.md`                            | Full product spec: vision, architecture, phases, non-goals | **Start here** — defines what to build and in what order |
| `PROGRESS.md`                           | Step-by-step checklist with session batches                | Read first on new session to know where to pick up       |
| `docs/DECISIONS.md`                     | Every design decision + rationale + alternatives           | When ambiguous — prevents re-litigating settled choices  |
| `docs/ARCHITECTURE.md`                  | Technical reference: data flow, component map, APIs        | When implementing new features or debugging              |
| `docs/knowledge/github-ingestion.md`    | GitHub REST/GraphQL patterns, rate limits, fallbacks       | When modifying ingestion pipeline                        |
| `docs/knowledge/markdown-generation.md` | Template algorithms, section composition, sanitization     | When editing generators or adding presets                |
| `docs/knowledge/ecosystem-embeds.md`    | GitHolo/GitChronicle snippet formats, OG URLs              | When updating ecosystem widgets                          |
| `docs/user/getting-started.md`          | User-facing onboarding                                     | When updating user-facing behavior                       |
| `docs/user/configuration.md`            | Presets, sections, toggles reference                       | When adding configuration options                        |

---

## ⚙️ Tech Stack Summary

| Category        | Choice                                                      |
| --------------- | ----------------------------------------------------------- |
| Framework       | Next.js 16 (App Router)                                     |
| Language        | TypeScript (strict mode)                                    |
| Runtime         | React 19                                                    |
| Styling         | Tailwind CSS v4 (@tailwindcss/postcss)                      |
| Markdown        | react-markdown + remark-gfm + rehype-raw + rehype-highlight |
| GitHub API      | @octokit/rest + @octokit/graphql                            |
| Icons           | lucide-react                                                |
| Animation       | framer-motion                                               |
| Confetti        | canvas-confetti                                             |
| Utils           | clsx + tailwind-merge                                       |
| Package Manager | npm                                                         |
| Deploy          | Vercel                                                      |

---

## 🏗️ Core Architecture (Brief)

```
src/
├── app/
│   ├── api/ingest/route.ts       # Server-side GitHub fetch (avoids CORS)
│   ├── globals.css               # OKLCH CSS vars + GitHub markdown theme
│   ├── layout.tsx                # Root layout + font imports
│   └── page.tsx                  # Main studio — state orchestrator
├── components/
│   ├── Header.tsx                # Mode switch, ecosystem links, import/export
│   ├── HeroIngestion.tsx         # Username/repo input + quick samples
│   ├── PaneSectionManager.tsx    # Left pane: sections, presets, toggles
│   ├── PaneMarkdownEditor.tsx    # Center pane: editor + toolbar + section tabs
│   ├── PaneGitHubPreview.tsx     # Right pane: rendered/raw + viewport toggle
│   ├── ExportToolbar.tsx         # Bottom bar: copy (confetti), download, quick embeds
│   └── Footer.tsx                # Ecosystem cross-links + OSS links
├── lib/
│   ├── github.ts                 # fetchGitHubProfile() + fetchGitHubProject()
│   └── generators.ts             # getProfileSections() + getProjectSections() + compile()
├── types/
│   └── readmecraft.ts            # All TypeScript interfaces
└── styles/ (unused — Tailwind v4 uses globals.css)
```

**State Flow:** `page.tsx` holds all state → passes down to panes → panes call back to update state → `compileSectionsToMarkdown()` runs → preview re-renders. All state autosaves to `localStorage` (`readmecraft_saved_state_v2`).

---

## 🎨 Design Priorities (Enforced)

1. **Zero AI Slop** — No generic purple gradients, no "generated by" footers, no centered HTML tables
2. **OKLCH Color Geometry** — Obsidian chassis, titanium borders, signal emerald accents only
3. **Typography Discipline** — Space Grotesk for display, JetBrains Mono for code/badges
4. **GitHub Parity** — Preview must match GitHub's dark mode markdown rendering exactly
5. **Instant Feedback** — <16ms editor→preview sync, confetti on copy, toasts on actions
6. **Privacy First** — No analytics, no backend, token stays in browser memory only

---

## 📝 Conventions

- **Commits:** Conventional (`feat:`, `fix:`, `chore:`, `docs:`) — Author: `ErBharatMalhotra <mr.bharatmalhotra@gmail.com>` only
- **Branch:** `main` — push directly, no PRs needed for solo work
- **Imports:** `@/*` alias for `src/*` (tsconfig paths)
- **Components:** `'use client'` at top for all interactive components
- **Styles:** Tailwind utilities only — no CSS modules, no inline styles (except CSS vars in globals.css)
- **Types:** Shared in `src/types/readmecraft.ts` — import from `@/types/readmecraft`
- **Async:** `fetch` in lib, API route for server-side, client fallback if API fails
- **Errors:** Graceful degradation — show sample data with warning toast, never crash

---

## 🚀 Implementation Order

### Current Status: Phase 1 Complete ✅

See `PROGRESS.md` for detailed checklist. Next batch starts at **Phase 2, Step 2.1**.

### Session Batches (3-7 steps each, independent modules → parallelize with subagents)

| Session     | Steps    | Scope                                                               | Parallelizable                 |
| ----------- | -------- | ------------------------------------------------------------------- | ------------------------------ |
| **Batch 1** | 2.1-2.4  | Lint/Format, Unit Tests, Integration Tests, Rate Limit Handling     | 2.2, 2.3, 2.4 independent      |
| **Batch 2** | 2.5-2.8  | Error Boundaries, Keyboard Shortcuts, Accessibility, SEO            | 2.5, 2.6, 2.7, 2.8 independent |
| **Batch 3** | 2.9-2.10 | Vercel Deploy + Domain, Analytics                                   | Sequential                     |
| **Batch 4** | 3.1-3.4  | GraphQL Query, Mono-repo Detection, CI/CD Badges, Contributor Graph | 3.1, 3.2, 3.3 independent      |
| **Batch 5** | 3.5-3.8  | Sponsors, Domain Verification, Light Mode, Command Palette          | 3.5, 3.6, 3.7 independent      |

**Parallelism Guidance:** Steps marked "independent" above can run concurrently. Spawn subagents with:

- Relevant `docs/knowledge/` guide
- Types/interfaces from `src/types/readmecraft.ts`
- Clear description of what to build and where

---

## 🧠 Context Management

```
## Context Management

Claude's effectiveness degrades as context grows. The main process is an
orchestrator — it delegates, tracks progress, and synthesizes.

The main process should NOT:
- Read large files directly — delegate to subagents
- Write large modules directly — delegate to subagents
- Debug complex issues inline — spawn a subagent to investigate
- Re-read files it already wrote unless debugging

The main process SHOULD:
- Track which steps are complete (read PROGRESS.md)
- Review subagent results briefly
- Make cross-step decisions (refactoring, shared patterns)
- Manage commits

Subagent delegation pattern: For each step, spawn a subagent with only
the context it needs:
- The relevant docs/knowledge/ guide (don't load all guides into main context)
- The types/interfaces it depends on
- A clear description of what to build and where

Commits are context reset points. After each step, commit. If context
gets heavy mid-session, start a new session — pick up from the last commit.
```

---

## ✅ Code Quality Standards

```
## Code Quality

- Before writing a new utility, search the codebase for existing implementations. Reuse over rewrite.
- After completing every 3-4 steps, pause and review: are there patterns that should be extracted? Refactor into shared modules only when you see 3+ concrete usages, never preemptively.
- Run linter and formatter after every step. Fix issues immediately.
- Keep functions short and single-purpose. If a function does two things, split it.
- No dead code, no commented-out code, no TODO comments without a corresponding decision in docs/DECISIONS.md.
- When a refactor touches existing tests, update them in the same commit.
- After major integration milestones and the final step, run /simplify to review changed code for reuse, quality, and efficiency. Fix any issues found before continuing.
```

**Commands:**

- `npm run build` — TypeScript + Next.js build (must pass)
- `npm run lint` — ESLint (must pass)
- No formatter configured yet — Step 2.1 adds Prettier

---

## 📖 Documentation Rules

```
## Documentation Rules

When implementing or modifying a user-facing feature, you MUST update the corresponding docs in `docs/user/`:
- New feature → add or update the relevant doc page
- Changed behavior → update the doc to match
- New configuration option → add to `docs/user/configuration.md`
- New keyboard shortcut → add to `docs/user/configuration.md`

When adding non-trivial implementation logic (API integration, algorithm, data transformation):
- Create or update a guide in `docs/knowledge/`
- Reference it in CLAUDE.md's key documents table

Docs are part of the definition of done. A feature without updated docs is not complete.
```

---

## 🔑 Critical Git & Author Rules (Non-Negotiable)

1. **Author:** `ErBharatMalhotra <mr.bharatmalhotra@gmail.com>` — ONLY this identity in all commits
2. **No co-authored-by trailers** — `commit.trailer=false`, `commit.cleanup=strip`
3. **No AI attribution** — No "generated by", "assisted by", "co-authored-by" anywhere in code or git history
4. **Conventional commits only** — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
5. **Verify before commit:** `git log --format="%an <%ae> %s" -1` must show only ErBharatMalhotra

---

## ⚠️ Known Constraints & Gotchas

| Constraint                                               | Impact                                       | Workaround                                            |
| -------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| GitHub API rate limit (60/hr unauth, 5000/hr with token) | Ingestion fails silently for popular users   | Show token input, cache 5min, fallback to sample data |
| No CORS on `api.github.com` from browser                 | Direct fetch fails in some contexts          | `/api/ingest` route proxies server-side               |
| `package.json` detection only checks root                | Mono-repos with nested packages missed       | Step 3.2: tree inspection for workspaces              |
| `localStorage` 5MB limit                                 | Large state (many custom sections) may quota | JSON export/import as backup, compress if needed      |
| Vercel hobby: 100GB bandwidth, 12s function timeout      | Fine for static export, API route is fast    | No long-running ops in API route                      |

---

## 🎯 Implementation Prompt

<!-- Implementation prompt:
You are implementing ReadmeCraft. Read CLAUDE.md first, then ROADMAP.md Phase 2. Start with step 2.1.
Check PROGRESS.md for current status. After each step, update PROGRESS.md and commit.
For ambiguous decisions, document in docs/DECISIONS.md and keep moving.
Use subagents for parallel steps (see Session Batches table).
Run npm run build && npm run lint after each step.
-->

---

## 📞 Quick Reference: Key Files to Touch by Feature Area

| Feature               | Files to Modify                                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Add profile preset    | `src/lib/generators.ts` (getProfileSections), `src/types/readmecraft.ts` (ProfilePreset), `src/components/PaneSectionManager.tsx` (radio group) |
| Add project preset    | `src/lib/generators.ts` (getProjectSections), `src/types/readmecraft.ts` (ProjectPreset), `src/components/PaneSectionManager.tsx`               |
| New section type      | `src/lib/generators.ts` (add to preset array), `src/components/PaneSectionManager.tsx` (auto-included)                                          |
| GitHub API change     | `src/lib/github.ts`, `src/app/api/ingest/route.ts`                                                                                              |
| Editor toolbar button | `src/components/PaneMarkdownEditor.tsx` (insertSnippet calls)                                                                                   |
| Export action         | `src/components/ExportToolbar.tsx`                                                                                                              |
| Color/design token    | `src/app/globals.css` (CSS vars), Tailwind config (none — v4 uses CSS vars)                                                                     |
| Preview styling       | `src/app/globals.css` (`.markdown-body` rules)                                                                                                  |
| State persistence     | `src/app/page.tsx` (localStorage effects)                                                                                                       |
