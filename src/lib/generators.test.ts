import { describe, it, expect } from 'vitest';
import {
  getProfileSections,
  getProjectSections,
  compileSectionsToMarkdown,
} from './generators';
import { SAMPLE_PROFILE, SAMPLE_PROJECT } from './github';
import type { ProfilePreset, ProjectPreset } from '@/types/readmecraft';

describe('Profile Generators', () => {
  const presets: ProfilePreset[] = ['bento', 'minimalist', 'titan'];

  presets.forEach((preset) => {
    it(`generates ${preset} sections with correct structure`, () => {
      const sections = getProfileSections(SAMPLE_PROFILE, preset);

      expect(sections).toBeInstanceOf(Array);
      expect(sections.length).toBeGreaterThan(0);

      sections.forEach((section) => {
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('enabled');
        expect(section).toHaveProperty('content');
        expect(section).toHaveProperty('order');
        expect(typeof section.enabled).toBe('boolean');
        expect(typeof section.order).toBe('number');
        expect(typeof section.content).toBe('string');
        expect(section.content.length).toBeGreaterThan(0);
      });
    });

    it(`compiles ${preset} markdown without errors`, () => {
      const sections = getProfileSections(SAMPLE_PROFILE, preset);
      const markdown = compileSectionsToMarkdown(sections);

      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(0);
      expect(markdown.trim()).toBe(markdown); // No leading/trailing whitespace
    });

    it(`includes username in ${preset} output`, () => {
      const sections = getProfileSections(SAMPLE_PROFILE, preset);
      const markdown = compileSectionsToMarkdown(sections);

      expect(markdown).toContain(SAMPLE_PROFILE.username);
    });

    it(`includes bio in ${preset} output`, () => {
      const sections = getProfileSections(SAMPLE_PROFILE, preset);
      const markdown = compileSectionsToMarkdown(sections);

      expect(markdown).toContain(SAMPLE_PROFILE.bio);
    });
  });

  it('bento preset includes ecosystem section when enabled', () => {
    const sections = getProfileSections(SAMPLE_PROFILE, 'bento');
    const ecosystemSection = sections.find((s) => s.id === 'ecosystem');

    expect(ecosystemSection).toBeDefined();
    expect(ecosystemSection?.enabled).toBe(true);
    expect(ecosystemSection?.content).toContain('GitHolo');
    expect(ecosystemSection?.content).toContain('GitChronicle');
  });

  it('minimalist preset has correct section count', () => {
    const sections = getProfileSections(SAMPLE_PROFILE, 'minimalist');
    const enabledSections = sections.filter((s) => s.enabled);

    expect(enabledSections.length).toBe(6);
  });

  it('titan preset includes table for pinned repos', () => {
    const sections = getProfileSections(SAMPLE_PROFILE, 'titan');
    const pinnedSection = sections.find((s) => s.id === 'pinned');

    expect(pinnedSection).toBeDefined();
    expect(pinnedSection?.content).toContain('| Repository |');
    expect(pinnedSection?.content).toContain('| :--- |');
  });
});

describe('Project Generators', () => {
  const presets: ProjectPreset[] = ['standard', 'api', 'cli'];

  presets.forEach((preset) => {
    it(`generates ${preset} sections with correct structure`, () => {
      const sections = getProjectSections(SAMPLE_PROJECT, preset);

      expect(sections).toBeInstanceOf(Array);
      expect(sections.length).toBeGreaterThan(0);

      sections.forEach((section) => {
        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('title');
        expect(section).toHaveProperty('enabled');
        expect(section).toHaveProperty('content');
        expect(section).toHaveProperty('order');
        expect(typeof section.enabled).toBe('boolean');
        expect(typeof section.order).toBe('number');
        expect(typeof section.content).toBe('string');
        expect(section.content.length).toBeGreaterThan(0);
      });
    });

    it(`compiles ${preset} markdown without errors`, () => {
      const sections = getProjectSections(SAMPLE_PROJECT, preset);
      const markdown = compileSectionsToMarkdown(sections);

      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(0);
      expect(markdown.trim()).toBe(markdown);
    });

    it(`includes repo title in ${preset} output`, () => {
      const sections = getProjectSections(SAMPLE_PROJECT, preset);
      const markdown = compileSectionsToMarkdown(sections);

      expect(markdown).toContain(SAMPLE_PROJECT.title);
    });

    it(`includes install command in ${preset} output`, () => {
      const sections = getProjectSections(SAMPLE_PROJECT, preset);
      const markdown = compileSectionsToMarkdown(sections);

      expect(markdown).toContain(SAMPLE_PROJECT.installCommand);
    });
  });

  it('standard preset includes all expected sections', () => {
    const sections = getProjectSections(SAMPLE_PROJECT, 'standard');
    const enabledSections = sections.filter((s) => s.enabled);
    const sectionIds = enabledSections.map((s) => s.id);

    expect(sectionIds).toContain('header');
    expect(sectionIds).toContain('features');
    expect(sectionIds).toContain('tech_stack');
    expect(sectionIds).toContain('architecture');
    expect(sectionIds).toContain('getting_started');
    expect(sectionIds).toContain('ecosystem');
    expect(sectionIds).toContain('contributing');
    expect(sectionIds).toContain('license');
  });

  it('api preset includes code example', () => {
    const sections = getProjectSections(SAMPLE_PROJECT, 'api');
    const apiSection = sections.find((s) => s.id === 'api_reference');

    expect(apiSection).toBeDefined();
    expect(apiSection?.content).toContain('```typescript');
    expect(apiSection?.content).toContain('createClient');
  });

  it('cli preset includes terminal quickstart', () => {
    const sections = getProjectSections(SAMPLE_PROJECT, 'cli');
    const quickstartSection = sections.find((s) => s.id === 'quickstart');

    expect(quickstartSection).toBeDefined();
    expect(quickstartSection?.content).toContain('```bash');
    expect(quickstartSection?.content).toContain(SAMPLE_PROJECT.installCommand);
  });
});

