<script setup lang="ts">
import type {
  BillDetailItem,
  BillFile,
  BillListParams,
  BillTransactionsParams,
} from '#/plugins/detective/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  PlayCircleOutlined,
  RedoOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  getBillListApi,
  getBillStatusApi,
  getBillTransactionsApi,
  parseBillApi,
  uploadBillApi,
} from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveBillList' });

const loading = ref(false);
const dataSource = ref<BillFile[]>([]);

const searchParams = reactive<BillListParams>({
  source: undefined,
  status: undefined,
});

const uploadModalVisible = ref(false);
const uploading = ref(false);
const uploadForm = reactive({
  source: 'wechat',
  forceReparse: false,
  file: null as File | null,
  password: '',
});

const needPassword = computed(() => {
  const isZip = uploadForm.file?.name.endsWith('.zip');
  const isWechatOrAlipay = ['alipay', 'wechat'].includes(uploadForm.source);
  return isZip && isWechatOrAlipay;
});

const resetUploadForm = () => {
  uploadForm.file = null;
  uploadForm.password = '';
  uploadForm.forceReparse = false;
};

const sourceOptions = [
  { label: $t('detective.bill.sourceOptions.wechat'), value: 'wechat' },
  { label: $t('detective.bill.sourceOptions.alipay'), value: 'alipay' },
  { label: $t('detective.bill.sourceOptions.bank'), value: 'bank' },
];

const statusOptions = [
  { label: $t('detective.bill.statusOptions.pending'), value: 'pending' },
  { label: $t('detective.bill.statusOptions.processing'), value: 'processing' },
  { label: $t('detective.bill.statusOptions.parsed'), value: 'parsed' },
  { label: $t('detective.bill.statusOptions.failed'), value: 'failed' },
];

const columns = [
  {
    title: $t('detective.bill.filename'),
    dataIndex: 'filename',
    key: 'filename',
    ellipsis: true,
  },
  {
    title: $t('detective.bill.source'),
    dataIndex: 'source',
    key: 'source',
    width: 100,
  },
  {
    title: $t('detective.bill.statementMonth'),
    dataIndex: 'statement_month',
    key: 'statement_month',
    width: 100,
  },
  {
    title: $t('detective.bill.status'),
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: $t('detective.bill.totalRows'),
    key: 'rows',
    width: 150,
  },
  {
    title: $t('detective.bill.createdTime'),
    dataIndex: 'created_time',
    key: 'created_time',
    width: 180,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 150,
    fixed: 'right' as const,
  },
];

const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    pending: 'default',
    processing: 'processing',
    parsed: 'success',
    success: 'success',
    failed: 'error',
  };
  return colorMap[status] || 'default';
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getBillListApi({ ...searchParams, type: 'upload' });
    dataSource.value = res || [];
  } catch (error) {
    console.error('Failed to fetch bills:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  fetchData();
};

const handleReset = () => {
  searchParams.source = undefined;
  searchParams.status = undefined;
  fetchData();
};

const handleBeforeUpload = (file: File) => {
  uploadForm.file = file;
  return false;
};

const handleConfirmUpload = async () => {
  if (!uploadForm.file) return;
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    const params: {
      force_reparse?: boolean;
      password?: string;
      source: string;
    } = {
      source: uploadForm.source,
    };
    if (needPassword.value && uploadForm.password) {
      params.password = uploadForm.password;
    }
    if (uploadForm.forceReparse) {
      params.force_reparse = true;
    }
    await uploadBillApi(formData, params);
    message.success($t('detective.bill.uploadSuccess'));
    resetUploadForm();
    uploadModalVisible.value = false;
    fetchData();
  } catch {
    message.error($t('detective.bill.uploadFailed'));
  } finally {
    uploading.value = false;
  }
};

const handleReupload = (record: BillFile) => {
  uploadForm.source = record.source;
  uploadForm.forceReparse = true;
  uploadModalVisible.value = true;
};

const handleParse = async (record: BillFile) => {
  try {
    await parseBillApi(record.id);
    message.success($t('detective.bill.parsing'));
    pollParseStatus(record.id);
  } catch {
    message.error($t('detective.bill.parseFailed'));
  }
};

const pollParseStatus = async (billId: number) => {
  const poll = async () => {
    try {
      const status = await getBillStatusApi(billId);
      if (status.status === 'processing') {
        setTimeout(poll, 2000);
      } else {
        fetchData();
        if (status.status === 'success' || status.status === 'parsed') {
          message.success($t('detective.bill.parseSuccess'));
        } else if (status.status === 'failed') {
          message.error($t('detective.bill.parseFailed'));
        }
      }
    } catch (error) {
      console.error('Failed to poll status:', error);
    }
  };
  poll();
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('zh-CN');
};

