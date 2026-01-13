import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

/** 商户账户 */
export interface MerchantAccount {
  id: number;
  merchant_id: number;
  name_pattern: string;
  account_type: 'credit' | 'transfer';
  account_pattern: string | null;
  note: string | null;
  is_active: boolean;
  created_time: string;
}

/** 套现商户 */
export interface CashOutMerchant {
  id: number;
  name: string;
  fee_rate: string;
  note: string | null;
  is_active: boolean;
  created_time: string;
  updated_time: string | null;
  accounts: MerchantAccount[];
}

/** 创建商户参数 */
export interface CreateMerchantParam {
  name: string;
  fee_rate?: number;
  note?: string;
}

/** 更新商户参数 */
export interface UpdateMerchantParam {
  name?: string;
  fee_rate?: number;
  note?: string;
  is_active?: boolean;
}

/** 创建账户参数 */
export interface CreateAccountParam {
  name_pattern: string;
  account_type: 'credit' | 'transfer';
  account_pattern?: string;
  note?: string;
}

/** 更新账户参数 */
export interface UpdateAccountParam {
  name_pattern?: string;
  account_pattern?: string;
  note?: string;
  is_active?: boolean;
}

/** 标注套现参数 */
export interface TagCashOutParam {
  merchant_id?: number;
  new_merchant?: CreateMerchantParam;
}

/** 关联商户参数 */
export interface LinkMerchantParam {
  merchant_id: number;
}

/** 标注响应 */
export interface TagCashOutResponse {
  transaction_id: number;
  merchant_id: number;
  merchant_name: string;
  tx_category: string;
  account_added: boolean;
  account_type: string | null;
  similar_updated_count: number;
}

/** 统计汇总 */
export interface CashOutStatsSummary {
  total_credit_amount: string;
  total_transfer_amount: string;
  total_fee: string;
  avg_fee_rate: string;
  merchant_count: number;
  credit_tx_count: number;
  transfer_tx_count: number;
}

/** 按商户统计 */
export interface CashOutStatsByMerchant {
  merchant_id: number;
  merchant_name: string;
  credit_amount: string;
  transfer_amount: string;
  fee: string;
  credit_tx_count: number;
  transfer_tx_count: number;
}

// ==================== 商户管理 API ====================

const BASE_URL = '/api/v1/detective/cash-out';

/** 获取商户列表 */
export async function getMerchantsApi(params?: { is_active?: boolean }) {
  return requestClient.get<CashOutMerchant[]>(`${BASE_URL}/merchants`, {
    params,
  });
}

/** 获取商户详情 */
export async function getMerchantDetailApi(merchantId: number) {
  return requestClient.get<CashOutMerchant>(
    `${BASE_URL}/merchants/${merchantId}`,
  );
}

/** 创建商户 */
export async function createMerchantApi(data: CreateMerchantParam) {
  return requestClient.post<CashOutMerchant>(`${BASE_URL}/merchants`, data);
}

/** 更新商户 */
export async function updateMerchantApi(
  merchantId: number,
  data: UpdateMerchantParam,
) {
  return requestClient.put<CashOutMerchant>(
    `${BASE_URL}/merchants/${merchantId}`,
    data,
  );
}

/** 删除商户 */
export async function deleteMerchantApi(merchantId: number) {
  return requestClient.delete(`${BASE_URL}/merchants/${merchantId}`);
}

// ==================== 商户账户 API ====================

/** 获取商户账户列表 */
export async function getMerchantAccountsApi(merchantId: number) {
  return requestClient.get<MerchantAccount[]>(
    `${BASE_URL}/merchants/${merchantId}/accounts`,
  );
}

/** 添加商户账户 */
export async function createMerchantAccountApi(
  merchantId: number,
  data: CreateAccountParam,
) {
  return requestClient.post<MerchantAccount>(
    `${BASE_URL}/merchants/${merchantId}/accounts`,
    data,
  );
}

/** 更新商户账户 */
export async function updateMerchantAccountApi(
  accountId: number,
  data: UpdateAccountParam,
) {
  return requestClient.put<MerchantAccount>(
    `${BASE_URL}/accounts/${accountId}`,
    data,
  );
}

/** 删除商户账户 */
export async function deleteMerchantAccountApi(accountId: number) {
  return requestClient.delete(`${BASE_URL}/accounts/${accountId}`);
}

// ==================== 交易标注 API ====================

/** 标注为套现 */
export async function tagCashOutApi(
  transactionId: number,
  data: TagCashOutParam,
) {
  return requestClient.post<TagCashOutResponse>(
    `${BASE_URL}/transactions/${transactionId}/tag`,
    data,
  );
}

/** 关联到商户（储蓄卡回款） */
export async function linkMerchantApi(
  transactionId: number,
  data: LinkMerchantParam,
) {
  return requestClient.post<TagCashOutResponse>(
    `${BASE_URL}/transactions/${transactionId}/link`,
    data,
  );
}

/** 取消套现标注 */
export async function untagCashOutApi(transactionId: number) {
  return requestClient.post(`${BASE_URL}/transactions/${transactionId}/untag`);
}

// ==================== 统计 API ====================

/** 获取统计汇总 */
export async function getCashOutStatsSummaryApi() {
  return requestClient.get<CashOutStatsSummary>(`${BASE_URL}/stats/summary`);
}

/** 获取按商户统计 */
export async function getCashOutStatsByMerchantApi() {
  return requestClient.get<CashOutStatsByMerchant[]>(
    `${BASE_URL}/stats/by-merchant`,
  );
}
