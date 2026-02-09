import { requestClient } from '#/api/request';

// ==================== 类型定义 ====================

/** 商户账户 */
export interface MerchantAccount {
  id: number;
  merchant_id: number;
  name_pattern: string;
  account_type: 'credit' | 'transfer';
  account_pattern: null | string;
  note: null | string;
  is_active: boolean;
  created_time: string;
}

/** 套现商户 */
export interface CashOutMerchant {
  id: number;
  name: string;
  fee_rate: string;
  note: null | string;
  is_active: boolean;
  created_time: string;
  updated_time: null | string;
  accounts: MerchantAccount[];
  group_id: null | number;
  group_name: null | string;
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
  account_type: null | string;
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

// ==================== 商户分组类型定义 ====================

/** 商户分组 */
export interface MerchantGroup {
  id: number;
  name: string;
  note: null | string;
  is_active: boolean;
  created_time: string;
  updated_time: null | string;
  merchant_count: number;
}

/** 创建分组参数 */
export interface CreateMerchantGroupParam {
  name: string;
  note?: string;
}

/** 更新分组参数 */
export interface UpdateMerchantGroupParam {
  name?: string;
  note?: string;
  is_active?: boolean;
}

/** 设置商户分组参数 */
export interface SetMerchantGroupParam {
  group_id: null | number;
}

/** 按分组统计 */
export interface CashOutStatsByGroup {
  group_id: number;
  group_name: string;
  credit_amount: string;
  transfer_amount: string;
  fee: string;
  credit_tx_count: number;
  transfer_tx_count: number;
  merchant_count: number;
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
  return requestClient.delete<null>(`${BASE_URL}/merchants/${merchantId}`);
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
  return requestClient.delete<null>(`${BASE_URL}/accounts/${accountId}`);
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
  return requestClient.post<null>(
    `${BASE_URL}/transactions/${transactionId}/untag`,
  );
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

/** 获取按分组统计 */
export async function getCashOutStatsByGroupApi() {
  return requestClient.get<CashOutStatsByGroup[]>(`${BASE_URL}/stats/by-group`);
}

// ==================== 商户分组 API ====================

/** 获取分组列表 */
export async function getGroupsApi(params?: { is_active?: boolean }) {
  return requestClient.get<MerchantGroup[]>(`${BASE_URL}/groups`, { params });
}

/** 创建分组 */
export async function createGroupApi(data: CreateMerchantGroupParam) {
  return requestClient.post<MerchantGroup>(`${BASE_URL}/groups`, data);
}

/** 更新分组 */
export async function updateGroupApi(
  groupId: number,
  data: UpdateMerchantGroupParam,
) {
  return requestClient.put<MerchantGroup>(
    `${BASE_URL}/groups/${groupId}`,
    data,
  );
}

/** 删除分组 */
export async function deleteGroupApi(groupId: number) {
  return requestClient.delete<null>(`${BASE_URL}/groups/${groupId}`);
}

/** 分组详情（含关联商户） */
export interface MerchantGroupDetail extends MerchantGroup {
  merchants: Array<{
    id: number;
    name: string;
  }>;
}

/** 分组交易项 */
export interface GroupTransactionItem {
  id: number;
  transaction_time: string;
  merchant_raw: string;
  amount: string;
  card_bank: string;
  card_last4: string;
  direction: 'expense' | 'income';
  merchant_id: number;
  merchant_name: string;
}

/** 分组交易统计 */
export interface GroupTransactionSummary {
  income_count: number;
  income_amount: string;
  expense_count: number;
  expense_amount: string;
}

/** 分组交易列表响应 */
export interface GroupTransactionsResponse {
  transactions: GroupTransactionItem[];
  total: number;
  summary: GroupTransactionSummary;
}

/** 获取分组详情 */
export async function getGroupDetailApi(groupId: number) {
  return requestClient.get<MerchantGroupDetail>(
    `${BASE_URL}/groups/${groupId}`,
  );
}

/** 获取分组交易列表 */
export async function getGroupTransactionsApi(
  groupId: number,
  params?: {
    page?: number;
    size?: number;
    type?: 'credit' | 'income';
  },
) {
  return requestClient.get<GroupTransactionsResponse>(
    `${BASE_URL}/groups/${groupId}/transactions`,
    { params },
  );
}

/** 设置商户分组 */
export async function setMerchantGroupApi(
  merchantId: number,
  data: SetMerchantGroupParam,
) {
  return requestClient.put<CashOutMerchant>(
    `${BASE_URL}/merchants/${merchantId}/group`,
    data,
  );
}

// ==================== 扫描匹配 API ====================

/** 扫描交易项 */
export interface ScanTransactionItem {
  transaction_id: number;
  transaction_time: string;
  merchant_raw: string;
  amount: string;
  card_bank: string;
  card_last4: string;
  confidence: number;
  is_tagged: boolean;
}

/** 扫描统计汇总 */
export interface ScanSummary {
  credit_count: number;
  credit_amount: string;
  income_count: number;
  income_amount: string;
  tagged_count: number;
  untagged_count: number;
}

/** 扫描响应 */
export interface ScanTransactionsResponse {
  merchant_id: number;
  merchant_name: string;
  credit_transactions: ScanTransactionItem[];
  income_transactions: ScanTransactionItem[];
  summary: ScanSummary;
}

/** 批量标注参数 */
export interface BatchTagParam {
  transaction_ids: number[];
}

/** 批量标注响应 */
export interface BatchTagResponse {
  tagged_count: number;
  credit_count: number;
  income_count: number;
}

/** 扫描匹配交易 */
export async function scanTransactionsApi(merchantId: number) {
  return requestClient.get<ScanTransactionsResponse>(
    `${BASE_URL}/merchants/${merchantId}/scan`,
  );
}

/** 批量标注套现 */
export async function batchTagApi(merchantId: number, data: BatchTagParam) {
  return requestClient.post<BatchTagResponse>(
    `${BASE_URL}/merchants/${merchantId}/batch-tag`,
    data,
  );
}

// ==================== 交易搜索 API ====================

/** 搜索交易参数 */
export interface SearchTransactionsParam {
  keyword: string;
  sources?: string; // 默认 'wechat,alipay,bank'
  page?: number;
  size?: number;
}

/** 搜索交易结果项 */
export interface SearchTransactionItem {
  id: number;
  transaction_time: string;
  merchant_raw: string;
  amount: string;
  direction: 'expense' | 'income';
  source: 'alipay' | 'bank' | 'wechat';
  card_bank: string;
  card_last4: null | string;
  description?: string;
}

/** 搜索交易响应 */
export interface SearchTransactionsResponse {
  items: SearchTransactionItem[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

/** 搜索交易 */
export async function searchTransactionsApi(params: SearchTransactionsParam) {
  return requestClient.get<SearchTransactionsResponse>(
    '/api/v1/detective/transactions/search',
    { params },
  );
}

// ==================== 交易关联分组 API ====================

/** 关联分组参数 */
export interface LinkGroupParam {
  group_id: number;
}

/** 关联分组响应 */
export interface LinkGroupResponse {
  transaction_id: number;
  group_id: number;
  group_name: string;
  tx_category: string;
}

/** 将交易关联到分组 */
export async function linkTransactionToGroupApi(
  transactionId: number,
  data: LinkGroupParam,
) {
  return requestClient.post<LinkGroupResponse>(
    `${BASE_URL}/transactions/${transactionId}/link-group`,
    data,
  );
}

/** 批量关联分组参数 */
export interface BatchLinkGroupParam {
  group_id: number;
  transaction_ids: number[];
}

/** 批量关联分组响应 */
export interface BatchLinkGroupResponse {
  linked_count: number;
  group_id: number;
  group_name: string;
}

/** 批量将交易关联到分组 */
export async function batchLinkTransactionsToGroupApi(
  data: BatchLinkGroupParam,
) {
  return requestClient.post<BatchLinkGroupResponse>(
    `${BASE_URL}/batch-link-group`,
    data,
  );
}
