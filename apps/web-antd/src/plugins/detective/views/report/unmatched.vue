<script setup lang="ts">
import type {
  MatchCandidate,
  Transaction,
  TransactionListParams,
} from '#/plugins/detective/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';

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
  Empty,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  exportReportApi,
  getMatchCandidatesApi,
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

// 匹配候选相关状态
const matchCandidates = ref<MatchCandidate[]>([]);
const candidatesLoading = ref(false);

// 手动匹配筛选状态
const paymentFilter = reactive({
  date: undefined as string | undefined,
  amount: undefined as number | undefined,
  merchant: undefined as string | undefined,
});

// 筛选函数
const filterTxList = (
  list: Transaction[],
  filter: { date?: string; amount?: number; merchant?: string },
) => {
  return list.filter((tx) => {
    if (filter.date && !tx.transaction_time?.startsWith(filter.date))
      return false;
    if (filter.amount && Math.abs(Number(tx.amount) - filter.amount) > 0.01)
      return false;
    if (
      filter.merchant &&
      !tx.merchant_raw?.toLowerCase().includes(filter.merchant.toLowerCase())
    )
      return false;
    return true;
  });
};

// 判断是否为无对侧交易的支付方式
const isNoCounterpartPayment = (tx: Transaction) => {
  const method = tx.payment_method?.toLowerCase() || '';
  if (tx.source === 'wechat' && method.includes('零钱')) return true;
  if (tx.source === 'alipay' && (method.includes('恒丰银行信用购') || method.includes('账户余额'))) return true;
  return false;
};

