<script setup lang="ts">
import type {
  CashOutMerchant,
  ScanSummary,
  ScanTransactionItem,
} from '#/plugins/detective/api';

import { computed, ref, watch } from 'vue';

import {
  Card,
  Checkbox,
  message,
  Modal,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { $t } from '#/locales';
import { batchTagApi, scanTransactionsApi } from '#/plugins/detective/api';

const props = defineProps<{
  merchant: CashOutMerchant | null;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'success'): void;
  (e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const scanLoading = ref(false);
const creditTransactions = ref<ScanTransactionItem[]>([]);
const incomeTransactions = ref<ScanTransactionItem[]>([]);
const summary = ref<null | ScanSummary>(null);
const selectedCreditKeys = ref<number[]>([]);
const selectedIncomeKeys = ref<number[]>([]);

// 所有已选交易ID
const allSelectedKeys = computed(() => [
  ...selectedCreditKeys.value,
  ...selectedIncomeKeys.value,
]);

// 已选交易统计
const selectionStats = computed(() => {
  const creditSelected = creditTransactions.value.filter((item) =>
    selectedCreditKeys.value.includes(item.transaction_id),
  );
  const incomeSelected = incomeTransactions.value.filter((item) =>
    selectedIncomeKeys.value.includes(item.transaction_id),
  );
  const creditAmount = creditSelected.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  const incomeAmount = incomeSelected.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  );
  return {
    count: creditSelected.length + incomeSelected.length,
    creditAmount,
    creditCount: creditSelected.length,
    incomeAmount,
    incomeCount: incomeSelected.length,
  };
});

// 表格列定义
const columns = [
  {
    dataIndex: 'transaction_time',
    title: $t('detective.transaction.transactionTime'),
    width: 140,
  },
  {
    dataIndex: 'merchant_raw',
    ellipsis: true,
    title: $t('detective.transaction.merchant'),
    width: 150,
  },
  {
    dataIndex: 'amount',
    title: $t('detective.transaction.amount'),
    width: 100,
  },
  {
    dataIndex: 'card_bank',
    title: $t('detective.transaction.cardBank'),
    width: 80,
  },
  {
    dataIndex: 'card_last4',
    title: $t('detective.transaction.cardLast4'),
    width: 80,
  },
  {
    dataIndex: 'is_tagged',
    title: $t('detective.cashOut.tagStatus'),
    width: 80,
  },
];

// 加载扫描结果
const loadScanResults = async () => {
  if (!props.merchant) return;
  scanLoading.value = true;
  try {
    const res = await scanTransactionsApi(props.merchant.id);
    creditTransactions.value = res.credit_transactions || [];
    incomeTransactions.value = res.income_transactions || [];
    summary.value = res.summary || null;
    selectedCreditKeys.value = [];
    selectedIncomeKeys.value = [];
  } catch (error) {
    console.error('Failed to scan transactions:', error);
  } finally {
    scanLoading.value = false;
  }
};

// 监听弹窗打开
watch(
  () => props.open,
  (val) => {
    if (val && props.merchant) {
      loadScanResults();
    } else {
      creditTransactions.value = [];
      incomeTransactions.value = [];
      summary.value = null;
      selectedCreditKeys.value = [];
      selectedIncomeKeys.value = [];
    }
  },
);

// 批量标注
const handleBatchTag = async () => {
  if (!props.merchant || allSelectedKeys.value.length === 0) return;
  loading.value = true;
  try {
    const res = await batchTagApi(props.merchant.id, {
      transaction_ids: allSelectedKeys.value,
    });
    message.success(
      $t('detective.cashOut.batchTagSuccess', {
        count: res.tagged_count,
        credit: res.credit_count,
        income: res.income_count,
      }),
    );
    emit('update:open', false);
    emit('success');
  } catch (error) {
    console.error('Failed to batch tag:', error);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit('update:open', false);
};

// 刷卡交易行选择配置
const creditRowSelection = computed(() => ({
  getCheckboxProps: (record: ScanTransactionItem) => ({
    disabled: record.is_tagged,
    name: String(record.transaction_id),
  }),
  onChange: (keys: (number | string)[]) => {
    selectedCreditKeys.value = keys.map(Number);
  },
  selectedRowKeys: selectedCreditKeys.value,
}));

// 回款交易行选择配置
const incomeRowSelection = computed(() => ({
  getCheckboxProps: (record: ScanTransactionItem) => ({
    disabled: record.is_tagged,
    name: String(record.transaction_id),
  }),
  onChange: (keys: (number | string)[]) => {
    selectedIncomeKeys.value = keys.map(Number);
  },
  selectedRowKeys: selectedIncomeKeys.value,
}));

// 全选未标注的刷卡交易
const selectAllUntaggedCredit = (checked: boolean) => {
  selectedCreditKeys.value = checked
    ? creditTransactions.value
        .filter((item) => !item.is_tagged)
        .map((item) => item.transaction_id)
    : [];
};

// 全选未标注的回款交易
const selectAllUntaggedIncome = (checked: boolean) => {
  selectedIncomeKeys.value = checked
    ? incomeTransactions.value
        .filter((item) => !item.is_tagged)
        .map((item) => item.transaction_id)
    : [];
};

// 计算是否全选
const isAllCreditSelected = computed(() => {
  const untagged = creditTransactions.value.filter((item) => !item.is_tagged);
  return (
    untagged.length > 0 && selectedCreditKeys.value.length === untagged.length
  );
});

const isAllIncomeSelected = computed(() => {
  const untagged = incomeTransactions.value.filter((item) => !item.is_tagged);
  return (
    untagged.length > 0 && selectedIncomeKeys.value.length === untagged.length
  );
});
</script>

<template>
  <Modal
    :open="open"
    :title="`${$t('detective.cashOut.scanMatch')} - ${merchant?.name || ''}`"
    :confirm-loading="loading"
    :ok-button-props="{ disabled: allSelectedKeys.length === 0 }"
    :ok-text="$t('detective.cashOut.batchTag')"
    width="950px"
    @cancel="handleCancel"
    @ok="handleBatchTag"
  >
    <Spin :spinning="scanLoading">
      <!-- 统计汇总 -->
      <div v-if="summary" class="mb-4 grid grid-cols-4 gap-4">
        <Card size="small">
          <Statistic
            :title="$t('detective.cashOut.creditAmount')"
            :value="summary.credit_amount"
            prefix="¥"
            :value-style="{ color: '#cf1322' }"
          />
          <div class="text-xs text-gray-400">
            {{ summary.credit_count }}
            {{ $t('detective.cashOut.transactions') }}
          </div>
        </Card>
        <Card size="small">
          <Statistic
            :title="$t('detective.cashOut.transferAmount')"
            :value="summary.income_amount"
            prefix="¥"
            :value-style="{ color: '#3f8600' }"
          />
          <div class="text-xs text-gray-400">
            {{ summary.income_count }}
            {{ $t('detective.cashOut.transactions') }}
          </div>
        </Card>
        <Card size="small">
          <Statistic
            :title="$t('detective.cashOut.tagged')"
            :value="summary.tagged_count"
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
        <Card size="small">
          <Statistic
            :title="$t('detective.cashOut.untagged')"
            :value="summary.untagged_count"
            :value-style="{ color: '#faad14' }"
          />
        </Card>
      </div>

      <!-- 套现刷卡区域 -->
      <div class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <Typography.Text strong>
            {{ $t('detective.cashOut.cashAdvance') }}
            <Tag color="red" class="ml-2">{{ creditTransactions.length }}</Tag>
          </Typography.Text>
          <Checkbox
            v-if="creditTransactions.some((t) => !t.is_tagged)"
            :checked="isAllCreditSelected"
            @change="
              (e: Event) =>
                selectAllUntaggedCredit((e.target as HTMLInputElement).checked)
            "
          >
            {{ $t('detective.cashOut.selectAllUntagged') }}
          </Checkbox>
        </div>
        <Table
          :columns="columns"
          :data-source="creditTransactions"
          :pagination="false"
          :row-key="(record: ScanTransactionItem) => record.transaction_id"
          :row-selection="creditRowSelection"
          :scroll="{ y: 200 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'transaction_time'">
              {{ dayjs(record.transaction_time).format('YYYY-MM-DD HH:mm') }}
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <span class="text-red-500">
                -¥{{ Number(record.amount).toFixed(2) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'is_tagged'">
              <Tag v-if="record.is_tagged" color="success">
                {{ $t('detective.cashOut.tagged') }}
              </Tag>
              <Tag v-else color="default">
                {{ $t('detective.cashOut.untagged') }}
              </Tag>
            </template>
          </template>
        </Table>
      </div>

      <!-- 套现回款区域 -->
      <div class="mb-4">
        <div class="mb-2 flex items-center justify-between">
          <Typography.Text strong>
            {{ $t('detective.cashOut.cashAdvanceIncome') }}
            <Tag color="green" class="ml-2">
              {{ incomeTransactions.length }}
            </Tag>
          </Typography.Text>
          <Checkbox
            v-if="incomeTransactions.some((t) => !t.is_tagged)"
            :checked="isAllIncomeSelected"
            @change="
              (e: Event) =>
                selectAllUntaggedIncome((e.target as HTMLInputElement).checked)
            "
          >
            {{ $t('detective.cashOut.selectAllUntagged') }}
          </Checkbox>
        </div>
        <Table
          :columns="columns"
          :data-source="incomeTransactions"
          :pagination="false"
          :row-key="(record: ScanTransactionItem) => record.transaction_id"
          :row-selection="incomeRowSelection"
          :scroll="{ y: 200 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'transaction_time'">
              {{ dayjs(record.transaction_time).format('YYYY-MM-DD HH:mm') }}
            </template>
            <template v-else-if="column.dataIndex === 'amount'">
              <span class="text-green-500">
                +¥{{ Number(record.amount).toFixed(2) }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'is_tagged'">
              <Tag v-if="record.is_tagged" color="success">
                {{ $t('detective.cashOut.tagged') }}
              </Tag>
              <Tag v-else color="default">
                {{ $t('detective.cashOut.untagged') }}
              </Tag>
            </template>
          </template>
        </Table>
      </div>

      <!-- 选择统计 -->
      <div
        v-if="selectionStats.count > 0"
        class="mt-3 flex items-center justify-between rounded bg-gray-50 p-3"
      >
        <Typography.Text>
          {{ $t('detective.cashOut.selected') }}:
          <strong>{{ selectionStats.count }}</strong>
          {{ $t('detective.cashOut.transactions') }}
          ({{ $t('detective.cashOut.cashAdvance') }}:
          {{ selectionStats.creditCount }},
          {{ $t('detective.cashOut.cashAdvanceIncome') }}:
          {{ selectionStats.incomeCount }})
        </Typography.Text>
        <div class="flex gap-4">
          <Typography.Text type="danger">
            {{ $t('detective.cashOut.creditAmount') }}: ¥{{
              selectionStats.creditAmount.toFixed(2)
            }}
          </Typography.Text>
          <Typography.Text type="success">
            {{ $t('detective.cashOut.transferAmount') }}: ¥{{
              selectionStats.incomeAmount.toFixed(2)
            }}
          </Typography.Text>
        </div>
      </div>

      <!-- 空数据提示 -->
      <div
        v-if="
          !scanLoading &&
          creditTransactions.length === 0 &&
          incomeTransactions.length === 0
        "
        class="py-8 text-center text-gray-400"
      >
        {{ $t('detective.cashOut.noScanResult') }}
      </div>
    </Spin>
  </Modal>
</template>
