/**
 * Lightweight text diff utilities for git-style side-by-side highlighting.
 */

export type DiffPart = {
  text: string;
  type: "same" | "removed" | "added";
};

export type DiffSide = {
  parts: DiffPart[];
};

export type TextDiffResult = {
  left: DiffSide;
  right: DiffSide;
};

/**
 * Escapes HTML special characters for safe rendering.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Builds a word-level diff between two strings (whitespace-aware).
 */
export function diffWords(left: string, right: string): TextDiffResult {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  const lcs = longestCommonSubsequence(leftTokens, rightTokens);
  return buildDiffFromLcs(leftTokens, rightTokens, lcs);
}

/**
 * Builds a line-level diff for multiline content, falling back to word diff per changed line pair.
 */
export function diffText(left: string | null | undefined, right: string | null | undefined): TextDiffResult {
  const a = left ?? "";
  const b = right ?? "";

  if (a === b) {
    return {
      left: { parts: [{ text: a, type: "same" }] },
      right: { parts: [{ text: b, type: "same" }] },
    };
  }

  if (!a && b) {
    return {
      left: { parts: [] },
      right: { parts: [{ text: b, type: "added" }] },
    };
  }

  if (a && !b) {
    return {
      left: { parts: [{ text: a, type: "removed" }] },
      right: { parts: [] },
    };
  }

  const leftLines = a.split("\n");
  const rightLines = b.split("\n");

  if (leftLines.length === 1 && rightLines.length === 1) {
    return diffWords(a, b);
  }

  const lineLcs = longestCommonSubsequence(leftLines, rightLines);
  const leftParts: DiffPart[] = [];
  const rightParts: DiffPart[] = [];

  let li = 0;
  let ri = 0;

  for (const line of lineLcs) {
    while (li < leftLines.length && leftLines[li] !== line) {
      leftParts.push({ text: `${leftLines[li]}\n`, type: "removed" });
      li++;
    }

    while (ri < rightLines.length && rightLines[ri] !== line) {
      rightParts.push({ text: `${rightLines[ri]}\n`, type: "added" });
      ri++;
    }

    if (li < leftLines.length && ri < rightLines.length) {
      leftParts.push({ text: `${line}\n`, type: "same" });
      rightParts.push({ text: `${line}\n`, type: "same" });
      li++;
      ri++;
    }
  }

  while (li < leftLines.length) {
    leftParts.push({ text: `${leftLines[li]}\n`, type: "removed" });
    li++;
  }

  while (ri < rightLines.length) {
    rightParts.push({ text: `${rightLines[ri]}\n`, type: "added" });
    ri++;
  }

  return {
    left: { parts: mergeAdjacent(leftParts) },
    right: { parts: mergeAdjacent(rightParts) },
  };
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  const pattern = /(\s+|[^\s]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    tokens.push(match[0]);
  }
  return tokens.length > 0 ? tokens : [text];
}

function longestCommonSubsequence<T>(a: T[], b: T[]): T[] {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: T[] = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      result.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return result;
}

function buildDiffFromLcs(left: string[], right: string[], lcs: string[]): TextDiffResult {
  const leftParts: DiffPart[] = [];
  const rightParts: DiffPart[] = [];
  let li = 0;
  let ri = 0;

  for (const token of lcs) {
    while (li < left.length && left[li] !== token) {
      leftParts.push({ text: left[li], type: "removed" });
      li++;
    }

    while (ri < right.length && right[ri] !== token) {
      rightParts.push({ text: right[ri], type: "added" });
      ri++;
    }

    if (li < left.length && ri < right.length) {
      leftParts.push({ text: token, type: "same" });
      rightParts.push({ text: token, type: "same" });
      li++;
      ri++;
    }
  }

  while (li < left.length) {
    leftParts.push({ text: left[li], type: "removed" });
    li++;
  }

  while (ri < right.length) {
    rightParts.push({ text: right[ri], type: "added" });
    ri++;
  }

  return {
    left: { parts: mergeAdjacent(leftParts) },
    right: { parts: mergeAdjacent(rightParts) },
  };
}

function mergeAdjacent(parts: DiffPart[]): DiffPart[] {
  if (parts.length === 0) {
    return parts;
  }

  const merged: DiffPart[] = [{ ...parts[0] }];
  for (let i = 1; i < parts.length; i++) {
    const current = parts[i];
    const last = merged[merged.length - 1];
    if (last.type === current.type) {
      last.text += current.text;
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}
