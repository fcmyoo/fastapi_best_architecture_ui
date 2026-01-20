<script setup lang="ts">
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
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  confirmMatchApi,
  getMatchExplainApi,
  getReconcileRunDetailApi,
  getRunMatchesApi,
  rejectMatchApi,
} from '#/plugins/detective/api';

const route = useRoute();
const router = useRouter();
const runId = computed(() => Number(route.params.id));

const runDetail = ref<null | ReconcileRun>(null);
const loading = ref(false);
const matchesLoading = ref(false);
const matches = ref<RunMatchItem[]>([]);
const statusFilter = ref<string | undefined>(undefined);
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

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

const statusOptions = [
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
];

const runStatusOptions = [
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
];

const getStatusOption = (status: string, options: typeof statusOptions) => {
  return options.find((o) => o.value === status) || options[0];
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#52c41a';
  if (confidence >= 0.6) return '#faad14';
  return '#ff4d4f';
};

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

const columns = [
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
    title: $t('detective.reconcile.paymentSource'),
    dataIndex: ['payment_tx', 'source'],
    key: 'payment_source',
    width: 100,
  },
  {
    title: $t('detective.reconcile.paymentTime'),
    dataIndex: ['payment_tx', 'transaction_time'],
    key: 'payment_time',
    width: 160,
  },
  {
    title: $t('detective.reconcile.paymentAmount'),
    dataIndex: ['payment_tx', 'amount'],
    key: 'payment_amount',
    width: 120,
  },
  {
    title: $t('detective.reconcile.paymentMerchant'),
    dataIndex: ['payment_tx', 'merchant_raw'],
    key: 'payment_merchant',
    width: 120,
  },
  {
    title: $t('detective.reconcile.debitSource'),
    dataIndex: ['debit_tx', 'source'],
    key: 'debit_source',
    width: 100,
  },
  {
    title: $t('detective.reconcile.debitTime'),
    dataIndex: ['debit_tx', 'transaction_time'],
    key: 'debit_time',
    width: 160,
  },
  {
    title: $t('detective.reconcile.debitAmount'),
    dataIndex: ['debit_tx', 'amount'],
    key: 'debit_amount',
    width: 120,
  },
  {
    title: $t('detective.reconcile.debitMerchant'),
    dataIndex: ['debit_tx', 'merchant_raw'],
    key: 'debit_merchant',
    width: 120,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 100,
    fixed: 'right' as const,
  },
];

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
    const res = await getRunMatchesApi(runId.value, {
      status: statusFilter.value,
      page: pagination.current,
      size: pagination.pageSize,
    });
    matches.value = res.items || [];
    pagination.total = res.total || 0;
  } finally {
    matchesLoading.value = false;
  }
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchMatches();
};

