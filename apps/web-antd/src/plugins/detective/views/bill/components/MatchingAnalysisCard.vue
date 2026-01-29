<script setup lang="ts">
import type { TransactionDetail } from '#/plugins/detective/api';

import {
  AlipayOutlined,
  BankOutlined,
  CreditCardOutlined,
  FileSearchOutlined,
  MinusCircleOutlined,
  SafetyCertificateOutlined,
  SyncOutlined,
  WechatOutlined,
} from '@ant-design/icons-vue';

const props = defineProps<{
  data: TransactionDetail;
}>();

// 根据来源获取图标
const getSourceIcon = (source: string) => {
  switch (source) {
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
      return BankOutlined;
    }
  }
};

// 根据来源获取来源名称（简短）
const getSourceName = (source: string, cardBank?: null | string) => {
  switch (source) {
    case 'alipay': {
      return '支付宝';
    }
    case 'bank': {
      return cardBank || '储蓄卡';
    }
    case 'credit_card': {
      return cardBank || '信用卡';
    }
    case 'wechat': {
      return '微信';
    }
    default: {
      return '交易';
    }
  }
};

// 获取来源类型标签
const getSourceTypeLabel = (sourceType?: string) => {
  switch (sourceType) {
    case 'debit_side': {
      return '扣款端';
    }
    case 'payment_side': {
      return '支付端';
    }
    default: {
      return '';
    }
  }
};

// 获取置信度百分比
const getConfidencePercent = () => {
  if (props.data.confidence === undefined || props.data.confidence === null)
    return '';
  return `${(Number(props.data.confidence) * 100).toFixed(0)}%`;
};

// 获取匹配状态显示文本
const getMatchStatusText = () => {
  if (!props.data.matched) return '未匹配';
  switch (props.data.match_status) {
    case 'confirmed': {
      return '已确认';
    }
    case 'rejected': {
      return '已拒绝';
    }
    default: {
      return '待审核';
    }
  }
};

// 获取匹配状态徽章样式
const getMatchStatusBadgeClass = () => {
  if (!props.data.matched) {
    return 'bg-gray-500';
  }
  switch (props.data.match_status) {
    case 'confirmed': {
      return 'bg-green-600';
    }
    case 'rejected': {
      return 'bg-red-600';
    }
    default: {
      return 'bg-orange-500';
    }
  }
};

// 获取左侧背景色类
const getLeftBgClass = () => {
  const bgMap: Record<string, string> = {
    alipay: 'bg-blue-50/20 border-blue-100/30',
    wechat: 'bg-green-50/20 border-green-100/30',
    bank: 'bg-orange-50/20 border-orange-100/30',
    credit_card: 'bg-purple-50/20 border-purple-100/30',
  };
  return bgMap[props.data.source] || 'bg-blue-50/20 border-blue-100/30';
};

// 获取右侧背景色类
const getRightBgClass = () => {
  if (!props.data.matched_transaction) return 'bg-red-50/20 border-red-100/30';
  const bgMap: Record<string, string> = {
    alipay: 'bg-blue-50/20 border-blue-100/30',
    wechat: 'bg-green-50/20 border-green-100/30',
    bank: 'bg-orange-50/20 border-orange-100/30',
    credit_card: 'bg-purple-50/20 border-purple-100/30',
  };
  return (
    bgMap[props.data.matched_transaction.source] ||
    'bg-red-50/20 border-red-100/30'
  );
};

// 获取左侧文字颜色类
const getLeftTextClass = () => {
  const colorMap: Record<string, string> = {
    alipay: 'text-blue-500',
    wechat: 'text-green-500',
    bank: 'text-orange-500',
    credit_card: 'text-purple-500',
  };
  return colorMap[props.data.source] || 'text-blue-500';
};

