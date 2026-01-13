<script setup lang="ts">
import type {
  Transaction,
  TransactionListParams,
} from '#/plugins/detective/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  DownloadOutlined,
  LinkOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  exportReportApi,
  getUnmatchedListApi,
  manualMatchApi,
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
  statement_month: undefined,
});

// 手动匹配相关状态
const manualMatchVisible = ref(false);
const manualMatchLoading = ref(false);
const manualMatchData = ref<Transaction[]>([]);
const manualMatchPageSize = 200;
const selectedPaymentTx = ref<null | Transaction>(null);
const selectedDebitTx = ref<null | Transaction>(null);

// 分离支付端和扣款端交易，优先使用预加载的数据
const paymentSideTxList = computed(() =>
  (manualMatchData.value.length > 0
    ? manualMatchData.value
    : dataSource.value
  ).filter((tx) => tx.source_type === 'payment_side'),
);
const debitSideTxList = computed(() =>
  (manualMatchData.value.length > 0
    ? manualMatchData.value
    : dataSource.value
  ).filter((tx) => tx.source_type === 'debit_side'),
);

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
    align: 'right' as const,
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

// 手动匹配弹窗中的表格列
const matchTableColumns = [
  {
    title: $t('detective.transaction.transactionTime'),
    dataIndex: 'transaction_time',
    key: 'transaction_time',
    width: 160,
  },
  {
    title: $t('detective.transaction.source'),
    dataIndex: 'source',
    key: 'source',
    width: 80,
  },
  {
    title: $t('detective.transaction.amount'),
    dataIndex: 'amount',
    key: 'amount',
    width: 100,
    align: 'right' as const,
  },
  {
    title: $t('detective.transaction.merchant'),
    dataIndex: 'merchant_raw',
    key: 'merchant_raw',
    ellipsis: true,
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

// 打开手动匹配弹窗
const openManualMatch = () => {
  selectedPaymentTx.value = null;
  selectedDebitTx.value = null;
  fetchManualMatchData();
  manualMatchVisible.value = true;
};

// 为手动匹配预加载更多未匹配交易，避免只限定当前页
const fetchManualMatchData = async () => {
  manualMatchLoading.value = true;
  try {
    const res = await getUnmatchedListApi({
      ...searchParams,
      page: 1,
      size: manualMatchPageSize,
    });
    manualMatchData.value = res.items || [];
  } catch (error) {
    console.error('Failed to fetch manual match list:', error);
    message.error($t('ui.actionMessage.operationFailed'));
  } finally {
    manualMatchLoading.value = false;
  }
};

// 执行手动匹配
const handleManualMatch = async () => {
  if (!selectedPaymentTx.value || !selectedDebitTx.value) {
    return;
  }

  manualMatchLoading.value = true;
  try {
    await manualMatchApi({
      payment_tx_id: selectedPaymentTx.value.id,
      debit_tx_id: selectedDebitTx.value.id,
    });
    message.success($t('detective.reconcile.matchSuccess'));
    manualMatchVisible.value = false;
    fetchData();
  } catch (error: any) {
    if (error?.response?.status === 404) {
      message.error($t('detective.reconcile.txNotFound'));
    } else if (error?.response?.status === 403) {
      message.error($t('detective.reconcile.noPermission'));
    } else {
      message.error($t('detective.reconcile.matchFailed'));
    }
  } finally {
    manualMatchLoading.value = false;
  }
};

// 获取行选择配置
const getPaymentRowSelection = () => ({
  type: 'radio' as const,
  selectedRowKeys: selectedPaymentTx.value ? [selectedPaymentTx.value.id] : [],
  onChange: (_: any, selectedRows: Transaction[]) => {
    selectedPaymentTx.value = selectedRows[0] || null;
  },
});

const getDebitRowSelection = () => ({
  type: 'radio' as const,
  selectedRowKeys: selectedDebitTx.value ? [selectedDebitTx.value.id] : [],
  onChange: (_: any, selectedRows: Transaction[]) => {
    selectedDebitTx.value = selectedRows[0] || null;
  },
});

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
      <Space>
        <Button type="primary" @click="openManualMatch">
          <template #icon><LinkOutlined /></template>
          {{ $t('detective.reconcile.manualMatch') }}
        </Button>
        <Button @click="handleExport">
          <template #icon><DownloadOutlined /></template>
          {{ $t('detective.report.exportExcel') }}
        </Button>
      </Space>
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

    <!-- 手动匹配弹窗 -->
    <Modal
      v-model:open="manualMatchVisible"
      :title="$t('detective.reconcile.manualMatchTitle')"
      width="900px"
      :ok-text="$t('detective.reconcile.manualMatch')"
      :ok-button-props="{
        disabled: !selectedPaymentTx || !selectedDebitTx,
        loading: manualMatchLoading,
      }"
      @ok="handleManualMatch"
    >
      <div class="flex gap-4">
        <!-- 支付端选择 -->
        <Card
          :title="$t('detective.reconcile.selectPaymentTx')"
          class="flex-1"
          size="small"
        >
          <Table
            :columns="matchTableColumns"
            :data-source="paymentSideTxList"
            :loading="manualMatchLoading"
            :row-selection="getPaymentRowSelection()"
            :pagination="{ pageSize: 5, size: 'small' }"
            :scroll="{ y: 200 }"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'amount'">
                <span class="text-red-500">
                  -¥{{ Number(record.amount).toFixed(2) }}
                </span>
              </template>
            </template>
          </Table>
          <Descriptions
            v-if="selectedPaymentTx"
            :title="$t('detective.reconcile.selectedPayment')"
            :column="1"
            size="small"
            class="mt-2"
          >
            <DescriptionsItem :label="$t('detective.transaction.amount')">
              <span class="text-red-500">
                -¥{{ Number(selectedPaymentTx.amount).toFixed(2) }}
              </span>
            </DescriptionsItem>
            <DescriptionsItem :label="$t('detective.transaction.merchant')">
              {{ selectedPaymentTx.merchant_raw }}
            </DescriptionsItem>
          </Descriptions>
          <div v-else class="mt-2 text-gray-400">
            {{ $t('detective.reconcile.noSelection') }}
          </div>
        </Card>

        <!-- 扣款端选择 -->
        <Card
          :title="$t('detective.reconcile.selectDebitTx')"
          class="flex-1"
          size="small"
        >
          <Table
            :columns="matchTableColumns"
            :data-source="debitSideTxList"
            :loading="manualMatchLoading"
            :row-selection="getDebitRowSelection()"
            :pagination="{ pageSize: 5, size: 'small' }"
            :scroll="{ y: 200 }"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'amount'">
                <span class="text-red-500">
                  -¥{{ Number(record.amount).toFixed(2) }}
                </span>
              </template>
            </template>
          </Table>
          <Descriptions
            v-if="selectedDebitTx"
            :title="$t('detective.reconcile.selectedDebit')"
            :column="1"
            size="small"
            class="mt-2"
          >
            <DescriptionsItem :label="$t('detective.transaction.amount')">
              <span class="text-red-500">
                -¥{{ Number(selectedDebitTx.amount).toFixed(2) }}
              </span>
            </DescriptionsItem>
            <DescriptionsItem :label="$t('detective.transaction.merchant')">
              {{ selectedDebitTx.merchant_raw }}
            </DescriptionsItem>
          </Descriptions>
          <div v-else class="mt-2 text-gray-400">
            {{ $t('detective.reconcile.noSelection') }}
          </div>
        </Card>
      </div>
    </Modal>
  </Page>
</template>
