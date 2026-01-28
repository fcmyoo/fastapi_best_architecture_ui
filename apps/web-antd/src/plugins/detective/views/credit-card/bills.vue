<script setup lang="ts">
import type {
  CreditCardBillsResponse,
  CreditCardBillSummary,
  UpdatePaymentStatusPayload,
} from '#/plugins/detective/api';
import type { Rule } from 'ant-design-vue/es/form';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ArrowLeftOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Empty,
  Form,
  FormItem,
  InputNumber,
  message,
  Modal,
  Select,
  SelectOption,
  Space,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { $t } from '#/locales';
import {
  deleteCardBillApi,
  getCardBillsApi,
  updateCardBillPaymentStatusApi,
} from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveCreditCardBills' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const cardInfo = ref<CreditCardBillsResponse | null>(null);

// Edit Modal State
const editModalVisible = ref(false);
const confirmLoading = ref(false);
const currentEditId = ref<number | null>(null);
const editFormRef = ref();

const editFormState = reactive<UpdatePaymentStatusPayload>({
  payment_status: 'unpaid',
  paid_amount: undefined,
  paid_date: undefined,
});

const bankCode = computed(() => route.params.bankCode as string);
const cardLast4 = computed(() => {
  const val = route.params.cardLast4 as string;
  return val === 'null' ? null : val;
});

const pageTitle = computed(() => {
  if (!cardInfo.value) return $t('detective.creditCard.billHistory');
  return `${cardInfo.value.bank_name} (*${cardInfo.value.card_last4 || '****'})`;
});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getCardBillsApi(bankCode.value, cardLast4.value);
    cardInfo.value = res;
  } catch (error) {
    console.error('Failed to fetch card bills:', error);
  } finally {
    loading.value = false;
  }
};

const formatAmount = (amount: null | number | undefined) => {
  if (amount === null || amount === undefined) return '-';
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
};

const formatBillingCycle = (start: null | string, end: null | string) => {
  if (!start || !end) return '-';
  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };
  return `${formatDate(start)} - ${formatDate(end)}`;
};

const getPaymentStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    unpaid: 'error',
    partial: 'warning',
    paid: 'success',
  };
  return colorMap[status] || 'default';
};

const getPaymentStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    unpaid: $t('detective.creditCard.paymentStatusOptions.unpaid'),
    partial: $t('detective.creditCard.paymentStatusOptions.partial'),
    paid: $t('detective.creditCard.paymentStatusOptions.paid'),
  };
  return textMap[status] || status;
};

const columns = [
  {
    title: $t('detective.creditCard.statementMonth'),
    dataIndex: 'statement_month',
    key: 'statement_month',
    width: 120,
  },
  {
    title: $t('detective.creditCard.billingCycle'),
    key: 'billing_cycle',
    width: 150,
  },
  {
    title: $t('detective.creditCard.billAmount'),
    dataIndex: 'bill_amount',
    key: 'bill_amount',
    width: 120,
    align: 'right' as const,
  },
  {
    title: $t('detective.creditCard.minPayment'),
    dataIndex: 'min_payment',
    key: 'min_payment',
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
    width: 140, // Increased width for tag + icon
  },
  {
    title: $t('detective.creditCard.transactionCount'),
    dataIndex: 'parsed_count',
    key: 'parsed_count',
    width: 100,
    align: 'center' as const,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 140, // Increased width for multiple buttons
    fixed: 'right' as const,
  },
];

const handleBack = () => {
  router.push('/detective/credit-card/list');
};

const handleViewDetail = (record: CreditCardBillSummary) => {
  router.push(`/detective/credit-card/bill-detail/${record.id}`);
};

