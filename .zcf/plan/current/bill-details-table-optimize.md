# 账单明细表格优化计划

## 任务概述

优化 `/detective/bill/details` 页面表格布局，解决以下痛点：

- A: 信息展示不够直观
- C: 来源区分不明显
- D: 匹配状态不够突出

## 目标文件

`apps/web-antd/src/plugins/detective/views/bill/details.vue`

## 执行步骤

### 1. 优化来源列展示

**当前**：仅显示来源文本（微信/支付宝/银行/信用卡）

**目标**：彩色圆点 + 来源名 + 卡号后四位/支付方式（双行）

```vue
<template v-if="column.key === 'source'">
  <div class="flex items-center gap-2">
    <span
      :class="getSourceDotClass(record.source)"
      class="h-2 w-2 rounded-full"
    />
    <div class="flex flex-col">
      <span>{{ getSourceLabel(record.source) }}</span>
      <span class="text-xs text-gray-400">
        {{ record.card_last4 || record.payment_method || '-' }}
      </span>
    </div>
  </div>
</template>
```

颜色映射：

- 微信: `bg-green-500`
- 支付宝: `bg-blue-500`
- 银行: `bg-emerald-500`
- 信用卡: `bg-purple-500`

### 2. 优化商户列展示

**当前**：仅显示 merchant_raw，ellipsis 截断

**目标**：商户名（主行）+ 描述/分类（次行灰色小字）

```vue
<template v-if="column.key === 'merchant_raw'">
  <div class="flex flex-col">
    <span class="truncate" :title="record.merchant_raw">
      {{ record.merchant_raw || '-' }}
    </span>
    <span
      v-if="record.description || record.category"
      class="truncate text-xs text-gray-400"
    >
      {{ record.description || record.category }}
    </span>
  </div>
</template>
```

### 3. 优化匹配状态列展示

**当前**：matched、confidence、match_status 分三列

**目标**：合并为一列，图标 + 置信度 + 状态标签

```vue
<template v-if="column.key === 'match_info'">
  <div class="flex items-center gap-1">
    <CheckCircleFilled v-if="record.matched" class="text-green-500" />
    <MinusCircleOutlined v-else class="text-gray-300" />
    <span v-if="record.confidence" class="text-xs">
      {{ (record.confidence * 100).toFixed(0) }}%
    </span>
    <Tag
      v-if="record.match_status"
      :color="getMatchStatusColor(record.match_status)"
      size="small"
    >
      {{ getMatchStatusLabel(record.match_status) }}
    </Tag>
  </div>
</template>
```

### 4. 精简时间列格式

**当前**：`2025-12-31 12:35:05`

**目标**：`12-31 12:35`

```typescript
const formatTime = (time: string) => {
  if (!time) return '-';
  return time.slice(5, 16); // MM-DD HH:mm
};
```

### 5. 更新列定义

删除 matched、confidence、match_status 三列，新增 match_info 合并列：

```typescript
const columns = [
  {
    title: '交易时间',
    dataIndex: 'transaction_time',
    key: 'transaction_time',
    width: 100,
  },
  { title: '来源', dataIndex: 'source', key: 'source', width: 120 },
  {
    title: '商户/描述',
    dataIndex: 'merchant_raw',
    key: 'merchant_raw',
    ellipsis: true,
  },
  {
    title: '金额',
    dataIndex: 'amount',
    key: 'amount',
    width: 100,
    align: 'right',
  },
  { title: '匹配状态', key: 'match_info', width: 140 },
  { title: '操作', key: 'action', width: 80, fixed: 'right' },
];
```

### 6. 添加辅助函数

```typescript
const getSourceDotClass = (source: string) => {
  const classes: Record<string, string> = {
    wechat: 'bg-green-500',
    alipay: 'bg-blue-500',
    bank: 'bg-emerald-500',
    credit_card: 'bg-purple-500',
  };
  return classes[source] || 'bg-gray-400';
};
```

## 预期效果

| 交易时间 | 来源 | 商户/描述 | 金额 | 匹配状态 | 操作 |
| --- | --- | --- | --- | --- | --- |
| 12-31 12:35 | 🟢 银行<br/>2022 | 宜宾市翠屏区棠湖学校<br/>消费 其他商家消费 | -¥15.00 | ✅ 95% 已确认 | 详情 |

## 风险评估

- 低风险：仅修改展示逻辑，不涉及数据处理
- 兼容性：使用 TailwindCSS 类，项目已支持
