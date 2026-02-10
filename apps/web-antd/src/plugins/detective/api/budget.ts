import { requestClient } from '#/api/request';

const BUDGET_PREFIX = '/api/v1/detective/budgets';

export enum BudgetType {
  Custom = 'custom',
  Monthly = 'monthly',
  Yearly = 'yearly',
}

export interface Budget {
  id: number;
  name: string;
  type: BudgetType;
  amount: number;
  period: string; // YYYY-MM for monthly, YYYY for yearly
  category_id?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  used_amount: number; // calculated field usually
  created_at: string;
  updated_at: string;
}

export interface CreateBudgetParams {
  name: string;
  type: BudgetType;
  amount: number;
  period?: string;
  category_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateBudgetParams extends Partial<CreateBudgetParams> {
  is_active?: boolean;
}

export interface BudgetListParams {
  is_active?: boolean;
}

/** 获取预算列表 */
export function getBudgetsApi(params?: BudgetListParams) {
  return requestClient.get<Budget[]>(BUDGET_PREFIX, { params });
}

/** 获取预算详情 */
export function getBudgetApi(id: number) {
  return requestClient.get<Budget>(`${BUDGET_PREFIX}/${id}`);
}

/** 创建预算 */
export function createBudgetApi(data: CreateBudgetParams) {
  return requestClient.post<Budget>(BUDGET_PREFIX, data);
}

/** 更新预算 */
export function updateBudgetApi(id: number, data: UpdateBudgetParams) {
  return requestClient.put<Budget>(`${BUDGET_PREFIX}/${id}`, data);
}

/** 删除预算 */
export function deleteBudgetApi(id: number) {
  return requestClient.delete(`${BUDGET_PREFIX}/${id}`);
}
