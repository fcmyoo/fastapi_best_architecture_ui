import { requestClient } from '#/api/request';

const ACCOUNT_PREFIX = '/api/v1/detective/accounts';

export enum AccountType {
  Alipay = 'alipay',
  Cash = 'cash',
  CreditCard = 'credit_card',
  DebitCard = 'debit_card',
  Other = 'other',
  Wechat = 'wechat',
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  credit_limit?: number;
  description?: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountParams {
  name: string;
  type: AccountType;
  balance: number;
  credit_limit?: number;
  description?: string;
}

export interface UpdateAccountParams extends Partial<CreateAccountParams> {
  is_archived?: boolean;
}

export interface AccountListParams {
  account_type?: AccountType;
  is_archived?: boolean;
}

/** 获取账户列表 */
export function getAccountsApi(params?: AccountListParams) {
  return requestClient.get<Account[]>(ACCOUNT_PREFIX, { params });
}

/** 获取账户详情 */
export function getAccountApi(id: number) {
  return requestClient.get<Account>(`${ACCOUNT_PREFIX}/${id}`);
}

/** 创建账户 */
export function createAccountApi(data: CreateAccountParams) {
  return requestClient.post<Account>(ACCOUNT_PREFIX, data);
}

/** 更新账户 */
export function updateAccountApi(id: number, data: UpdateAccountParams) {
  return requestClient.put<Account>(`${ACCOUNT_PREFIX}/${id}`, data);
}

/** 删除账户 */
export function deleteAccountApi(id: number) {
  return requestClient.delete(`${ACCOUNT_PREFIX}/${id}`);
}
