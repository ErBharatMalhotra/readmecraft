import { describe, expect, it } from 'vitest';
import { auditReadme, extractImageUrls } from '@/lib/badge-audit';

describe('extractImageUrls', () => {
  it('finds markdown and html images and de-duplicates them', () => {
    const markdown = [
      '![stats](https://github-readme-stats.vercel.app/api?username=octocat)',
      '<img src="https://img.shields.io/badge/-React-61DAFB?style=flat-square" />',
      '<img src="https://img.shields.io/badge/-React-61DAFB?style=flat-square" />',
      '[![streak](https://github-readme-streak-stats.herokuapp.com/?user=octocat)](https://github.com)',
    ].join('\n');

    const urls = extractImageUrls(markdown);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toContain('github-readme-stats');
    expect(urls[2]).toContain('github-readme-streak-stats');
  });
});

describe('auditReadme', () => {
  it('marks the paused readme-stats instance dead and offers a native replacement', () => {
    const report = auditReadme({
      username: 'octocat',
      markdown:
        '![stats](https://github-readme-stats.vercel.app/api?username=octocat&theme=dracula)',
    });

    expect(report.counts.dead).toBe(1);
    expect(report.findings[0].severity).toBe('dead');
    expect(report.findings[0].fix?.url).toBe(
      'https://readme.bharatdn.com/api/badges?username=octocat&type=stats&theme=dracula'
    );
    expect(report.score).toBeLessThan(100);
  });

  it('flags herokuapp hosts as dead and keeps the theme', () => {
    const report = auditReadme({
      username: 'octocat',
      markdown:
        '![streak](https://github-readme-streak-stats.herokuapp.com/?user=octocat&theme=nord)',
    });

    expect(report.findings[0].severity).toBe('dead');
    expect(report.findings[0].fix?.url).toBe(
      'https://readme.bharatdn.com/api/badges?username=octocat&type=streak&theme=nord'
    );
  });

  it('turns a shields skill chip into a native skill chip', () => {
    const report = auditReadme({
      username: 'octocat',
      markdown:
        '<img src="https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react" alt="React" />',
    });

    expect(report.findings[0].severity).toBe('risky');
    expect(report.findings[0].fix?.url).toBe(
      'https://readme.bharatdn.com/api/badges?type=skill&name=React&theme=gta6'
    );
  });

  it('leaves our own badges and unknown hosts alone, and rewrites the markdown', () => {
    const markdown = [
      '<img src="https://readme.bharatdn.com/api/badges?username=octocat&type=snake&theme=gta6" />',
      '![custom](https://example.com/some-badge.svg)',
      '![stats](https://github-readme-stats.vercel.app/api?username=octocat)',
    ].join('\n');

    const report = auditReadme({ username: 'octocat', markdown });

    expect(report.counts.native).toBe(1);
    expect(report.counts.unknown).toBe(1);
    expect(report.fixedCount).toBe(1);
    expect(report.fixedMarkdown).toContain('/api/badges?username=octocat&type=stats&theme=gta6');
    expect(report.fixedMarkdown).not.toContain('github-readme-stats.vercel.app');
    expect(report.fixedMarkdown).toContain('https://example.com/some-badge.svg');
  });

  it('scores an all-native README at 100', () => {
    const report = auditReadme({
      username: 'octocat',
      markdown:
        '<img src="https://readme.bharatdn.com/api/badges?username=octocat&type=stats" /><img src="https://readme.bharatdn.com/api/badges?username=octocat&type=streak" />',
    });

    expect(report.counts.dead).toBe(0);
    expect(report.score).toBe(100);
  });
});
