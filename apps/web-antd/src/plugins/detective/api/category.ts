import { requestClient } from '#/api/request';

const CATEGORY_PREFIX = '/api/v1/detective/categories';

export enum CategoryType {
  Expense = 'expense',
  Income = 'income',
}

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  parent_id?: number;
  icon?: string;
  sort_order: number;
  is_archived: boolean;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryParams {
  name: string;
  type: CategoryType;
  parent_id?: number;
  icon?: string;
  sort_order?: number;
}

export interface UpdateCategoryParams extends Partial<CreateCategoryParams> {
  is_archived?: boolean;
}

export interface CategoryListParams {
  category_type?: CategoryType;
  is_archived?: boolean;
}

/** 获取分类列表 */
export function getCategoriesApi(params?: CategoryListParams) {
  return requestClient.get<Category[]>(CATEGORY_PREFIX, { params });
}

/** 获取分类树 */
export function getCategoryTreeApi() {
  return requestClient.get<Category[]>(`${CATEGORY_PREFIX}/tree`);
}

/** 获取分类详情 */
export function getCategoryApi(id: number) {
  return requestClient.get<Category>(`${CATEGORY_PREFIX}/${id}`);
}

/** 创建分类 */
export function createCategoryApi(data: CreateCategoryParams) {
  return requestClient.post<Category>(CATEGORY_PREFIX, data);
}

/** 更新分类 */
export function updateCategoryApi(id: number, data: UpdateCategoryParams) {
  return requestClient.put<Category>(`${CATEGORY_PREFIX}/${id}`, data);
}

/** 删除分类 */
export function deleteCategoryApi(id: number) {
  return requestClient.delete(`${CATEGORY_PREFIX}/${id}`);
}
