import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

// ========== 新版 API 类型定义（按卡聚合） ==========

/** 最新账单摘要 */
export interface LatestBillSummary {
  statement_month: string;
  bill_amount: null | number;
  min_payment: null | number;
  due_date: null | string;
  bill_date: null | string;
  payment_status: 'paid' | 'partial' | 'unpaid';
}

/** 信用卡摘要（列表项） */
export interface CreditCardSummary {
  card_id: string;
  bank_code: string;
  bank_name: string;
  card_last4: null | string;
  credit_limit: null | number;
  latest_bill: LatestBillSummary | null;
}

/** 账单摘要（历史账单列表项） */
export interface CreditCardBillSummary {
  id: number;
  statement_month: string;
  billing_cycle_start: null | string;
  billing_cycle_end: null | string;
  bill_amount: null | number;
  min_payment: null | number;
  due_date: null | string;
  payment_status: string;
  parsed_count: number;
}

/** 历史账单响应 */
export interface CreditCardBillsResponse {
  bank_code: string;
  bank_name: string;
  card_last4: null | string;
  credit_limit: null | number;
  bills: CreditCardBillSummary[];
}

/** 账单交易项 */
export interface BillTransactionItem {
  id: number;
  transaction_time: string;
  merchant_raw: null | string;
  amount: number;
  direction: 'expense' | 'income';
  category_name: null | string;
}

/** 账单详情 */
export interface BillDetailInfo {
  id: number;
  bank_name: string;
  card_last4: null | string;
  statement_month: string;
  billing_cycle_start: null | string;
  billing_cycle_end: null | string;
  bill_amount: null | number;
  min_payment: null | number;
  due_date: null | string;
  credit_limit: null | number;
  payment_status: string;
}

/** 账单交易明细响应 */
export interface BillTransactionsResponse {
  bill_info: BillDetailInfo;
  transactions: BillTransactionItem[];
}

// ========== 新版 API 函数 ==========

/** 获取信用卡列表（按卡聚合） */
export async function getCreditCardsApi() {
  return requestClient.get<CreditCardSummary[]>(
    '/api/v1/detective/credit-cards',
  );
}

/** 获取单卡历史账单 */
export async function getCardBillsApi(
  bankCode: string,
  cardLast4: null | string,
) {
  return requestClient.get<CreditCardBillsResponse>(
    `/api/v1/detective/credit-cards/${bankCode}/${cardLast4 || 'null'}/bills`,
  );
}

/** 获取信用卡账单交易明细 */
export async function getCreditCardBillTransactionsApi(billId: number) {
  return requestClient.get<BillTransactionsResponse>(
    `/api/v1/detective/credit-cards/bills/${billId}/transactions`,
  );
}

// ========== 旧版 API 类型定义（保留兼容） ==========

export interface CreditCardBill {
  id: number;
  bank_code: string;
  bank_name: string;
  statement_month: string;
  card_last4: string;
  bill_date: string;
  due_date: string;
  bill_amount: string;
  min_payment?: string;
  billing_cycle_start?: string;
  billing_cycle_end?: string;
  parsed_count: number;
  saved_count: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  paid_amount?: string;
  paid_date?: string;
  email_subject?: string;
  created_time: string;
}

export interface CreditCardBillListParams {
  bank_code?: string;
  statement_month?: string;
  payment_status?: string;
  page?: number;
  size?: number;
}

export interface CreditCardTransaction {
  id: number;
  direction: 'expense' | 'income';
  transaction_time: string;
  amount: string;
  merchant_raw?: string;
  merchant_norm?: string;
  card_bank?: string;
  card_last4?: string;
  tx_category?: string;
  matched: boolean;
}

export interface CreditCardTransactionsParams {
  direction?: 'expense' | 'income';
  page?: number;
  size?: number;
}

/**
 * 获取信用卡账单列表
 */
export async function getCreditCardBillListApi(
  params?: CreditCardBillListParams,
) {
  return requestClient.get<CreditCardBill[]>('/api/v1/detective/email-bills', {
    params,
  });
}

/**
 * 获取信用卡账单详情
 */
export async function getCreditCardBillDetailApi(billId: number) {
  return requestClient.get<CreditCardBill>(
    `/api/v1/detective/email-bills/${billId}`,
  );
}

/**
 * 获取信用卡账单交易明细
 */
export async function getCreditCardTransactionsApi(
  billId: number,
  params?: CreditCardTransactionsParams,
) {
  return requestClient.get<PaginationResult<CreditCardTransaction>>(
    `/api/v1/detective/email-bills/${billId}/transactions`,
    { params },
  );
}

/**
 * 解析邮件账单 (EML 文件)
 */
export async function parseEmailBillApi(data: FormData) {
  return requestClient.post<CreditCardBill>(
    '/api/v1/detective/email-bills/parse-eml',
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

/**
 * 删除信用卡账单
 */
export async function deleteCreditCardBillApi(billId: number) {
  return requestClient.delete(`/api/v1/detective/email-bills/${billId}`);
}

export interface FetchEmailBillsResult {
  task_id: string;
  message: string;
}

/**
 * 从邮箱收取信用卡账单
 * @param months 收取最近几个月的账单，范围 1-24，默认 12
 */
export async function fetchEmailBillsApi(months?: number) {
  return requestClient.post<FetchEmailBillsResult>(
    '/api/v1/detective/email-bills/fetch',
    null,
    { params: months ? { months } : undefined },
  );
}
