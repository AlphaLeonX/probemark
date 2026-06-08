import * as assert from 'assert';
import * as vscode from 'vscode';

suite('insertProbe command', () => {

  // Helper: create a document and set it as the active editor
  async function openDocument(
    language: string,
    content: string,
  ): Promise<{ document: vscode.TextDocument; editor: vscode.TextEditor }> {
    const document = await vscode.workspace.openTextDocument({ language, content });
    const editor = await vscode.window.showTextDocument(document);
    return { document, editor };
  }

  // Helper: wait for extension activation
  async function ensureActivated() {
    const ext = vscode.extensions.getExtension('your-publisher-id.probemark');
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  }

  suiteSetup(async () => {
    await ensureActivated();
  });

  test('TypeScript: select userName and insert probe', async () => {
    const tsContent = [
      'const handleSubmit = () => {',
      '  const userName = "Rose";',
      '};',
    ].join('\n');

    const { document, editor } = await openDocument('typescript', tsContent);

    // Select userName on line 2
    const line = 1; // 0-based
    const start = tsContent.split('\n')[1].indexOf('userName');
    editor.selection = new vscode.Selection(
      new vscode.Position(line, start),
      new vscode.Position(line, start + 'userName'.length),
    );

    await vscode.commands.executeCommand('probemark.insertProbe');

    const text = document.getText();
    assert.ok(text.includes('console.log('), `Expected console.log in:\n${text}`);
    assert.ok(text.includes('userName'), `Expected userName in:\n${text}`);
    assert.ok(text.includes('// probemark:auto'), `Expected // probemark:auto in:\n${text}`);
    assert.ok(text.includes('handleSubmit'), `Expected handleSubmit in:\n${text}`);

    // Inserted on the next line after cursor
    const lines = text.split('\n');
    assert.strictEqual(lines.length, 4, 'Expected 4 lines (3 original + 1 new probe line)');
    // Line 3 (index 2) should be the newly inserted probe
    assert.ok(lines[2].includes('console.log('), `Line 3 should be the probe, got: ${lines[2]}`);
  });

  test('Python: select name and insert probe', async () => {
    const pyContent = [
      'def greet():',
      '    name = "Rose"',
    ].join('\n');

    const { document, editor } = await openDocument('python', pyContent);

    // Select name on line 2
    const line = 1;
    const start = pyContent.split('\n')[1].indexOf('name');
    editor.selection = new vscode.Selection(
      new vscode.Position(line, start),
      new vscode.Position(line, start + 'name'.length),
    );

    await vscode.commands.executeCommand('probemark.insertProbe');

    const text = document.getText();
    assert.ok(text.includes('print('), `Expected print( in:\n${text}`);
    assert.ok(text.includes('name'), `Expected name in:\n${text}`);
    assert.ok(text.includes('# probemark:auto'), `Expected # probemark:auto in:\n${text}`);
  });

  test('PHP: select user and insert probe', async () => {
    const phpContent = [
      'function process() {',
      '    $user = getUser();',
      '}',
    ].join('\n');

    const { document, editor } = await openDocument('php', phpContent);

    const line = 1;
    const start = phpContent.split('\n')[1].indexOf('$user');
    editor.selection = new vscode.Selection(
      new vscode.Position(line, start),
      new vscode.Position(line, start + '$user'.length),
    );

    await vscode.commands.executeCommand('probemark.insertProbe');

    const text = document.getText();
    assert.ok(text.includes('var_dump('), `Expected var_dump( in:\n${text}`);
    assert.ok(text.includes('$user'), `Expected $user in:\n${text}`);
    assert.ok(text.includes('// probemark:auto'), `Expected // probemark:auto in:\n${text}`);
  });

  test('Go: select user and insert probe', async () => {
    const goContent = [
      'func Process() {',
      '    user := getUser()',
      '}',
    ].join('\n');

    const { document, editor } = await openDocument('go', goContent);

    const line = 1;
    const start = goContent.split('\n')[1].indexOf('user');
    editor.selection = new vscode.Selection(
      new vscode.Position(line, start),
      new vscode.Position(line, start + 'user'.length),
    );

    await vscode.commands.executeCommand('probemark.insertProbe');

    const text = document.getText();
    assert.ok(text.includes('fmt.Println('), `Expected fmt.Println( in:\n${text}`);
    assert.ok(text.includes('user'), `Expected user in:\n${text}`);
    assert.ok(text.includes('// probemark:auto'), `Expected // probemark:auto in:\n${text}`);
  });

  test('No selection, cursor on a word — reads the current word', async () => {
    const tsContent = [
      'function test() {',
      '  const myVar = 123;',
      '}',
    ].join('\n');

    const { document, editor } = await openDocument('typescript', tsContent);

    // Place cursor inside myVar (no selection)
    const line = 1;
    const pos = tsContent.split('\n')[1].indexOf('myVar') + 2; // cursor at 'V' in 'myVar'
    editor.selection = new vscode.Selection(
      new vscode.Position(line, pos),
      new vscode.Position(line, pos),
    );

    await vscode.commands.executeCommand('probemark.insertProbe');

    const text = document.getText();
    assert.ok(text.includes('myVar'), `Expected myVar in:\n${text}`);
    assert.ok(text.includes('// probemark:auto'), `Expected // probemark:auto in:\n${text}`);
  });

  test('No selection and no recognisable word — inserts default debug probe', async () => {
    const tsContent = [
      'function test() {',
      '  ;',
      '}',
    ].join('\n');

    const { document, editor } = await openDocument('typescript', tsContent);

    // Cursor before the semicolon
    const line = 1;
    editor.selection = new vscode.Selection(
      new vscode.Position(line, 0),
      new vscode.Position(line, 0),
    );

    await vscode.commands.executeCommand('probemark.insertProbe');

    const text = document.getText();
    assert.ok(text.includes('debug'), `Expected debug in:\n${text}`);
    assert.ok(text.includes('// probemark:auto'), `Expected // probemark:auto in:\n${text}`);
  });
});
