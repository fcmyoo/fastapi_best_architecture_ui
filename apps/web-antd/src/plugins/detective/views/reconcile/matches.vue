<script setup lang="ts">
import type { Key } from 'ant-design-vue/es/table/interface';

import type { MatchListParams, MatchResult } from '#/plugins/detective/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
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

const loading = ref(false);
const dataSource = ref<MatchResult[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const searchParams = reactive<MatchListParams>({
  status: undefined,
  min_confidence: undefined,
});

const selectedRowKeys = ref<number[]>([]);

const explainModalVisible = ref(false);
const explainLoading = ref(false);
const currentExplain = ref<any>(null);
const currentMatch = ref<MatchResult | null>(null);

const statusOptions = [
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
];

const columns = [
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
];

const getStatusOption = (status: string) => {
  return statusOptions.find((o) => o.value === status) || statusOptions[0];
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
  searchParams.status = undefined;
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
  } catch {
    message.error($t('common.failed'));
  }
};

const handleRejectInModal = async () => {
  if (!currentMatch.value) return;
  try {
    await rejectMatchApi(currentMatch.value.id);
    message.success($t('common.success'));
    currentMatch.value.status = 'rejected';
    fetchData();
  } catch {
    message.error($t('common.failed'));
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
          :placeholder="$t('detective.reconcile.status')"
          :options="statusOptions"
          allow-clear
          style="width: 120px"
        />
        <Select
          v-model:value="searchParams.min_confidence"
          placeholder="最低置信度"
          allow-clear
          style="width: 120px"
        >
          <a-select-option :value="0.8">≥ 80%</a-select-option>
          <a-select-option :value="0.6">≥ 60%</a-select-option>
          <a-select-option :value="0.4">≥ 40%</a-select-option>
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
          type="primary"
          :disabled="selectedRowKeys.length === 0"
          @click="handleBatchConfirm"
        >
          <template #icon><CheckOutlined /></template>
          {{ $t('detective.reconcile.batchConfirm') }}
        </Button>
        <Button
          danger
          :disabled="selectedRowKeys.length === 0"
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
      :scroll="{ x: 1100 }"
      :row-selection="{
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record: MatchResult) => ({
          disabled: record.status !== 'pending',
        }),
      }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'confidence'">
          <Progress
            :percent="Math.round(record.confidence * 100)"
            :stroke-color="getConfidenceColor(record.confidence)"
            :size="[100, 8]"
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
            type="link"
            size="small"
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
                :color="getStatusOption(currentMatch.status)?.color"
                class="px-4 py-1 text-base"
              >
                {{ getStatusOption(currentMatch.status)?.label }}
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
                    :label="$t('detective.transaction.paymentMethod')"
                  >
                    {{ currentMatch.payment_tx.payment_method || '-' }}
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.category')"
                  >
                    {{ currentMatch.payment_tx.category || '-' }}
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
                    {{ currentMatch.debit_tx.card_bank || '-' }}
                  </DescriptionsItem>
                  <DescriptionsItem
                    :label="$t('detective.transaction.cardLast4')"
                  >
                    {{ currentMatch.debit_tx.card_last4 || '-' }}
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
