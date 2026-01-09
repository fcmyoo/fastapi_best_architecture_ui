<script setup lang="ts">
import type {
  CreditCardBill,
  CreditCardBillListParams,
  CreditCardTransaction,
  CreditCardTransactionsParams,
} from '#/plugins/detective/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  CreditCardOutlined,
  DownOutlined,
  MailOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Upload,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  fetchEmailBillsApi,
  getCreditCardBillListApi,
  getCreditCardTransactionsApi,
  parseEmailBillApi,
} from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveCreditCardList' });

const loading = ref(false);
const dataSource = ref<CreditCardBill[]>([]);

const searchParams = reactive<CreditCardBillListParams>({
  bank_code: undefined,
  payment_status: undefined,
});

const paymentStatusOptions = [
  {
    label: $t('detective.creditCard.paymentStatusOptions.unpaid'),
    value: 'unpaid',
  },
  {
    label: $t('detective.creditCard.paymentStatusOptions.partial'),
    value: 'partial',
  },
  {
    label: $t('detective.creditCard.paymentStatusOptions.paid'),
    value: 'paid',
  },
];

const columns = [
  {
    title: $t('detective.creditCard.bankName'),
    key: 'bank_info',
    width: 180,
  },
  {
    title: $t('detective.creditCard.statementMonth'),
    dataIndex: 'statement_month',
    key: 'statement_month',
    width: 100,
  },
  {
    title: $t('detective.creditCard.billingCycle'),
    key: 'billing_cycle',
    width: 200,
  },
  {
    title: $t('detective.creditCard.billAmount'),
    dataIndex: 'bill_amount',
    key: 'bill_amount',
    width: 120,
    align: 'right' as const,
  },
  {
    title: $t('detective.creditCard.dueDate'),
    dataIndex: 'due_date',
    key: 'due_date',
    width: 120,
  },
  {
    title: $t('detective.creditCard.paymentStatus'),
    key: 'payment_status',
    width: 100,
  },
  {
    title: $t('detective.creditCard.transactionCount'),
    key: 'tx_count',
    width: 100,
  },
  {
    title: $t('detective.creditCard.createdTime'),
    dataIndex: 'created_time',
    key: 'created_time',
    width: 180,
  },
];

const getPaymentStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    unpaid: 'error',
    partial: 'warning',
    paid: 'success',
  };
  return colorMap[status] || 'default';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getCreditCardBillListApi(searchParams);
    dataSource.value = res || [];
  } catch (error) {
    console.error('Failed to fetch credit card bills:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchData();
};

const handleReset = () => {
  searchParams.bank_code = undefined;
  searchParams.payment_status = undefined;
  fetchData();
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

const formatAmount = (amount: number | string) => {
  return `¥${Number(amount).toFixed(2)}`;
};

// 邮件导入
const emailImportModalVisible = ref(false);
const uploading = ref(false);

// 邮箱收取
const fetching = ref(false);
const fetchMonthsOptions = [
  { label: $t('detective.creditCard.fetchMonths.3'), value: 3 },
  { label: $t('detective.creditCard.fetchMonths.6'), value: 6 },
  { label: $t('detective.creditCard.fetchMonths.12'), value: 12 },
  { label: $t('detective.creditCard.fetchMonths.24'), value: 24 },
];

const handleFetchFromEmail = async (months: number) => {
  fetching.value = true;
  try {
    const res = await fetchEmailBillsApi(months);
    message.success(res.message || $t('detective.creditCard.fetchStarted'));
    setTimeout(() => fetchData(), 3000);
  } catch (error: any) {
    if (error?.response?.status === 403) {
      message.error($t('detective.creditCard.fetchConfigError'));
    } else {
      message.error($t('detective.creditCard.fetchFailed'));
    }
  } finally {
    fetching.value = false;
  }
};

const handleEmailImport = async (options: any) => {
  const { file } = options;
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    await parseEmailBillApi(formData);
    message.success($t('detective.creditCard.importSuccess'));
    emailImportModalVisible.value = false;
    fetchData();
  } catch {
    message.error($t('detective.creditCard.importFailed'));
  } finally {
    uploading.value = false;
  }
};

// 交易明细弹窗
const transactionsModalVisible = ref(false);
const transactionsLoading = ref(false);
const currentBill = ref<CreditCardBill | null>(null);
const transactions = ref<CreditCardTransaction[]>([]);
const transactionsPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});
const transactionsFilter = reactive<CreditCardTransactionsParams>({
  direction: undefined,
});

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

const transactionColumns = [
  {
    title: $t('detective.transaction.transactionTime'),
    dataIndex: 'transaction_time',
    key: 'transaction_time',
    width: 180,
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
    title: $t('detective.transaction.matched'),
    dataIndex: 'matched',
    key: 'matched',
    width: 80,
  },
];

const getDirectionColor = (direction: string) => {
  return direction === 'expense' ? 'red' : 'green';
};

const formatTxAmount = (amount: number | string, direction: string) => {
  const prefix = direction === 'expense' ? '-' : '+';
  return `${prefix}¥${Number(amount).toFixed(2)}`;
};

const handleRowClick = (record: CreditCardBill) => {
  currentBill.value = record;
  transactionsPagination.current = 1;
  transactionsFilter.direction = undefined;
  transactionsModalVisible.value = true;
  fetchTransactions();
};

const fetchTransactions = async () => {
  if (!currentBill.value) return;
  transactionsLoading.value = true;
  try {
    const res = await getCreditCardTransactionsApi(currentBill.value.id, {
      ...transactionsFilter,
      page: transactionsPagination.current,
      size: transactionsPagination.pageSize,
    });
    transactions.value = res.items || [];
    transactionsPagination.total = res.total || 0;
  } catch {
    transactionsModalVisible.value = false;
    fetchData();
  } finally {
    transactionsLoading.value = false;
  }
};

