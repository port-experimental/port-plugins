import React, { useMemo } from "react";
import { diffLines, diffStats } from "../utils/diff";

type Props = {
  oldText: string;
  newText: string;
};

const SIGN: Record<string, string> = {
  added: "+",
  removed: "-",
  unchanged: " ",
};

export function DiffView({ oldText, newText }: Props) {
  const lines = useMemo(() => diffLines(oldText, newText), [oldText, newText]);
  const stats = useMemo(() => diffStats(lines), [lines]);

  if (oldText === newText) {
    return <p className="muted">No changes yet — edit the content to see a diff.</p>;
  }

  return (
    <div className="diff">
      <div className="diff-stats">
        <span className="diff-added-count">+{stats.added}</span>
        <span className="diff-removed-count">-{stats.removed}</span>
      </div>
      <pre className="diff-body" aria-label="Proposed changes">
        {lines.map((line, idx) => (
          <div key={idx} className={`diff-line diff-${line.kind}`}>
            <span className="diff-sign" aria-hidden>
              {SIGN[line.kind]}
            </span>
            <span className="diff-content">{line.text}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}
