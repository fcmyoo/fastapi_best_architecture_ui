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
