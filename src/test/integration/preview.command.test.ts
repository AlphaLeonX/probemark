import * as assert from 'assert';
import * as vscode from 'vscode';
import { collectGeneratedProbesFromText } from '../../core/cleanup';

suite('preview command', () => {

  async function ensureActivated() {
    const ext = vscode.extensions.getExtension('your-publisher-id.probemark');
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  }

  suiteSetup(async () => {
    await ensureActivated();
  });

  test('preview data generation logic (pure function)', () => {
    const text = [
      "console.log('🧪 [A.ts:1] debug'); // probemark:auto",
      "const x = 1;",
      "console.log('🧪 [A.ts:3] foo → name:', name); // probemark:auto",
    ].join('\n');

    const entries = collectGeneratedProbesFromText(text);
    assert.strictEqual(entries.length, 2);
    assert.strictEqual(entries[0].lineNumber, 1);
    assert.strictEqual(entries[1].lineNumber, 3);
    assert.ok(entries[0].preview.length <= 120);
    assert.ok(entries[1].preview.length <= 120);
  });

  test('empty file preview returns empty array', () => {
    const entries = collectGeneratedProbesFromText('');
    assert.strictEqual(entries.length, 0);
  });

  test('execute preview command does not throw (mock QuickPick)', async () => {
    const tsContent = [
      "console.log('🧪 [test.ts:1] debug'); // probemark:auto",
      "const x = 1;",
    ].join('\n');

    const document = await vscode.workspace.openTextDocument({ language: 'typescript', content: tsContent });
    await vscode.window.showTextDocument(document);

    const origQuickPick = vscode.window.showQuickPick as any;
    let commandDidNotThrow = false;

    try {
      // Stub showQuickPick: user cancels selection
      (vscode.window as any).showQuickPick = async (_items: any, _options: any) => {
        return undefined;
      };

      await vscode.commands.executeCommand('probemark.previewProbesInCurrentFile');
      commandDidNotThrow = true;
    } finally {
      (vscode.window as any).showQuickPick = origQuickPick;
    }

    assert.ok(commandDidNotThrow, 'preview command should not throw');
  });
});
