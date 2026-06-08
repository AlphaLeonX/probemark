import * as vscode from 'vscode';
import { buildLogStatement } from './core/logBuilder';
import { buildContextPrefix, findNearestFunctionName } from './core/context';
import { getIndentation } from './core/textUtils';
import { collectGeneratedProbesFromText, removeGeneratedProbesFromText, ProbeEntry } from './core/cleanup';

// ═══════════════════════════════════════════════════════════
// Extension entry points
// ═══════════════════════════════════════════════════════════

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('probemark.insertProbe', handleInsertProbe),
    vscode.commands.registerCommand('probemark.removeProbesInCurrentFile', handleRemoveProbesInCurrentFile),
    vscode.commands.registerCommand('probemark.removeProbesInWorkspace', handleRemoveProbesInWorkspace),
    vscode.commands.registerCommand('probemark.previewProbesInCurrentFile', handlePreviewProbesInCurrentFile),
  );
}

export function deactivate() {
  // No cleanup needed
}

// ═══════════════════════════════════════════════════════════
// Command: Insert probe
// ═══════════════════════════════════════════════════════════

async function handleInsertProbe(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor found.');
    return;
  }

  const document = editor.document;
  const position = editor.selection.active;
  const languageId = document.languageId;

  // 1. Get variable / expression text
  const value = getSelectedOrCurrentWord(editor);

  // 2. Get current-line indentation
  const currentLine = document.lineAt(position.line);
  const indentation = getIndentation(currentLine.text);

  // 3. Build context prefix
  const lineNumber = position.line + 1; // 1-based
  const lines = document.getText().split('\n');
  const funcName = findNearestFunctionName(lines, lineNumber - 1);
  const contextPrefix = buildContextPrefix(document.fileName, lineNumber, value, funcName);

  // 4. Generate probe statement
  const probeStatement = buildLogStatement(languageId, value, contextPrefix);

  // 5. Insert
  const insertText = '\n' + indentation + probeStatement;
  const editSuccess = await editor.edit((editBuilder) => {
    editBuilder.insert(currentLine.range.end, insertText);
  });
  if (!editSuccess) {
    return;
  }

  // 6. Move cursor to end of the newly inserted probe line
  const newLine = position.line + 1;
  const newChar = indentation.length + probeStatement.length;
  editor.selection = new vscode.Selection(
    new vscode.Position(newLine, newChar),
    new vscode.Position(newLine, newChar),
  );
}

// ═══════════════════════════════════════════════════════════
// Command: Remove probes in current file (with confirmation)
// ═══════════════════════════════════════════════════════════

async function handleRemoveProbesInCurrentFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor found.');
    return;
  }
  await removeProbesFromDocumentWithConfirm(editor);
}

// ═══════════════════════════════════════════════════════════
// Command: Preview probes in current file
// ═══════════════════════════════════════════════════════════

async function handlePreviewProbesInCurrentFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage('No active editor found.');
    return;
  }

  const entries = collectProbeEntriesFromDocument(editor.document);
  if (entries.length === 0) {
    vscode.window.showInformationMessage('No ProbeMark probes found in this file.');
    return;
  }

  const items = entries.map((e) => ({
    label: `Line ${e.lineNumber}`,
    description: e.preview,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title: `ProbeMark Preview (${entries.length} probe(s) in current file)`,
    placeHolder: 'Select a probe line to jump to it',
    matchOnDescription: true,
  });

  if (!picked) {
    return;
  }

  // Jump to the selected line
  const targetLine = parseInt(picked.label.replace('Line ', ''), 10);
  const pos = new vscode.Position(targetLine - 1, 0);
  editor.selection = new vscode.Selection(pos, pos);
  editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
}

// ═══════════════════════════════════════════════════════════
// Command: Remove probes across workspace (with confirmation)
// ═══════════════════════════════════════════════════════════

