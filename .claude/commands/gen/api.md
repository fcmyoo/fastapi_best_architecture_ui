---
description: "生成 API 接口文件"
---

# API 接口生成

为 **$ARGUMENTS** 模块生成 API 接口文件。

## 生成位置

`apps/web-antd/src/api/{module}.ts`

## 生成模板

```typescript
import { requestClient } from '#/api/request';

// ============ 类型定义 ============

/** {Module} 信息 */
export interface {Module}Info {
  id: number;
  // TODO: 根据实际需求补充字段
}

/** {Module} 查询参数 */
export interface {Module}Query {
  page?: number;
  size?: number;
  // TODO: 根据实际需求补充查询条件
}

/** {Module} 创建/更新参数 */
export interface {Module}Form {
  // TODO: 根据实际需求补充字段
}

// ============ API 接口 ============

/** 获取 {module} 列表 */
export function get{Module}List(params: {Module}Query) {
  return requestClient.get<{Module}Info[]>('/api/v1/{path}', { params });
}

/** 获取 {module} 详情 */
export function get{Module}ById(id: number) {
  return requestClient.get<{Module}Info>(`/api/v1/{path}/${id}`);
}

/** 创建 {module} */
export function create{Module}(data: {Module}Form) {
  return requestClient.post<{Module}Info>('/api/v1/{path}', data);
}

/** 更新 {module} */
export function update{Module}(id: number, data: {Module}Form) {
  return requestClient.put<{Module}Info>(`/api/v1/{path}/${id}`, data);
}

/** 删除 {module} */
export function delete{Module}(id: number) {
  return requestClient.delete(`/api/v1/{path}/${id}`);
}
```

## 执行步骤

1. 解析模块名称，生成 PascalCase 和 camelCase 形式
2. 询问用户 API 路径（如 `/sys/users`）
3. 询问用户主要字段（可选，用于生成类型定义）
4. 生成 API 文件
5. 提示用户补充类型定义

## 命名规范

| 输入 | Module (PascalCase) | module (camelCase) | 文件名 |
|------|---------------------|-------------------|--------|
| 用户管理 | User | user | user.ts |
| 角色权限 | Role | role | role.ts |
| 数据字典 | Dict | dict | dict.ts |
