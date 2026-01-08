# Detective 插件 (嘎嘎侦探)

> [返回主应用](../../CLAUDE.md) > plugins > detective

账单对账管理插件，支持微信/支付宝/信用卡账单导入与对账。

## 目录结构

```
detective/
├── api/              # API 接口
│   ├── bill.ts       # 账单管理
│   ├── transaction.ts # 交易管理
│   ├── reconcile.ts  # 对账管理
│   └── report.ts     # 报表
├── views/            # 页面
│   ├── bill/         # 账单列表/明细
│   ├── transaction/  # 交易列表
│   ├── reconcile/    # 对账记录/匹配结果
│   └── report/       # 报表中心
├── langs/            # 国际化
│   ├── zh-CN/
│   └── en-US/
└── routes/           # 路由配置
```

## 核心 API

### 账单管理 (`/api/v1/detective/bills`)

| 接口                 | 方法 | 说明                            |
| -------------------- | ---- | ------------------------------- |
| `/bills`             | GET  | 获取账单列表 (返回数组，非分页) |
| `/bills/{id}`        | GET  | 获取账单详情                    |
| `/bills/upload`      | POST | 上传账单文件                    |
| `/bills/{id}/parse`  | POST | 解析账单                        |
| `/bills/{id}/status` | GET  | 获取解析状态                    |

### 上传接口参数

```typescript
// POST /api/v1/detective/bills/upload
// Content-Type: multipart/form-data

// Query 参数 (不是 form-data!)
{
  source: 'wechat' | 'alipay' | 'credit_card',  // 必填
  password?: string,      // ZIP 解压密码
  force_reparse?: boolean // 重新解析已存在的文件
}

// Body (FormData)
{
  file: File  // 账单文件
}
```

### 邮件账单 (`/api/v1/detective/email-bills`)

| 接口                      | 方法 | 说明              |
| ------------------------- | ---- | ----------------- |
| `/email-bills/banks`      | GET  | 支持的银行列表    |
| `/email-bills/parse-eml`  | POST | 解析 EML 邮件文件 |
| `/email-bills/parse-html` | POST | 解析 HTML 内容    |

## 数据结构

### BillFile (账单文件)

```typescript
interface BillFile {
  id: number;
  type: 'upload' | 'email'; // 类型：手动上传/邮件导入
  source: string; // 来源：wechat/alipay/credit_card
  filename: string;
  statement_month: string; // 账期
  status: string; // pending/processing/parsed/failed
  total_rows: number; // 总行数
  success_rows: number; // 成功行数
  failed_rows: number; // 失败行数
  created_time: string;
  // 信用卡账单特有
  bank_code?: string;
  bank_name?: string;
  card_last4?: string;
  bill_amount?: string;
  due_date?: string;
  email_subject?: string;
}
```

## 页面功能

### 账单列表 (`/detective/bills/list`)

- 筛选：类型、来源、状态
- 操作：
  - 解析 (status=pending 时显示)
  - 重新上传 (type=upload 时显示，调用 upload?force_reparse=true)
  - 重新导入 (type=email 时显示，调用 parse-eml)

## 注意事项

1. 上传接口的 `source` 是 Query 参数，不是 FormData
2. 账单列表接口返回数组，不是分页结构
3. 状态包含 `parsed` (已解析)，不只是 success
