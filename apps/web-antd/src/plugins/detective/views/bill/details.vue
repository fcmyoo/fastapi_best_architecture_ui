<script setup lang="ts">
import type {
  BillDetailItem,
  BillDetailListParams,
} from '#/plugins/detective/api';

import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  CheckCircleFilled,
  LinkOutlined,
  MinusCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import { getBillDetailListApi } from '#/plugins/detective/api';
import {
  formatTimeDisplay,
  getMatchStatusColor,
  getSourceDisplayName,
  getSourceDotClass,
} from '#/plugins/detective/utils/source';

import ManualMatchModal from './components/ManualMatchModal.vue';

defineOptions({ name: 'DetectiveBillDetails' });

const router = useRouter();
const loading = ref(false);
const dataSource = ref<BillDetailItem[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

// 合并筛选状态：unmatched=未匹配，其他为 match_status 值
const searchParams = reactive<
  Omit<BillDetailListParams, 'match_status' | 'matched'> & {
    combined_status?: string;
  }
>({
  statement_month: undefined,
  source: undefined,
  source_type: undefined,
  direction: undefined,
  combined_status: undefined,
  min_amount: undefined,
  max_amount: undefined,
  keyword: undefined,
  min_confidence: undefined,
  max_confidence: undefined,
});

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

// 合并的匹配状态选项：未匹配 + 待审核 + 已确认 + 已拒绝
const combinedStatusOptions = [
  {
    label: $t('detective.transaction.matchedOptions.false'),
    value: 'unmatched',
  },
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
    width: 120,
  },
  {
    title: $t('detective.transaction.source'),
    dataIndex: 'source',
    key: 'source',
    width: 130,
  },
  {
    title: $t('detective.transaction.merchant'),
    dataIndex: 'merchant_raw',
    key: 'merchant_raw',
    ellipsis: true,
  },
  {
    title: $t('detective.transaction.amount'),
    dataIndex: 'amount',
    key: 'amount',
    width: 110,
    align: 'right' as const,
  },
  {
    title: $t('detective.transaction.matched'),
    key: 'match_info',
    width: 150,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 130,
    fixed: 'right' as const,
  },
];

const formatAmount = (amount: number | string, direction: string) => {
  const prefix = direction === 'expense' ? '-' : '+';
  return `${prefix}¥${Number(amount).toFixed(2)}`;
};

// 获取来源副标题（卡号后四位或支付方式）
const getSourceSubtitle = (record: BillDetailItem) => {
  if (record.source === 'wechat' || record.source === 'alipay') {
    return record.card_last4 || record.payment_method || '';
  }
  return record.card_last4 || '';
};

const fetchData = async () => {
  loading.value = true;
  try {
    // 处理合并的状态筛选
    let matchedValue: boolean | undefined;
    let matchStatusValue: string | undefined;
    if (searchParams.combined_status === 'unmatched') {
      matchedValue = false;
    } else if (searchParams.combined_status) {
      matchedValue = true;
      matchStatusValue = searchParams.combined_status;
    }
    const params = {
      statement_month: searchParams.statement_month,
      source: searchParams.source,
      source_type: searchParams.source_type,
      direction: searchParams.direction,
      matched: matchedValue,
      match_status: matchStatusValue,
      min_amount: searchParams.min_amount,
      max_amount: searchParams.max_amount,
      keyword: searchParams.keyword,
      min_confidence: searchParams.min_confidence,
      max_confidence: searchParams.max_confidence,
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
    combined_status: undefined,
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
  router.push({
    path: `/detective/bill/detail/${record.id}`,
    state: {
      confidence: record.confidence,
      match_status: record.match_status,
    },
  });
};

// 手动匹配弹窗
const matchModalVisible = ref(false);
const matchingTransaction = ref<BillDetailItem | null>(null);

const handleOpenMatchModal = (record: BillDetailItem) => {
  matchingTransaction.value = record;
  matchModalVisible.value = true;
};

const handleMatchSuccess = () => {
  fetchData();
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
          v-model:value="searchParams.combined_status"
          :placeholder="$t('detective.reconcile.matchStatus')"
          :options="combinedStatusOptions"
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
      :scroll="{ x: 900 }"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <!-- 交易时间：年月日 + 时分秒双行 -->
        <template v-if="column.key === 'transaction_time'">
          <div class="flex flex-col">
            <span>{{ formatTimeDisplay(record.transaction_time).date }}</span>
            <span
              v-if="formatTimeDisplay(record.transaction_time).time"
              class="text-xs text-gray-400"
            >
              {{ formatTimeDisplay(record.transaction_time).time }}
            </span>
          </div>
        </template>
        <!-- 来源：彩色圆点 + 银行名/来源名 + 卡号/支付方式 -->
        <template v-if="column.key === 'source'">
          <div class="flex items-center gap-2">
            <span
              :class="getSourceDotClass(record.source)"
              class="h-2 w-2 shrink-0 rounded-full"
            ></span>
            <div class="flex flex-col">
              <span>{{
                getSourceDisplayName(record.source, record.card_bank)
              }}</span>
              <span
                v-if="getSourceSubtitle(record as BillDetailItem)"
                class="text-xs text-gray-400"
              >
                {{ getSourceSubtitle(record as BillDetailItem) }}
              </span>
            </div>
          </div>
        </template>
        <!-- 商户：商户名 + 描述/分类双行 -->
        <template v-if="column.key === 'merchant_raw'">
          <div class="flex flex-col">
            <span class="truncate" :title="record.merchant_raw">
              {{ record.merchant_raw || '-' }}
            </span>
            <span
              v-if="record.description || record.category"
              class="truncate text-xs text-gray-400"
              :title="record.description || record.category"
            >
              {{ record.description || record.category }}
            </span>
          </div>
        </template>
        <!-- 金额：带收支颜色 -->
        <template v-if="column.key === 'amount'">
          <span
            :class="
              record.direction === 'expense' ? 'text-red-500' : 'text-green-500'
            "
          >
            {{ formatAmount(record.amount, record.direction) }}
          </span>
        </template>
        <!-- 匹配状态：图标 + 置信度 + 状态标签 -->
        <template v-if="column.key === 'match_info'">
          <div class="flex items-center gap-1">
            <CheckCircleFilled v-if="record.matched" class="text-green-500" />
            <MinusCircleOutlined v-else class="text-gray-300" />
            <span
              v-if="
                record.confidence !== undefined && record.confidence !== null
              "
              class="text-xs"
            >
              {{ (record.confidence * 100).toFixed(0) }}%
            </span>
            <Tag
              v-if="record.matched"
              :color="getMatchStatusColor(record.match_status)"
              class="ml-1"
            >
              {{
                combinedStatusOptions.find(
                  (o) => o.value === record.match_status,
                )?.label || record.match_status
              }}
            </Tag>
            <Tag v-else color="default" class="ml-1">
              {{ $t('detective.transaction.matchedOptions.false') }}
            </Tag>
          </div>
        </template>
        <!-- 操作 -->
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              v-if="!record.matched"
              type="link"
              size="small"
              @click="handleOpenMatchModal(record as BillDetailItem)"
            >
              <template #icon><LinkOutlined /></template>
              {{ $t('detective.reconcile.match') }}
            </Button>
            <Button
              type="link"
              size="small"
              @click="handleViewDetail(record as BillDetailItem)"
            >
              {{ $t('common.detail') }}
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <!-- 手动匹配弹窗 -->
    <ManualMatchModal
      v-model:open="matchModalVisible"
      :transaction="matchingTransaction"
      @success="handleMatchSuccess"
    />
  </Page>
</template>
