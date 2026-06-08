import * as assert from 'assert';
import { buildLogStatement, buildValueLog, buildDefaultLog } from '../../core/logBuilder';

suite('buildLogStatement', () => {

  // ─── JavaScript (with variable) ──────────────────────────
  test('javascript with variable', () => {
    const result = buildLogStatement('javascript', 'userName', '🧪 [App.tsx:42] handleSubmit → userName:');
    assert.ok(result.includes("console.log('"));
    assert.ok(result.includes("', userName);"));
    assert.ok(result.includes('// probemark:auto'));
    assert.ok(result.includes("🧪 [App.tsx:42] handleSubmit → userName:"));
  });

  test('javascript without variable', () => {
    const result = buildLogStatement('javascript', undefined, '🧪 [App.js:10] debug');
    assert.ok(result.includes("console.log('🧪 [App.js:10] debug');"));
    assert.ok(result.includes('// probemark:auto'));
  });

  // ─── JavaScript React ────────────────────────────────────
  test('javascriptreact with variable', () => {
    const result = buildLogStatement('javascriptreact', 'count', '🧪 [Comp.jsx:5] render → count:');
    assert.ok(result.includes("console.log('"));
    assert.ok(result.includes("', count);"));
    assert.ok(result.includes('// probemark:auto'));
  });

  // ─── TypeScript ──────────────────────────────────────────
  test('typescript with variable', () => {
    const result = buildLogStatement('typescript', 'userName', '🧪 [App.ts:42] handleSubmit → userName:');
    assert.ok(result.includes("console.log('"));
    assert.ok(result.includes("', userName);"));
    assert.ok(result.includes('// probemark:auto'));
    assert.ok(result.includes("🧪 [App.ts:42] handleSubmit → userName:"));
  });

  test('typescriptreact with variable', () => {
    const result = buildLogStatement('typescriptreact', 'count', '🧪 [Comp.tsx:5] render → count:');
    assert.ok(result.includes("console.log('"));
    assert.ok(result.includes("', count);"));
    assert.ok(result.includes('// probemark:auto'));
  });

  // ─── Python ──────────────────────────────────────────────
  test('python with variable', () => {
    const result = buildLogStatement('python', 'name', '🧪 [greet.py:4] greet → name:');
    assert.ok(result.includes("print('"));
    assert.ok(result.includes("', name)"));
    assert.ok(result.includes('# probemark:auto'));
    assert.ok(result.includes("🧪 [greet.py:4] greet → name:"));
  });

  test('python without variable', () => {
    const result = buildLogStatement('python', undefined, '🧪 [greet.py:4] debug');
    assert.ok(result.includes("print('🧪 [greet.py:4] debug')"));
    assert.ok(result.includes('# probemark:auto'));
  });

  // ─── Java ────────────────────────────────────────────────
  test('java with variable', () => {
    const result = buildLogStatement('java', 'userName', '🧪 [Main.java:10] main → userName:');
    assert.ok(result.includes('System.out.println("'));
    assert.ok(result.includes('" + userName);'));
    assert.ok(result.includes('// probemark:auto'));
    assert.ok(result.includes('🧪 [Main.java:10] main → userName:'));
  });

  test('java without variable', () => {
    const result = buildLogStatement('java', undefined, '🧪 [Main.java:10] debug');
    assert.ok(result.includes('System.out.println("🧪 [Main.java:10] debug");'));
    assert.ok(result.includes('// probemark:auto'));
  });

  // ─── PHP variable without $ ──────────────────────────────
  test('php variable without $ — auto-prepended', () => {
    const result = buildLogStatement('php', 'user', '🧪 [app.php:8] process → user:');
    assert.ok(result.includes('var_dump($user);'));
    assert.ok(result.includes('// probemark:auto'));
  });

  test('php variable with $ — kept as-is', () => {
    const result = buildLogStatement('php', '$user', '🧪 [app.php:8] process → $user:');
    assert.ok(result.includes('var_dump($user);'));
    assert.ok(result.includes('// probemark:auto'));
  });

  test('php without variable', () => {
    const result = buildLogStatement('php', undefined, '🧪 [app.php:8] debug');
    assert.ok(result.includes("var_dump('🧪 [app.php:8] debug');"));
    assert.ok(result.includes('// probemark:auto'));
  });

  // ─── Go ──────────────────────────────────────────────────
  test('go with variable', () => {
    const result = buildLogStatement('go', 'user', '🧪 [process.go:5] Process → user:');
    assert.ok(result.includes('fmt.Println("'));
    assert.ok(result.includes('", user)'));
    assert.ok(result.includes('// probemark:auto'));
    assert.ok(result.includes('🧪 [process.go:5] Process → user:'));
  });

  test('go without variable', () => {
    const result = buildLogStatement('go', undefined, '🧪 [process.go:5] debug');
    assert.ok(result.includes('fmt.Println("🧪 [process.go:5] debug")'));
    assert.ok(result.includes('// probemark:auto'));
  });

  test('Go does not auto-add import', () => {
    const result = buildLogStatement('go', 'val', '🧪 [main.go:3] main → val:');
    // assert result starts with fmt.Println(, does not contain import statement
    assert.ok(result.startsWith('fmt.Println('));
    assert.ok(!result.includes('import'));
  });

  // ─── Unknown fallback ────────────────────────────────────
  test('unknown fallback with variable', () => {
    const result = buildLogStatement('ruby', 'x', '🧪 [code.rb:1] debug');
    // fallback uses console.log
    assert.ok(result.includes("console.log('"));
    assert.ok(result.includes("', x);"));
    assert.ok(result.includes('// probemark:auto'));
  });

  test('unknown fallback without variable', () => {
    const result = buildLogStatement('cobol', undefined, '🧪 [code.cob:1] debug');
    assert.ok(result.includes("console.log('🧪 [code.cob:1] debug');"));
    assert.ok(result.includes('// probemark:auto'));
  });

  // ─── Edge cases ──────────────────────────────────────────
  test('value contains dot expression user.profile.name', () => {
    const result = buildLogStatement('javascript', 'user.profile.name', '🧪 [App.js:5] → user.profile.name:');
    assert.ok(result.includes("', user.profile.name);"));
  });

  test('value already trimmed (whitespace handled upstream)', () => {
    const result = buildLogStatement('typescript', 'userName', '🧪 [App.ts:10] → userName:');
    assert.ok(result.includes("', userName);"));
  });

  test('label with single-quote does not break the string', () => {
    const ctx = "🧪 [File.ts:1] → it\\'s:";
    const result = buildLogStatement('javascript', 'val', ctx);
    assert.ok(result.includes("console.log('"));
    assert.ok(result.includes("// probemark:auto"));
    assert.ok(!result.includes("it's"));
  });

  test('label with double-quote does not break the string', () => {
    const ctx = '🧪 [File.java:1] → say\\"hi\\":';
    const result = buildLogStatement('java', 'val', ctx);
    assert.ok(result.includes('System.out.println("'));
    assert.ok(result.includes('// probemark:auto'));
    assert.ok(!result.includes('say"hi"'));
  });
});
