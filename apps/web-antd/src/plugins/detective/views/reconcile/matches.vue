<script setup lang="ts">
import type { Key } from 'ant-design-vue/es/table/interface';

import type {
  MatchExplain,
  MatchListParams,
  MatchResult,
} from '#/plugins/detective/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  message,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  batchConfirmMatchesApi,
  batchRejectMatchesApi,
  confirmMatchApi,
  getMatchExplainApi,
  getMatchListApi,
  rejectMatchApi,
} from '#/plugins/detective/api';

import ScoreDetail from '../bill/components/ScoreDetail.vue';
import TransactionComparison from './components/TransactionComparison.vue';

const loading = ref(false);
const dataSource = ref<MatchResult[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const searchParams = reactive<MatchListParams>({
  status: 'pending',
  min_confidence: undefined,
});

const selectedRowKeys = ref<number[]>([]);

const explainModalVisible = ref(false);
const explainLoading = ref(false);
const currentExplain = ref<MatchExplain | null>(null);
const currentMatch = ref<MatchResult | null>(null);

const statusOptions = computed(() => [
  {
    label: $t('detective.reconcile.statusOptions.pending'),
    value: 'pending',
    color: 'default',
  },
  {
    label: $t('detective.reconcile.statusOptions.confirmed'),
    value: 'confirmed',
    color: 'success',
  },
  {
    label: $t('detective.reconcile.statusOptions.rejected'),
    value: 'rejected',
    color: 'error',
  },
]);

const columns = computed(() => [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: $t('detective.reconcile.confidence'),
    dataIndex: 'confidence',
    key: 'confidence',
    width: 120,
  },
  {
    title: $t('detective.reconcile.paymentTx'),
    key: 'payment',
    width: 250,
  },
  {
    title: $t('detective.reconcile.debitTx'),
    key: 'debit',
    width: 250,
  },
  {
    title: $t('detective.reconcile.status'),
    dataIndex: 'status',
    key: 'status',
    width: 150,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 120,
    fixed: 'right' as const,
  },
]);

const getStatusOption = (status: string) => {
  return (
    statusOptions.value.find((o) => o.value === status) ||
    statusOptions.value[0]
  );
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return '#52c41a';
  if (confidence >= 0.7) return '#faad14';
  return '#ff4d4f';
};

const pendingHighConfidenceIds = computed(() => {
  return dataSource.value
    .filter((m) => m.status === 'pending' && m.confidence >= 0.9)
    .map((m) => m.id);
});

const formatTxAmount = (amount?: number, direction?: string) => {
  if (amount === undefined || amount === null) return '';
  let prefix = '￥';
  if (direction === 'expense') prefix = '-￥';
  else if (direction === 'income') prefix = '+￥';
  return `${prefix}${Number(amount).toFixed(2)}`;
};

const getAmountClass = (direction?: string) => {
  if (direction === 'expense') return 'text-red-500';
  if (direction === 'income') return 'text-green-500';
  return '';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchParams,
      page: pagination.current,
      size: pagination.pageSize,
    };
    const res = await getMatchListApi(params);
    dataSource.value = res.items || [];
    pagination.total = res.total || 0;
  } catch (error) {
    console.error('Failed to fetch matches:', error);
  } finally {
    loading.value = false;
  }
};

const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
};

const handleSearch = () => {
  pagination.current = 1;
  fetchData();
};

const handleReset = () => {
  searchParams.status = 'pending';
  searchParams.min_confidence = undefined;
  pagination.current = 1;
  fetchData();
};

const handleBatchConfirm = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要确认的匹配');
    return;
  }
  try {
    await batchConfirmMatchesApi(selectedRowKeys.value);
    message.success($t('common.success'));
    selectedRowKeys.value = [];
    fetchData();
  } catch {
    message.error($t('common.failed'));
  }
};

const handleBatchReject = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要拒绝的匹配');
    return;
  }
  try {
    await batchRejectMatchesApi(selectedRowKeys.value);
    message.success($t('common.success'));
    selectedRowKeys.value = [];
    fetchData();
  } catch {
    message.error($t('common.failed'));
  }
};

const handleConfirmAllHighConfidence = async () => {
  const ids = pendingHighConfidenceIds.value;
  if (ids.length === 0) {
    message.info('当前页没有 ≥90% 的待确认匹配');
    return;
  }
  Modal.confirm({
    title: '一键确认高置信度匹配',
    content: `将确认当前页 ${ids.length} 条置信度 ≥90% 的待确认匹配，是否继续？`,
    onOk: async () => {
      try {
        await batchConfirmMatchesApi(ids);
        message.success(`已确认 ${ids.length} 条匹配`);
        selectedRowKeys.value = [];
        fetchData();
      } catch {
        message.error($t('common.failed'));
      }
    },
  });
};

const handleViewExplain = async (record: MatchResult) => {
  currentMatch.value = record;
  explainModalVisible.value = true;
  explainLoading.value = true;
  try {
    currentExplain.value = await getMatchExplainApi(record.id);
  } catch (error) {
    console.error('Failed to fetch explain:', error);
  } finally {
    explainLoading.value = false;
  }
};

const handleConfirmInModal = async () => {
  if (!currentMatch.value) return;
  try {
    await confirmMatchApi(currentMatch.value.id);
    message.success($t('common.success'));
    currentMatch.value.status = 'confirmed';
    fetchData();
    explainModalVisible.value = false;
  } catch {
    message.error('操作失败，匹配记录可能已被更新，正在刷新列表');
    explainModalVisible.value = false;
    fetchData();
  }
};

