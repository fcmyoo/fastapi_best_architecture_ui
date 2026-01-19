# 项目任务分解规划

## 已明确的决策

- 使用现有的套现管理模块架构，在其基础上扩展分组功能
- 分组管理作为独立页面，路由为 `/detective/cash-out/groups`
- 商户与分组为多对一关系（一个商户只能属于一个分组）
- 统计页面使用 Tab 切换方式展示"按商户统计"和"按分组统计"
- 复用现有的 API 请求封装和国际化方案
- 遵循项目现有的代码风格和组件使用规范（Ant Design Vue）

## 整体规划概述

### 项目目标

为套现管理模块新增商户分组功能，支持多个商户共用一个回款人的业务场景。用户可以创建分组（代表回款人），将多个商户关联到同一分组，实现按回款人维度的统计分析。

### 技术栈

- Vue 3.5+ + TypeScript 5.8+
- Ant Design Vue 4.x（Table、Modal、Form、Select、Tabs 等组件）
- Pinia 状态管理（如需要）
- Vue I18n 国际化

### 主要阶段

1. **API 层开发**：新增分组相关的类型定义和 API 接口封装
2. **分组管理页面**：创建独立的分组管理页面，支持 CRUD 操作
3. **商户管理改造**：在商户列表和编辑表单中集成分组选择功能
4. **统计页面改造**：新增"按分组统计" Tab 页，展示分组维度的统计数据

---

## 详细任务分解

### 阶段 1：API 层开发

#### 任务 1.1：新增分组相关类型定义

- **目标**：定义商户分组相关的 TypeScript 接口
- **输入**：后端 API 文档中的类型定义
- **输出**：完整的类型定义，包括 `MerchantGroup`、`CreateMerchantGroupParam`、`UpdateMerchantGroupParam`、`SetMerchantGroupParam`、`CashOutStatsByGroup`
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\api\cash-out.ts`
- **预估工作量**：15 分钟

#### 任务 1.2：新增分组管理 API 函数

- **目标**：封装分组 CRUD 的 API 请求函数
- **输入**：后端 API 端点定义
- **输出**：
  - `getGroupsApi()` - 获取分组列表
  - `createGroupApi(data)` - 创建分组
  - `updateGroupApi(groupId, data)` - 更新分组
  - `deleteGroupApi(groupId)` - 删除分组
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\api\cash-out.ts`
- **预估工作量**：15 分钟

#### 任务 1.3：新增商户分组关联 API

- **目标**：封装设置商户分组的 API 请求函数
- **输入**：后端 API 端点 `PUT /merchants/{merchant_id}/group`
- **输出**：`setMerchantGroupApi(merchantId, data)` 函数
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\api\cash-out.ts`
- **预估工作量**：10 分钟

#### 任务 1.4：新增按分组统计 API

- **目标**：封装按分组统计的 API 请求函数
- **输入**：后端 API 端点 `GET /stats/by-group`
- **输出**：`getCashOutStatsByGroupApi()` 函数
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\api\cash-out.ts`
- **预估工作量**：10 分钟

---

### 阶段 2：分组管理页面

#### 任务 2.1：创建分组管理页面组件

- **目标**：创建分组管理的主页面，包含分组列表表格
- **输入**：分组 API、UI 设计规范
- **输出**：分组列表页面，支持：
  - 表格展示：分组名称、商户数、备注、状态、创建时间、操作列
  - 新增分组按钮
  - 编辑/删除操作
  - 状态切换开关
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\views\cash-out\groups\index.vue`（新建）
- **UI 设计要点**：
  - 页面布局参考现有 `cash-out/index.vue` 的商户列表部分
  - 使用 `Page` 组件作为容器
  - 表格使用 `Table` 组件，列配置包含：分组名称（可点击查看详情）、商户数（数字徽章）、备注、状态（Switch）、创建时间、操作（编辑/删除）
  - 空状态使用图标 + 文字 + 添加按钮的组合
- **预估工作量**：45 分钟

#### 任务 2.2：创建分组表单弹窗组件

- **目标**：创建分组新增/编辑的弹窗表单
- **输入**：分组数据结构
- **输出**：可复用的分组表单弹窗，支持新增和编辑模式
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\views\cash-out\groups\GroupFormModal.vue`（新建）
- **UI 设计要点**：
  - 使用 `Modal` + `Form` 组件
  - 表单字段：分组名称（必填，Input）、备注（可选，TextArea）
  - 编辑模式额外显示状态开关
  - 表单验证：名称必填
- **预估工作量**：30 分钟

