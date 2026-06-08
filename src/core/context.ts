import * as path from 'path';
import { escapeAllQuotes } from './textUtils';

/**
 * 从 fromLine 向上扫描文本行数组，查找最近的函数/方法声明。
 * 使用轻量正则匹配，不依赖 AST。
 *
 * 支持的声明模式：
 *   function foo(        — JS / TS / PHP
 *   async function foo( — JS / TS
 *   def foo(             — Python
 *   func foo(            — Go
 *   const foo = (…) =>   — JS / TS 箭头函数
 *   const foo = function(— JS / TS 函数表达式
 *   foo: function(       — JS / TS 方法简写
 *   public ... foo(      — Java 方法
 *   void foo(            — Java / TS 方法
 */
export function findNearestFunctionName(
  lines: string[],
  fromLine: number,
): string | undefined {
  const patterns: RegExp[] = [
    // Python: def foo(
    /\bdef\s+(\w+)\s*\(/,
    // Go: func foo(   (含方法接收者: func (r *T) foo()
    /\bfunc\s+(?:\s*\(\s*\w+\s+\*?\w+\s*\)\s*)?(\w+)\s*\(/,
    // JS/TS/PHP: async function foo(
    /\basync\s+function\s+(\w+)\s*\(/,
    // JS/TS/PHP: function foo(
    /\bfunction\s+(\w+)\s*\(/,
    // JS/TS: const foo = (...) =>   (箭头函数)
    /\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/,
    // JS/TS: const foo = function   (函数表达式)
    /\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?function\b/,
    // JS/TS: foo: function   (方法简写)
    /\b(\w+)\s*:\s*(?:async\s+)?function\b/,
    // Java: public/private/protected ... foo(
    /\b(?:public|private|protected)\s+(?:\w+\s+)+(\w+)\s*\(/,
    // Java/TS: 返回类型方法  void foo(, int foo(, String foo(
    /\b(?:void|int|long|double|float|boolean|char|byte|short|String)\s+(\w+)\s*\(/,
  ];

  for (let line = fromLine; line >= 0; line--) {
    if (line >= lines.length) {
      continue;
    }
    const text = lines[line].trim();

    // 跳过空行和纯注释
    if (!text || text.startsWith('//') || text.startsWith('#') || text.startsWith('/*') || text.startsWith('*')) {
      continue;
    }

    for (const pat of patterns) {
      const match = text.match(pat);
      if (match) {
        return match[1];
      }
    }
  }

  return undefined;
}

/**
 * 构造上下文前缀。
 *
 * 有变量 + 有函数名：
 *   🧪 [FileName:Line] FuncName → varName:
 * 有变量 + 无函数名：
 *   🧪 [FileName:Line] varName:
 * 无变量（默认 debug）：
 *   🧪 [FileName:Line] debug
 */
export function buildContextPrefix(
  fileName: string,
  lineNumber: number,
  variableName: string | undefined,
  functionName: string | undefined,
): string {
  const basename = path.basename(fileName);

  let prefix = `🧪 [${basename}:${lineNumber}]`;

  if (functionName) {
    prefix += ` ${functionName} →`;
  }

  if (variableName) {
    // 同时对单/双引号转义，保证前缀在任何引号风格中安全
    prefix += ` ${escapeAllQuotes(variableName)}:`;
  } else {
    prefix += ` debug`;
  }

  return prefix;
}
