# Detective 插件待办事项

> 基于 2025-01-07 后端 API 变更文档整理

## 待开发功能

### 高优先级

- [ ] **手动匹配功能**
  - 新增 API: `POST /api/v1/detective/matches/manual`
  - 在 `unmatched.vue` 页面添加手动匹配入口
  - 弹窗选择配对交易（支付侧 + 扣款侧）
  - 错误处理：404/403 友好提示

### 中优先级

- [ ] **自动确认标识展示**
  - 在匹配列表区分"自动确认"/"手动确认"
  - 可通过 `confirmed_by` 是否为 null 判断
  - 涉及文件：`RunDetail.vue`, `matches.vue`

- [ ] **Stats 新增字段展示**
  - `auto_confirmed` (自动确认数)
  - `pending` (待审核数)
  - 涉及文件：`runs.vue`, `RunDetail.vue`

### 低优先级

- [ ] **模型字段补充**
  - `Transaction` 接口添加 `card_type?: string`
  - `ReconcileRun` 接口添加 `is_active?: boolean`
  - `MatchResult` 接口添加 `reject_reason`, `confirmed_by`, `confirmed_time`

## 已完成

- [x] Stats 解析修复 (`runs.vue`)
- [x] 匹配解释银行卡信息展示 (`RunDetail.vue`)
- [x] `MatchExplain` 接口添加 `card_type` 字段
