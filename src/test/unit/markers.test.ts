import * as assert from 'assert';
import { getLanguageCommentMarker, PROBEMARK_MARKER, isGeneratedProbeLine } from '../../core/markers';

suite('getLanguageCommentMarker', () => {

  test('python returns # probemark:auto', () => {
    assert.strictEqual(getLanguageCommentMarker('python'), '# probemark:auto');
  });

  test('javascript returns // probemark:auto', () => {
    assert.strictEqual(getLanguageCommentMarker('javascript'), '// probemark:auto');
  });

  test('typescript returns // probemark:auto', () => {
    assert.strictEqual(getLanguageCommentMarker('typescript'), '// probemark:auto');
  });

  test('javascriptreact returns // probemark:auto', () => {
    assert.strictEqual(getLanguageCommentMarker('javascriptreact'), '// probemark:auto');
  });

  test('typescriptreact returns // probemark:auto', () => {
    assert.strictEqual(getLanguageCommentMarker('typescriptreact'), '// probemark:auto');
  });

  test('java returns // probemark:auto', () => {
    assert.strictEqual(getLanguageCommentMarker('java'), '// probemark:auto');
  });

  test('go returns // probemark:auto', () => {
    assert.strictEqual(getLanguageCommentMarker('go'), '// probemark:auto');
  });

  test('php returns // probemark:auto', () => {
    assert.strictEqual(getLanguageCommentMarker('php'), '// probemark:auto');
  });

  test('fallback (unknown) returns // probemark:auto', () => {
    assert.strictEqual(getLanguageCommentMarker('ruby'), '// probemark:auto');
  });
});

suite('PROBEMARK_MARKER constant', () => {
  test('PROBEMARK_MARKER value is probemark:auto', () => {
    assert.strictEqual(PROBEMARK_MARKER, 'probemark:auto');
  });
});

suite('isGeneratedProbeLine', () => {
  test('line containing probemark:auto returns true', () => {
    assert.strictEqual(isGeneratedProbeLine("console.log('test'); // probemark:auto"), true);
  });

  test('line without probemark:auto returns false', () => {
    assert.strictEqual(isGeneratedProbeLine("console.log('test');"), false);
  });

  test('probemark:auto at end of line', () => {
    assert.strictEqual(isGeneratedProbeLine("  print('hello')  # probemark:auto"), true);
  });

  test('empty line returns false', () => {
    assert.strictEqual(isGeneratedProbeLine(''), false);
  });
});
