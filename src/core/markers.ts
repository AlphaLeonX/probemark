/** Marker string used to identify probe lines inserted by this extension */
export const PROBEMARK_MARKER = 'probemark:auto';

/**
 * Returns the language-specific comment marker string.
 * Python returns `# probemark:auto`, all other languages return `// probemark:auto`.
 */
export function getLanguageCommentMarker(languageId: string): string {
  if (languageId === 'python') {
    return `# ${PROBEMARK_MARKER}`;
  }
  return `// ${PROBEMARK_MARKER}`;
}

/** Returns true when a line contains the probemark:auto marker */
export function isGeneratedProbeLine(lineText: string): boolean {
  return lineText.includes(PROBEMARK_MARKER);
}
