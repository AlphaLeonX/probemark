import * as assert from 'assert';
import { isGeneratedProbeLine, PROBEMARK_MARKER } from '../../core/markers';
import { collectGeneratedProbesFromText, removeGeneratedProbesFromText } from '../../core/cleanup';

suite('cleanup — isGeneratedProbeLine', () => {
  test('line with probemark:auto marker', () => {
    assert.strictEqual(isGeneratedProbeLine("console.log('🧪 [App.tsx:42] handleSubmit → userName:', userName); // probemark:auto"), true);
  });

  test('plain console.log does not match', () => {
    assert.strictEqual(isGeneratedProbeLine("console.log('hello');"), false);
  });

  test('plain print does not match', () => {
    assert.strictEqual(isGeneratedProbeLine("print('hello')"), false);
  });

  test('logger.info does not match', () => {
    assert.strictEqual(isGeneratedProbeLine("logger.info('something happened');"), false);
  });
});

suite('cleanup — collectGeneratedProbesFromText', () => {
  test('empty file returns empty array', () => {
    const entries = collectGeneratedProbesFromText('');
    assert.strictEqual(entries.length, 0);
  });

  test('no probemark:auto lines returns empty array', () => {
    const text = [
      "console.log('test');",
      "print('hello')",
    ].join('\n');
    const entries = collectGeneratedProbesFromText(text);
    assert.strictEqual(entries.length, 0);
  });

  test('collects multiple probemark:auto probe lines', () => {
    const text = [
      "console.log('🧪 [A.ts:1] debug'); // probemark:auto",
      "const x = 1;",
      "console.log('🧪 [A.ts:3] debug'); // probemark:auto",
    ].join('\n');
    const entries = collectGeneratedProbesFromText(text);
    assert.strictEqual(entries.length, 2);
    assert.strictEqual(entries[0].lineNumber, 1);
    assert.strictEqual(entries[1].lineNumber, 3);
  });

  test('first line is probemark:auto', () => {
    const text = "console.log('🧪 [B.ts:1] debug'); // probemark:auto\nconst x = 2;";
    const entries = collectGeneratedProbesFromText(text);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].lineNumber, 1);
  });

  test('last line is probemark:auto', () => {
    const text = "const x = 2;\nconsole.log('🧪 [B.ts:2] debug'); // probemark:auto";
    const entries = collectGeneratedProbesFromText(text);
    assert.strictEqual(entries.length, 1);
    assert.strictEqual(entries[0].lineNumber, 2);
  });
});

suite('cleanup — removeGeneratedProbesFromText', () => {
  test('removes lines containing probemark:auto', () => {
    const text = [
      "const a = 1;",
      "console.log('🧪 [A.ts:2] debug'); // probemark:auto",
      "const b = 2;",
    ].join('\n');
    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedCount, 1);
    assert.strictEqual(result.removedLines.length, 1);
    assert.strictEqual(result.removedLines[0].line, 2);
    assert.ok(result.removedLines[0].content.includes('probemark:auto'));
    const lines = result.cleanedText.split('\n');
    assert.strictEqual(lines.length, 2);
    assert.strictEqual(lines[0], 'const a = 1;');
    assert.strictEqual(lines[1], 'const b = 2;');
  });

  test('does not remove plain console.log', () => {
    const text = [
      "console.log('hello');",
      "console.log('🧪 [A.ts:2] debug'); // probemark:auto",
    ].join('\n');
    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedCount, 1);
    const lines = result.cleanedText.split('\n');
    assert.strictEqual(lines.length, 1);
    assert.strictEqual(lines[0], "console.log('hello');");
  });

  test('does not remove plain print', () => {
    const text = [
      "print('hello')",
      "console.log('🧪 [A.ts:2] debug'); // probemark:auto",
    ].join('\n');
    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedCount, 1);
    assert.ok(result.cleanedText.includes("print('hello')"));
  });

  test('does not remove logger.info', () => {
    const text = [
      "logger.info('something happened');",
      "console.log('🧪 [A.ts:2] debug'); // probemark:auto",
    ].join('\n');
    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedCount, 1);
    assert.ok(result.cleanedText.includes("logger.info('something happened');"));
  });

  test('consecutive probemark:auto probes', () => {
    const text = [
      "console.log('🧪 [A.ts:1] a'); // probemark:auto",
      "console.log('🧪 [A.ts:2] b'); // probemark:auto",
      "console.log('🧪 [A.ts:3] c'); // probemark:auto",
      "const x = 1;",
    ].join('\n');
    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedCount, 3);
    assert.strictEqual(result.removedLines.length, 3);
    // removedLines in ascending line-number order
    assert.strictEqual(result.removedLines[0].line, 1);
    assert.strictEqual(result.removedLines[1].line, 2);
    assert.strictEqual(result.removedLines[2].line, 3);
    const lines = result.cleanedText.split('\n');
    assert.strictEqual(lines.length, 1);
    assert.strictEqual(lines[0], 'const x = 1;');
  });

  test('first line is probemark:auto', () => {
    const text = "console.log('🧪 [B.ts:1] debug'); // probemark:auto\nconst x = 2;";
    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedCount, 1);
    assert.strictEqual(result.removedLines[0].line, 1);
    assert.strictEqual(result.cleanedText, 'const x = 2;');
  });

  test('last line is probemark:auto', () => {
    const text = "const x = 2;\nconsole.log('🧪 [B.ts:2] debug'); // probemark:auto";
    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedCount, 1);
    assert.strictEqual(result.removedLines[0].line, 2);
    assert.strictEqual(result.cleanedText, 'const x = 2;');
  });

  test('empty file', () => {
    const result = removeGeneratedProbesFromText('');
    assert.strictEqual(result.removedCount, 0);
    assert.strictEqual(result.removedLines.length, 0);
    assert.strictEqual(result.cleanedText, '');
  });

  test('returns removedCount', () => {
    const text = "// probemark:auto\n// probemark:auto\nconst x = 1;";
    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedCount, 2);
  });

  test('removedLines includes line and content', () => {
    const text = [
      "console.log('🧪 [A.ts:1] hello'); // probemark:auto",
      "const x = 1;",
      "console.log('🧪 [A.ts:3] world'); // probemark:auto",
    ].join('\n');
    const result = removeGeneratedProbesFromText(text);
    assert.strictEqual(result.removedLines.length, 2);
    assert.strictEqual(result.removedLines[0].line, 1);
    assert.ok(result.removedLines[0].content.includes('hello'));
    assert.strictEqual(result.removedLines[1].line, 3);
    assert.ok(result.removedLines[1].content.includes('world'));
  });
});
