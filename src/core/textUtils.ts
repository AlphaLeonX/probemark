/**
 * 从行文本中提取前导空白（空格和制表符）。
 */
export function getIndentation(lineText: string): string {
  const match = lineText.match(/^[ \t]*/);
  return match ? match[0] : '';
}

/**
 * 同时对单引号和双引号进行转义，使前缀在任何引号风格中都是安全的。
 */
export function escapeAllQuotes(value: string): string {
  return value.replace(/['"]/g, '\\$&');
}

/**
 * PHP 变量规范化：如果值不以 $ 开头，自动补上。
 */
export function normalizePhpVariable(value: string): string {
  return value.startsWith('$') ? value : '$' + value;
}
