/**
 * Normalizes treeView-beta diagrams for Mermaid 11.15.0:
 * - Converts box-drawing input (├──, └──, │) to indentation
 * - Quotes bare node labels (this release only accepts STRING2 / quoted names)
 */

const ALL_BOX_CHARS = /[─━│┃└┗├┣]/;
const BRANCH_CHAR = /[└┗├┣]/;
const DASH_CHAR = /[─━]/;
const DECORATION_ONLY = /^[\s│┃]+$/;
const METADATA_LINE = /^\s*(title[\t ]|accTitle[\t ]*:|accDescr[\t ]*[:{])/;
const COMMENT_LINE = /^\s*%%/;
const FRONTMATTER_LINE = /^---\s*$/;

const INDENT_UNIT = "    ";
const TREE_VIEW_KEYWORD = "treeView-beta";

export interface PreprocessResult {
  text: string;
  lineMap: Map<number, number>;
}

function isBoxDrawingFormat(lines: string[]): boolean {
  return lines.some((line) => ALL_BOX_CHARS.test(line));
}

function inferSegmentWidth(contentLines: string[]): number {
  for (const line of contentLines) {
    const match = BRANCH_CHAR.exec(line);
    if (match?.index && match.index > 0) {
      return match.index;
    }
  }
  return 4;
}

function isPassthroughLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed === "" ||
    COMMENT_LINE.test(line) ||
    METADATA_LINE.test(line) ||
    FRONTMATTER_LINE.test(trimmed)
  );
}

function isQuotedLabel(label: string): boolean {
  return (
    (label.startsWith('"') && label.endsWith('"')) ||
    (label.startsWith("'") && label.endsWith("'"))
  );
}

function quoteTreeViewLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed || isQuotedLabel(trimmed)) {
    return trimmed;
  }
  const escaped = trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function formatTreeViewNodeLine(indent: string, label: string): string {
  return `${indent}${quoteTreeViewLabel(label)}`;
}

/** Quote bare labels on indent-based treeView-beta lines. */
function quoteBareTreeViewNodes(input: string, keywordIdx: number): string {
  const lines = input.split("\n");

  for (let i = keywordIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (isPassthroughLine(line) || DECORATION_ONLY.test(line)) {
      continue;
    }

    const match = line.match(/^(\s*)(.+?)\s*$/);
    if (!match) continue;

    const [, indent, content] = match;
    if (isQuotedLabel(content.trim())) continue;

    lines[i] = formatTreeViewNodeLine(indent, content.trimEnd());
  }

  return lines.join("\n");
}

export function remapErrorLines(message: string, lineMap: Map<number, number>): string {
  return message.replace(/\bline\s+(\d+)\b/gi, (match, lineStr: string) => {
    const line = parseInt(lineStr, 10);
    const original = lineMap.get(line);
    return original ? `line ${original}` : match;
  });
}

export function preprocessBoxDrawing(input: string): PreprocessResult {
  const lines = input.split("\n");
  const lineMap = new Map<number, number>();

  let keywordIdx = -1;
  for (const [i, line] of lines.entries()) {
    if (line.trim() === TREE_VIEW_KEYWORD) {
      keywordIdx = i;
      break;
    }
  }

  if (keywordIdx === -1) {
    return { text: input, lineMap };
  }

  const contentLineTexts: string[] = [];
  for (let i = keywordIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (isPassthroughLine(line) || DECORATION_ONLY.test(line)) {
      continue;
    }
    contentLineTexts.push(line.replace(/\t/g, " "));
  }

  if (!isBoxDrawingFormat(contentLineTexts)) {
    return {
      text: quoteBareTreeViewNodes(input, keywordIdx),
      lineMap,
    };
  }

  const segmentWidth = inferSegmentWidth(contentLineTexts);
  const outputLines: string[] = [];
  let outLineNo = 0;

  for (let i = 0; i <= keywordIdx; i++) {
    outputLines.push(lines[i]);
    outLineNo++;
    lineMap.set(outLineNo, i + 1);
  }

  for (let i = keywordIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const origLineNo = i + 1;

    if (isPassthroughLine(line)) {
      outputLines.push(line);
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
      continue;
    }

    if (DECORATION_ONLY.test(line)) {
      continue;
    }

    const normalized = line.replace(/\t/g, " ");
    const branchMatch = BRANCH_CHAR.exec(normalized);

    if (branchMatch?.index !== undefined) {
      const branchCol = branchMatch.index;
      const depth = Math.round(branchCol / segmentWidth) + 1;

      let pos = branchCol + 1;
      while (pos < normalized.length && DASH_CHAR.test(normalized[pos])) {
        pos++;
      }
      while (pos < normalized.length && normalized[pos] === " ") {
        pos++;
      }
      const content = normalized.slice(pos).trimEnd();

      if (!content) {
        throw new Error(
          `Line ${origLineNo}: Empty node — expected a filename or directory name after the box-drawing prefix`
        );
      }

      outputLines.push(
        formatTreeViewNodeLine(INDENT_UNIT.repeat(depth), content)
      );
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
    } else if (/^[\s─━│┃└┗├┣]+$/.test(normalized)) {
      continue;
    } else if (ALL_BOX_CHARS.test(normalized)) {
      outputLines.push(formatTreeViewNodeLine("", trimmed));
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
    } else if (/^\s+/.test(normalized)) {
      throw new Error(
        `Line ${origLineNo}: Unexpected indentation without box-drawing characters. ` +
          `In box-drawing format, use ├── or └── prefixes for indented nodes.`
      );
    } else {
      outputLines.push(formatTreeViewNodeLine("", trimmed));
      outLineNo++;
      lineMap.set(outLineNo, origLineNo);
    }
  }

  return { text: outputLines.join("\n"), lineMap };
}
