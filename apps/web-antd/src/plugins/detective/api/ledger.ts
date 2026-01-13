import { requestClient } from '#/api/request';

// ==================== 数据模型 ====================

/**
 * 账本分录 - 去重后的真实消费记录
 */
export interface LedgerEntry {
  id: number;
  owner_user_id: number;
  account_id: number;
  category_id: number;
  amount: number;
  direction: 'expense' | 'income';
  entry_date: string;
  transaction_time: string;
  merchant: string;
  description?: string;
  source_type: 'import' | 'manual' | 'recurring';
  source_tx_id?: number;
  match_id?: number;
  tags?: string;
  note?: string;
  is_confirmed: boolean;
}

/**
 * 分类映射
 */
export interface CategoryMapping {
  id: number;
  source: 'alipay' | 'bank' | 'credit_card' | 'wechat';
  category_id: number;
  owner_user_id?: number;
  raw_category: string;
  raw_merchant?: string;
  priority: number;
  is_active: boolean;
}

// ==================== 统计响应类型 ====================

/**
 * 账本月度统计
 */
export interface LedgerMonthlyStats {
  total_income: number;
  total_expense: number;
  income_count: number;
  expense_count: number;
  net: number;
}

/**
 * 账本分类统计项
 */
export interface LedgerCategoryStats {
  category_id: number;
  category_name: string;
  direction: 'expense' | 'income';
  count: number;
  total: number;
  percentage: number;
}

/**
 * 账本日统计项
 */
export interface LedgerDailyStats {
  date: string;
  expense: number;
  income: number;
  net: number;
  count: number;
}

/**
 * 账本月度趋势项
 */
export interface LedgerMonthlyTrend {
  month: string;
  expense: number;
  income: number;
  net: number;
  count: number;
}

/**
 * 账本账户统计项
 */
export interface LedgerAccountStats {
  account_id: number;
  account_name: string;
  account_type: null | string;
  expense: number;
  income: number;
  net: number;
  count: number;
}

// ==================== API 接口 ====================

/**
 * 获取账本月度统计
 */
export async function getLedgerMonthlyStatsApi(params?: {
  year?: number;
  month?: number;
}) {
  return requestClient.get<LedgerMonthlyStats>(
    '/api/v1/detective/stats/ledger/monthly',
    { params },
  );
}

/**
 * 获取账本分类统计
 */
export async function getLedgerCategoryStatsApi(params?: {
  year?: number;
  month?: number;
}) {
  return requestClient.get<LedgerCategoryStats[]>(
    '/api/v1/detective/stats/ledger/category',
    { params },
  );
}

/**
 * 获取账本日统计
 */
export async function getLedgerDailyStatsApi(params?: {
  year?: number;
  month?: number;
}) {
  return requestClient.get<LedgerDailyStats[]>(
    '/api/v1/detective/stats/ledger/daily',
    { params },
  );
}

/**
 * 获取账本月度趋势
 */
export async function getLedgerMonthlyTrendApi(params?: { months?: number }) {
  return requestClient.get<LedgerMonthlyTrend[]>(
    '/api/v1/detective/stats/ledger/monthly-trend',
    { params },
  );
}

/**
 * 获取账本账户统计
 */
export async function getLedgerAccountStatsApi(params?: {
  year?: number;
  month?: number;
}) {
  return requestClient.get<LedgerAccountStats[]>(
    '/api/v1/detective/stats/ledger/account',
    { params },
  );
}
