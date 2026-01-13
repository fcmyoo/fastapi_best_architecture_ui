# Detective 插件待办事项

> 基于 2025-01-07 后端 API 变更文档整理

## 待开发功能

- [ ] **Summary 报表页面改造** - 使用 ledger 接口替换旧接口

## 已完成

- [x] Stats 解析修复 (`runs.vue`)
- [x] 匹配解释银行卡信息展示 (`RunDetail.vue`)
- [x] `MatchExplain` 接口添加 `card_type` 字段
- [x] **手动匹配功能** (2025-01-12)
  - 新增 API: `POST /api/v1/detective/matches/manual`
  - 在 `unmatched.vue` 页面添加手动匹配入口
  - 弹窗选择配对交易（支付侧 + 扣款侧）
  - 错误处理：404/403 友好提示
- [x] **自动确认标识展示** (2025-01-12)
  - 在匹配列表区分"自动确认"/"手动确认"
  - 通过 `confirmed_by` 是否为 null 判断
  - 涉及文件：`RunDetail.vue`, `matches.vue`
- [x] **Stats 新增字段展示** (2025-01-12)
  - `auto_confirmed` (自动确认数)
  - `pending` (待审核数)
  - 涉及文件：`runs.vue`, `RunDetail.vue`
- [x] **模型字段补充** (2025-01-12)
  - `Transaction` 接口添加 `card_type?: string`
  - `ReconcileRun` 接口添加 `is_active?: boolean`
  - `MatchResult` 接口添加 `reject_reason`, `confirmed_by`, `confirmed_time`
  - `RunMatchItem` 接口添加 `confirmed_by`
- [x] **记账扩展功能** (2026-01-12)
  - 新增 `api/ledger.ts` - 账本统计 API 接口
  - 新增 `views/ledger/index.vue` - 记账统计页面（独立页面）
  - 新增路由 `/detective/ledger`
  - 新增数据库菜单 `DetectiveLedger` (ID: 93)
  - 支持月度统计、分类统计、账户统计、月度趋势
  - 空数据提示：引导用户先完成对账确认