const handleRejectInModal = async () => {
  if (!currentMatch.value) return;
  try {
    await rejectMatchApi(currentMatch.value.id);
    message.success($t('common.success'));
    currentMatch.value.status = 'rejected';
    fetchData();
    explainModalVisible.value = false;
  } catch {
    message.error('操作失败，匹配记录可能已被更新，正在刷新列表');
    explainModalVisible.value = false;
    fetchData();
  }
};

const onSelectChange = (keys: Key[]) => {
  selectedRowKeys.value = keys as number[];
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.reconcile.matches')">
    <div class="mb-4 flex items-center justify-between">
      <Space>
        <Select
          v-model:value="searchParams.status"
          :options="statusOptions"
          :placeholder="$t('detective.reconcile.status')"
          allow-clear
          style="width: 120px"
        />
        <Select
          v-model:value="searchParams.min_confidence"
          allow-clear
          placeholder="最低置信度"
          style="width: 120px"
        >
          <Select.Option :value="0.9">≥ 90%</Select.Option>
          <Select.Option :value="0.8">≥ 80%</Select.Option>
          <Select.Option :value="0.6">≥ 60%</Select.Option>
          <Select.Option :value="0.4">≥ 40%</Select.Option>
        </Select>
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
        <Button
          :disabled="pendingHighConfidenceIds.length === 0"
          type="primary"
          @click="handleConfirmAllHighConfidence"
        >
          <template #icon><ThunderboltOutlined /></template>
          一键确认 ≥90%
          <span v-if="pendingHighConfidenceIds.length > 0" class="ml-1">
            ({{ pendingHighConfidenceIds.length }})
          </span>
        </Button>
        <Button
          :disabled="selectedRowKeys.length === 0"
          type="primary"
          @click="handleBatchConfirm"
        >
          <template #icon><CheckOutlined /></template>
          {{ $t('detective.reconcile.batchConfirm') }}
        </Button>
        <Button
          :disabled="selectedRowKeys.length === 0"
          danger
          @click="handleBatchReject"
        >
          <template #icon><CloseOutlined /></template>
          {{ $t('detective.reconcile.batchReject') }}
        </Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :row-selection="{
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record: MatchResult) => ({
          disabled: record.status !== 'pending',
        }),
      }"
      :scroll="{ x: 1100 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'confidence'">
          <Progress
            :percent="Math.round(record.confidence * 100)"
            :size="[100, 8]"
            :stroke-color="getConfidenceColor(record.confidence)"
          />
        </template>
        <template v-if="column.key === 'payment'">
          <div v-if="record.payment_tx" class="text-xs">
            <div>{{ record.payment_tx.merchant_raw }}</div>
            <div :class="getAmountClass(record.payment_tx.direction)">
              {{
                formatTxAmount(
                  record.payment_tx.amount,
                  record.payment_tx.direction,
                )
              }}
            </div>
            <div class="text-gray-400">
              {{ record.payment_tx.transaction_time }}
            </div>
          </div>
        </template>
        <template v-if="column.key === 'debit'">
          <div v-if="record.debit_tx" class="text-xs">
            <div>{{ record.debit_tx.merchant_raw }}</div>
            <div :class="getAmountClass(record.debit_tx.direction)">
              {{
                formatTxAmount(
                  record.debit_tx.amount,
                  record.debit_tx.direction,
                )
              }}
            </div>
            <div class="text-gray-400">
              {{ record.debit_tx.transaction_time }}
            </div>
          </div>
        </template>
        <template v-if="column.key === 'status'">
          <Tag :color="getStatusOption(record.status)?.color">
            {{ getStatusOption(record.status)?.label }}
          </Tag>
          <Tag
            v-if="record.status === 'confirmed'"
            :color="record.confirmed_by ? 'blue' : 'cyan'"
            class="ml-1"
          >
            {{
              record.confirmed_by
                ? $t('detective.reconcile.manualConfirmed')
                : $t('detective.reconcile.autoConfirmed')
            }}
          </Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Button
            size="small"
            type="link"
            @click="handleViewExplain(record as MatchResult)"
          >
            <template #icon><InfoCircleOutlined /></template>
            {{ $t('detective.reconcile.explain') }}
          </Button>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="explainModalVisible"
      :footer="null"
      :title="$t('detective.reconcile.explain')"
      width="1000px"
    >
      <div v-if="currentMatch" class="py-4">
        <!-- 匹配状态 -->
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <Tag
              :color="getStatusOption(currentMatch.status)?.color"
              class="px-4 py-1 text-base"
            >
              {{ getStatusOption(currentMatch.status)?.label }}
            </Tag>
            <div class="text-lg font-bold">
              {{ $t('detective.reconcile.confidence') }}:
              <span
                :style="{
                  color: getConfidenceColor(currentMatch.confidence),
                }"
              >
                {{ (currentMatch.confidence * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
          <div v-if="currentMatch.status === 'pending'" class="flex gap-2">
            <Button type="primary" @click="handleConfirmInModal">
              <template #icon><CheckOutlined /></template>
              {{ $t('detective.reconcile.confirm') }}
            </Button>
            <Button danger @click="handleRejectInModal">
              <template #icon><CloseOutlined /></template>
              {{ $t('detective.reconcile.reject') }}
            </Button>
          </div>
        </div>

        <!-- 交易对比 -->
        <TransactionComparison
          :debit-tx="currentMatch.debit_tx"
          :payment-tx="currentMatch.payment_tx"
        />

        <!-- 评分详情 -->
        <ScoreDetail
          v-if="currentExplain"
          :loading="explainLoading"
          :score-data="currentExplain"
        />
      </div>
    </Modal>
  </Page>
</template>