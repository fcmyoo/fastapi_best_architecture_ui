<script setup lang="ts">
import type { TransactionDetail } from '#/plugins/detective/api';

import { computed } from 'vue';

import {
  AlipayOutlined,
  BankOutlined,
  CreditCardOutlined,
  ShopOutlined,
  UserOutlined,
  WalletOutlined,
  WechatOutlined,
} from '@ant-design/icons-vue';

const props = defineProps<{
  data: TransactionDetail;
}>();

const isExpense = computed(() => props.data.direction === 'expense');

// 根据来源获取图标
const getSourceIcon = () => {
  switch (props.data.source) {
    case 'alipay': {
      return AlipayOutlined;
    }
    case 'bank': {
      return BankOutlined;
    }
    case 'credit_card': {
      return CreditCardOutlined;
    }
    case 'wechat': {
      return WechatOutlined;
    }
    default: {
      return ShopOutlined;
    }
  }
};

// 根据来源获取品牌名称
const getBrandName = () => {
  switch (props.data.source) {
    case 'alipay': {
      return '支付宝';
    }
    case 'bank': {
      return '储蓄卡';
    }
    case 'credit_card': {
      return '信用卡';
    }
    case 'wechat': {
      return '微信';
    }
    default: {
      return '支付';
    }
  }
};

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

// 根据来源获取主题色
const getThemeColor = () => {
  switch (props.data.source) {
    case 'alipay': {
      return '#1677FF';
    }
    case 'bank': {
      return '#FA8C16';
    }
    case 'credit_card': {
      return '#722ED1';
    }
    case 'wechat': {
      return '#07C160';
    }
    default: {
      return '#1677FF';
    }
  }
};

// 根据来源获取主题色类
const getThemeColorClass = () => {
  switch (props.data.source) {
    case 'alipay': {
      return 'text-[#1677FF]';
    }
    case 'bank': {
      return 'text-[#FA8C16]';
    }
    case 'credit_card': {
      return 'text-[#722ED1]';
    }
    case 'wechat': {
      return 'text-[#07C160]';
    }
    default: {
      return 'text-[#1677FF]';
    }
  }
};

// 根据来源获取背景色类
const getThemeBgClass = () => {
  switch (props.data.source) {
    case 'alipay': {
      return 'bg-[#1677FF]';
    }
    case 'bank': {
      return 'bg-[#FA8C16]';
    }
    case 'credit_card': {
      return 'bg-[#722ED1]';
    }
    case 'wechat': {
      return 'bg-[#07C160]';
    }
    default: {
      return 'bg-[#1677FF]';
    }
  }
};

// 根据来源获取浅色背景类
const getThemeLightBgClass = () => {
  switch (props.data.source) {
    case 'alipay': {
      return 'bg-blue-50';
    }
    case 'bank': {
      return 'bg-orange-50';
    }
    case 'credit_card': {
      return 'bg-purple-50';
    }
    case 'wechat': {
      return 'bg-green-50';
    }
    default: {
      return 'bg-blue-50';
    }
  }
};

// 根据来源获取阴影类
const getThemeShadowClass = () => {
  switch (props.data.source) {
    case 'alipay': {
      return 'shadow-blue-200';
    }
    case 'bank': {
      return 'shadow-orange-200';
    }
    case 'credit_card': {
      return 'shadow-purple-200';
    }
    case 'wechat': {
      return 'shadow-green-200';
    }
    default: {
      return 'shadow-blue-200';
    }
  }
};

// 根据来源获取边框色类
const getThemeBorderClass = () => {
  switch (props.data.source) {
    case 'alipay': {
      return 'border-blue-400';
    }
    case 'bank': {
      return 'border-orange-400';
    }
    case 'credit_card': {
      return 'border-purple-400';
    }
    case 'wechat': {
      return 'border-green-400';
    }
    default: {
      return 'border-blue-400';
    }
  }
};

// 获取支付方式显示名称
const getPaymentMethodName = () => {
  if (props.data.card_bank && props.data.card_last4) {
    return `${props.data.card_bank}(${props.data.card_last4})`;
  }
  return props.data.payment_method || '账户';
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
  return props.data.merchant_norm || props.data.merchant_raw || '收款方';
};

const themeColor = getThemeColor();
const SourceIcon = getSourceIcon();
const PaymentMethodIcon = getPaymentMethodIcon();
</script>

<template>
  <div
    class="core-transaction-card relative overflow-hidden rounded-[32px] border border-white bg-white p-8 shadow-sm md:p-10"
  >
    <!-- 品牌水印装饰 -->
    <div class="brand-watermark" :style="{ color: `${themeColor}03` }">
      {{ getBrandName() }}
    </div>

    <div class="relative z-10 mb-10 flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div
          :class="[getThemeBgClass(), getThemeShadowClass()]"
          class="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
        >
          <SourceIcon class="text-xl text-white" />
        </div>
        <div>
          <h2
            :class="getThemeColorClass()"
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
        {{ data.matched ? '已匹配' : '未匹配' }}
      </a-tag>
    </div>

    <div
      class="relative z-10 mb-10 flex flex-col justify-between gap-8 md:flex-row md:items-end"
    >
      <div class="space-y-1">
        <p class="text-sm font-medium text-gray-400">
          支出金额 ({{ data.currency || 'CNY' }})
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
          :class="[getThemeLightBgClass(), getThemeColorClass()]"
          class="flex h-12 w-12 items-center justify-center rounded-xl"
        >
          <slot name="category-icon">
            <ShopOutlined class="text-2xl" />
          </slot>
        </div>
        <div>
          <p class="mb-0.5 text-xs text-gray-400">交易类型</p>
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
          :class="[getThemeBgClass()]"
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
          :class="getThemeBorderClass()"
        >
          <UserOutlined class="text-lg" :class="getThemeColorClass()" />
        </div>
        <span
          class="max-w-[80px] truncate text-center text-[10px] font-bold leading-tight"
          :class="getThemeColorClass()"
        >
          {{ getReceiverName() }}
        </span>
      </div>
    </div>

    <div
      class="relative z-10 mt-6 flex items-center justify-between border-t border-gray-50 pt-6"
    >
      <span class="text-sm text-gray-400">
        商户全称:
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
