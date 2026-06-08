import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { removeGeneratedProbesFromText, collectGeneratedProbesFromText } from '../../core/cleanup';

suite('workspace cleanup', () => {

  // Test fixture directory
  const fixtureDir = path.resolve(__dirname, '..', '..', '..', 'test-fixtures', 'workspace');

  test('a.ts — all probemark:auto probes removed, normal logs kept', () => {
    const content = fs.readFileSync(path.join(fixtureDir, 'a.ts'), 'utf-8');
    const result = removeGeneratedProbesFromText(content);

    // a.ts has 3 probemark:auto probe lines
    assert.strictEqual(result.removedCount, 3, `Expected 3 removed, got ${result.removedCount}`);

    const cleaned = result.cleanedText;
    // Plain console.log kept
    assert.ok(cleaned.includes("console.log('normal log', result)"), 'Normal console.log should remain');
    // logger.info kept
    assert.ok(cleaned.includes("logger.info('application started')"), 'logger.info should remain');
    // probemark:auto all removed
    assert.ok(!cleaned.includes('probemark:auto'), 'All probemark:auto lines should be removed');
  });

  test('b.py — all probemark:auto probes removed, normal print kept', () => {
    const content = fs.readFileSync(path.join(fixtureDir, 'b.py'), 'utf-8');
    const result = removeGeneratedProbesFromText(content);

    // b.py has 3 probemark:auto probe lines
    assert.strictEqual(result.removedCount, 3, `Expected 3 removed, got ${result.removedCount}`);

    const cleaned = result.cleanedText;
    // Plain print kept
    assert.ok(cleaned.includes("print('normal print', msg)"), 'Normal print should remain');
    // probemark:auto all removed
    assert.ok(!cleaned.includes('probemark:auto'), 'All probemark:auto lines should be removed');
  });

  test('c.go — all probemark:auto probes removed, normal fmt.Println kept', () => {
    const content = fs.readFileSync(path.join(fixtureDir, 'c.go'), 'utf-8');
    const result = removeGeneratedProbesFromText(content);

    // c.go has 2 probemark:auto probe lines
    assert.strictEqual(result.removedCount, 2, `Expected 2 removed, got ${result.removedCount}`);

    const cleaned = result.cleanedText;
    // Plain fmt.Println kept
    assert.ok(cleaned.includes('fmt.Println("normal output", name)'), 'Normal fmt.Println should remain');
    // probemark:auto all removed
    assert.ok(!cleaned.includes('probemark:auto'), 'All probemark:auto lines should be removed');
  });

  test('temp-dir copy test — does not mutate original fixture files', () => {
    // Copy fixtures to a temp directory
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'probemark-test-'));
    try {
      // Copy files
      const files = ['a.ts', 'b.py', 'c.go'];
      for (const f of files) {
        fs.copyFileSync(path.join(fixtureDir, f), path.join(tmpDir, f));
      }

      // Read the copied a.ts
      const content = fs.readFileSync(path.join(tmpDir, 'a.ts'), 'utf-8');
      const result = removeGeneratedProbesFromText(content);
      assert.strictEqual(result.removedCount, 3);
      assert.ok(!result.cleanedText.includes('probemark:auto'));

      // Verify original fixture files are unchanged
      const origContent = fs.readFileSync(path.join(fixtureDir, 'a.ts'), 'utf-8');
      assert.ok(origContent.includes('probemark:auto'), 'Original fixture should remain unchanged');
    } finally {
      // Clean up temp directory
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('collectGeneratedProbesFromText totals are correct', () => {
    const total = ['a.ts', 'b.py', 'c.go'].reduce((sum, file) => {
      const content = fs.readFileSync(path.join(fixtureDir, file), 'utf-8');
      return sum + collectGeneratedProbesFromText(content).length;
    }, 0);
    // a.ts: 3, b.py: 3, c.go: 2 = 8
    assert.strictEqual(total, 8, `Expected 8 total probemark:auto lines, got ${total}`);
  });

  test('cleaned text is still readable', () => {
    const content = fs.readFileSync(path.join(fixtureDir, 'b.py'), 'utf-8');
    const result = removeGeneratedProbesFromText(content);

    const lines = result.cleanedText.split('\n');
    // Should still have remaining non-probe lines
    assert.ok(lines.length > 0, 'Should have remaining lines');
    // Verify key content
    assert.ok(result.cleanedText.includes('name = "Rose"'), 'Variable assignment should remain');
    assert.ok(result.cleanedText.includes('def greet():'), 'Function definition should remain');
    assert.ok(result.cleanedText.includes('msg = "hello"'), 'Inner variable should remain');
  });
});
