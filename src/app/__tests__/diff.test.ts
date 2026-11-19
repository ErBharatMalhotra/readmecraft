import { describe, expect, it } from 'vitest';
import { diffLines } from '@/lib/diff';

describe('line diff', () => {
  it('reports identical documents without noise', () => {
    const result = diffLines('# Title\n\nBody\n', '# Title\n\nBody\n');

    expect(result.identical).toBe(true);
    expect(result.added).toBe(0);
    expect(result.removed).toBe(0);
    expect(result.lines.every((line) => line.type === 'ctx')).toBe(true);
  });

  it('keeps context around a changed line', () => {
    const result = diffLines('a\nb\nc\n', 'a\nB\nc\n');

    expect(result.identical).toBe(false);
    expect(result.added).toBe(1);
    expect(result.removed).toBe(1);
    expect(result.lines.map((line) => line.type)).toEqual(['ctx', 'del', 'add', 'ctx', 'ctx']);
    expect(result.lines[2].text).toBe('B');
  });

  it('aligns lines inserted in the middle of a long document', () => {
    const before = ['# T', '', 'one', 'two', 'three', ''].join('\n');
    const after = ['# T', '', 'one', 'inserted', 'two', 'three', ''].join('\n');
    const result = diffLines(before, after);

    expect(result.added).toBe(1);
    expect(result.removed).toBe(0);
    expect(result.lines.filter((line) => line.type === 'ctx').length).toBe(6);
  });

  it('flags oversized changes instead of aligning them', () => {
    const before = Array.from({ length: 900 }, (_, i) => `old-${i}`).join('\n');
    const after = Array.from({ length: 900 }, (_, i) => `new-${i}`).join('\n');
    const result = diffLines(before, after);

    expect(result.truncated).toBe(true);
    expect(result.removed).toBe(900);
    expect(result.added).toBe(900);
  });

  it('normalises CRLF so a Windows checkout is not a 100% diff', () => {
    const result = diffLines('a\r\nb\r\n', 'a\nb\n');
    expect(result.added + result.removed).toBe(0);
  });
});