async function handleRemoveProbesInWorkspace(): Promise<void> {
  // Limit scan to known source extensions; avoid node_modules
  const patterns = '**/*.{js,jsx,ts,tsx,py,java,php,go}';
  const uris = await vscode.workspace.findFiles(patterns, '**/node_modules/**');

  if (uris.length === 0) {
    vscode.window.showInformationMessage('No supported source files found in workspace.');
    return;
  }

  // Batch scan, cap at 500 entries
  const allEntries: WorkspaceProbeEntry[] = [];
  const scanLimit = 500;

  for (const uri of uris) {
    if (allEntries.length >= scanLimit) {
      break;
    }
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      const entries = collectProbeEntriesFromDocument(doc);
      for (const e of entries) {
        allEntries.push({ relativePath: vscode.workspace.asRelativePath(uri), ...e });
        if (allEntries.length >= scanLimit) {
          break;
        }
      }
    } catch {
      // Skip files that can't be read
    }
  }

  if (allEntries.length === 0) {
    vscode.window.showInformationMessage('No ProbeMark probes found in workspace.');
    return;
  }

  const previewItems: vscode.QuickPickItem[] = allEntries.map((e) => ({
    label: `${e.relativePath}:${e.lineNumber}`,
    description: e.preview,
  }));

  // Step 1: QuickPick preview
  const confirmed = await vscode.window.showQuickPick(previewItems, {
    title: `ProbeMark — ${allEntries.length} probe(s) across workspace`,
    placeHolder: 'Press Enter to confirm deletion, or Esc to cancel',
    canPickMany: false,
  });

  // User cancelled (Esc)
  if (!confirmed) {
    return;
  }

  // Step 2: Modal confirmation
  const proceed = await vscode.window.showWarningMessage(
    `Delete ${allEntries.length} probe statement(s) across the workspace?`,
    { modal: true },
    'Delete All',
  );

  if (proceed !== 'Delete All') {
    return;
  }

  // Step 3: Group by file and delete
  const byFile = new Map<string, number[]>();
  for (const e of allEntries) {
    const lines = byFile.get(e.relativePath) ?? [];
    lines.push(e.lineNumber);
    byFile.set(e.relativePath, lines);
  }

  let removed = 0;

  for (const [relPath, lineNumbers] of byFile) {
    const uri = uris.find((u) => vscode.workspace.asRelativePath(u) === relPath);
    if (!uri) {
      continue;
    }
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      const edit = new vscode.WorkspaceEdit();
      // Delete from bottom to top
      const sorted = [...lineNumbers].sort((a, b) => b - a);
      for (const ln of sorted) {
        const line = doc.lineAt(ln - 1);
        edit.delete(uri, line.rangeIncludingLineBreak);
      }
      await vscode.workspace.applyEdit(edit);
      removed += lineNumbers.length;
    } catch {
      // Skip files that can't be edited
    }
  }

  try {
    await vscode.workspace.saveAll(false);
  } catch {
    // Save failure is not fatal
  }

  vscode.window.showInformationMessage(
    `Removed ${removed} probe statement(s) across workspace.`,
  );
}

// ═══════════════════════════════════════════════════════════
// Helper types
// ═══════════════════════════════════════════════════════════

interface WorkspaceProbeEntry extends ProbeEntry {
  relativePath: string;
}

// ═══════════════════════════════════════════════════════════
// Helper: Collect probe entries from a TextDocument
// ═══════════════════════════════════════════════════════════

function collectProbeEntriesFromDocument(document: vscode.TextDocument): ProbeEntry[] {
  return collectGeneratedProbesFromText(document.getText());
}

// ═══════════════════════════════════════════════════════════
// Core removal logic (with UI confirmation dialogs)
// ═══════════════════════════════════════════════════════════

async function removeProbesFromDocumentWithConfirm(editor: vscode.TextEditor): Promise<void> {
  const document = editor.document;
  const entries = collectProbeEntriesFromDocument(document);

  if (entries.length === 0) {
    vscode.window.showInformationMessage('No ProbeMark probes found in this file.');
    return;
  }

  // Step 1: QuickPick preview
  const items: vscode.QuickPickItem[] = entries.map((e) => ({
    label: `Line ${e.lineNumber}`,
    description: e.preview,
  }));

  const confirmed = await vscode.window.showQuickPick(items, {
    title: `ProbeMark — ${entries.length} probe(s) in current file`,
    placeHolder: 'Press Enter to confirm deletion, or Esc to cancel',
    canPickMany: false,
  });

  if (!confirmed) {
    return;
  }

  // Step 2: Modal confirmation
  const proceed = await vscode.window.showWarningMessage(
    `Delete ${entries.length} probe statement(s) from this file?`,
    { modal: true },
    'Delete',
  );

  if (proceed !== 'Delete') {
    return;
  }

  // Execute deletion (bottom to top)
  await editor.edit((editBuilder) => {
    for (let i = entries.length - 1; i >= 0; i--) {
      const line = document.lineAt(entries[i].lineNumber - 1);
      editBuilder.delete(line.rangeIncludingLineBreak);
    }
  });

  vscode.window.showInformationMessage(`Removed ${entries.length} probe statement(s).`);
}

// ═══════════════════════════════════════════════════════════
// Helper: Variable / expression extraction
// ═══════════════════════════════════════════════════════════

function getSelectedOrCurrentWord(editor: vscode.TextEditor): string | undefined {
  const selection = editor.selection;

  if (!selection.isEmpty) {
    const selectedText = editor.document.getText(selection).trim();
    if (selectedText.length > 0) {
      return selectedText;
    }
  }

  const document = editor.document;
  const position = selection.active;
  const wordRange = document.getWordRangeAtPosition(position);

  if (wordRange) {
    const word = document.getText(wordRange).trim();
    if (word.length > 0) {
      return word;
    }
  }

  return undefined;
}
