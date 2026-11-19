// ============================================================================
// ReadmeCraft — minimal line diff for the write-back preview
// ============================================================================
// Renders what a commit would change before anything is written to GitHub, so a
// regeneration can never silently replace a README the user hand-edited.

export type DiffLineType = 'add' | 'del' | 'ctx';

export interface DiffLine {
  type: DiffLineType;
  text: string;
}

export interface LineDiff {
  lines: DiffLine[];
  added: number;
  removed: number;
  /** True when the change was too large to align line by line. */
  truncated: boolean;
  identical: boolean;
}

// Alignment is O(n*m); above this the middle block is shown as a plain
// remove-all/add-all pair instead of burning memory on a huge table.
const MAX_ALIGN_LINES = 1200;

function splitLines(text: string): string[] {
  if (text.length === 0) return [];
  return text.replace(/\r\n?/g, '\n').split('\n');
}

function alignBlock(before: string[], after: string[]): DiffLine[] {
  const m = before.length;
  const n = after.length;
  const table: Int32Array[] = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      table[i][j] =
        before[i] === after[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (before[i] === after[j]) {
      lines.push({ type: 'ctx', text: before[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      lines.push({ type: 'del', text: before[i] });
      i++;
    } else {
      lines.push({ type: 'add', text: after[j] });
      j++;
    }
  }
  while (i < m) lines.push({ type: 'del', text: before[i++] });
  while (j < n) lines.push({ type: 'add', text: after[j++] });
  return lines;
}

export function diffLines(oldText: string, newText: string): LineDiff {
  const before = splitLines(oldText);
  const after = splitLines(newText);

  if (oldText === newText) {
    return {
      lines: before.map((text) => ({ type: 'ctx', text })),
      added: 0,
      removed: 0,
      truncated: false,
      identical: true,
    };
  }

  // Trim the unchanged prefix/suffix first: a one-line header edit in a long
  // README then stays a tiny, exact diff.
  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;

  let endBefore = before.length;
  let endAfter = after.length;
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore--;
    endAfter--;
  }

  const prefix = before.slice(0, start).map<DiffLine>((text) => ({ type: 'ctx', text }));
  const suffix = before.slice(endBefore).map<DiffLine>((text) => ({ type: 'ctx', text }));
  const middleBefore = before.slice(start, endBefore);
  const middleAfter = after.slice(start, endAfter);

  let truncated = false;
  let middle: DiffLine[];
  if (middleBefore.length + middleAfter.length > MAX_ALIGN_LINES) {
    truncated = true;
    middle = [
      ...middleBefore.map<DiffLine>((text) => ({ type: 'del', text })),
      ...middleAfter.map<DiffLine>((text) => ({ type: 'add', text })),
    ];
  } else {
    middle = alignBlock(middleBefore, middleAfter);
  }

  const lines = [...prefix, ...middle, ...suffix];
  let added = 0;
  let removed = 0;
  for (const line of lines) {
    if (line.type === 'add') added++;
    else if (line.type === 'del') removed++;
  }

  return { lines, added, removed, truncated, identical: false };
}
