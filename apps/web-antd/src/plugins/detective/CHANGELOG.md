# Detective 插件 Changelog

## P0 - 关键修复 (2026-02-09)

### P0-1: 修复定时器内存泄漏

- `bill/index.vue`: 保存 `pollParseStatus` 的 `setTimeout` 引用，`onUnmounted` 时清理
- `credit-card/index.vue`: 保存 `handleFetchFromEmail` 的 `setTimeout` 引用，`onUnmounted` 时清理

### P0-2: 统一金额类型定义

- 创建 `utils/format.ts`：提供 `parseAmount`、`formatAmount`、`formatDate`、`formatDateTime` 工具函数
- 修复 `cash-out.ts` 中 `ScanTransactionItem.amount` 的 `number | string` 联合类型为 `string`

### P0-3: 修复 URL 拼接问题

- `credit-card.ts`: `getCardBillsApi` 中 `cardLast4 || 'null'` 提取为语义化变量 `last4Segment`，添加注释说明

### P0-4: 消除 any 类型

- `dashboard/index.vue`: `ref<any>(null)` → `ref<SystemStats | null>(null)`
- `reconcile.ts`: `stats?: Record<string, any>` → 定义 `ReconcileRunStats` 接口
- `reconcile/matches.vue`: `ref<any>(null)` → `ref<MatchExplain | null>(null)`
- 6 个文件: `handleTableChange(pag: any)` → `(pag: { current?: number; pageSize?: number })`
- 3 个文件: `catch (error: any)` → `catch (error: unknown)` + 类型守卫
- `credit-card/index.vue`: `handleEmailImport(options: any)` → `(options: { file: File })`

- `ScanMatchModal.vue`: 模板 `(e: any)` → `(e: Event)` + `HTMLInputElement` 断言
- `unmatched.vue`: `onChange(_: any, ...)` → `(_: (number | string)[], ...)`

### P0-5: 补充 API 返回类型

- `reconcile.ts`: `confirmMatchApi`/`rejectMatchApi` 补充 `<MatchResult>` 泛型
- `reconcile.ts`: `batchConfirmMatchesApi`/`batchRejectMatchesApi` 补充 `<{ updated_count: number }>` 泛型
- `bill.ts`: `parseBillApi` 补充 `<BillStatusResult>`，`deleteBillApi` 补充 `<void>`
- `cash-out.ts`: 3 个 delete 函数和 `untagCashOutApi` 补充 `<void>` 泛型
- `credit-card.ts`: 2 个 delete 函数补充 `<void>` 泛型

## P1 - 短期优化 (2026-02-09)

### P1-1: 抽取公共工具函数

- 扩展 `utils/format.ts`：新增 `formatDirectionalAmount` 带方向金额格式化
- 扩展 `utils/source.ts`：新增 `getSourceIcon`、`getSourceColorClass`、`getSourceBorderClass`、更新 `getSourceDisplayName` 签名
- 9 个文件删除本地 `formatAmount` 重复定义，改为导入公共函数
- 3 个 bill 子组件删除本地 `getSourceIcon`/`getSourceName`/`getSourceColorClass` 重复定义

### P1-2: ECharts 按需导入

- 创建 `utils/echarts.ts`：按需导入 BarChart/LineChart/PieChart + 必要组件，预计减少 600KB+ 打包体积
- `dashboard/index.vue`、`report/summary.vue`、`ledger/index.vue` 删除 `import * as echarts from 'echarts'`

### P1-3: 抽取 useECharts composable

- 创建 `composables/useECharts.ts`：封装 init/setOption/resize/dispose 逻辑
- 3 个图表页面重构为使用 `useECharts`，删除手动的 resize 监听和 dispose 清理

### P1-4: columns 改为 computed

- 8 个文件的 `columns` 数组改为 `computed(() => [...])`
- 17 个 `xxxOptions` 数组改为 `computed`
- 确保语言切换时表格列标题和筛选选项正确更新

### P1-5: 图表渲染加 nextTick

- `dashboard/index.vue`、`report/summary.vue`、`ledger/index.vue` 在数据更新后 `await nextTick()` 再渲染图表

## P2 - 中期重构 (2026-02-09)

### P2-1: i18n 全面覆盖

- `transactions.vue`: 表格列、状态标签、操作按钮文案 i18n 化
- `CoreAmountCard.vue`: 金额卡片标题、趋势描述 i18n 化（新增 20+ key）

### P2-2: 组件逻辑优化

- `CoreAmountCard.vue`: 7 个 `getThemeXxx` 函数合并为单一 `theme` computed 对象，提升代码可读性

### P2-3: API 类型优化

- 创建 `api/types.ts`: 抽取 `PaginationParams` 公共接口
- 9 个 API interface (`BillListParams`, `TransactionListParams` 等) 改为 `extends PaginationParams`
- `credit-card.ts`: 旧版 API 添加 `@deprecated` 标注

## P3 - 长期规划 (2026-02-09)

### P3-1: 组件拆分重构

- `ManualMatchModal.vue` (844行) 拆分为 4 个子组件：
  - `MatchForm.vue`: 左侧交易详情面板
  - `CandidateList.vue`: 右侧匹配候选列表（含筛选逻辑）
  - `MatchPreview.vue`: 底部匹配预览与操作栏
  - `ScoreDetail.vue`: 候选卡片内的评分详情条
- 优化了组件间的数据流向，状态管理更清晰

### P3-2: 日期参数统一

- `ledger.ts`: 所有统计 API (`getLedgerMonthlyStatsApi` 等) 参数由 `{ year, month }` 统一为 `{ statement_month: string }`
- 更新 `ledger/index.vue` 和 `report/summary.vue` 中的调用方式

### P3-3: 旧版 API 迁移与清理

- `credit-card.ts`: 删除已废弃的旧版 API (`getCreditCardBillListApi`, `getCreditCardTransactionsApi` 等)
- 保留 `CreditCardBill` 接口用于 `parseEmailBillApi` 兼容
