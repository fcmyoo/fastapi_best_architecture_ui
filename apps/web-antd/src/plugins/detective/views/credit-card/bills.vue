<script setup lang="ts">
import type {
  CreditCardBillsResponse,
  CreditCardBillSummary,
} from '#/plugins/detective/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ArrowLeftOutlined, CreditCardOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Descriptions,
  DescriptionsItem,
  Empty,
  Space,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import { getCardBillsApi } from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveCreditCardBills' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const cardInfo = ref<CreditCardBillsResponse | null>(null);

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
    width: 100,
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
    width: 100,
    fixed: 'right' as const,
  },
];

const handleBack = () => {
  router.push('/detective/credit-card/list');
};

const handleViewDetail = (record: CreditCardBillSummary) => {
  router.push(`/detective/credit-card/bill-detail/${record.id}`);
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
              <Tag :color="getPaymentStatusColor(record.payment_status)">
                {{ getPaymentStatusText(record.payment_status) }}
              </Tag>
            </template>
            <template v-if="column.key === 'action'">
              <Button
                type="link"
                size="small"
                @click="handleViewDetail(record as CreditCardBillSummary)"
              >
                {{ $t('detective.creditCard.viewDetail') }}
              </Button>
            </template>
          </template>
        </Table>
      </template>

      <Empty
        v-else-if="!loading"
        :description="$t('detective.creditCard.noBill')"
      />
    </Spin>
  </Page>
</template>
