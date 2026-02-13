<script setup lang="ts">
import type { Key } from 'ant-design-vue/es/table/interface';

import type {
  MatchExplain,
  ReconcileRun,
  RunMatchItem,
} from '#/plugins/detective/api';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  message,
  Modal,
  Progress,
  Row,
  Segmented,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  batchConfirmMatchesApi,
  batchRejectMatchesApi,
  confirmMatchApi,
  getMatchExplainApi,
  getReconcileRunDetailApi,
  getRunMatchesApi,
  rejectMatchApi,
} from '#/plugins/detective/api';

import ScoreDetail from '../bill/components/ScoreDetail.vue';
import TransactionComparison from './components/TransactionComparison.vue';

const route = useRoute();
const router = useRouter();
const runId = computed(() => Number(route.params.id));

const runDetail = ref<null | ReconcileRun>(null);
const loading = ref(false);
const matchesLoading = ref(false);
const matches = ref<RunMatchItem[]>([]);
const activeTab = ref<string>('pending');
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});
const selectedRowKeys = ref<number[]>([]);

// 弹窗相关
const explainModalVisible = ref(false);
const explainLoading = ref(false);
const currentMatch = ref<null | RunMatchItem>(null);
const currentExplain = ref<MatchExplain | null>(null);

const parsedStats = computed(() => {
  if (!runDetail.value?.stats) return null;
  if (typeof runDetail.value.stats === 'string') {
    try {
      return JSON.parse(runDetail.value.stats);
    } catch {
      return null;
    }
  }
  return runDetail.value.stats;
});

const statusOptions = computed(() => [
  {
    label: $t('detective.reconcile.matchStatusOptions.pending'),
    value: 'pending',
    color: 'default',
  },
  {
    label: $t('detective.reconcile.matchStatusOptions.confirmed'),
    value: 'confirmed',
    color: 'success',
  },
  {
    label: $t('detective.reconcile.matchStatusOptions.rejected'),
    value: 'rejected',
    color: 'error',
  },
]);

const segmentedOptions = computed(() => [
  { label: '全部', value: 'all' },
  {
    label: $t('detective.reconcile.matchStatusOptions.pending'),
    value: 'pending',
  },
  {
    label: $t('detective.reconcile.matchStatusOptions.confirmed'),
    value: 'confirmed',
  },
  {
    label: $t('detective.reconcile.matchStatusOptions.rejected'),
    value: 'rejected',
  },
]);

const runStatusOptions = computed(() => [
  {
    label: $t('detective.reconcile.runStatusOptions.pending'),
    value: 'pending',
    color: 'default',
  },
  {
    label: $t('detective.reconcile.runStatusOptions.running'),
    value: 'running',
    color: 'processing',
  },
  {
    label: $t('detective.reconcile.runStatusOptions.success'),
    value: 'success',
    color: 'success',
  },
  {
    label: $t('detective.reconcile.runStatusOptions.failed'),
    value: 'failed',
    color: 'error',
  },
]);

const getStatusOption = (
  status: string,
  options: typeof statusOptions.value,
) => {
  return options.find((o) => o.value === status) || options[0];
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return '#52c41a';
  if (confidence >= 0.7) return '#faad14';
  return '#ff4d4f';
};

const formatAmount = (amount?: number) => {
  if (amount === undefined || amount === null) return '';
  return `￥${Number(amount).toFixed(2)}`;
};

const pendingHighConfidenceIds = computed(() => {
  return matches.value
    .filter((m) => m.status === 'pending' && m.confidence >= 0.9)
    .map((m) => m.id);
});

const columns = computed(() => [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  {
    title: $t('detective.reconcile.confidence'),
    dataIndex: 'confidence',
    key: 'confidence',
    width: 100,
  },
  {
    title: $t('detective.reconcile.matchStatus'),
    dataIndex: 'status',
    key: 'status',
    width: 150,
  },
  {
    title: $t('detective.reconcile.paymentTx'),
    key: 'payment_tx',
    width: 250,
  },
  {
    title: $t('detective.reconcile.debitTx'),
    key: 'debit_tx',
    width: 250,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 100,
    fixed: 'right' as const,
  },
]);

const fetchRunDetail = async () => {
  loading.value = true;
  try {
    runDetail.value = await getReconcileRunDetailApi(runId.value);
  } finally {
    loading.value = false;
  }
};

