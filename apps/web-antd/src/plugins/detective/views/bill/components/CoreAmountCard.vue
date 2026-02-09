<script setup lang="ts">
import type { TransactionDetail } from '#/plugins/detective/api';

import { computed } from 'vue';

import {
  BankOutlined,
  CreditCardOutlined,
  ShopOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons-vue';

import { getSourceDisplayName, getSourceIcon } from '#/plugins/detective/utils/source';
import { $t } from '#/locales';

const props = defineProps<{
  data: TransactionDetail;
}>();

const isExpense = computed(() => props.data.direction === 'expense');

// 根据来源获取品牌名称（使用公共函数）
const getBrandName = () => getSourceDisplayName(props.data.source);

// 根据来源获取品牌英文名
const getBrandEnglishName = () => {
  switch (props.data.source) {
    case 'alipay': {
      return 'Alipay Transaction';
    }
    case 'bank': {
      return 'Bank Transaction';
    }
    case 'credit_card': {
      return 'Credit Card Transaction';
    }
    case 'wechat': {
      return 'WeChat Transaction';
    }
    default: {
      return 'Transaction';
    }
  }
};

// 来源主题配置：将 7 个 getThemeXxx 函数合并为一个 computed 对象
interface SourceTheme {
  bg: string;
  border: string;
  color: string;
  hex: string;
  lightBg: string;
  shadow: string;
  text: string;
}

const sourceThemeMap: Record<string, SourceTheme> = {
  alipay: {
    hex: '#1677FF',
    text: 'text-[#1677FF]',
    bg: 'bg-[#1677FF]',
    lightBg: 'bg-blue-50',
    shadow: 'shadow-blue-200',
    border: 'border-blue-400',
    color: 'blue',
  },
  bank: {
    hex: '#FA8C16',
    text: 'text-[#FA8C16]',
    bg: 'bg-[#FA8C16]',
    lightBg: 'bg-orange-50',
    shadow: 'shadow-orange-200',
    border: 'border-orange-400',
    color: 'orange',
  },
  credit_card: {
    hex: '#722ED1',
    text: 'text-[#722ED1]',
    bg: 'bg-[#722ED1]',
    lightBg: 'bg-purple-50',
    shadow: 'shadow-purple-200',
    border: 'border-purple-400',
    color: 'purple',
  },
  wechat: {
    hex: '#07C160',
    text: 'text-[#07C160]',
    bg: 'bg-[#07C160]',
    lightBg: 'bg-green-50',
    shadow: 'shadow-green-200',
    border: 'border-green-400',
    color: 'green',
  },
};

const defaultTheme: SourceTheme = sourceThemeMap.alipay;

const theme = computed(
  () => sourceThemeMap[props.data.source] || defaultTheme,
);

// 获取支付方式显示名称
const getPaymentMethodName = () => {
  if (props.data.card_bank && props.data.card_last4) {
    return `${props.data.card_bank}(${props.data.card_last4})`;
  }
  return props.data.payment_method || $t('detective.bill.coreCard.account');
};

// 获取支付方式图标
const getPaymentMethodIcon = () => {
  if (props.data.card_type === 'credit_card') return CreditCardOutlined;
  if (props.data.card_type === 'debit_card') return BankOutlined;
  if (props.data.payment_method_type === 'balance') return WalletOutlined;
  if (props.data.card_bank) return BankOutlined;
  return WalletOutlined;
};

// 获取收款方显示名称
const getReceiverName = () => {
  return props.data.merchant_norm || props.data.merchant_raw || $t('detective.bill.coreCard.receiver');
};

const SourceIcon = getSourceIcon(props.data.source);
const PaymentMethodIcon = getPaymentMethodIcon();
</script>

<template>
  <div
    class="core-transaction-card relative overflow-hidden rounded-[32px] border border-white bg-white p-8 shadow-sm md:p-10"
  >
    <!-- 品牌水印装饰 -->
    <div class="brand-watermark" :style="{ color: `${theme.hex}03` }">
      {{ getBrandName() }}
    </div>

    <div class="relative z-10 mb-10 flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div
          :class="[theme.bg, theme.shadow]"
          class="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
        >
          <SourceIcon class="text-xl text-white" />
        </div>
        <div>
          <h2
            :class="theme.text"
            class="text-lg font-bold leading-tight"
          >
            {{ getBrandName() }}
          </h2>
          <p
            class="text-[10px] font-medium uppercase tracking-widest text-gray-400"
          >
            {{ getBrandEnglishName() }}
          </p>
        </div>
      </div>
      <a-tag
        :color="data.matched ? 'success' : 'processing'"
        class="rounded-full border-none px-4 py-0.5 font-bold"
      >
        {{ data.matched ? $t('detective.bill.matchedOptions.true') : $t('detective.bill.matchedOptions.false') }}
      </a-tag>
    </div>

    <div
      class="relative z-10 mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-end"
    >
      <div class="space-y-1">
        <p class="text-sm font-medium text-gray-400">
          {{ $t('detective.bill.coreCard.expenseAmount') }} ({{ data.currency || 'CNY' }})
        </p>
        <div class="flex items-baseline gap-1">
          <span
            class="text-4xl font-bold"
            :class="isExpense ? 'text-rose-500' : 'text-emerald-500'"
          >
            {{ isExpense ? '-' : '+' }}
          </span>
          <span
            class="text-6xl font-black tracking-tighter"
            :class="isExpense ? 'text-rose-600' : 'text-emerald-600'"
          >
            {{ Number(data.amount).toFixed(2) }}
          </span>
        </div>
      </div>

      <div
        class="flex items-center gap-4 rounded-2xl border border-blue-50/50 bg-white/60 p-4 backdrop-blur"
      >
        <div
          :class="[theme.lightBg, theme.text]"
          class="flex h-12 w-12 items-center justify-center rounded-xl"
        >
          <slot name="category-icon">
            <ShopOutlined class="text-2xl" />
          </slot>
        </div>
        <div>
          <p class="mb-0.5 text-xs text-gray-400">{{ $t('detective.bill.detailPage.txType') }}</p>
          <p class="font-bold text-gray-800">
            {{ data.tx_type || data.category || '-' }}
          </p>
        </div>
      </div>
    </div>

    <!-- 资金流向链 -->
    <div
      class="relative z-10 flex items-center justify-between rounded-2xl border border-blue-100/50 bg-blue-50/30 p-6"
    >
      <!-- 付款来源 -->
      <div class="flex min-w-[60px] flex-col items-center gap-1">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-100 bg-white shadow-sm"
        >
          <PaymentMethodIcon class="text-lg text-gray-600" />
        </div>
        <span
          class="text-center text-[10px] font-bold leading-tight text-gray-500"
        >
          {{ getPaymentMethodName() }}
        </span>
      </div>
      <div class="pay-flow-line"></div>
      <!-- 支付平台 -->
      <div class="flex min-w-[60px] flex-col items-center gap-1">
        <div
          :class="[theme.bg]"
          class="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
        >
          <SourceIcon class="text-lg text-white" />
        </div>
        <span class="text-[10px] font-bold text-gray-500">{{
          getBrandName()
        }}</span>
      </div>
      <div class="pay-flow-line"></div>
      <!-- 收款方 -->
      <div class="flex min-w-[60px] flex-col items-center gap-1">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl border-2 bg-white shadow-sm"
          :class="theme.border"
        >
          <UserOutlined class="text-lg" :class="theme.text" />
        </div>
        <span
          class="max-w-[80px] truncate text-center text-[10px] font-bold leading-tight"
          :class="theme.text"
        >
          {{ getReceiverName() }}
        </span>
      </div>
    </div>

    <div
      class="relative z-10 mt-6 flex items-center justify-between border-t border-gray-50 pt-6"
    >
      <span class="text-sm text-gray-400">
        {{ $t('detective.bill.coreCard.merchantFullName') }}:
        <span class="ml-1 font-bold text-gray-900">{{
          data.merchant_norm || data.merchant_raw || '-'
        }}</span>
      </span>
      <span class="font-mono text-[11px] font-bold text-gray-400">{{
        data.transaction_time
      }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.core-transaction-card {
  background: linear-gradient(135deg, #fff 0%, #f8fbff 100%);
}

.brand-watermark {
  position: absolute;
  right: -20px;
  bottom: -10px;
  font-size: 80px;
  font-style: italic;
  font-weight: 900;
  pointer-events: none;
  user-select: none;
}

.pay-flow-line {
  flex-grow: 1;
  height: 2px;
  margin: 0 12px;
  background: repeating-linear-gradient(
    to right,
    #d9d9d9,
    #d9d9d9 4px,
    transparent 4px,
    transparent 8px
  );
}
</style>
