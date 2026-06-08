import { isGeneratedProbeLine } from './markers';

/** A probe entry (pure-text representation, no vscode API dependency) */
export interface ProbeEntry {
  lineNumber: number; // 1-based
  content: string;
  preview: string;
}

/** Information about a removed line */
export interface RemovedLine {
  line: number;   // 1-based
  content: string;
}

/** Result of a probe removal operation */
export interface RemoveResult {
  cleanedText: string;
  removedCount: number;
  removedLines: RemovedLine[];
}

/**
 * Collect every line that carries the probemark:auto marker from raw text.
 */
export function collectGeneratedProbesFromText(text: string): ProbeEntry[] {
  const lines = text.split('\n');
  const entries: ProbeEntry[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (isGeneratedProbeLine(lines[i])) {
      entries.push({
        lineNumber: i + 1,
        content: lines[i],
        preview: lines[i].trim().slice(0, 120),
      });
    }
  }

  return entries;
}

/**
 * Remove every line that carries the probemark:auto marker from raw text.
 * Returns the cleaned text together with removal statistics.
 */
export function removeGeneratedProbesFromText(text: string): RemoveResult {
  const lines = text.split('\n');
  const removedLines: RemovedLine[] = [];

  // Traverse backwards so splice indices stay valid
  for (let i = lines.length - 1; i >= 0; i--) {
    if (isGeneratedProbeLine(lines[i])) {
      removedLines.push({
        line: i + 1,
        content: lines[i],
      });
      lines.splice(i, 1);
    }
  }

  // Reverse so removedLines is ordered ascending by line number
  removedLines.reverse();

  return {
    cleanedText: lines.join('\n'),
    removedCount: removedLines.length,
    removedLines,
  };
}