const fetchMatches = async () => {
  matchesLoading.value = true;
  try {
    const status = activeTab.value === 'all' ? undefined : activeTab.value;
    const res = await getRunMatchesApi(runId.value, {
      status,
      page: pagination.current,
      size: pagination.pageSize,
    });
    matches.value = res.items || [];
    pagination.total = res.total || 0;
  } finally {
    matchesLoading.value = false;
  }
};

const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchMatches();
};

const handleStatusChange = () => {
  pagination.current = 1;
  selectedRowKeys.value = [];
  fetchMatches();
};

const goBack = () => {
  router.push('/detective/reconcile/runs');
};

const handleViewExplain = async (record: RunMatchItem) => {
  currentMatch.value = record;
  currentExplain.value = null;
  explainModalVisible.value = true;
  explainLoading.value = true;
  try {
    currentExplain.value = await getMatchExplainApi(record.id);
  } catch (error) {
    console.error('Failed to fetch explain:', error);
    message.error('获取评分详情失败');
  } finally {
    explainLoading.value = false;
  }
};

const handleConfirmInModal = async () => {
  if (!currentMatch.value) return;
  try {
    await confirmMatchApi(currentMatch.value.id);
    message.success($t('ui.actionMessage.operationSuccess'));
    explainModalVisible.value = false;
    fetchMatches();
  } catch {
    message.error('操作失败，匹配记录可能已被更新，正在刷新列表');
    explainModalVisible.value = false;
    fetchMatches();
  }
};

const handleRejectInModal = async () => {
  if (!currentMatch.value) return;
  try {
    await rejectMatchApi(currentMatch.value.id);
    message.success($t('ui.actionMessage.operationSuccess'));
    explainModalVisible.value = false;
    fetchMatches();
  } catch {
    message.error('操作失败，匹配记录可能已被更新，正在刷新列表');
    explainModalVisible.value = false;
    fetchMatches();
  }
};

const handleQuickConfirm = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要确认的匹配');
    return;
  }
  try {
    await batchConfirmMatchesApi(selectedRowKeys.value);
    message.success($t('ui.actionMessage.operationSuccess'));
    selectedRowKeys.value = [];
    fetchMatches();
  } catch {
    message.error($t('ui.actionMessage.operationFailed'));
  }
};

const handleBatchReject = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要拒绝的匹配');
    return;
  }
  try {
    await batchRejectMatchesApi(selectedRowKeys.value);
    message.success($t('ui.actionMessage.operationSuccess'));
    selectedRowKeys.value = [];
    fetchMatches();
  } catch {
    message.error($t('ui.actionMessage.operationFailed'));
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
        fetchMatches();
      } catch {
        message.error($t('ui.actionMessage.operationFailed'));
      }
    },
  });
};

const onSelectChange = (keys: Key[]) => {
  selectedRowKeys.value = keys as number[];
};

onMounted(() => {
  fetchRunDetail();
  fetchMatches();
});
</script>

