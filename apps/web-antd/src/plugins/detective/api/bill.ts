import type { PaginationResult } from '#/types';

import { requestClient } from '#/api/request';

export interface BillFile {
  id: number;
  type: 'email' | 'upload';
  source: string;
  filename: string;
  statement_month: string;
  status: string;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  created_time: string;
  // 信用卡账单特有字段
  bank_code?: string;
  bank_name?: string;
  card_last4?: string;
  bill_amount?: string;
  due_date?: string;
  email_subject?: string;
}

export interface BillListParams {
  type?: string;
  source?: string;
  status?: string;
  statement_month?: string;
  page?: number;
  size?: number;
}

export interface BillStatusResult {
  status: string;
  progress: number;
  message?: string;
}

export interface UploadBillParams {
  file: File;
  source: string;
  statement_month?: string;
}

/**
 * 获取账单列表
 */
export async function getBillListApi(params?: BillListParams) {
  return requestClient.get<BillFile[]>('/api/v1/detective/bills', { params });
}

/**
 * 获取账单详情
 */
export async function getBillDetailApi(billId: number) {
  return requestClient.get<BillFile>(`/api/v1/detective/bills/${billId}`);
}

/**
 * 上传账单文件
 * @param data FormData 包含 file 字段
 * @param params Query 参数：source (必填), password (可选), force_reparse (可选)
 */
export async function uploadBillApi(
  data: FormData,
  params: { force_reparse?: boolean; password?: string; source: string },
) {
  return requestClient.post<BillFile>('/api/v1/detective/bills/upload', data, {
    params,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 解析账单
 */
export async function parseBillApi(billId: number) {
  return requestClient.post(`/api/v1/detective/bills/${billId}/parse`);
}

/**
 * 获取账单解析状态
 */
export async function getBillStatusApi(billId: number) {
  return requestClient.get<BillStatusResult>(
    `/api/v1/detective/bills/${billId}/status`,
  );
}

/**
 * 解析邮件账单 (EML 文件)
 */
export async function parseEmailBillApi(data: FormData) {
  return requestClient.post<BillFile>(
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
 * 删除账单
 */
export async function deleteBillApi(billId: number) {
  return requestClient.delete(`/api/v1/detective/bills/${billId}`);
}

export interface BillDetailItem {
  id: number;
  source: string;
  source_type: string;
  direction: 'expense' | 'income';
  transaction_time: string;
  amount: number;
  statement_month: string;
  merchant_raw?: string;
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
}

export interface BillDetailListParams {
  statement_month?: string;
  source?: string;
  source_type?: string;
  direction?: string;
  matched?: boolean;
  match_status?: string;
  min_amount?: number;
  max_amount?: number;
  keyword?: string;
  min_confidence?: number;
  max_confidence?: number;
  page?: number;
  size?: number;
}

/**
 * 获取账单明细列表
 */
export async function getBillDetailListApi(params?: BillDetailListParams) {
  return requestClient.get<PaginationResult<BillDetailItem>>(
    '/api/v1/detective/bills/details',
    { params },
  );
}

export interface BillTransactionsParams {
  direction?: 'expense' | 'income';
  page?: number;
  size?: number;
}

/**
 * 获取指定账单的交易明细
 */
export async function getBillTransactionsApi(
  billId: number,
  params?: BillTransactionsParams,
) {
  return requestClient.get<PaginationResult<BillDetailItem>>(
    `/api/v1/detective/bills/${billId}/transactions`,
    { params },
  );
}
