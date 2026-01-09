<script setup lang="ts">
import type {
  BillDetailItem,
  BillDetailListParams,
} from '#/plugins/detective/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ReloadOutlined, SearchOutlined } from '@ant-design/icons-vue';
import {
  Button,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import { getBillDetailListApi } from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveBillDetails' });

const loading = ref(false);
const dataSource = ref<BillDetailItem[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const searchParams = reactive<
  Omit<BillDetailListParams, 'matched'> & { matched?: string }
>({
  statement_month: undefined,
  source: undefined,
  source_type: undefined,
  direction: undefined,
  matched: undefined,
  match_status: undefined,
  min_amount: undefined,
  max_amount: undefined,
  keyword: undefined,
  min_confidence: undefined,
  max_confidence: undefined,
});

const detailVisible = ref(false);
const currentDetail = ref<BillDetailItem | null>(null);

const sourceOptions = [
  { label: $t('detective.bill.sourceOptions.wechat'), value: 'wechat' },
  { label: $t('detective.bill.sourceOptions.alipay'), value: 'alipay' },
  { label: $t('detective.bill.sourceOptions.bank'), value: 'bank' },
  {
    label: $t('detective.bill.sourceOptions.credit_card'),
    value: 'credit_card',
  },
];

const sourceTypeOptions = [
  {
    label: $t('detective.bill.sourceTypeOptions.payment_side'),
    value: 'payment_side',
  },
  {
    label: $t('detective.bill.sourceTypeOptions.debit_side'),
    value: 'debit_side',
  },
];

const directionOptions = [
  {
    label: $t('detective.transaction.directionOptions.expense'),
    value: 'expense',
  },
  {
    label: $t('detective.transaction.directionOptions.income'),
    value: 'income',
  },
];

const matchedOptions = [
  { label: $t('detective.transaction.matchedOptions.true'), value: 'true' },
  { label: $t('detective.transaction.matchedOptions.false'), value: 'false' },
];

const matchStatusOptions = [
  { label: $t('detective.bill.matchStatusOptions.pending'), value: 'pending' },
  {
    label: $t('detective.bill.matchStatusOptions.confirmed'),
    value: 'confirmed',
  },
  {
    label: $t('detective.bill.matchStatusOptions.rejected'),
    value: 'rejected',
  },
];

const columns = [
  {
    title: $t('detective.transaction.transactionTime'),
    dataIndex: 'transaction_time',
    key: 'transaction_time',
    width: 180,
  },
  {
    title: $t('detective.transaction.source'),
    dataIndex: 'source',
    key: 'source',
    width: 100,
  },
  {
    title: $t('detective.transaction.direction'),
    dataIndex: 'direction',
    key: 'direction',
    width: 80,
  },
  {
    title: $t('detective.transaction.amount'),
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    align: 'right' as const,
  },
  {
    title: $t('detective.transaction.merchant'),
    dataIndex: 'merchant_raw',
    key: 'merchant_raw',
    ellipsis: true,
  },
  {
    title: $t('detective.transaction.matched'),
    dataIndex: 'matched',
    key: 'matched',
    width: 100,
  },
  {
    title: $t('detective.reconcile.confidence'),
    dataIndex: 'confidence',
    key: 'confidence',
    width: 100,
  },
  {
    title: $t('detective.reconcile.matchStatus'),
    dataIndex: 'match_status',
    key: 'match_status',
    width: 100,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 100,
    fixed: 'right' as const,
  },
];

const getDirectionColor = (direction: string) => {
  return direction === 'expense' ? 'red' : 'green';
};

const formatAmount = (amount: number | string, direction: string) => {
  const prefix = direction === 'expense' ? '-' : '+';
  return `${prefix}¥${Number(amount).toFixed(2)}`;
};

const getMatchStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    pending: 'orange',
    confirmed: 'green',
    rejected: 'red',
  };
  return colors[status || ''] || 'default';
};

const fetchData = async () => {
  loading.value = true;
  try {
    let matchedValue: boolean | undefined;
    if (searchParams.matched === 'true') {
      matchedValue = true;
    } else if (searchParams.matched === 'false') {
      matchedValue = false;
    }
    const params = {
      ...searchParams,
      matched: matchedValue,
      page: pagination.current,
      size: pagination.pageSize,
    };
    const res = await getBillDetailListApi(params);
    dataSource.value = res.items || [];
    pagination.total = res.total || 0;
  } finally {
    loading.value = false;
  }
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
};

const handleSearch = () => {
  pagination.current = 1;
  fetchData();
};

const handleReset = () => {
  Object.assign(searchParams, {
    statement_month: undefined,
    source: undefined,
    source_type: undefined,
    direction: undefined,
    matched: undefined,
    match_status: undefined,
    min_amount: undefined,
    max_amount: undefined,
    keyword: undefined,
    min_confidence: undefined,
    max_confidence: undefined,
  });
  pagination.current = 1;
  fetchData();
};