// 分离支付端交易，优先使用预加载的数据，过滤无对侧交易的支付方式
const paymentSideTxList = computed(() => {
  const base = (
    manualMatchData.value.length > 0 ? manualMatchData.value : dataSource.value
  ).filter((tx) => tx.source_type === 'payment_side' && !isNoCounterpartPayment(tx));
  return filterTxList(base, paymentFilter);
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

// 手动匹配弹窗中的表格列 - 基础列
const baseMatchColumns = [
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

// 支付端列 - 显示支付方式和匹配状态
const paymentTableColumns = [
  ...baseMatchColumns,
  {
    title: $t('detective.transaction.paymentMethod'),
    dataIndex: 'payment_method',
    key: 'payment_method',
    width: 100,
  },
  {
    title: $t('detective.transaction.matched'),
    dataIndex: 'matched',
    key: 'matched',
    width: 80,
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
  matchCandidates.value = [];
  // 重置筛选条件
  Object.assign(paymentFilter, { date: undefined, amount: undefined, merchant: undefined });
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
    // 重置选择状态并刷新数据
    selectedPaymentTx.value = null;
    selectedDebitTx.value = null;
    matchCandidates.value = [];
    fetchManualMatchData();
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

// 获取匹配候选
const fetchMatchCandidates = async (txId: number) => {
  candidatesLoading.value = true;
  matchCandidates.value = [];
  selectedDebitTx.value = null;
  try {
    const res = await getMatchCandidatesApi(txId, true);
    matchCandidates.value = res.candidates || [];
  } catch (error) {
    console.error('Failed to fetch match candidates:', error);
  } finally {
    candidatesLoading.value = false;
  }
};

// 监听支付端选择变化
watch(selectedPaymentTx, (newVal) => {
  if (newVal) {
    fetchMatchCandidates(newVal.id);
  } else {
    matchCandidates.value = [];
    selectedDebitTx.value = null;
  }
});

// 选择候选
const selectCandidate = (candidate: MatchCandidate) => {
  selectedDebitTx.value = candidate.transaction;
};

// 获取置信度颜色
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#52c41a';
  if (confidence >= 0.6) return '#faad14';
  return '#ff4d4f';
};

// 获取置信度状态
const getConfidenceStatus = (confidence: number) => {
  if (confidence >= 0.8) return 'success';
  if (confidence >= 0.6) return 'normal';
  return 'exception';
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
      width="90vw"
      :style="{ maxWidth: '1200px' }"
      :body-style="{ maxHeight: '75vh', overflowY: 'auto' }"
      :ok-text="$t('detective.reconcile.manualMatch')"
      :ok-button-props="{
        disabled: !selectedPaymentTx || !selectedDebitTx,
        loading: manualMatchLoading,
      }"
      @ok="handleManualMatch"
    >
      <div class="flex flex-col gap-4">
        <!-- 上方：支付端交易选择 -->
        <Card
          :title="$t('detective.reconcile.selectPaymentTx')"
          size="small"
        >
          <div class="pb-4">
            <Space wrap>
              <DatePicker
                v-model:value="paymentFilter.date"
                :placeholder="$t('detective.transaction.transactionTime')"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                allow-clear
                size="small"
                style="width: 130px"
              />
              <InputNumber
                v-model:value="paymentFilter.amount"
                :placeholder="$t('detective.transaction.amount')"
                :precision="2"
                :min="0"
                allow-clear
                size="small"
                style="width: 100px"
              />
              <Input
                v-model:value="paymentFilter.merchant"
                :placeholder="$t('detective.transaction.merchant')"
                allow-clear
                size="small"
                style="width: 120px"
              />
            </Space>
          </div>
          <Table
            :columns="paymentTableColumns"
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
              <template v-if="column.key === 'matched'">
                <Tag v-if="record.matched" color="orange" size="small">
                  {{ $t('detective.reconcile.candidates.matched') }}
                </Tag>
                <Tag v-else color="green" size="small">
                  {{ $t('detective.reconcile.candidates.unmatched') }}
                </Tag>
              </template>
            </template>
          </Table>
        </Card>

        <!-- 下方：匹配候选区域 -->
        <Card size="small">
          <template #title>
            <div class="flex items-center justify-between">
              <span>{{ $t('detective.reconcile.candidates.title') }}</span>
              <span v-if="matchCandidates.length > 0" class="text-sm font-normal text-gray-500">
                {{ $t('detective.reconcile.candidates.total', { count: matchCandidates.length }) }}
              </span>
            </div>
          </template>

          <!-- 已选支付端摘要 -->
          <div v-if="selectedPaymentTx" class="mb-3 rounded p-3" :class="selectedPaymentTx.matched ? 'bg-orange-50' : 'bg-blue-50'">
            <div class="mb-1 flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ $t('detective.reconcile.selectedPayment') }}</span>
              <Tag v-if="selectedPaymentTx.matched" color="orange" size="small">
                {{ $t('detective.reconcile.candidates.matched') }}
              </Tag>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-red-500 font-medium">-¥{{ Number(selectedPaymentTx.amount).toFixed(2) }}</span>
              <span class="text-gray-600">{{ selectedPaymentTx.merchant_raw }}</span>
              <span class="text-gray-400 text-sm">{{ selectedPaymentTx.transaction_time }}</span>
            </div>
            <div v-if="selectedPaymentTx.matched" class="mt-2 text-xs text-orange-600">
              {{ $t('detective.reconcile.candidates.willReplace') }}
            </div>
          </div>

          <!-- 加载状态 -->
          <div v-if="candidatesLoading" class="flex items-center justify-center py-8">
            <Spin :tip="$t('detective.reconcile.candidates.loading')" />
          </div>

          <!-- 空状态 -->
          <Empty
            v-else-if="!selectedPaymentTx"
            :description="$t('detective.reconcile.candidates.emptyHint')"
            class="py-8"
          />
          <Empty
            v-else-if="matchCandidates.length === 0"
            :description="$t('detective.reconcile.candidates.empty')"
            class="py-8"
          />

          <!-- 候选列表 -->
          <div v-else class="grid gap-3 md:grid-cols-2">
            <div
              v-for="candidate in matchCandidates"
              :key="candidate.transaction.id"
              class="cursor-pointer rounded-lg border p-3 transition-all hover:border-blue-400 hover:shadow-md"
              :class="{
                'border-blue-500 bg-blue-50 shadow-md': selectedDebitTx?.id === candidate.transaction.id,
                'border-orange-300 bg-orange-50': candidate.transaction.matched && selectedDebitTx?.id !== candidate.transaction.id,
                'border-gray-200': !candidate.transaction.matched && selectedDebitTx?.id !== candidate.transaction.id,
              }"
              @click="selectCandidate(candidate)"
            >
              <!-- 候选卡片头部 -->
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Progress
                    type="circle"
                    :percent="Math.round(candidate.confidence * 100)"
                    :size="36"
                    :stroke-color="getConfidenceColor(candidate.confidence)"
                    :status="getConfidenceStatus(candidate.confidence)"
                  />
                  <span class="font-medium" :style="{ color: getConfidenceColor(candidate.confidence) }">
                    {{ Math.round(candidate.confidence * 100) }}%
                  </span>
                </div>
                <div class="flex items-center gap-1">
                  <Tag v-if="candidate.transaction.matched" color="orange">
                    {{ $t('detective.reconcile.candidates.matched') }}
                  </Tag>
                  <Tag v-if="selectedDebitTx?.id === candidate.transaction.id" color="blue">
                    {{ $t('detective.reconcile.candidates.selected') }}
                  </Tag>
                </div>
              </div>

              <!-- 已匹配提示 - 显示当前匹配的交易信息 -->
              <div v-if="candidate.transaction.matched && candidate.matched_transaction" class="mb-2 rounded bg-orange-100 p-2 text-xs">
                <div class="mb-1 text-orange-600 font-medium">{{ $t('detective.reconcile.candidates.currentMatch') }}</div>
                <div class="flex items-center gap-3 text-gray-600">
                  <span>¥{{ Number(candidate.matched_transaction.amount).toFixed(2) }}</span>
                  <span class="truncate">{{ candidate.matched_transaction.merchant_raw }}</span>
                  <span class="text-gray-400">{{ candidate.matched_transaction.transaction_time }}</span>
                </div>
                <div class="mt-1 text-orange-500">{{ $t('detective.reconcile.candidates.willReplace') }}</div>
              </div>
              <div v-else-if="candidate.transaction.matched" class="mb-2 rounded bg-orange-100 px-2 py-1 text-xs text-orange-600">
                {{ $t('detective.reconcile.candidates.willReplace') }}
              </div>

              <!-- 交易信息 -->
              <div class="mb-2 space-y-1 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500">{{ candidate.transaction.transaction_time }}</span>
                  <span class="text-red-500 font-medium">-¥{{ Number(candidate.transaction.amount).toFixed(2) }}</span>
                </div>
                <div class="text-gray-600 truncate">{{ candidate.transaction.merchant_raw }}</div>
                <div v-if="candidate.transaction.card_bank || candidate.transaction.card_last4" class="text-gray-400 text-xs">
                  {{ candidate.transaction.card_bank || '' }}
                  {{ candidate.transaction.card_last4 ? `(${candidate.transaction.card_last4})` : '' }}
                </div>
              </div>

              <!-- 评分详情 -->
              <div class="space-y-1 border-t pt-2">
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-16 text-gray-500">{{ $t('detective.reconcile.scoreDetail.time') }}</span>
                  <Progress :percent="Math.round(candidate.score_detail.time_score * 100)" :show-info="false" size="small" class="flex-1" />
                  <span class="w-8 text-right text-gray-600">{{ Math.round(candidate.score_detail.time_score * 100) }}%</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-16 text-gray-500">{{ $t('detective.reconcile.scoreDetail.amount') }}</span>
                  <Progress :percent="Math.round(candidate.score_detail.amount_score * 100)" :show-info="false" size="small" class="flex-1" />
                  <span class="w-8 text-right text-gray-600">{{ Math.round(candidate.score_detail.amount_score * 100) }}%</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-16 text-gray-500">{{ $t('detective.reconcile.scoreDetail.merchant') }}</span>
                  <Progress :percent="Math.round(candidate.score_detail.merchant_score * 100)" :show-info="false" size="small" class="flex-1" />
                  <span class="w-8 text-right text-gray-600">{{ Math.round(candidate.score_detail.merchant_score * 100) }}%</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-16 text-gray-500">{{ $t('detective.reconcile.scoreDetail.bankCard') }}</span>
                  <Progress :percent="Math.round(candidate.score_detail.bank_card_score * 100)" :show-info="false" size="small" class="flex-1" />
                  <span class="w-8 text-right text-gray-600">{{ Math.round(candidate.score_detail.bank_card_score * 100) }}%</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="w-16 text-gray-500">{{ $t('detective.reconcile.scoreDetail.channel') }}</span>
                  <Progress :percent="Math.round(candidate.score_detail.channel_score * 100)" :show-info="false" size="small" class="flex-1" />
                  <span class="w-8 text-right text-gray-600">{{ Math.round(candidate.score_detail.channel_score * 100) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  </Page>
</template>
