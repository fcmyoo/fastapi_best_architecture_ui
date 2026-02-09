/**
 * 公共 API 类型定义
 */

/** 分页查询参数 */
export interface PaginationParams {
  page?: number;
  size?: number;
}

/** 分页响应结构 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}
