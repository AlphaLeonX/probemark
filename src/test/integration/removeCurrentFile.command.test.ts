import * as assert from 'assert';
import * as vscode from 'vscode';
import { removeGeneratedProbesFromText } from '../../core/cleanup';

suite('removeCurrentFile command', () => {

  async function ensureActivated() {
    const ext = vscode.extensions.getExtension('your-publisher-id.probemark');
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  }

  suiteSetup(async () => {
    await ensureActivated();
  });

  test('core removal logic: probemark:auto lines removed, plain console.log and logger.info kept', () => {
    const text = [
      "console.log('normal hello');",
      "console.log('🧪 [A.ts:2] debug'); // probemark:auto",
      "logger.info('something happened');",
    ].join('\n');

    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedCount, 1, `Expected 1 removed, got ${result.removedCount}`);

    const lines = result.cleanedText.split('\n');
    assert.strictEqual(lines.length, 2);
    assert.strictEqual(lines[0], "console.log('normal hello');");
    assert.strictEqual(lines[1], "logger.info('something happened');");
  });

  test('execute remove command via command dispatch (mock confirmation dialogs)', async () => {
    const tsContent = [
      "console.log('normal log');",
      "console.log('🧪 [test.ts:2] debug'); // probemark:auto",
      "logger.info('app info');",
      "console.log('🧪 [test.ts:4] debug'); // probemark:auto",
    ].join('\n');

    const document = await vscode.workspace.openTextDocument({ language: 'typescript', content: tsContent });
    await vscode.window.showTextDocument(document);

    // Mock QuickPick and warning confirmation dialogs
    const origQuickPick = vscode.window.showQuickPick as any;
    const origWarn = vscode.window.showWarningMessage as any;

    try {
      // Stub showQuickPick to return the first pick item (confirm)
      (vscode.window as any).showQuickPick = async (items: any, _options: any) => {
        if (items && items.length > 0) {
          return items[0];
        }
        return undefined;
      };

      // Stub showWarningMessage to return 'Delete'
      (vscode.window as any).showWarningMessage = async (_msg: string, _options: any, ...actions: string[]) => {
        return actions[0];
      };

      await vscode.commands.executeCommand('probemark.removeProbesInCurrentFile');

      const text = document.getText();
      // probemark:auto lines should be removed
      assert.ok(!text.includes('probemark:auto'), `probemark:auto lines should be removed, got:\n${text}`);
      // Plain console.log should remain
      assert.ok(text.includes("console.log('normal log');"), `Normal console.log should remain, got:\n${text}`);
      // logger.info should remain
      assert.ok(text.includes("logger.info('app info');"), `logger.info should remain, got:\n${text}`);
    } finally {
      // Restore originals
      (vscode.window as any).showQuickPick = origQuickPick;
      (vscode.window as any).showWarningMessage = origWarn;
    }
  });
});