// 交易明细弹窗
const transactionsModalVisible = ref(false);
const transactionsLoading = ref(false);
const currentBill = ref<BillFile | null>(null);
const transactions = ref<BillDetailItem[]>([]);
const transactionsPagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});
const transactionsFilter = reactive<BillTransactionsParams>({
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

const formatAmount = (amount: number | string, direction: string) => {
  const prefix = direction === 'expense' ? '-' : '+';
  return `${prefix}¥${Number(amount).toFixed(2)}`;
};

const handleRowClick = (record: BillFile) => {
  if (record.status !== 'parsed') return;
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
    const res = await getBillTransactionsApi(currentBill.value.id, {
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
  <Page :title="$t('detective.bill.title')">
    <div class="mb-4 flex items-center justify-between">
      <Space>
        <Select
          v-model:value="searchParams.source"
          :placeholder="$t('detective.bill.source')"
          :options="sourceOptions"
          allow-clear
          style="width: 120px"
        />
        <Select
          v-model:value="searchParams.status"
          :placeholder="$t('detective.bill.status')"
          :options="statusOptions"
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
        <Button type="primary" @click="uploadModalVisible = true">
          <template #icon><UploadOutlined /></template>
          {{ $t('detective.bill.upload') }}
        </Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1000 }"
      row-key="id"
      :row-class-name="
        (record: BillFile) =>
          record.status === 'parsed' ? 'cursor-pointer hover:bg-gray-50' : ''
      "
      :custom-row="
        (record: BillFile) => ({ onClick: () => handleRowClick(record) })
      "
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'source'">
          {{
            sourceOptions.find((o) => o.value === record.source)?.label ||
            record.source
          }}
        </template>
        <template v-if="column.key === 'status'">
          <Tag :color="getStatusColor(record.status)">
            {{
              statusOptions.find((o) => o.value === record.status)?.label ||
              record.status
            }}
          </Tag>
        </template>
        <template v-if="column.key === 'rows'">
          <span class="text-green-600">{{ record.success_rows }}</span>
          <span v-if="record.failed_rows > 0" class="text-red-500">
            / {{ record.failed_rows }}
          </span>
          <span class="text-gray-400"> / {{ record.total_rows }}</span>
        </template>
        <template v-if="column.key === 'created_time'">
          {{ formatDateTime(record.created_time) }}
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button
              v-if="record.status === 'pending'"
              type="link"
              size="small"
              @click.stop="handleParse(record as BillFile)"
            >
              <template #icon><PlayCircleOutlined /></template>
              {{ $t('detective.bill.parse') }}
            </Button>
            <Popconfirm
              :title="$t('detective.bill.reuploadConfirm')"
              @confirm="handleReupload(record as BillFile)"
            >
              <Button type="link" size="small" @click.stop>
                <template #icon><RedoOutlined /></template>
                {{ $t('detective.bill.reupload') }}
              </Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="uploadModalVisible"
      :title="$t('detective.bill.upload')"
      :footer="null"
    >
      <div class="py-4">
        <div class="mb-4">
          <label class="mb-2 block">{{ $t('detective.bill.source') }}</label>
          <Select
            v-model:value="uploadForm.source"
            :options="sourceOptions"
            style="width: 100%"
          />
        </div>
        <div class="mb-4">
          <Upload
            :before-upload="handleBeforeUpload"
            :show-upload-list="false"
            accept=".csv,.xlsx,.xls,.zip"
          >
            <Button block>
              <template #icon><UploadOutlined /></template>
              {{
                uploadForm.file
                  ? uploadForm.file.name
                  : $t('detective.bill.selectFile')
              }}
            </Button>
          </Upload>
        </div>
        <div v-if="needPassword" class="mb-4">
          <label class="mb-2 block">{{
            $t('detective.bill.zipPassword')
          }}</label>
          <Input.Password
            v-model:value="uploadForm.password"
            :placeholder="$t('detective.bill.zipPasswordPlaceholder')"
          />
        </div>
        <Button
          type="primary"
          :loading="uploading"
          :disabled="!uploadForm.file"
          block
          @click="handleConfirmUpload"
        >
          {{ $t('detective.bill.upload') }}
        </Button>
      </div>
    </Modal>

    <!-- 交易明细弹窗 -->
    <Modal
      v-model:open="transactionsModalVisible"
      :title="
        currentBill
          ? `${currentBill.filename} - ${$t('detective.bill.transactions')}`
          : $t('detective.bill.transactions')
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
              {{ formatAmount(record.amount, record.direction) }}
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
