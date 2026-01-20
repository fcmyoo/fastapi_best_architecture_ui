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

// 交易详情响应（包含关联信息）
export interface TransactionDetail {
  id: number;
  source: string;
  source_type: string;
  direction: 'expense' | 'income';
  transaction_time: string;
  amount: string;
  statement_month?: string;
  merchant_raw?: string;
  merchant_norm?: string;
  description?: string;
  category?: string;
  payment_method?: string;
  card_bank?: string;
  card_last4?: string;
  card_type?: string;
  tx_type?: string;
  tx_status?: string;
  external_id?: string;
  matched: boolean;
  match_id?: number;
  confidence?: number;
  match_status?: string;
  account_id?: number;
  category_id?: number;
  is_manual?: boolean;
  note?: string;
  cash_out_group_id?: number;
  created_time?: string;
  updated_time?: string;
  // 关联信息
  bill_file?: {
    filename: string;
    id: number;
    source: string;
  };
  matched_transaction?: {
    amount: string;
    card_bank?: string;
    card_last4?: string;
    category?: string;
    description?: string;
    id: number;
    merchant_raw?: string;
    payment_method?: string;
    source: string;
    source_type: string;
    transaction_time: string;
  };
  cash_out_group?: null | {
    id: number;
    name: string;
  };
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
  return requestClient.get<TransactionDetail>(
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
