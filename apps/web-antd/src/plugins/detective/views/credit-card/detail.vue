<script setup lang="ts">
import type {
  BillDetailInfo,
  BillTransactionItem,
} from '#/plugins/detective/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { ArrowLeftOutlined, CreditCardOutlined } from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  Empty,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import { getCreditCardBillTransactionsApi } from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveCreditCardBillDetail' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const billInfo = ref<BillDetailInfo | null>(null);
const transactions = ref<BillTransactionItem[]>([]);

const billId = computed(() => Number(route.params.billId));

const pageTitle = computed(() => {
  if (!billInfo.value) return $t('detective.creditCard.billDetail');
  return `${billInfo.value.statement_month} ${$t('detective.creditCard.billDetail')}`;
});

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getCreditCardBillTransactionsApi(billId.value);
    billInfo.value = res.bill_info;
    transactions.value = res.transactions || [];
  } catch (error) {
    console.error('Failed to fetch bill transactions:', error);
  } finally {
    loading.value = false;
  }
};

const formatBillingCycle = (start: null | string, end: null | string) => {
  if (!start || !end) return '-';
  return `${start} ~ ${end}`;
};

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

const getDirectionColor = (direction: string) => {
  return direction === 'expense' ? 'red' : 'green';
};

const getDirectionText = (direction: string) => {
  return direction === 'expense'
    ? $t('detective.transaction.directionOptions.expense')
    : $t('detective.transaction.directionOptions.income');
};

const formatTxAmount = (amount: number, direction: string) => {
  const prefix = direction === 'expense' ? '-' : '+';
  return `${prefix}¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
};

const columns = [
  {
    title: $t('detective.transaction.transactionTime'),
    dataIndex: 'transaction_time',
    key: 'transaction_time',
    width: 120,
  },
  {
    title: $t('detective.transaction.merchant'),
    dataIndex: 'merchant_raw',
    key: 'merchant_raw',
    ellipsis: true,
  },
  {
    title: $t('detective.transaction.category'),
    dataIndex: 'category_name',
    key: 'category_name',
    width: 100,
  },
  {
    title: $t('detective.transaction.direction'),
    key: 'direction',
    width: 80,
  },
  {
    title: $t('detective.transaction.amount'),
    key: 'amount',
    width: 120,
    align: 'right' as const,
  },
];

const handleBack = () => {
  router.back();
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
      <template v-if="billInfo">
        <!-- 账单摘要卡片 -->
        <Card class="mb-4">
          <Row :gutter="16">
            <Col :span="6">
              <div class="flex items-center gap-2 text-gray-500">
                <CreditCardOutlined />
                <span>{{
                  `${billInfo.bank_name} (*${billInfo.card_last4 || '****'})`
                }}</span>
              </div>
              <div class="mt-2 text-sm text-gray-400">
                {{ $t('detective.creditCard.billingCycle') }}:
                {{
                  formatBillingCycle(
                    billInfo.billing_cycle_start,
                    billInfo.billing_cycle_end,
                  )
                }}
              </div>
            </Col>
            <Col :span="6">
              <Statistic
                :title="$t('detective.creditCard.billAmount')"
                :value="billInfo.bill_amount || 0"
                :precision="2"
                prefix="¥"
                :value-style="{ color: '#cf1322' }"
              />
            </Col>
            <Col :span="6">
              <Statistic
                :title="$t('detective.creditCard.minPayment')"
                :value="billInfo.min_payment || 0"
                :precision="2"
                prefix="¥"
              />
            </Col>
            <Col :span="6">
              <div class="text-gray-500">
                {{ $t('detective.creditCard.dueDate') }}
              </div>
              <div class="mt-1 text-lg font-medium">
                {{ billInfo.due_date || '-' }}
              </div>
              <Tag
                :color="getPaymentStatusColor(billInfo.payment_status)"
                class="mt-2"
              >
                {{ getPaymentStatusText(billInfo.payment_status) }}
              </Tag>
            </Col>
          </Row>
        </Card>

        <!-- 交易明细表格 -->
        <Card
          :title="`${$t('detective.creditCard.transactions')} (${transactions.length})`"
        >
          <Table
            :columns="columns"
            :data-source="transactions"
            :pagination="{ pageSize: 20 }"
            :scroll="{ x: 600 }"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'transaction_time'">
                {{ formatDateTime(record.transaction_time) }}
              </template>
              <template v-if="column.key === 'merchant_raw'">
                {{ record.merchant_raw || '-' }}
              </template>
              <template v-if="column.key === 'category_name'">
                <Tag v-if="record.category_name">
                  {{ record.category_name }}
                </Tag>
                <span v-else class="text-gray-400">-</span>
              </template>
              <template v-if="column.key === 'direction'">
                <Tag :color="getDirectionColor(record.direction)">
                  {{ getDirectionText(record.direction) }}
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
            </template>
          </Table>
        </Card>
      </template>

      <Empty
        v-else-if="!loading"
        :description="$t('detective.creditCard.noBill')"
      />
    </Spin>
  </Page>
</template>