<template>
  <Page :title="$t('detective.reconcile.runDetail')">
    <template #extra>
      <Button @click="goBack">
        <template #icon><ArrowLeftOutlined /></template>
        {{ $t('common.back') }}
      </Button>
    </template>

    <Card :loading="loading" class="mb-4">
      <Descriptions :column="3" bordered size="small">
        <DescriptionsItem label="ID">{{ runDetail?.id }}</DescriptionsItem>
        <DescriptionsItem :label="$t('detective.reconcile.statementMonth')">
          {{ runDetail?.statement_month }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.reconcile.status')">
          <Tag
            v-if="runDetail"
            :color="getStatusOption(runDetail.status, runStatusOptions)?.color"
          >
            {{ getStatusOption(runDetail.status, runStatusOptions)?.label }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.reconcile.matchedCount')">
          {{ parsedStats?.matched ?? '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.reconcile.autoConfirmedCount')">
          {{ parsedStats?.auto_confirmed ?? '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.reconcile.pendingCount')">
          {{ parsedStats?.pending ?? '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.reconcile.totalPayment')">
          {{ parsedStats?.total_payment_side ?? '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.reconcile.totalDebit')">
          {{ parsedStats?.total_debit_side ?? '-' }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.reconcile.createdTime')">
          {{ runDetail?.created_time }}
        </DescriptionsItem>
        <DescriptionsItem :label="$t('detective.reconcile.finishedTime')">
          {{ runDetail?.finished_time ?? '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Card>

    <Card :title="$t('detective.reconcile.matchResults')">
      <div class="mb-4 flex items-center justify-between">
        <Segmented
          v-model:value="activeTab"
          :options="segmentedOptions"
          @change="handleStatusChange"
        />
        <div class="flex gap-2">
          <Button
            v-if="activeTab === 'pending'"
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
            v-if="activeTab === 'pending'"
            :disabled="selectedRowKeys.length === 0"
            type="primary"
            @click="handleQuickConfirm"
          >
            <template #icon><CheckOutlined /></template>
            {{ $t('detective.reconcile.batchConfirm') }}
          </Button>
          <Button
            v-if="activeTab === 'pending'"
            :disabled="selectedRowKeys.length === 0"
            danger
            @click="handleBatchReject"
          >
            <template #icon><CloseOutlined /></template>
            批量拒绝
          </Button>
          <Button @click="fetchMatches">
            <template #icon><ReloadOutlined /></template>
            {{ $t('common.refresh') }}
          </Button>
        </div>
      </div>

      <Table
        :columns="columns"
        :data-source="matches"
        :loading="matchesLoading"
        :pagination="pagination"
        :row-selection="{
          selectedRowKeys,
          onChange: onSelectChange,
          getCheckboxProps: (record) => ({
            disabled: record.status !== 'pending',
          }),
        }"
        :scroll="{ x: 1400 }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="getStatusOption(record.status, statusOptions)?.color">
              {{ getStatusOption(record.status, statusOptions)?.label }}
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
          <template v-else-if="column.key === 'confidence'">
            <Progress
              :percent="Math.round(record.confidence * 100)"
              :size="[80, 8]"
              :stroke-color="getConfidenceColor(record.confidence)"
            />
          </template>
          <template v-else-if="column.key === 'payment_tx'">
            <div v-if="record.payment_tx" class="text-xs">
              <div class="font-medium">{{ record.payment_tx.merchant_raw }}</div>
              <div class="font-bold text-red-500">
                {{ formatAmount(record.payment_tx.amount) }}
              </div>
              <div class="text-gray-400">
                {{ record.payment_tx.transaction_time }}
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'debit_tx'">
            <div v-if="record.debit_tx" class="text-xs">
              <div class="font-medium">{{ record.debit_tx.merchant_raw }}</div>
              <div class="font-bold text-green-500">
                {{ formatAmount(record.debit_tx.amount) }}
              </div>
              <div class="text-gray-400">
                {{ record.debit_tx.transaction_time }}
              </div>
              <div v-if="record.debit_tx.card_bank" class="text-gray-400">
                {{ record.debit_tx.card_bank }}
                {{ record.debit_tx.card_last4 ? `(${record.debit_tx.card_last4})` : '' }}
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button
              size="small"
              type="link"
              @click="handleViewExplain(record as RunMatchItem)"
            >
              <template #icon><InfoCircleOutlined /></template>
              {{ $t('common.detail') }}
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 评分详情弹窗 -->
    <Modal
      v-model:open="explainModalVisible"
      :footer="null"
      :title="$t('detective.reconcile.explain')"
      width="1000px"
    >
      <div v-if="currentMatch" class="py-4">
        <!-- 匹配状态 -->
        <Row align="middle" class="mb-6" justify="space-between">
          <Col>
            <div class="flex items-center gap-4">
              <Tag
                :color="
                  getStatusOption(currentMatch.status, statusOptions)?.color
                "
                class="px-4 py-1 text-base"
              >
                {{ getStatusOption(currentMatch.status, statusOptions)?.label }}
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
          </Col>
          <Col v-if="currentMatch.status === 'pending'">
            <div class="flex gap-2">
              <Button type="primary" @click="handleConfirmInModal">
                <template #icon><CheckOutlined /></template>
                {{ $t('detective.reconcile.confirm') }}
              </Button>
              <Button danger @click="handleRejectInModal">
                <template #icon><CloseOutlined /></template>
                {{ $t('detective.reconcile.reject') }}
              </Button>
            </div>
          </Col>
        </Row>

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