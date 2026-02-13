<script setup lang="ts">
import type { BillDetailItem } from '#/plugins/detective/api';

import { computed } from 'vue';

import { Card, Col, Descriptions, DescriptionsItem, Row, Tag } from 'ant-design-vue';

import { $t } from '#/locales';

const props = defineProps<{
  paymentTx?: BillDetailItem;
  debitTx?: BillDetailItem;
  paymentTitle?: string;
  debitTitle?: string;
}>();

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

const amountDiff = computed(() => {
  if (!props.paymentTx?.amount || !props.debitTx?.amount) return null;
  const diff = Math.abs(Number(props.paymentTx.amount) - Number(props.debitTx.amount));
  return diff;
});

const amountMatch = computed(() => {
  if (amountDiff.value === null) return true;
  return amountDiff.value <= 0.01;
});

const timeDiffText = computed(() => {
  if (!props.paymentTx?.transaction_time || !props.debitTx?.transaction_time) return null;
  const t1 = new Date(props.paymentTx.transaction_time).getTime();
  const t2 = new Date(props.debitTx.transaction_time).getTime();
  const diffMs = Math.abs(t1 - t2);
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) {
    return `${Math.round(diffMs / (1000 * 60))} 分钟`;
  }
  if (diffHours < 24) {
    return `${diffHours.toFixed(1)} 小时`;
  }
  return `${(diffHours / 24).toFixed(1)} 天`;
});
</script>

<template>
  <div class="mb-4">
    <!-- 差异摘要 -->
    <div
      v-if="amountDiff !== null || timeDiffText"
      class="mb-3 flex gap-4 rounded-lg bg-gray-50 px-4 py-2 text-xs"
    >
      <span v-if="amountDiff !== null" class="flex items-center gap-1">
        金额差异:
        <Tag :color="amountMatch ? 'green' : 'orange'" size="small">
          {{ amountMatch ? '完全匹配' : `￥${amountDiff.toFixed(2)}` }}
        </Tag>
      </span>
      <span v-if="timeDiffText" class="flex items-center gap-1">
        时间差异:
        <Tag color="blue" size="small">{{ timeDiffText }}</Tag>
      </span>
    </div>

    <Row :gutter="16">
      <Col :span="12">
        <Card
          :title="paymentTitle || $t('detective.reconcile.paymentTx')"
          class="h-full"
          size="small"
        >
          <template #extra>
            <Tag v-if="paymentTx?.source" color="blue" size="small">
              {{ paymentTx.source }}
            </Tag>
          </template>
          <template v-if="paymentTx">
            <Descriptions :column="1" bordered size="small">
              <DescriptionsItem :label="$t('detective.transaction.merchant')">
                <span class="font-medium">{{ paymentTx.merchant_raw }}</span>
              </DescriptionsItem>
              <DescriptionsItem :label="$t('detective.transaction.amount')">
                <span
                  :class="getAmountClass(paymentTx.direction)"
                  class="text-lg font-bold"
                >
                  {{ formatTxAmount(paymentTx.amount, paymentTx.direction) }}
                </span>
                <Tag
                  v-if="!amountMatch"
                  color="orange"
                  size="small"
                  class="ml-2"
                >
                  差异
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem
                :label="$t('detective.transaction.transactionTime')"
              >
                {{ paymentTx.transaction_time }}
              </DescriptionsItem>
              <DescriptionsItem
                :label="$t('detective.transaction.paymentMethod')"
              >
                {{ paymentTx.payment_method || '-' }}
              </DescriptionsItem>
              <DescriptionsItem :label="$t('detective.transaction.category')">
                {{ paymentTx.category || '-' }}
              </DescriptionsItem>
            </Descriptions>
          </template>
          <div v-else class="py-8 text-center text-gray-400">
            {{ $t('common.noData') }}
          </div>
        </Card>
      </Col>
      <Col :span="12">
        <Card
          :title="debitTitle || $t('detective.reconcile.debitTx')"
          class="h-full"
          size="small"
        >
          <template #extra>
            <Tag v-if="debitTx?.source" color="green" size="small">
              {{ debitTx.source }}
            </Tag>
          </template>
          <template v-if="debitTx">
            <Descriptions :column="1" bordered size="small">
              <DescriptionsItem :label="$t('detective.transaction.merchant')">
                <span class="font-medium">{{ debitTx.merchant_raw }}</span>
              </DescriptionsItem>
              <DescriptionsItem :label="$t('detective.transaction.amount')">
                <span
                  :class="getAmountClass(debitTx.direction)"
                  class="text-lg font-bold"
                >
                  {{ formatTxAmount(debitTx.amount, debitTx.direction) }}
                </span>
                <Tag
                  v-if="!amountMatch"
                  color="orange"
                  size="small"
                  class="ml-2"
                >
                  差异
                </Tag>
              </DescriptionsItem>
              <DescriptionsItem
                :label="$t('detective.transaction.transactionTime')"
              >
                {{ debitTx.transaction_time }}
              </DescriptionsItem>
              <DescriptionsItem :label="$t('detective.transaction.cardBank')">
                {{ debitTx.card_bank || '-' }}
              </DescriptionsItem>
              <DescriptionsItem :label="$t('detective.transaction.cardLast4')">
                {{ debitTx.card_last4 || '-' }}
              </DescriptionsItem>
            </Descriptions>
          </template>
          <div v-else class="py-8 text-center text-gray-400">
            {{ $t('common.noData') }}
          </div>
        </Card>
      </Col>
    </Row>
  </div>
</template>
