<script setup lang="ts">
import type {
  Transaction,
  TransactionListParams,
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
import {
  getTransactionDetailApi,
  getTransactionListApi,
} from '#/plugins/detective/api';

const loading = ref(false);
const dataSource = ref<Transaction[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const searchParams = reactive<TransactionListParams>({
  source: undefined,
  direction: undefined,
  matched: undefined,
  statement_month: undefined,
  keyword: undefined,
  min_amount: undefined,
  max_amount: undefined,
});

const detailVisible = ref(false);
const detailLoading = ref(false);
const currentDetail = ref<null | Transaction>(null);

const sourceOptions = [
  { label: $t('detective.bill.sourceOptions.wechat'), value: 'wechat' },
  { label: $t('detective.bill.sourceOptions.alipay'), value: 'alipay' },
  {
    label: $t('detective.bill.sourceOptions.credit_card'),
    value: 'credit_card',
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
  { label: $t('detective.transaction.matchedOptions.true'), value: true },
  { label: $t('detective.transaction.matchedOptions.false'), value: false },
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
    align: 'right',
  },
  {
    title: $t('detective.transaction.merchant'),
    dataIndex: 'merchant_raw',
    key: 'merchant_raw',
    ellipsis: true,
  },
  {
    title: $t('detective.transaction.category'),
    dataIndex: 'category',
    key: 'category',
    width: 100,
  },
  {
    title: $t('detective.transaction.matched'),
    dataIndex: 'matched',
    key: 'matched',
    width: 100,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 100,
    fixed: 'right',
  },
];

const getDirectionColor = (direction: string) => {
  return direction === 'expense' ? 'red' : 'green';
};

const formatAmount = (amount: number | string, direction: string) => {
  const prefix = direction === 'expense' ? '-' : '+';
  return `${prefix}¥${Number(amount).toFixed(2)}`;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchParams,
      page: pagination.current,
      size: pagination.pageSize,
    };
    const res = await getTransactionListApi(params);
    dataSource.value = res.items || [];
    pagination.total = res.total || 0;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
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
    source: undefined,
    direction: undefined,
    matched: undefined,
    statement_month: undefined,
    keyword: undefined,
    min_amount: undefined,
    max_amount: undefined,
  });
  pagination.current = 1;
  fetchData();
};

const handleViewDetail = async (record: Transaction) => {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    currentDetail.value = await getTransactionDetailApi(record.id);
  } catch (error) {
    console.error('Failed to fetch detail:', error);
  } finally {
    detailLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.transaction.title')">
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
        <Select
          v-model:value="searchParams.source"
          :placeholder="$t('detective.transaction.source')"
          :options="sourceOptions"
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
        <DatePicker
          v-model:value="searchParams.statement_month"
          picker="month"
          :placeholder="$t('detective.transaction.statementMonth')"
          format="YYYY-MM"
          value-format="YYYY-MM"
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
      :scroll="{ x: 1200 }"
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
        <template v-if="column.key === 'action'">
          <Button type="link" size="small" @click="handleViewDetail(record)">
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
      <Descriptions
        v-if="currentDetail"
        :column="1"
        bordered
        :loading="detailLoading"
      >
        <DescriptionsItem :label="$t('detective.transaction.transactionTime')">
          {{ currentDetail.transaction_time }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.source')">
          {{
            sourceOptions.find((o) => o.value === currentDetail.source)
              ?.label || currentDetail.source
          }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.direction')">
          <Tag :color="getDirectionColor(currentDetail.direction)">
            {{
              directionOptions.find((o) => o.value === currentDetail.direction)
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
          {{ currentDetail.merchant_raw }}
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
        <DescriptionsItem :label="$t('detective.transaction.statementMonth')">
          {{ currentDetail.statement_month }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.transaction.remark')">
          {{ currentDetail.remark || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Drawer>
  </Page>
</template>
