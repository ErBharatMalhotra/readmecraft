# Markdown Generation — Template Algorithms & Section Composition

> Deep-dive on how ReadmeCraft transforms structured data into GitHub-ready markdown.

---

## 🎯 Core Philosophy

**Markdown-in, Markdown-out.** No AST manipulation, no runtime templating engine. Templates are TypeScript template literals that produce static markdown strings at generation time. The editor works on raw markdown; the preview renders it.

---

## 🏗️ Section Model

```typescript
interface Section {
  id: string;           // Unique identifier (e.g., 'header', 'bento_grid', 'custom_12345')
  title: string;        // Human-readable label for UI
  enabled: boolean;     // Toggle in Section Manager
  content: string;      // Raw markdown (interpolated at generation)
  order: number;        // Sort key for compilation
  isCustom?: boolean;   // User-added vs preset
}
```

**Why not AST?**
- Simplicity: `content` is just a string — editable in textarea, versionable in JSON
- Round-trip: User edits markdown → saves → preview updates — no parsing needed
- Performance: `join('\n\n')` is O(n) with zero dependencies

---

## ⚙️ Compilation Pipeline

```typescript
function compileSectionsToMarkdown(sections: Section[]): string {
  return sections
    .filter(s => s.enabled)           // 1. Respect toggles
    .sort((a, b) => a.order - b.order) // 2. Respect reorder
    .map(s => s.content.trim())        // 3. Trim each section
    .join('\n\n');                     // 4. Join with double newline
}
```

**Output Guarantees:**
- No leading/trailing whitespace
- Exactly one blank line between sections
- Disabled sections produce zero output
- Order matches Section Manager UI exactly

---

## 🎨 Template Generation Functions

### Entry Points
```typescript
// Profile Mode
function getProfileSections(data: ProfileData, preset: ProfilePreset): Section[]

// Project Mode
function getProjectSections(data: ProjectData, preset: ProjectPreset): Section[]
```

### Preset Dispatch Pattern
```typescript
function getProfileSections(data: ProfileData, preset: ProfilePreset): Section[] {
  switch (preset) {
    case 'minimalist': return minimalistSections(data);
    case 'titan': return titanSections(data);
    case 'bento':
    default: return bentoSections(data);
  }
}
```

### Section Factory Pattern
Each preset returns a `Section[]` array. Sections are built by interpolating `data` into template literals.

---

## 📝 Template Interpolation Patterns

### Basic Field Injection
```typescript
// Profile: Header section
content: `# ${name}
> ${bio || 'Building resilient systems & high-taste developer tools.'}`
```

### Array Mapping (Languages, Skills, Repos)
```typescript
// Languages as YAML block
content: `\`\`\`yaml
languages: [ ${languages.map(l => l.name).join(', ')} ]
frameworks: [ Next.js, React, Node.js, TailwindCSS ]
\`\`\``

// Pinned repos as markdown list
content: `### 🚀 Selected Works

${pinnedRepos.map(repo => 
  `- **[${repo.name}](${repo.url})** — ${repo.description} \`★ ${repo.stargazersCount}\``
).join('\n')}`
```

