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
