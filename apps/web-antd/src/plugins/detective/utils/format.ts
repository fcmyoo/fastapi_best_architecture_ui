/**
 * 统一金额解析：兼容 number / string / null / undefined
 * 返回 number 类型，无效值返回 0
 */
export function parseAmount(value: null | number | string | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  return Number.isFinite(num) ? num : 0;
}

/**
 * 格式化金额显示：¥1,234.56
 * @param value 金额值（兼容 number / string / null / undefined）
 * @param fallback 无效值时的显示文本，默认 '-'
 */
export function formatAmount(
  value: null | number | string | undefined,
  fallback = '-',
): string {
  if (value === null || value === undefined || value === '') return fallback;
  const num = parseAmount(value);
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 格式化日期：YYYY-MM-DD
 */
export function formatDate(
  dateStr: null | string | undefined,
  fallback = '-',
): string {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return fallback;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * 格式化日期时间：YYYY-MM-DD HH:mm:ss
 */
export function formatDateTime(
  dateStr: null | string | undefined,
  fallback = '-',
): string {
  if (!dateStr) return fallback;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('zh-CN');
}