describe('compileSectionsToMarkdown', () => {
  it('joins enabled sections with double newline', () => {
    const sections = [
      { id: '1', title: 'A', enabled: true, content: 'Content A', order: 1 },
      { id: '2', title: 'B', enabled: true, content: 'Content B', order: 2 },
      { id: '3', title: 'C', enabled: true, content: 'Content C', order: 3 },
    ];

    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toBe('Content A\n\nContent B\n\nContent C');
  });

  it('excludes disabled sections', () => {
    const sections = [
      { id: '1', title: 'A', enabled: true, content: 'Content A', order: 1 },
      { id: '2', title: 'B', enabled: false, content: 'Content B', order: 2 },
      { id: '3', title: 'C', enabled: true, content: 'Content C', order: 3 },
    ];

    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toBe('Content A\n\nContent C');
    expect(markdown).not.toContain('Content B');
  });

  it('sorts by order field', () => {
    const sections = [
      { id: '1', title: 'A', enabled: true, content: 'Content A', order: 3 },
      { id: '2', title: 'B', enabled: true, content: 'Content B', order: 1 },
      { id: '3', title: 'C', enabled: true, content: 'Content C', order: 2 },
    ];

    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toBe('Content B\n\nContent C\n\nContent A');
  });

  it('trims section content', () => {
    const sections = [
      { id: '1', title: 'A', enabled: true, content: '  Content A  ', order: 1 },
      { id: '2', title: 'B', enabled: true, content: '\nContent B\n', order: 2 },
    ];

    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toBe('Content A\n\nContent B');
  });

  it('returns empty string for empty array', () => {
    const markdown = compileSectionsToMarkdown([]);
    expect(markdown).toBe('');
  });

  it('returns empty string when all sections disabled', () => {
    const sections = [
      { id: '1', title: 'A', enabled: false, content: 'Content A', order: 1 },
      { id: '2', title: 'B', enabled: false, content: 'Content B', order: 2 },
    ];

    const markdown = compileSectionsToMarkdown(sections);
    expect(markdown).toBe('');
  });
});

describe('Ecosystem toggles in generators', () => {
  it('includes GitHolo when gitHoloEnabled is true', () => {
    const data = { ...SAMPLE_PROFILE, gitHoloEnabled: true, gitChronicleEnabled: false };
    const sections = getProfileSections(data, 'bento');
    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toContain('githolo.vercel.app/api/og');
    expect(markdown).toContain('githolo.bharatdn.com');
  });

  it('excludes GitHolo when gitHoloEnabled is false', () => {
    const data = { ...SAMPLE_PROFILE, gitHoloEnabled: false, gitChronicleEnabled: true };
    const sections = getProfileSections(data, 'bento');
    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).not.toContain('githolo.vercel.app/api/og');
  });

  it('includes GitChronicle when gitChronicleEnabled is true', () => {
    const data = { ...SAMPLE_PROFILE, gitHoloEnabled: false, gitChronicleEnabled: true };
    const sections = getProfileSections(data, 'bento');
    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toContain('gitchronicle-wheat.vercel.app/badge');
    expect(markdown).toContain('gitchronicle.bharatdn.com');
  });

  it('excludes GitChronicle when gitChronicleEnabled is false', () => {
    const data = { ...SAMPLE_PROFILE, gitHoloEnabled: true, gitChronicleEnabled: false };
    const sections = getProfileSections(data, 'bento');
    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).not.toContain('gitchronicle-wheat.vercel.app/badge');
  });

  it('project mode uses owner for ecosystem snippets', () => {
    const data = { ...SAMPLE_PROJECT, gitHoloEnabled: true, gitChronicleEnabled: true };
    const sections = getProjectSections(data, 'standard');
    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toContain(`githolo.vercel.app/api/og/${SAMPLE_PROJECT.owner}`);
    expect(markdown).toContain(`gitchronicle-wheat.vercel.app/badge/${SAMPLE_PROJECT.owner}`);
  });
});

describe('Markdown output quality', () => {
  it('contains valid markdown headings', () => {
    const sections = getProfileSections(SAMPLE_PROFILE, 'bento');
    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toMatch(/^# /m); // H1
    expect(markdown).toMatch(/^### /m); // H3 (bento uses H3)
  });

  it('contains valid markdown links', () => {
    const sections = getProfileSections(SAMPLE_PROFILE, 'bento');
    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toMatch(/\[.*\]\(https?:\/\/.*\)/);
  });

  it('minimalist preset contains code blocks', () => {
    const sections = getProfileSections(SAMPLE_PROFILE, 'minimalist');
    const markdown = compileSectionsToMarkdown(sections);

    expect(markdown).toContain('```');
  });

  it('does not contain "generated by" or AI attribution', () => {
    const profileSections = getProfileSections(SAMPLE_PROFILE, 'bento');
    const projectSections = getProjectSections(SAMPLE_PROJECT, 'standard');

    const profileMarkdown = compileSectionsToMarkdown(profileSections);
    const projectMarkdown = compileSectionsToMarkdown(projectSections);

    const forbidden = ['generated by', 'assisted by', 'ai-generated', 'created by ai'];

    forbidden.forEach((phrase) => {
      expect(profileMarkdown.toLowerCase()).not.toContain(phrase);
      expect(projectMarkdown.toLowerCase()).not.toContain(phrase);
    });
  });
});