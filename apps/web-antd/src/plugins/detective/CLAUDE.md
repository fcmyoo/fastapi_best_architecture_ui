# Detective 插件 (嘎嘎侦探)

> [返回主应用](../../CLAUDE.md) > plugins > detective

账单对账管理插件，支持微信/支付宝账单导入与对账，以及信用卡账单管理。

## 目录结构

```
detective/
├── api/                # API 接口
│   ├── index.ts        # API 导出入口
│   ├── bill.ts         # 普通账单管理
│   ├── cash-out.ts     # 套现管理
│   ├── credit-card.ts  # 信用卡账单管理
│   ├── ledger.ts       # 记账统计
│   ├── transaction.ts  # 交易管理
│   ├── reconcile.ts    # 对账管理
│   └── report.ts       # 报表
├── views/              # 页面
│   ├── dashboard/      # 仪表盘概览
│   ├── bill/           # 普通账单（微信/支付宝/银行卡）
│   ├── cash-out/       # 套现管理
│   ├── credit-card/    # 信用卡账单管理
│   ├── ledger/         # 记账统计
│   ├── transaction/    # 交易列表
│   ├── reconcile/      # 对账记录/匹配结果
│   └── report/         # 报表中心
├── langs/              # 国际化
│   ├── zh-CN/
│   └── en-US/
└── routes/             # 路由配置
```

## 架构说明

### 账单管理分离

普通账单和信用卡账单已分离为独立模块：

| 模块 | 路由 | 用途 | API |
| --- | --- | --- | --- |
| 普通账单 | `/detective/bill/list` | 微信/支付宝/银行卡流水，用于对账 | `/api/v1/detective/bills` |
| 信用卡 | `/detective/credit-card` | 信用卡邮件账单，用于还款管理 | `/api/v1/detective/email-bills` |

### 对账数据流

```
普通账单 ──导入──► Transaction 表 ◄──导入── 信用卡账单
                       │
                       ▼
                   对账匹配
              (payment_side ↔ debit_side)
```

## 核心 API

### 普通账单 (`/api/v1/detective/bills`)

| 接口                       | 方法 | 说明                    |
| -------------------------- | ---- | ----------------------- |
| `/bills`                   | GET  | 获取账单列表 (返回数组) |
| `/bills/{id}`              | GET  | 获取账单详情            |
| `/bills/upload`            | POST | 上传账单文件            |
| `/bills/{id}/parse`        | POST | 解析账单                |
| `/bills/{id}/status`       | GET  | 获取解析状态            |
| `/bills/{id}/transactions` | GET  | 获取账单交易明细        |

### 信用卡账单 (`/api/v1/detective/email-bills`)

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/email-bills` | GET | 获取信用卡账单列表 |
| `/email-bills/{id}` | GET | 获取账单详情 |
| `/email-bills/{id}/transactions` | GET | 获取交易明细 |
| `/email-bills/parse-eml` | POST | 解析 EML 邮件文件 |
| `/email-bills/fetch` | POST | 从邮箱自动收取账单 (参数: months=1-24) |
| `/email-bills/banks` | GET | 支持的银行列表 |

## 数据结构

### BillFile (普通账单)

```typescript
interface BillFile {
  id: number;
  type: 'upload';
  source: 'wechat' | 'alipay' | 'bank';
  filename: string;
  statement_month: string;
  status: 'pending' | 'processing' | 'parsed' | 'failed';
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  created_time: string;
}
```

### CreditCardBill (信用卡账单)

```typescript
interface CreditCardBill {
  id: number;
  bank_code: string;
  bank_name: string;
  statement_month: string;
  card_last4: string;
  bill_date: string;
  due_date: string;
  bill_amount: string;
  min_payment?: string;
  billing_cycle_start?: string;
  billing_cycle_end?: string;
  parsed_count: number;
  saved_count: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  paid_amount?: string;
  paid_date?: string;
  email_subject?: string;
  created_time: string;
}
```

## 页面功能

### 普通账单 (`/detective/bill/list`)

- 筛选：来源、状态
- 操作：解析、重新上传
- 点击行查看交易明细

### 信用卡管理 (`/detective/credit-card`)

- 展示：银行、账单周期、账单金额、还款状态、交易数
- 操作：从邮箱收取（支持选择 3/6/12/24 个月）、导入 EML 文件
- 点击行查看交易明细

## 注意事项

1. 上传接口的 `source` 是 Query 参数，不是 FormData
2. 普通账单列表接口返回数组，不是分页结构
3. 信用卡账单的 `parsed_count` 和 `saved_count` 可能不同（去重）

## 套现管理模块

### API (`/api/v1/detective/cash-out`)

| 接口                        | 方法           | 说明         |
| --------------------------- | -------------- | ------------ |
| `/merchants`                | GET            | 获取商户列表 |
| `/merchants/{id}`           | GET/PUT/DELETE | 商户 CRUD    |
| `/merchants/{id}/accounts`  | GET/POST       | 商户账户管理 |
| `/merchants/{id}/scan`      | GET            | 扫描匹配交易 |
| `/merchants/{id}/batch-tag` | POST           | 批量标注套现 |
| `/transactions/{id}/tag`    | POST           | 标注为套现   |
| `/transactions/{id}/untag`  | POST           | 取消标注     |

### 扫描匹配响应结构

```typescript
interface ScanTransactionsResponse {
  merchant_id: number;
  merchant_name: string;
  credit_transactions: ScanTransactionItem[]; // 套现刷卡（信用卡支出）
  income_transactions: ScanTransactionItem[]; // 套现回款（储蓄卡收入）
  summary: {
    credit_count: number;
    credit_amount: string;
    income_count: number;
    income_amount: string;
    tagged_count: number;
    untagged_count: number;
  };
}

interface ScanTransactionItem {
  transaction_id: number;
  transaction_time: string;
  merchant_raw: string;
  amount: string;
  card_bank: string;
  card_last4: string;
  confidence: number; // 100=精确匹配, 90=包含匹配
  is_tagged: boolean;
}
```

### 业务分组说明

| 分组 | 条件 | 业务含义 |
| --- | --- | --- |
| `credit_transactions` | source=credit_card & direction=expense | 信用卡刷卡消费 |
| `income_transactions` | source=bank & direction=income | 储蓄卡收入回款 |