// Delete Logic
const handleDelete = (record: CreditCardBillSummary) => {
  Modal.confirm({
    title: $t('common.confirmDelete'),
    content: $t('detective.creditCard.confirmDeleteBill', {
      month: record.statement_month,
    }),
    okType: 'danger',
    onOk: async () => {
      try {
        await deleteCardBillApi(record.id);
        message.success($t('common.deleteSuccess'));
        fetchData();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    },
  });
};

// Edit Logic
const handleEditStatus = (record: CreditCardBillSummary) => {
  currentEditId.value = record.id;
  editFormState.payment_status = record.payment_status as any;
  // Note: The list API might not return paid_amount/paid_date for every item if it's a summary.
  // Ideally, we'd fetch detail or just let user input new values.
  // Assuming defaults or empty for now if not present in record.
  // If record has these fields, map them:
  // editFormState.paid_amount = record.paid_amount;
  // editFormState.paid_date = record.paid_date;
  editFormState.paid_amount = undefined;
  editFormState.paid_date = undefined;

  editModalVisible.value = true;
};

const handleEditSubmit = async () => {
  try {
    await editFormRef.value.validate();
    confirmLoading.value = true;

    if (!currentEditId.value) return;

    // Format date for API
    const payload = {
      ...editFormState,
      paid_date: editFormState.paid_date
        ? dayjs(editFormState.paid_date).format('YYYY-MM-DD')
        : undefined,
    };

    await updateCardBillPaymentStatusApi(currentEditId.value, payload);
    message.success($t('common.updateSuccess'));
    editModalVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('Update failed:', error);
  } finally {
    confirmLoading.value = false;
  }
};

const editFormRules: Record<string, Rule[]> = {
  payment_status: [
    { required: true, message: $t('common.required'), trigger: 'change' },
  ],
  paid_amount: [
    {
      required: true,
      message: $t('common.required'),
      trigger: 'blur',
      type: 'number',
    },
  ],
  paid_date: [
    {
      required: true,
      message: $t('common.required'),
      trigger: 'change',
      type: 'object',
    },
  ],
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="pageTitle">
    <template #extra>
      <Button @click="handleBack">
        <template #icon><ArrowLeftOutlined /></template>
        {{ $t('detective.creditCard.backToList') }}
      </Button>
    </template>

    <Spin :spinning="loading">
      <template v-if="cardInfo">
        <Descriptions :column="4" class="mb-4" bordered size="small">
          <DescriptionsItem :label="$t('detective.creditCard.bankName')">
            <Space>
              <CreditCardOutlined />
              {{ cardInfo.bank_name }}
            </Space>
          </DescriptionsItem>
          <DescriptionsItem :label="$t('detective.creditCard.cardLast4')">
            **** {{ cardInfo.card_last4 || '****' }}
          </DescriptionsItem>
          <DescriptionsItem :label="$t('detective.creditCard.creditLimit')">
            {{ formatAmount(cardInfo.credit_limit) }}
          </DescriptionsItem>
          <DescriptionsItem
            :label="$t('detective.creditCard.transactionCount')"
          >
            {{ cardInfo.bills.length }} {{ $t('common.items') }}
          </DescriptionsItem>
        </Descriptions>

        <Table
          :columns="columns"
          :data-source="cardInfo.bills"
          :loading="loading"
          :pagination="false"
          :scroll="{ x: 900 }"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'billing_cycle'">
              {{
                formatBillingCycle(
                  record.billing_cycle_start,
                  record.billing_cycle_end,
                )
              }}
            </template>
            <template v-if="column.key === 'bill_amount'">
              <span class="font-medium text-red-500">
                {{ formatAmount(record.bill_amount) }}
              </span>
            </template>
            <template v-if="column.key === 'min_payment'">
              {{ formatAmount(record.min_payment) }}
            </template>
            <template v-if="column.key === 'payment_status'">
              <div
                class="cursor-pointer hover:opacity-80"
                @click="handleEditStatus(record as CreditCardBillSummary)"
              >
                <Tag :color="getPaymentStatusColor(record.payment_status)">
                  {{ getPaymentStatusText(record.payment_status) }}
                  <EditOutlined class="ml-1" />
                </Tag>
              </div>
            </template>
            <template v-if="column.key === 'action'">
              <Space>
                <Button
                  type="link"
                  size="small"
                  @click="handleViewDetail(record as CreditCardBillSummary)"
                >
                  {{ $t('detective.creditCard.viewDetail') }}
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  @click="handleDelete(record as CreditCardBillSummary)"
                >
                  <template #icon><DeleteOutlined /></template>
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </template>

      <Empty
        v-else-if="!loading"
        :description="$t('detective.creditCard.noBill')"
      />
    </Spin>

    <!-- Payment Status Edit Modal -->
    <Modal
      v-model:open="editModalVisible"
      :title="$t('detective.creditCard.updatePaymentStatus')"
      :confirm-loading="confirmLoading"
      @ok="handleEditSubmit"
    >
      <Form
        ref="editFormRef"
        :model="editFormState"
        :rules="editFormRules"
        layout="vertical"
        class="mt-4"
      >
        <FormItem
          :label="$t('detective.creditCard.paymentStatus')"
          name="payment_status"
        >
          <Select v-model:value="editFormState.payment_status">
            <SelectOption value="unpaid">
              {{ $t('detective.creditCard.paymentStatusOptions.unpaid') }}
            </SelectOption>
            <SelectOption value="partial">
              {{ $t('detective.creditCard.paymentStatusOptions.partial') }}
            </SelectOption>
            <SelectOption value="paid">
              {{ $t('detective.creditCard.paymentStatusOptions.paid') }}
            </SelectOption>
          </Select>
        </FormItem>

        <template v-if="editFormState.payment_status !== 'unpaid'">
          <FormItem
            :label="$t('detective.creditCard.paidAmount')"
            name="paid_amount"
          >
            <InputNumber
              v-model:value="editFormState.paid_amount"
              :min="0"
              style="width: 100%"
              :prefix="'¥'"
            />
          </FormItem>
          <FormItem
            :label="$t('detective.creditCard.paidDate')"
            name="paid_date"
          >
            <DatePicker
              v-model:value="editFormState.paid_date"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </FormItem>
        </template>
      </Form>
    </Modal>
  </Page>
</template>
