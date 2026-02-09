<script setup lang="ts">
import type { BillDetailItem } from '#/plugins/detective/api';

import { computed } from 'vue';

import { BankOutlined } from '@ant-design/icons-vue';

import {
  getSourceBorderClass,
  getSourceColorClass,
  getSourceDisplayName,
  getSourceIcon,
} from '#/plugins/detective/utils/source';

const props = defineProps<{
  transaction: BillDetailItem | null;
}>();

const SourceIcon = computed(() =>
  props.transaction ? getSourceIcon(props.transaction.source) : BankOutlined,
);
</script>

<template>
  <div
    class="flex flex-col rounded-3xl border bg-white p-6 shadow-sm"
    :class="[
      transaction
        ? getSourceBorderClass(transaction.source)
        : 'border-gray-200',
    ]"
  >
    <div class="mb-5 flex items-center gap-3">
      <div
        class="flex h-11 w-11 items-center justify-center rounded-xl"
        :class="
          transaction ? getSourceColorClass(transaction.source) : 'bg-gray-50'
        "
      >
        <component :is="SourceIcon" class="text-xl" />
      </div>
      <div>
        <h3 class="text-base font-bold text-gray-800">
          {{
            transaction
              ? getSourceDisplayName(transaction.source, transaction.card_bank)
              : '-'
          }}
        </h3>
        <p class="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          支付端 · Payment Side
        </p>
      </div>
    </div>

    <template v-if="transaction">
      <!-- 金额 -->
      <div class="mb-6 text-center">
        <p class="mb-1 text-xs text-gray-400">交易金额</p>
        <p class="text-4xl font-black tracking-tight text-rose-500">
          -¥{{ Number(transaction.amount).toFixed(2) }}
        </p>
        <p class="mt-2 font-mono text-xs text-gray-400">
          {{ transaction.transaction_time }}
        </p>
      </div>

      <!-- 信息块 -->
      <div class="space-y-3">
        <div class="info-block">
          <p class="block-label">商户/收款方</p>
          <p class="block-content">
            {{ transaction.merchant_raw || '-' }}
          </p>
        </div>
        <div class="info-block">
          <p class="block-label">交易描述</p>
          <p class="block-content">
            {{ transaction.description || '-' }}
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="info-block">
            <p class="block-label">支付方式</p>
            <p class="block-content">
              {{ transaction.payment_method || '-' }}
            </p>
          </div>
          <div class="info-block">
            <p class="block-label">交易类型</p>
            <p class="block-content">
              {{ transaction.tx_type || transaction.category || '-' }}
            </p>
          </div>
        </div>
      </div>

      <!-- ID 标签 -->
      <div class="mt-4 flex justify-end">
        <span class="id-badge">ID: {{ transaction.id }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.info-block {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 52px;
  padding: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;

  .block-label {
    margin-bottom: 2px;
    font-size: 10px;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .block-content {
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
    line-height: 1.4;
    color: #374151;
    white-space: nowrap;
  }
}

.id-badge {
  padding: 4px 10px;
  font-family: ui-monospace, monospace;
  font-size: 10px;
  color: #9ca3af;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
}
</style>