const handleStatusChange = () => {
  pagination.current = 1;
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
    message.error($t('ui.actionMessage.operationFailed'));
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
    message.error($t('ui.actionMessage.operationFailed'));
  }
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
      <div class="mb-4 flex items-center gap-4">
        <Select
          v-model:value="statusFilter"
          :placeholder="$t('detective.reconcile.filterByStatus')"
          :options="statusOptions"
          allow-clear
          style="width: 200px"
          @change="handleStatusChange"
        />
        <Button @click="fetchMatches">
          <template #icon><ReloadOutlined /></template>
          {{ $t('common.refresh') }}
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="matches"
        :loading="matchesLoading"
        :pagination="pagination"
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
            {{ (record.confidence * 100).toFixed(1) }}%
          </template>
          <template v-else-if="column.key === 'action'">
            <Button
              type="link"
              size="small"
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
      :title="$t('detective.reconcile.explain')"
      width="900px"
      :footer="null"
    >
      <div v-if="currentMatch" class="py-4">
        <!-- 匹配状态 -->
        <Row :gutter="24" align="middle" class="mb-4">
          <Col :span="8">
            <div class="text-center">
              <div class="mb-2 text-gray-500">
                {{ $t('detective.reconcile.matchStatus') }}
              </div>
              <Tag
                :color="
                  getStatusOption(currentMatch.status, statusOptions)?.color
                "
                class="px-4 py-1 text-base"
              >
                {{ getStatusOption(currentMatch.status, statusOptions)?.label }}
              </Tag>
            </div>
          </Col>
          <Col :span="8">
            <div class="text-center">
              <div class="mb-2 text-gray-500">
                {{ $t('detective.reconcile.confidence') }}
              </div>
              <Progress
                type="circle"
                :percent="Math.round(currentMatch.confidence * 100)"
                :stroke-color="getConfidenceColor(currentMatch.confidence)"
                :size="80"
              />
            </div>
          </Col>
          <Col :span="8">
            <div class="text-center" v-if="currentMatch.status === 'pending'">
              <div class="mb-2 text-gray-500">{{ $t('common.action') }}</div>
              <div class="flex justify-center gap-2">
                <Button
                  type="primary"
                  size="small"
                  @click="handleConfirmInModal"
                >
                  <template #icon><CheckOutlined /></template>
                  {{ $t('detective.reconcile.confirm') }}
                </Button>
                <Button danger size="small" @click="handleRejectInModal">
                  <template #icon><CloseOutlined /></template>
                  {{ $t('detective.reconcile.reject') }}
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        <!-- 交易对比 -->
        <Row :gutter="16" class="mb-4">
          <Col :span="12">
            <Card :title="$t('detective.reconcile.paymentTx')" size="small">
              <template v-if="currentMatch.payment_tx">
                <Descriptions :column="1" size="small">
                  <DescriptionsItem label="ID">
                    {{ currentMatch.payment_tx.id }}
                  </DescriptionsItem>
                  <DescriptionsItem :label="$t('detective.transaction.source')">
                    <Tag size="small">{{ currentMatch.payment_tx.source }}</Tag>
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.merchant')"
                  >
                    {{ currentMatch.payment_tx.merchant_raw }}
                  </DescriptionsItem>
                  <DescriptionsItem :label="$t('detective.transaction.amount')">
                    <span
                      class="font-bold"
                      :class="getAmountClass(currentMatch.payment_tx.direction)"
                    >
                      {{
                        formatTxAmount(
                          currentMatch.payment_tx.amount,
                          currentMatch.payment_tx.direction,
                        )
                      }}
                    </span>
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.transactionTime')"
                  >
                    {{ currentMatch.payment_tx.transaction_time }}
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.cardBank')"
                  >
                    {{ currentExplain?.payment_card_bank || '-' }}
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.cardLast4')"
                  >
                    {{ currentExplain?.payment_card_last4 || '-' }}
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.cardType')"
                  >
                    {{ currentExplain?.payment_card_type || '-' }}
                  </DescriptionsItem>
                </Descriptions>
              </template>
            </Card>
          </Col>
          <Col :span="12">
            <Card :title="$t('detective.reconcile.debitTx')" size="small">
              <template v-if="currentMatch.debit_tx">
                <Descriptions :column="1" size="small">
                  <DescriptionsItem label="ID">
                    {{ currentMatch.debit_tx.id }}
                  </DescriptionsItem>
                  <DescriptionsItem :label="$t('detective.transaction.source')">
                    <Tag size="small">{{ currentMatch.debit_tx.source }}</Tag>
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.merchant')"
                  >
                    {{ currentMatch.debit_tx.merchant_raw }}
                  </DescriptionsItem>
                  <DescriptionsItem :label="$t('detective.transaction.amount')">
                    <span
                      class="font-bold"
                      :class="getAmountClass(currentMatch.debit_tx.direction)"
                    >
                      {{
                        formatTxAmount(
                          currentMatch.debit_tx.amount,
                          currentMatch.debit_tx.direction,
                        )
                      }}
                    </span>
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.transactionTime')"
                  >
                    {{ currentMatch.debit_tx.transaction_time }}
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.cardBank')"
                  >
                    {{ currentExplain?.debit_card_bank || '-' }}
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.cardLast4')"
                  >
                    {{ currentExplain?.debit_card_last4 || '-' }}
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.cardType')"
                  >
                    {{ currentExplain?.debit_card_type || '-' }}
                  </DescriptionsItem>
                </Descriptions>
              </template>
            </Card>
          </Col>
        </Row>

        <!-- 评分详情 -->
        <Card
          :title="$t('detective.reconcile.explain')"
          size="small"
          v-if="currentExplain"
          :loading="explainLoading"
        >
          <Row :gutter="8">
            <Col :span="6">
              <div class="rounded bg-gray-50 p-2 text-center">
                <div class="text-xs text-gray-500">
                  {{ $t('detective.reconcile.scoreDetail.time') }}
                </div>
                <div
                  class="text-xl font-bold"
                  :style="{
                    color: getConfidenceColor(currentExplain.time_score),
                  }"
                >
                  {{ (currentExplain.time_score * 100).toFixed(0) }}%
                </div>
                <div class="text-xs text-gray-400">
                  差{{ currentExplain.time_diff_hours?.toFixed(1) }}h
                </div>
              </div>
            </Col>
            <Col :span="6">
              <div class="rounded bg-gray-50 p-2 text-center">
                <div class="text-xs text-gray-500">
                  {{ $t('detective.reconcile.scoreDetail.amount') }}
                </div>
                <div
                  class="text-xl font-bold"
                  :style="{
                    color: getConfidenceColor(currentExplain.amount_score),
                  }"
                >
                  {{ (currentExplain.amount_score * 100).toFixed(0) }}%
                </div>
                <div class="text-xs text-gray-400">
                  差{{ currentExplain.amount_diff }}
                </div>
              </div>
            </Col>
            <Col :span="6">
              <div class="rounded bg-gray-50 p-2 text-center">
                <div class="text-xs text-gray-500">
                  {{ $t('detective.reconcile.scoreDetail.bankCard') }}
                </div>
                <div
                  class="text-xl font-bold"
                  :style="{
                    color: getConfidenceColor(currentExplain.bank_card_score),
                  }"
                >
                  {{ (currentExplain.bank_card_score * 100).toFixed(0) }}%
                </div>
                <div class="text-xs text-gray-400">储蓄卡匹配</div>
              </div>
            </Col>
            <Col :span="6">
              <div class="rounded bg-gray-50 p-2 text-center">
                <div class="text-xs text-gray-500">
                  {{ $t('detective.reconcile.scoreDetail.channel') }}
                </div>
                <div
                  class="text-xl font-bold"
                  :style="{
                    color: getConfidenceColor(currentExplain.channel_score),
                  }"
                >
                  {{ (currentExplain.channel_score * 100).toFixed(0) }}%
                </div>
                <div class="text-xs text-gray-400">渠道匹配</div>
              </div>
            </Col>
          </Row>
          <div class="mt-4">
            <div class="mb-2 text-center text-sm text-gray-500">综合置信度</div>
            <Progress
              :percent="Math.round(currentExplain.total_score * 100)"
              :stroke-color="getConfidenceColor(currentExplain.total_score)"
              :stroke-width="12"
            />
            <div class="mt-1 text-center text-xs text-gray-400">
              {{ currentExplain.confidence }}
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  </Page>
</template>