#### 任务 2.3：配置分组管理路由

- **目标**：在路由配置中添加分组管理页面
- **输入**：路由配置文件
- **输出**：新增 `/detective/cash-out/groups` 路由
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\routes\index.ts`
- **预估工作量**：10 分钟

#### 任务 2.4：添加分组管理国际化文案

- **目标**：添加分组管理相关的中英文翻译
- **输入**：功能需求
- **输出**：完整的国际化文案
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\langs\zh-CN\detective.json`
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\langs\en-US\detective.json`
- **预估工作量**：15 分钟

---

### 阶段 3：商户管理改造

#### 任务 3.1：商户列表表格新增"所属分组"列

- **目标**：在商户列表表格中显示商户所属的分组
- **输入**：商户数据（需后端返回 `group_id` 和 `group_name` 字段）
- **输出**：商户表格新增"所属分组"列，显示分组名称或"未分组"
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\views\cash-out\index.vue`
- **UI 设计要点**：
  - 在"商户名称"列后添加"所属分组"列
  - 有分组时显示分组名称（可点击跳转到分组详情）
  - 无分组时显示灰色"未分组"文字
- **预估工作量**：20 分钟

#### 任务 3.2：商户编辑表单新增分组选择

- **目标**：在商户新增/编辑弹窗中添加分组选择下拉框
- **输入**：分组列表 API
- **输出**：商户表单新增分组选择字段
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\views\cash-out\index.vue`
- **UI 设计要点**：
  - 在"手续费率"字段后添加"所属分组"下拉框
  - 使用 `Select` 组件，支持搜索和清空
  - 选项来源于分组列表 API
  - 可选字段，允许不选择分组
- **预估工作量**：30 分钟

#### 任务 3.3：更新商户类型定义

- **目标**：扩展商户类型定义，添加分组相关字段
- **输入**：后端返回的商户数据结构
- **输出**：`CashOutMerchant` 接口新增 `group_id` 和 `group_name` 字段
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\api\cash-out.ts`
- **预估工作量**：5 分钟

---

### 阶段 4：统计页面改造

#### 任务 4.1：重构统计区域为 Tab 布局

- **目标**：将现有统计概览改造为 Tab 切换布局
- **输入**：现有统计卡片组件
- **输出**：
  - Tab 1：汇总统计（现有内容）
  - Tab 2：按商户统计（现有内容移入）
  - Tab 3：按分组统计（新增）
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\views\cash-out\index.vue`
- **UI 设计要点**：
  - 使用 `Tabs` 组件包裹统计区域
  - 保持现有统计卡片样式不变
  - Tab 切换时懒加载对应数据
- **预估工作量**：30 分钟

#### 任务 4.2：创建按分组统计表格

- **目标**：在"按分组统计" Tab 中展示分组维度的统计数据
- **输入**：按分组统计 API
- **输出**：分组统计表格，列包含：分组名称、商户数、刷卡金额、刷卡笔数、回款金额、回款笔数、手续费、手续费率
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\views\cash-out\index.vue`
- **UI 设计要点**：
  - 表格样式与现有商户统计表格保持一致
  - 金额列使用红/绿色区分刷卡/回款
  - 手续费率列显示百分比格式
  - 支持点击分组名称查看该分组下的商户列表
- **预估工作量**：40 分钟

#### 任务 4.3：添加统计相关国际化文案

- **目标**：添加按分组统计相关的翻译文案
- **输入**：功能需求
- **输出**：统计 Tab 和表格列的国际化文案
- **涉及文件**：
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\langs\zh-CN\detective.json`
  - `E:\code\GitHub\fastapi_best_architecture_ui\apps\web-antd\src\plugins\detective\langs\en-US\detective.json`
- **预估工作量**：10 分钟

---

## 已确认的决策（2026-01-15 更新）

### 问题 1：商户分组关联的交互方式
**已确认**：✅ 方案 A - 在商户编辑弹窗中选择分组

### 问题 2：分组详情页面是否需要
**已确认**：✅ 方案 A - 不需要独立详情页，使用筛选方式

### 问题 3：后端 API 就绪状态
**已确认**：✅ 后端 API 已全部完成，可直接调用

---

## 执行状态

| 阶段 | 状态 | 备注 |
|------|------|------|
| 阶段 1：API 层开发 | ⏳ 待执行 | |
| 阶段 2：分组管理页面 | ⏳ 待执行 | |
| 阶段 3：商户管理改造 | ⏳ 待执行 | |
| 阶段 4：统计页面改造 | ⏳ 待执行 | |