const handleTransactionsTableChange = (pag: any) => {
  transactionsPagination.current = pag.current;
  transactionsPagination.pageSize = pag.pageSize;
  fetchTransactions();
};

const handleDirectionFilterChange = () => {
  transactionsPagination.current = 1;
  fetchTransactions();
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.creditCard.title')">
    <div class="mb-4 flex items-center justify-between">
      <Space>
        <Select
          v-model:value="searchParams.payment_status"
          :placeholder="$t('detective.creditCard.paymentStatus')"
          :options="paymentStatusOptions"
          allow-clear
          style="width: 120px"
        />
        <Button type="primary" @click="handleSearch">
          {{ $t('common.search') }}
        </Button>
        <Button @click="handleReset">
          {{ $t('common.reset') }}
        </Button>
      </Space>
      <Space>
        <Button @click="fetchData">
          <template #icon><ReloadOutlined /></template>
          {{ $t('common.refresh') }}
        </Button>
        <Dropdown :disabled="fetching">
          <Button :loading="fetching">
            <MailOutlined />
            {{ $t('detective.creditCard.fetchFromEmail') }}
            <DownOutlined />
          </Button>
          <template #overlay>
            <Menu>
              <MenuItem
                v-for="opt in fetchMonthsOptions"
                :key="opt.value"
                @click="handleFetchFromEmail(opt.value)"
              >
                {{ opt.label }}
              </MenuItem>
            </Menu>
          </template>
        </Dropdown>
        <Button type="primary" @click="emailImportModalVisible = true">
          <template #icon><MailOutlined /></template>
          {{ $t('detective.creditCard.import') }}
        </Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1200 }"
      row-key="id"
      :row-class-name="() => 'cursor-pointer hover:bg-gray-50'"
      :custom-row="
        (record: CreditCardBill) => ({ onClick: () => handleRowClick(record) })
      "
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'bank_info'">
          <Space>
            <CreditCardOutlined />
            <span>{{ record.bank_name }}</span>
            <span class="text-gray-400">(*{{ record.card_last4 }})</span>
          </Space>
        </template>
        <template v-if="column.key === 'billing_cycle'">
          <template v-if="record.billing_cycle_start">
            {{ record.billing_cycle_start }} ~ {{ record.billing_cycle_end }}
          </template>
          <span v-else class="text-gray-400">-</span>
        </template>
        <template v-if="column.key === 'bill_amount'">
          <span class="font-medium text-red-500">
            {{ formatAmount(record.bill_amount) }}
          </span>
        </template>
        <template v-if="column.key === 'payment_status'">
          <Tag :color="getPaymentStatusColor(record.payment_status)">
            {{
              paymentStatusOptions.find(
                (o) => o.value === record.payment_status,
              )?.label || record.payment_status
            }}
          </Tag>
        </template>
        <template v-if="column.key === 'tx_count'">
          <Tooltip>
            <template #title>
              {{ $t('detective.creditCard.parsedCount') }}:
              {{ record.parsed_count }}<br />
              {{ $t('detective.creditCard.savedCount') }}:
              {{ record.saved_count }}
            </template>
            <span class="text-green-600">{{ record.saved_count }}</span>
            <span class="text-gray-400"> / {{ record.parsed_count }}</span>
          </Tooltip>
        </template>
        <template v-if="column.key === 'created_time'">
          {{ formatDateTime(record.created_time) }}
        </template>
      </template>
    </Table>

    <!-- 邮件导入弹窗 -->
    <Modal
      v-model:open="emailImportModalVisible"
      :title="$t('detective.creditCard.import')"
      :footer="null"
    >
      <div class="py-4">
        <Upload
          :custom-request="handleEmailImport"
          :show-upload-list="false"
          accept=".eml"
        >
          <Button type="primary" :loading="uploading" block>
            <template #icon><MailOutlined /></template>
            {{ $t('detective.creditCard.selectEmlFile') }}
          </Button>
        </Upload>
        <p class="mt-2 text-center text-gray-400">
          {{ $t('detective.creditCard.importTip') }}
        </p>
      </div>
    </Modal>

    <!-- 交易明细弹窗 -->
    <Modal
      v-model:open="transactionsModalVisible"
      :title="
        currentBill
          ? `${currentBill.bank_name} ${currentBill.statement_month} - ${$t('detective.creditCard.transactions')}`
          : $t('detective.creditCard.transactions')
      "
      width="900px"
      :footer="null"
    >
      <div class="mb-4">
        <Space>
          <Select
            v-model:value="transactionsFilter.direction"
            :placeholder="$t('detective.transaction.direction')"
            :options="directionOptions"
            allow-clear
            style="width: 120px"
            @change="handleDirectionFilterChange"
          />
          <span class="text-gray-500">
            {{ $t('common.total') }}: {{ transactionsPagination.total }}
          </span>
        </Space>
      </div>
      <Table
        :columns="transactionColumns"
        :data-source="transactions"
        :loading="transactionsLoading"
        :pagination="transactionsPagination"
        :scroll="{ x: 700, y: 400 }"
        row-key="id"
        size="small"
        @change="handleTransactionsTableChange"
      >
        <template #bodyCell="{ column, record }">
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
                record.direction === 'expense'
                  ? 'text-red-500'
                  : 'text-green-500'
              "
            >
              {{ formatTxAmount(record.amount, record.direction) }}
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
        </template>
      </Table>
    </Modal>
  </Page>
</template>
