<script setup lang="ts">
import type {
  Transaction,
  TransactionListParams,
} from '#/plugins/detective/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons-vue';
import {
  Button,
  DatePicker,
  message,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import { exportReportApi, getUnmatchedListApi } from '#/plugins/detective/api';

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
  statement_month: undefined,
});

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
    const res = await getUnmatchedListApi(params);
    dataSource.value = res.items || [];
    pagination.total = res.total || 0;
  } catch (error) {
    console.error('Failed to fetch unmatched:', error);
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
  searchParams.source = undefined;
  searchParams.direction = undefined;
  searchParams.statement_month = undefined;
  pagination.current = 1;
  fetchData();
};

const handleExport = async () => {
  try {
    const blob = await exportReportApi({
      statement_month: searchParams.statement_month || undefined,
      format: 'excel',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unmatched_${searchParams.statement_month || 'all'}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success($t('detective.report.exportSuccess'));
  } catch {
    message.error($t('detective.report.exportFailed'));
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.report.unmatched')">
    <div class="mb-4 flex items-center justify-between">
      <Space>
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
        <DatePicker
          v-model:value="searchParams.statement_month"
          picker="month"
          :placeholder="$t('detective.bill.statementMonth')"
          format="YYYY-MM"
          value-format="YYYY-MM"
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
      <Button @click="handleExport">
        <template #icon><DownloadOutlined /></template>
        {{ $t('detective.report.exportExcel') }}
      </Button>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 900 }"
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
      </template>
    </Table>
  </Page>
</template>
