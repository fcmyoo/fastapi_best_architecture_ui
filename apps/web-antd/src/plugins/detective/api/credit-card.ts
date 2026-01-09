import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

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