### Badge Generation (Shields.io)
```typescript
// Dynamic badge URLs with data interpolation
content: `[![Followers](https://img.shields.io/github/followers/${username}?label=Followers&style=for-the-badge&color=10b981&labelColor=090d16)](https://github.com/${username})
[![Stars](https://img.shields.io/badge/Stars-Earned-10b981?style=for-the-badge&labelColor=090d16)](https://github.com/${username})`
```

### Table Generation (Titan Preset)
```typescript
content: `### 🏛️ Flagship Repositories

| Repository | Focus & Impact | Primary Tech | Stars |
| :--- | :--- | :--- | :--- |
${pinnedRepos.map(r => 
  `| **[${r.name}](${r.url})** | ${r.description} | \`${r.language}\` | ⭐ ${r.stargazersCount} |`
).join('\n')}`
```

### Conditional Sections (Ecosystem Widgets)
```typescript
// Only included if enabled in data
enabled: data.gitHoloEnabled || data.gitChronicleEnabled,
content: `### 🌌 Holographic Telemetry & Live Cadence

<div align="center">

${data.gitHoloEnabled ? `[![GitHolo 3D Card](https://githolo.vercel.app/api/og/${username})](https://githolo.bharatdn.com)` : ''}

${data.gitChronicleEnabled ? `[![GitChronicle Cadence](https://gitchronicle-wheat.vercel.app/badge/${username}.svg)](https://gitchronicle.bharatdn.com)` : ''}

</div>`
```

---

## 🎭 Preset Definitions

### Profile Presets

#### 1. Bento Grid (`bento`) — Default
| Section ID | Title | Content Focus |
|------------|-------|---------------|
| `header` | Bento Header & Profile Intro | Name, bio, badges, links |
| `ecosystem` | Ecosystem Widgets | GitHolo + GitChronicle |
| `bento_grid` | Bento Card Grid | About + Top Languages |
| `tech_stack` | Tech Stack & Tooling | Badge cloud |
| `pinned_projects` | Pinned Showcase | GitHub stats cards |
| `github_metrics` | GitHub Velocity & Streaks | Stats + Streak cards |

**Visual:** Grid-based, card-heavy, modern editorial.

#### 2. Minimalist (`minimalist`)
| Section ID | Title | Content Focus |
|------------|-------|---------------|
| `header` | Title & Introduction | Name, bio, location, links |
| `ecosystem` | Ecosystem Badges | GitHolo + GitChronicle |
| `about` | Focus & Engineering Creed | Bulleted focus areas |
| `skills` | Languages & Core Technologies | YAML code block |
| `featured` | Featured Repositories | Markdown list |
| `stats` | Live GitHub Metrics | Stats + Top Langs cards |

**Visual:** Linear/Vercel aesthetic — monochrome, high contrast, generous whitespace.

#### 3. Titan (`titan`)
| Section ID | Title | Content Focus |
|------------|-------|---------------|
| `header` | Hero Banner & Open Source Creed | Badge row, quote, stats |
| `ecosystem` | Ecosystem Telemetry | GitHolo + GitChronicle |
| `pinned` | Flagship Open Source Projects | Markdown table |
| `skills` | Technology Arsenal | Shields.io badge cloud |
| `stats` | Commit Cadence & Streaks | Streak stats card |
| `connect` | Contact & Collaboration | Links section |

**Visual:** Badge-heavy, table-based, high-velocity OSS maintainer vibe.

### Project Presets

#### 1. Standard (`standard`) — Default
| Section ID | Title | Content Focus |
|------------|-------|---------------|
| `header` | Hero Banner & Badges | Title, desc, badges, demo link |
| `features` | Core Features | Bulleted feature list |
| `tech_stack` | Tech Stack & Dependencies | Badge cloud |
| `architecture` | System Architecture | Code fence diagram |
| `getting_started` | Installation & Local Development | Prereqs + 3-step setup |
| `ecosystem` | Ecosystem Cross-Pollination | GitHolo + GitChronicle + ReadmeCraft |
| `contributing` | Contributing & Community | Standard 5-step PR flow |
| `license` | License | SPDX license |

#### 2. API SDK (`api`)
| Section ID | Title | Content Focus |
|------------|-------|---------------|
| `header` | API Title & Metadata | Title, desc, badges |
| `installation` | Installation & Setup | Package manager command |
| `api_reference` | API Quick Reference | TypeScript code example |
| `architecture` | System Architecture | Code fence diagram |
| `testing` | Testing & Verification | Test command |
| `ecosystem` | Ecosystem Integrations | GitHolo + GitChronicle + ReadmeCraft |

#### 3. CLI Tool (`cli`)
| Section ID | Title | Content Focus |
|------------|-------|---------------|
| `header` | Header & Badges | Title, desc, badges |
| `quickstart` | Terminal Quickstart | Install + run commands |
| `features` | Core Capabilities | Bulleted features |
| `usage` | CLI Usage & Flags | Code fence with flags |
| `ecosystem` | Ecosystem Telemetry | GitHolo + GitChronicle + ReadmeCraft |
| `license` | License | SPDX license |

---

## 🔧 Adding a New Section to a Preset

### Step 1: Add Section Object
```typescript
// In getProfileSections() or getProjectSections()
{
  id: 'my_new_section',
  title: 'My New Section',
  enabled: true,
  order: 4,  // Position in sequence
  content: `### My New Section

Content with ${data.field} interpolation.`,
}
```

### Step 2: UI Auto-Inclusion
- `PaneSectionManager` reads `sections` prop → renders toggle + reorder automatically
- No additional UI code needed

### Step 3: Custom Sections (User-Added)
```typescript
// In PaneSectionManager handleAddCustomSection()
const newSection: Section = {
  id: `custom_${Date.now()}`,
  title: userTitle,
  content: userContent,
  enabled: true,
  order: sections.length + 1,
  isCustom: true,  // Shows amber badge + delete button
};
```

---

## 🧹 Sanitization & Safety

### Current v1: No Sanitization
- Templates are trusted (authored by us)
- User custom sections: Raw markdown passed through
- Preview uses `rehype-raw` → renders HTML as-is

### Risks
- User could inject `<script>` via custom section
- GitHub sanitizes on their end — but preview doesn't

### Phase 2.7 Fix: DOMPurify Integration
```typescript
// In PaneGitHubPreview or compile step
import DOMPurify from 'isomorphic-dompurify';

function sanitizeMarkdown(markdown: string): string {
  // Only sanitize HTML passthrough, preserve markdown syntax
  return DOMPurify.sanitize(markdown, {
    ALLOWED_TAGS: ['div', 'span', 'img', 'a', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'br'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'align', 'width', 'class', 'style'],
  });
}
```

---

## 🧪 Testing Strategy

### Snapshot Tests (Vitest)
```typescript
// tests/generators.test.ts
import { getProfileSections, getProjectSections, compileSectionsToMarkdown } from '@/lib/generators';
import { SAMPLE_PROFILE, SAMPLE_PROJECT } from '@/lib/github';

describe('Profile Generators', () => {
  const presets: ProfilePreset[] = ['bento', 'minimalist', 'titan'];
  
  presets.forEach(preset => {
    test(`generates ${preset} markdown`, () => {
      const sections = getProfileSections(SAMPLE_PROFILE, preset);
      const markdown = compileSectionsToMarkdown(sections);
      expect(markdown).toMatchSnapshot();
    });
  });
});

describe('Project Generators', () => {
  const presets: ProjectPreset[] = ['standard', 'api', 'cli'];
  
  presets.forEach(preset => {
    test(`generates ${preset} markdown`, () => {
      const sections = getProjectSections(SAMPLE_PROJECT, preset);
      const markdown = compileSectionsToMarkdown(sections);
      expect(markdown).toMatchSnapshot();
    });
  });
});
```

### Test Coverage Goals
- All 6 presets generate non-empty markdown
- All sections have valid markdown syntax
- Ecosystem toggles correctly include/exclude snippets
- Custom sections round-trip through compile
- Disabled sections produce no output
- Order changes reflect in output

---

## 🔮 Future Enhancements

1. **Template Variants** — Per-section style options (e.g., "card" vs "list" for pinned repos)
2. **Conditional Blocks** — `{{#if data.sponsors}}` syntax in templates
3. **Partial Re-render** — Only recompile changed section (performance)
4. **Markdown Lint** — `markdownlint` integration in compile pipeline
5. **Export Variants** — GitHub-flavored vs CommonMark vs GitLab
6. **AI-Assisted Rewrite** — Opt-in local model for section polishing (Phase 5)

---

## 📚 Reference: Markdown Features Used

| Feature | Syntax | Used In |
|---------|--------|---------|
| Headings | `# ` `## ` `### ` | All sections |
| Bold/Italic | `**bold**` `*italic*` | All sections |
| Code Blocks | `\`\`\`lang\ncode\n\`\`\`` | Skills, architecture, usage |
| Inline Code | `` `code` `` | Badges, commands |
| Lists | `- item` `1. item` | Features, steps |
| Tables | `\| a \| b \|\n\| --- \| --- \|\n\| 1 \| 2 \|` | Titan preset, architecture |
| Links | `[text](url)` | All badges, repo links |
| Images | `![alt](url)` | GitHolo, GitChronicle badges |
| Blockquotes | `> quote` | Bios, taglines |
| Horizontal Rule | `---` | Section separators |
| HTML | `<div align="center">` | Badge centering |
| Task Lists | `- [x] done` | Roadmap sections |
| Strikethrough | `~~text~~` | Not currently used |
| Emoji | `🚀` `✨` `🛠️` | All sections |

---

## 🔗 Related Docs
- `docs/ARCHITECTURE.md` — Component responsibilities, data flow
- `docs/DECISIONS.md` — Decision 008: Section-Based Markdown Generation
- `docs/knowledge/ecosystem-embeds.md` — Badge snippet formats
- `docs/knowledge/github-ingestion.md` — Data sources for templates