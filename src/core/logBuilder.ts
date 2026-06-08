import { getLanguageCommentMarker } from './markers';
import { normalizePhpVariable } from './textUtils';

/**
 * 根据语言 ID 和上下文生成日志语句。
 */
export function buildLogStatement(
  languageId: string,
  value: string | undefined,
  contextPrefix: string,
): string {
  if (value) {
    return buildValueLog(languageId, value, contextPrefix);
  }
  return buildDefaultLog(languageId, contextPrefix);
}

/**
 * 生成带变量的日志语句。
 */
export function buildValueLog(languageId: string, value: string, ctx: string): string {
  const mark = getLanguageCommentMarker(languageId);

  switch (languageId) {
    case 'javascript':
    case 'javascriptreact':
    case 'typescript':
    case 'typescriptreact':
      return `console.log('${ctx}', ${value}); ${mark}`;

    case 'python':
      return `print('${ctx}', ${value})  ${mark}`;

    case 'java':
      return `System.out.println("${ctx} " + ${value}); ${mark}`;

    case 'php':
      // PHP var_dump 没有 label 位，上下文信息仅通过行尾标记携带
      return `var_dump(${normalizePhpVariable(value)}); ${mark}`;

    case 'go':
      return `fmt.Println("${ctx}", ${value}) ${mark}`;

    default:
      return `console.log('${ctx}', ${value}); ${mark}`;
  }
}

/**
 * 生成默认日志语句（无变量）。
 */
export function buildDefaultLog(languageId: string, ctx: string): string {
  const mark = getLanguageCommentMarker(languageId);

  switch (languageId) {
    case 'javascript':
    case 'javascriptreact':
    case 'typescript':
    case 'typescriptreact':
      return `console.log('${ctx}'); ${mark}`;

    case 'python':
      return `print('${ctx}')  ${mark}`;

    case 'java':
      return `System.out.println("${ctx}"); ${mark}`;

    case 'php':
      return `var_dump('${ctx}'); ${mark}`;

    case 'go':
      return `fmt.Println("${ctx}") ${mark}`;

    default:
      return `console.log('${ctx}'); ${mark}`;
  }
}