// 获取右侧文字颜色类
const getRightTextClass = () => {
  if (!props.data.matched_transaction) return 'text-red-600';
  const colorMap: Record<string, string> = {
    alipay: 'text-blue-500',
    wechat: 'text-green-500',
    bank: 'text-orange-500',
    credit_card: 'text-purple-500',
  };
  return colorMap[props.data.matched_transaction.source] || 'text-red-600';
};

const LeftSourceIcon = getSourceIcon(props.data.source);
const RightSourceIcon = props.data.matched_transaction
  ? getSourceIcon(props.data.matched_transaction.source)
  : BankOutlined;
</script>

<template>
  <div class="rounded-[24px] border border-gray-100 bg-white p-8 shadow-sm">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 shadow-sm"
        >
          <SafetyCertificateOutlined class="text-xl" />
        </div>
        <div>
          <h3 class="text-lg font-bold text-gray-800">智能对账关联分析</h3>
          <p
            class="text-[10px] font-bold uppercase tracking-widest text-gray-400"
          >
            Automated Engine
          </p>
        </div>
      </div>
      <div
        :class="getMatchStatusBadgeClass()"
        class="flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-md"
      >
        <SafetyCertificateOutlined />
        {{ getMatchStatusText() }}
        <template v-if="getConfidencePercent()">
          ({{ getConfidencePercent() }})
        </template>
      </div>
    </div>

    <!-- 对比网格 -->
    <div class="compare-grid">
      <!-- 左侧：当前交易 -->
      <div :class="getLeftBgClass()" class="compare-panel">
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="side-icon">
              <LeftSourceIcon :class="getLeftTextClass()" class="text-lg" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-gray-800">
                {{ getSourceName(data.source, data.card_bank) }}
              </h4>
              <p
                :class="getLeftTextClass()"
                class="text-[9px] font-bold uppercase tracking-wider"
              >
                {{ getSourceTypeLabel(data.source_type) }}
              </p>
            </div>
          </div>
          <span class="id-badge">ID: {{ data.id }}</span>
        </div>
        <div class="space-y-4">
          <div class="info-block">
            <p class="block-label">交易描述</p>
            <p class="block-content">{{ data.description || '-' }}</p>
          </div>
          <div class="info-block">
            <p class="block-label">商户/收款方</p>
            <p class="block-content">
              {{ data.merchant_norm || data.merchant_raw || '-' }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="info-block">
              <p class="block-label">交易时间</p>
              <p class="block-content font-mono font-bold">
                {{
                  data.transaction_time?.split(' ')[1] ||
                  data.transaction_time ||
                  '-'
                }}
              </p>
            </div>
            <div class="info-block">
              <p class="block-label">交易金额</p>
              <p
                class="block-content font-mono font-bold"
                :class="
                  data.direction === 'expense'
                    ? 'text-rose-500'
                    : 'text-emerald-500'
                "
              >
                {{ data.direction === 'expense' ? '-' : '+' }}¥{{
                  Number(data.amount).toFixed(2)
                }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="info-block">
              <p class="block-label">支付方式</p>
              <p class="block-content">{{ data.payment_method || '-' }}</p>
            </div>
            <div class="info-block">
              <p class="block-label">交易类型</p>
              <p class="block-content">
                {{ data.tx_type || data.category || '-' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间连接器 -->
      <div class="connector-area">
        <div class="line"></div>
        <div class="badge-center"><SyncOutlined /></div>
      </div>

      <!-- 右侧：匹配的交易 -->
      <div :class="getRightBgClass()" class="compare-panel">
        <template v-if="data.matched_transaction">
          <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="side-icon">
                <RightSourceIcon :class="getRightTextClass()" class="text-lg" />
              </div>
              <div>
                <h4 class="text-sm font-bold text-gray-800">
                  {{
                    getSourceName(
                      data.matched_transaction.source,
                      data.matched_transaction.card_bank,
                    )
                  }}
                </h4>
                <p
                  :class="getRightTextClass()"
                  class="text-[9px] font-bold uppercase tracking-wider"
                >
                  {{ getSourceTypeLabel(data.matched_transaction.source_type) }}
                </p>
              </div>
            </div>
            <span class="id-badge">ID: {{ data.matched_transaction.id }}</span>
          </div>
          <div class="space-y-4">
            <div class="info-block">
              <p class="block-label">交易描述</p>
              <p class="block-content">
                {{ data.matched_transaction.description || '-' }}
              </p>
            </div>
            <div class="info-block">
              <p class="block-label">商户/收款方</p>
              <p class="block-content">
                {{
                  data.matched_transaction.merchant_norm ||
                  data.matched_transaction.merchant_raw ||
                  '-'
                }}
              </p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="info-block">
                <p class="block-label">交易时间</p>
                <p class="block-content font-mono font-bold">
                  {{
                    data.matched_transaction.transaction_time?.split(' ')[1] ||
                    data.matched_transaction.transaction_time ||
                    '-'
                  }}
                </p>
              </div>
              <div class="info-block">
                <p class="block-label">交易金额</p>
                <p
                  class="block-content font-mono font-bold"
                  :class="
                    data.matched_transaction.source_type === 'debit_side'
                      ? 'text-emerald-500'
                      : 'text-rose-500'
                  "
                >
                  {{
                    data.matched_transaction.source_type === 'debit_side'
                      ? '+'
                      : '-'
                  }}¥{{ Number(data.matched_transaction.amount).toFixed(2) }}
                </p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="info-block">
                <p class="block-label">银行/卡号</p>
                <p class="block-content">
                  {{
                    data.matched_transaction.card_bank
                      ? `${data.matched_transaction.card_bank}(${data.matched_transaction.card_last4 || ''})`
                      : '-'
                  }}
                </p>
              </div>
              <div class="info-block">
                <p class="block-label">交易状态</p>
                <p class="block-content">
                  {{ data.matched_transaction.tx_status || '-' }}
                </p>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex h-full items-center justify-center py-12">
            <div class="text-center text-gray-400">
              <MinusCircleOutlined class="mb-2 text-4xl" />
              <p class="text-sm">暂无匹配交易</p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="mt-8 flex items-center justify-between border-t border-gray-50 pt-6 text-[11px] font-medium text-gray-500"
    >
      <div class="flex items-center gap-6">
        <span class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
          策略: 金额+时间(±5s)
        </span>
        <span v-if="data.confidence" class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
          置信度: {{ getConfidencePercent() }} ({{
            Number(data.confidence) >= 0.8 ? 'HIGH' : 'MEDIUM'
          }})
        </span>
        <span v-else class="flex items-center gap-1.5">
          <span class="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
          置信度: 未计算
        </span>
      </div>
      <a-button type="link" size="small" class="font-bold text-indigo-600">
        对账日志 <FileSearchOutlined />
      </a-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.compare-grid {
  display: grid;
  grid-template-columns: 1fr 48px 1fr;
  align-items: stretch;
}

.compare-panel {
  @apply flex flex-col rounded-2xl border p-6;
}

.connector-area {
  @apply relative flex h-full flex-col items-center justify-center;

  .line {
    @apply absolute z-0 w-full border-t border-dashed border-gray-200;

    right: -20px;
    left: -20px;
  }

  .badge-center {
    @apply z-10 flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-indigo-500 shadow-sm;
  }
}

.side-icon {
  @apply flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm;
}

.id-badge {
  @apply rounded border border-gray-50 bg-white px-2 py-1 font-mono text-[10px] text-gray-400 shadow-sm;
}

.info-block {
  @apply flex min-h-[56px] flex-col justify-center rounded-xl border border-white bg-white/80 p-3;

  .block-label {
    @apply mb-0.5 text-[10px] font-bold uppercase text-gray-400;
  }

  .block-content {
    @apply line-clamp-2 text-xs leading-tight text-gray-700;
  }
}
</style>
