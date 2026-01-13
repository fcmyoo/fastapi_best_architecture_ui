import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

export interface Transaction {
  id: number;
  source: string;
  source_type: string;
  direction: 'expense' | 'income';
  amount: number;
  transaction_time: string;
  merchant_raw: string;
  merchant_normalized?: string;
  category?: string;
  payment_method?: string;
  card_bank?: string;
  card_last4?: string;
  card_type?: string;
  matched: boolean;
  match_id?: number;
  bill_id?: number;
  statement_month: string;
  remark?: string;
  created_time: string;
}

export interface TransactionListParams {
  source?: string;
  direction?: string;
  matched?: boolean;
  statement_month?: string;
  category?: string;
  min_amount?: number;
  max_amount?: number;
  start_date?: string;
  end_date?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface TransactionStats {
  total_count: number;
  total_expense: number;
  total_income: number;
  matched_count: number;
  unmatched_count: number;
}

/**
 * 获取交易列表
 */
export async function getTransactionListApi(params?: TransactionListParams) {
  return requestClient.get<PaginationResult<Transaction>>(
    '/api/v1/detective/transactions',
    { params },
  );
}

/**
 * 获取交易详情
 */
export async function getTransactionDetailApi(txId: number) {
  return requestClient.get<Transaction>(
    `/api/v1/detective/transactions/${txId}`,
  );
}

/**
 * 获取交易统计
 */
export async function getTransactionStatsApi(params?: {
  statement_month?: string;
}) {
  return requestClient.get<TransactionStats>(
    '/api/v1/detective/transactions/stats',
    { params },
  );
}
