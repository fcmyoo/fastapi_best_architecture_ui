import { requestClient } from '#/api/request';

const RECURRING_PREFIX = '/api/v1/detective/recurring';

export enum RecurringType {
  Expense = 'expense',
  Income = 'income',
  Transfer = 'transfer',
}

export enum FrequencyType {
  Daily = 'daily',
  Monthly = 'monthly',
  Weekly = 'weekly',
  Yearly = 'yearly',
}

export interface RecurringTransaction {
  id: number;
  name: string;
  type: RecurringType;
  amount: number;
  frequency: FrequencyType;
  interval: number; // e.g., every 2 months
  start_date: string;
  end_date?: string;
  next_run_date: string;
  account_id?: number;
  category_id?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRecurringParams {
  name: string;
  type: RecurringType;
  amount: number;
  frequency: FrequencyType;
  interval?: number;
  start_date: string;
  end_date?: string;
  account_id?: number;
  category_id?: number;
  description?: string;
}

export interface UpdateRecurringParams extends Partial<CreateRecurringParams> {
  is_active?: boolean;
}

export interface RecurringListParams {
  is_active?: boolean;
}

/** 获取周期交易列表 */
export function getRecurringTransactionsApi(params?: RecurringListParams) {
  return requestClient.get<RecurringTransaction[]>(RECURRING_PREFIX, {
    params,
  });
}

/** 获取周期交易详情 */
export function getRecurringTransactionApi(id: number) {
  return requestClient.get<RecurringTransaction>(`${RECURRING_PREFIX}/${id}`);
}

/** 创建周期交易 */
export function createRecurringTransactionApi(data: CreateRecurringParams) {
  return requestClient.post<RecurringTransaction>(RECURRING_PREFIX, data);
}

/** 更新周期交易 */
export function updateRecurringTransactionApi(
  id: number,
  data: UpdateRecurringParams,
) {
  return requestClient.put<RecurringTransaction>(
    `${RECURRING_PREFIX}/${id}`,
    data,
  );
}

/** 删除周期交易 */
export function deleteRecurringTransactionApi(id: number) {
  return requestClient.delete(`${RECURRING_PREFIX}/${id}`);
}
