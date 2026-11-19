import { describe, expect, it } from 'vitest';
import { scoreReadmeMarkdown } from '@/lib/public-score';

const STRONG_README = `# ReadmeCraft

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Stars](https://img.shields.io/badge/stars-100-emerald)

A studio that turns a GitHub profile into a production README. Live at
[readme.bharatdn.com](https://readme.bharatdn.com), docs in
[docs](https://readme.bharatdn.com/templates).

## Features

| Feature | Status |
| --- | --- |
| Native badges | done |
| Live preview | done |

## Install

\`\`\`bash
npm install
npm run dev
\`\`\`

## Usage

Run the studio, paste a username, export the markdown.

\`\`\`ts
const readme = generate(username);
\`\`\`

## Contact

Email [hello@example.com](mailto:hello@example.com) or find me on
[X](https://x.com/example).

## License

MIT

## Contributing

PRs welcome. Read the guide in [CONTRIBUTING](https://github.com/example/repo).
`;

const WEAK_README = '# Thing\n\nA thing.\n';

describe('public README score', () => {
  it('scores a documented README far above a stub', () => {
    const strong = scoreReadmeMarkdown(STRONG_README);
    const weak = scoreReadmeMarkdown(WEAK_README);

    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.score).toBeGreaterThanOrEqual(80);
    expect(weak.score).toBeLessThan(40);
    expect(['A+', 'A', 'A-', 'B+']).toContain(strong.grade);
  });

  it('derives every metric from the markdown itself', () => {
    const result = scoreReadmeMarkdown(STRONG_README);

    expect(result.stats.badges).toBe(3);
    expect(result.stats.codeBlocks).toBe(2);
    expect(result.stats.tables).toBe(1);
    expect(result.stats.h1).toBe(1);
    expect(result.metrics).toHaveLength(5);
    expect(result.metrics.every((metric) => metric.max === 20)).toBe(true);
    expect(result.score).toBe(result.metrics.reduce((sum, metric) => sum + metric.score, 0));
  });

  it('suggests concrete fixes for a stub without inventing data', () => {
    const result = scoreReadmeMarkdown(WEAK_README);

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeLessThanOrEqual(5);
    expect(result.suggestions.map((s) => s.title).join(' ')).toMatch(/install|section|code/i);
    expect(result.stats.words).toBeLessThan(10);
  });

  it('never exceeds 100 or goes below 0', () => {
    for (const readme of [STRONG_README, WEAK_README, '']) {
      const { score } = scoreReadmeMarkdown(readme);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
});
