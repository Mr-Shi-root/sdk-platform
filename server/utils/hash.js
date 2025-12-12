/**
 * 哈希工具
 * 用于生成错误堆栈的哈希值，用于错误聚合
 */

const crypto = require('crypto');

/**
 * 生成堆栈哈希
 * 用于识别相同的错误
 */
function generateStackHash(stack) {
  if (!stack) {
    return null;
  }

  // 清理堆栈信息，移除动态部分（行号、列号、时间戳等）
  const cleanedStack = cleanStack(stack);

  // 生成 MD5 哈希
  return crypto
    .createHash('md5')
    .update(cleanedStack)
    .digest('hex');
}

/**
 * 清理堆栈信息
 * 移除动态部分，保留核心错误特征
 */
function cleanStack(stack) {
  if (!stack) return '';

  return stack
    // 移除行号和列号
    .replace(/:\d+:\d+/g, '')
    // 移除文件路径中的动态部分（如 hash）
    .replace(/\?[a-z0-9]+/gi, '')
    // 移除时间戳
    .replace(/\d{13}/g, '')
    // 移除 URL 参数
    .replace(/\?.*$/gm, '')
    // 统一换行符
    .replace(/\r\n/g, '\n')
    // 移除多余空格
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 生成唯一 ID
 */
function generateUniqueId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  generateStackHash,
  cleanStack,
  generateUniqueId,
};
