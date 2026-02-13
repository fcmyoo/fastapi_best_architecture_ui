<script setup lang="ts">
import type { TransactionDetail } from '#/plugins/detective/api';

import { computed, h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LeftOutlined,
  MinusCircleOutlined,
  ShareAltOutlined,
  ShopOutlined,
  TagOutlined,
} from '@ant-design/icons-vue';
import { Button, Modal, Spin, Tag } from 'ant-design-vue';

import { $t } from '#/locales';
import {
  getMatchDetailApi,
  getTransactionDetailApi,
} from '#/plugins/detective/api';
import {
  formatTime,
  getMatchStatusColor,
  getSourceDisplayName,
  getSourceDotClass,
} from '#/plugins/detective/utils/source';

import CoreAmountCard from './components/CoreAmountCard.vue';
import MatchingAnalysisCard from './components/MatchingAnalysisCard.vue';

defineOptions({ name: 'DetectiveBillDetail' });

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detail = ref<null | TransactionDetail>(null);

const txId = computed(() => Number(route.params.id));

// 来源选项
const sourceOptions: Record<string, string> = {
  wechat: $t('detective.bill.sourceOptions.wechat'),
  alipay: $t('detective.bill.sourceOptions.alipay'),
  bank: $t('detective.bill.sourceOptions.bank'),
  credit_card: $t('detective.bill.sourceOptions.credit_card'),
};

// 来源类型选项
const sourceTypeOptions: Record<string, string> = {
  payment_side: $t('detective.bill.sourceTypeOptions.payment_side'),
  debit_side: $t('detective.bill.sourceTypeOptions.debit_side'),
};

// 匹配状态选项
const matchStatusOptions: Record<string, string> = {
  pending: $t('detective.bill.matchStatusOptions.pending'),
  confirmed: $t('detective.bill.matchStatusOptions.confirmed'),
  rejected: $t('detective.bill.matchStatusOptions.rejected'),
};