const handleViewDetail = (record: BillDetailItem) => {
  currentDetail.value = record;
  detailVisible.value = true;
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.bill.details')">
    <div class="mb-4">
      <Space wrap>
        <Input
          v-model:value="searchParams.keyword"
          :placeholder="$t('detective.transaction.merchant')"
          style="width: 200px"
          allow-clear
        >
          <template #prefix><SearchOutlined /></template>
        </Input>
        <DatePicker
          v-model:value="searchParams.statement_month"
          picker="month"
          :placeholder="$t('detective.transaction.statementMonth')"
          format="YYYY-MM"
          value-format="YYYY-MM"
        />
        <Select
          v-model:value="searchParams.source"
          :placeholder="$t('detective.transaction.source')"
          :options="sourceOptions"
          allow-clear
          style="width: 120px"
        />
        <Select
          v-model:value="searchParams.source_type"
          :placeholder="$t('detective.bill.sourceTypeOptions.payment_side')"
          :options="sourceTypeOptions"
          allow-clear
          style="width: 120px"
        />
        <Select
          v-model:value="searchParams.direction"
          :placeholder="$t('detective.transaction.direction')"
          :options="directionOptions"
          allow-clear
          style="width: 100px"
        />
        <Select
          v-model:value="searchParams.matched"
          :placeholder="$t('detective.transaction.matched')"
          :options="matchedOptions"
          allow-clear
          style="width: 120px"
        />
        <Select
          v-model:value="searchParams.match_status"
          :placeholder="$t('detective.reconcile.matchStatus')"
          :options="matchStatusOptions"
          allow-clear
          style="width: 120px"
        />
        <InputNumber
          v-model:value="searchParams.min_amount"
          placeholder="最小金额"
          :min="0"
          style="width: 120px"
        />
        <InputNumber
          v-model:value="searchParams.max_amount"
          placeholder="最大金额"
          :min="0"
          style="width: 120px"
        />
        <Button type="primary" @click="handleSearch">
          {{ $t('common.search') }}
        </Button>
        <Button @click="handleReset">
          {{ $t('common.reset') }}
        </Button>
        <Button @click="fetchData">
          <template #icon><ReloadOutlined /></template>
        </Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 1300 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'source'">
          {{
            sourceOptions.find((o) => o.value === record.source)?.label ||
            record.source
          }}
        </template>
        <template v-if="column.key === 'direction'">
          <Tag :color="getDirectionColor(record.direction)">
            {{
              directionOptions.find((o) => o.value === record.direction)
                ?.label || record.direction
            }}
          </Tag>
        </template>
        <template v-if="column.key === 'amount'">
          <span
            :class="
              record.direction === 'expense' ? 'text-red-500' : 'text-green-500'
            "
          >
            {{ formatAmount(record.amount, record.direction) }}
          </span>
        </template>
        <template v-if="column.key === 'matched'">
          <Tag :color="record.matched ? 'success' : 'default'">
            {{
              record.matched
                ? $t('detective.transaction.matchedOptions.true')
                : $t('detective.transaction.matchedOptions.false')
            }}
          </Tag>
        </template>
        <template v-if="column.key === 'confidence'">
          <span
            v-if="record.confidence !== undefined && record.confidence !== null"
          >
            {{ (record.confidence * 100).toFixed(0) }}%
          </span>
          <span v-else>-</span>
        </template>
        <template v-if="column.key === 'match_status'">
          <Tag
            v-if="record.match_status"
            :color="getMatchStatusColor(record.match_status)"
          >
            {{
              matchStatusOptions.find((o) => o.value === record.match_status)
                ?.label || record.match_status
            }}
          </Tag>
          <span v-else>-</span>
        </template>
        <template v-if="column.key === 'action'">
          <Button
            type="link"
            size="small"
            @click="handleViewDetail(record as BillDetailItem)"
          >
            {{ $t('common.detail') }}
          </Button>
        </template>
      </template>
    </Table>

    <Drawer
      v-model:open="detailVisible"
      :title="$t('detective.transaction.detail')"
      width="500"
    >
      <Descriptions v-if="currentDetail" :column="1" bordered>
        <DescriptionsItem :label="$t('detective.transaction.transactionTime')">
          {{ currentDetail.transaction_time }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.source')">
          {{
            sourceOptions.find((o) => o.value === currentDetail!.source)
              ?.label || currentDetail.source
          }}
        </DescriptionsItem>
        <DescriptionsItem
          :label="$t('detective.bill.sourceTypeOptions.payment_side')"
        >
          {{
            sourceTypeOptions.find(
              (o) => o.value === currentDetail!.source_type,
            )?.label || currentDetail.source_type
          }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.direction')">
          <Tag :color="getDirectionColor(currentDetail.direction)">
            {{
              directionOptions.find((o) => o.value === currentDetail!.direction)
                ?.label
            }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.amount')">
          <span
            :class="
              currentDetail.direction === 'expense'
                ? 'text-red-500'
                : 'text-green-500'
            "
          >
            {{ formatAmount(currentDetail.amount, currentDetail.direction) }}
          </span>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.merchant')">
          {{ currentDetail.merchant_raw || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.category')">
          {{ currentDetail.category || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.paymentMethod')">
          {{ currentDetail.payment_method || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.cardBank')">
          {{ currentDetail.card_bank || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.cardLast4')">
          {{ currentDetail.card_last4 || '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.matched')">
          <Tag :color="currentDetail.matched ? 'success' : 'default'">
            {{
              currentDetail.matched
                ? $t('detective.transaction.matchedOptions.true')
                : $t('detective.transaction.matchedOptions.false')
            }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem
          v-if="currentDetail.confidence !== undefined"
          :label="$t('detective.reconcile.confidence')"
        >
          {{ (currentDetail.confidence * 100).toFixed(0) }}%
        </DescriptionsItem>
        <DescriptionsItem
          v-if="currentDetail.match_status"
          :label="$t('detective.reconcile.matchStatus')"
        >
          <Tag :color="getMatchStatusColor(currentDetail.match_status)">
            {{
              matchStatusOptions.find(
                (o) => o.value === currentDetail!.match_status,
              )?.label
            }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.statementMonth')">
          {{ currentDetail.statement_month }}
        </DescriptionsItem>
        <DescriptionsItem
          v-if="currentDetail.note"
          :label="$t('detective.transaction.remark')"
        >
          {{ currentDetail.note }}
        </DescriptionsItem>
      </Descriptions>
    </Drawer>
  </Page>
</template>