const fetchDetail = async () => {
  if (!txId.value) return;
  loading.value = true;
  try {
    const data = await getTransactionDetailApi(txId.value);

    // 如果已匹配但没有状态，获取匹配详情
    if (data.matched && data.match_id && !data.match_status) {
      try {
        const matchDetail = await getMatchDetailApi(data.match_id);
        data.match_status = matchDetail.status;
        if (data.confidence === null || data.confidence === undefined) {
          data.confidence = Number(matchDetail.confidence);
        }
      } catch (error) {
        console.error('Failed to fetch match detail:', error);
      }
    }

    // 从路由 state 获取列表页传递的 confidence 和 match_status
    const state = history.state as null | {
      confidence?: number | string;
      match_status?: string;
    };
    if (state?.confidence !== undefined && data.confidence === null) {
      data.confidence =
        typeof state.confidence === 'string'
          ? Number.parseFloat(state.confidence)
          : state.confidence;
    }
    if (state?.match_status && !data.match_status) {
      data.match_status = state.match_status;
    }
    detail.value = data;
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push('/detective/bill/details');
};

// 匹配对比弹窗
const compareModalVisible = ref(false);

// 获取支付端和扣款端交易
const paymentSideTx = computed(() => {
  if (!detail.value) return null;
  return detail.value.source_type === 'payment_side'
    ? detail.value
    : detail.value.matched_transaction;
});

const debitSideTx = computed(() => {
  if (!detail.value) return null;
  return detail.value.source_type === 'debit_side'
    ? detail.value
    : detail.value.matched_transaction;
});

// 获取分类图标
const getCategoryIcon = () => {
  if (!detail.value) return ShopOutlined;
  // 根据交易类型返回不同的图标
  const txType = detail.value.tx_type || detail.value.category || '';
  if (txType.includes('教育') || txType.includes('培训')) {
    return BookOutlined;
  }
  return ShopOutlined;
};

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <!-- Header Navigation -->
    <header class="mb-8 flex items-center justify-between">
      <div
        class="group flex cursor-pointer items-center gap-2 font-bold text-gray-500 transition-colors hover:text-blue-600"
        @click="goBack"
      >
        <LeftOutlined class="transition-transform group-hover:-translate-x-1" />
        交易详情
      </div>
      <div class="flex gap-3">
        <Button shape="round" :icon="h(ShareAltOutlined)">分享</Button>
        <Button
          type="primary"
          shape="round"
          :icon="h(EditOutlined)"
          class="shadow-lg shadow-blue-100"
        >
          编辑交易
        </Button>
      </div>
    </header>

    <Spin :spinning="loading">
      <template v-if="detail">
        <div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <!-- Main Content Area -->
          <main class="space-y-8 lg:col-span-2">
            <!-- Core Card -->
            <CoreAmountCard :data="detail">
              <template #category-icon>
                <component :is="getCategoryIcon()" class="text-2xl" />
              </template>
            </CoreAmountCard>

            <!-- Matching Analysis Card -->
            <MatchingAnalysisCard :data="detail" @success="fetchDetail" />
          </main>

          <!-- Sidebar -->
          <aside class="space-y-8">
            <!-- Source File Card -->
            <div
              class="rounded-[24px] bg-indigo-900 p-6 text-white shadow-xl shadow-indigo-100"
            >
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-800"
                >
                  <FileTextOutlined class="text-xl" />
                </div>
                <div>
                  <h4 class="text-sm font-bold">数据源文件</h4>
                  <p class="text-[10px] font-bold uppercase text-indigo-300">
                    Statement CSV
                  </p>
                </div>
              </div>
              <div
                class="rounded-2xl border border-indigo-700/50 bg-indigo-800/50 p-4"
              >
                <p class="mb-2 break-all text-xs text-indigo-100">
                  {{ detail.bill_file?.filename || '-' }}
                </p>
                <span
                  class="rounded-md bg-indigo-700 px-2 py-0.5 text-[10px] font-bold"
                >
                  FILE ID: {{ detail.bill_file?.id || '-' }}
                </span>
              </div>
            </div>

            <!-- Notes & Tags -->
            <div
              class="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm"
            >
              <h4
                class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700"
              >
                <TagOutlined class="text-gray-400" /> 备注与标签
              </h4>
              <div class="space-y-4">
                <div
                  class="cursor-pointer rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-xs italic text-gray-400 transition-colors hover:bg-gray-100"
                >
                  {{ detail.note || '点击添加备注内容...' }}
                </div>
                <div class="flex flex-wrap gap-2">
                  <Tag
                    v-if="detail.category"
                    closable
                    color="blue"
                    class="rounded-lg border-none px-3 py-0.5 font-bold"
                  >
                    {{ detail.category }}
                  </Tag>
                  <Tag
                    v-if="detail.tx_type"
                    closable
                    color="cyan"
                    class="rounded-lg border-none px-3 py-0.5 font-bold"
                  >
                    {{ detail.tx_type }}
                  </Tag>
                  <Button
                    type="dashed"
                    size="small"
                    shape="round"
                    class="text-[10px]"
                  >
                    + 新增
                  </Button>
                </div>
              </div>
            </div>

            <!-- Additional Info Card -->
            <div
              class="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm"
            >
              <h4
                class="mb-4 flex items-center gap-2 text-sm font-bold text-gray-700"
              >
                <FileTextOutlined class="text-gray-400" /> 详细信息
              </h4>
              <div class="space-y-3">
                <div
                  class="flex items-center justify-between border-b border-gray-50 py-2"
                >
                  <span class="text-xs text-gray-400">来源</span>
                  <div class="flex items-center gap-2">
                    <span
                      :class="getSourceDotClass(detail.source)"
                      class="h-2 w-2 rounded-full"
                    ></span>
                    <span class="text-xs font-medium text-gray-700">{{
                      sourceOptions[detail.source] || detail.source
                    }}</span>
                  </div>
                </div>
                <div
                  class="flex items-center justify-between border-b border-gray-50 py-2"
                >
                  <span class="text-xs text-gray-400">来源类型</span>
                  <span class="text-xs font-medium text-gray-700">{{
                    sourceTypeOptions[detail.source_type] || detail.source_type
                  }}</span>
                </div>
                <div
                  class="flex items-center justify-between border-b border-gray-50 py-2"
                >
                  <span class="text-xs text-gray-400">银行</span>
                  <span class="text-xs font-medium text-gray-700">{{
                    detail.card_bank || '-'
                  }}</span>
                </div>
                <div
                  class="flex items-center justify-between border-b border-gray-50 py-2"
                >
                  <span class="text-xs text-gray-400">卡号后四位</span>
                  <span class="text-xs font-medium text-gray-700">{{
                    detail.card_last4 ? `****${detail.card_last4}` : '-'
                  }}</span>
                </div>
                <div
                  class="flex items-center justify-between border-b border-gray-50 py-2"
                >
                  <span class="text-xs text-gray-400">支付方式</span>
                  <span class="text-xs font-medium text-gray-700">{{
                    detail.payment_method || '-'
                  }}</span>
                </div>
                <div
                  class="flex items-center justify-between border-b border-gray-50 py-2"
                >
                  <span class="text-xs text-gray-400">账单月份</span>
                  <span class="text-xs font-medium text-gray-700">{{
                    detail.statement_month || '-'
                  }}</span>
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-xs text-gray-400">外部ID</span>
                  <span
                    class="max-w-[150px] truncate text-xs font-medium text-gray-700"
                    :title="detail.external_id"
                  >
                    {{ detail.external_id || '-' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Danger Actions -->
            <Button
              danger
              type="text"
              block
              class="h-14 rounded-[20px] border-2 border-transparent font-bold hover:border-rose-100 hover:bg-rose-50"
            >
              <template #icon><DeleteOutlined /></template>
              删除此笔交易记录
            </Button>
          </aside>
        </div>
      </template>
    </Spin>

    <!-- 匹配对比弹窗 -->
    <Modal
      v-model:open="compareModalVisible"
      :title="$t('detective.transaction.detailPage.matchCompare')"
      :footer="null"
      width="900px"
      destroy-on-close
    >
      <div class="grid grid-cols-2 gap-4">
        <!-- 支付端 -->
        <div class="rounded-2xl border border-blue-100/30 bg-blue-50/20 p-6">
          <div
            class="mb-4 flex items-center gap-2 border-b border-blue-100 pb-3"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm"
            >
              <span class="text-xs font-bold text-blue-500">支</span>
            </div>
            <h4 class="text-sm font-bold text-gray-800">
              {{ $t('detective.reconcile.paymentTx') }}
            </h4>
          </div>
          <template v-if="paymentSideTx">
            <div class="mb-4 text-center">
              <div class="text-2xl font-bold text-red-500">
                -¥{{ Number(paymentSideTx.amount).toFixed(2) }}
              </div>
              <div class="mt-1 text-xs text-gray-500">
                {{ formatTime(paymentSideTx.transaction_time) }}
              </div>
            </div>
            <div class="space-y-2">
              <div class="rounded-xl border border-white bg-white/80 p-3">
                <p class="mb-0.5 text-[10px] font-bold uppercase text-gray-400">
                  来源
                </p>
                <div class="flex items-center gap-1">
                  <span
                    :class="getSourceDotClass(paymentSideTx.source)"
                    class="h-2 w-2 rounded-full"
                  ></span>
                  <p class="text-xs text-gray-700">
                    {{
                      getSourceDisplayName(
                        paymentSideTx.source,
                        paymentSideTx.card_bank,
                      )
                    }}
                  </p>
                </div>
              </div>
              <div class="rounded-xl border border-white bg-white/80 p-3">
                <p class="mb-0.5 text-[10px] font-bold uppercase text-gray-400">
                  商户
                </p>
                <p class="text-xs text-gray-700">
                  {{ paymentSideTx.merchant_raw || '-' }}
                </p>
              </div>
              <div class="rounded-xl border border-white bg-white/80 p-3">
                <p class="mb-0.5 text-[10px] font-bold uppercase text-gray-400">
                  描述
                </p>
                <p class="text-xs text-gray-700">
                  {{ paymentSideTx.description || '-' }}
                </p>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="flex h-40 items-center justify-center">
              <div class="text-center text-gray-400">
                <MinusCircleOutlined class="mb-2 text-3xl" />
                <p class="text-xs">暂无数据</p>
              </div>
            </div>
          </template>
        </div>

        <!-- 扣款端 -->
        <div
          class="rounded-2xl border border-orange-100/30 bg-orange-50/20 p-6"
        >
          <div
            class="mb-4 flex items-center gap-2 border-b border-orange-100 pb-3"
          >
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm"
            >
              <span class="text-xs font-bold text-orange-500">扣</span>
            </div>
            <h4 class="text-sm font-bold text-gray-800">
              {{ $t('detective.reconcile.debitTx') }}
            </h4>
          </div>
          <template v-if="debitSideTx">
            <div class="mb-4 text-center">
              <div class="text-2xl font-bold text-green-500">
                +¥{{ Number(debitSideTx.amount).toFixed(2) }}
              </div>
              <div class="mt-1 text-xs text-gray-500">
                {{ formatTime(debitSideTx.transaction_time) }}
              </div>
            </div>
            <div class="space-y-2">
              <div class="rounded-xl border border-white bg-white/80 p-3">
                <p class="mb-0.5 text-[10px] font-bold uppercase text-gray-400">
                  来源
                </p>
                <div class="flex items-center gap-1">
                  <span
                    :class="getSourceDotClass(debitSideTx.source)"
                    class="h-2 w-2 rounded-full"
                  ></span>
                  <p class="text-xs text-gray-700">
                    {{
                      getSourceDisplayName(
                        debitSideTx.source,
                        debitSideTx.card_bank,
                      )
                    }}
                  </p>
                </div>
              </div>
              <div class="rounded-xl border border-white bg-white/80 p-3">
                <p class="mb-0.5 text-[10px] font-bold uppercase text-gray-400">
                  商户
                </p>
                <p class="text-xs text-gray-700">
                  {{ debitSideTx.merchant_raw || '-' }}
                </p>
              </div>
              <div class="rounded-xl border border-white bg-white/80 p-3">
                <p class="mb-0.5 text-[10px] font-bold uppercase text-gray-400">
                  描述
                </p>
                <p class="text-xs text-gray-700">
                  {{ debitSideTx.description || '-' }}
                </p>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="flex h-40 items-center justify-center">
              <div class="text-center text-gray-400">
                <MinusCircleOutlined class="mb-2 text-3xl" />
                <p class="text-xs">暂无数据</p>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 匹配信息 -->
      <div
        v-if="detail"
        class="mt-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      >
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="mb-1 text-[10px] font-bold uppercase text-gray-400">
              置信度
            </p>
            <p class="text-lg font-bold text-indigo-600">
              {{
                detail.confidence
                  ? `${(Number(detail.confidence) * 100).toFixed(0)}%`
                  : '-'
              }}
            </p>
          </div>
          <div class="text-center">
            <p class="mb-1 text-[10px] font-bold uppercase text-gray-400">
              匹配状态
            </p>
            <Tag
              :color="getMatchStatusColor(detail.match_status)"
              class="text-sm font-bold"
            >
              {{ matchStatusOptions[detail.match_status || ''] || '-' }}
            </Tag>
          </div>
          <div class="text-center">
            <p class="mb-1 text-[10px] font-bold uppercase text-gray-400">
              匹配ID
            </p>
            <p class="text-lg font-bold text-gray-700">
              {{ detail.match_id || '-' }}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
/* 全局样式微调 */
:deep(.ant-btn-round) {
  @apply font-bold;
}
</style>
