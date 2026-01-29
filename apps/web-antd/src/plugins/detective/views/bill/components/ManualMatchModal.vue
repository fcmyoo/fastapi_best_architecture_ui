<script setup lang="ts">
import type { BillDetailItem, MatchCandidate } from '#/plugins/detective/api';

import { computed, ref, watch } from 'vue';

import {
  AlipayOutlined,
  BankOutlined,
  CheckCircleFilled,
  CloseOutlined,
  CreditCardOutlined,
  LinkOutlined,
  SearchOutlined,
  SwapOutlined,
  WechatOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Empty,
  Input,
  InputNumber,
  message,
  Progress,
  Space,
  Spin,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import { getMatchCandidatesApi, manualMatchApi } from '#/plugins/detective/api';

const props = defineProps<{
  open: boolean;
  transaction: BillDetailItem | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}>();

// 状态
const loading = ref(false);
const candidatesLoading = ref(false);
const candidates = ref<MatchCandidate[]>([]);
const selectedCandidate = ref<MatchCandidate | null>(null);

// 筛选条件
const filterAmount = ref<number | undefined>(undefined);
const filterMerchant = ref<string>('');

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

// 根据来源获取颜色类
const getSourceColorClass = (source: string) => {
  const colorMap: Record<string, string> = {
    alipay: 'text-blue-500 bg-blue-50',
    wechat: 'text-green-500 bg-green-50',
    bank: 'text-orange-500 bg-orange-50',
    credit_card: 'text-purple-500 bg-purple-50',
  };
  return colorMap[source] || 'text-gray-500 bg-gray-50';
};

// 根据来源获取边框颜色类
const getSourceBorderClass = (source: string) => {
  const colorMap: Record<string, string> = {
    alipay: 'border-blue-200',
    wechat: 'border-green-200',
    bank: 'border-orange-200',
    credit_card: 'border-purple-200',
  };
  return colorMap[source] || 'border-gray-200';
};

// 根据来源获取名称
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

// 获取置信度颜色
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#52c41a';
  if (confidence >= 0.6) return '#faad14';
  return '#ff4d4f';
};

// 获取置信度状态
const getConfidenceStatus = (
  confidence: number,
): 'exception' | 'normal' | 'success' => {
  if (confidence >= 0.8) return 'success';
  if (confidence >= 0.6) return 'normal';
  return 'exception';
};

// 过滤后的候选列表
const filteredCandidates = computed(() => {
  let result = candidates.value;
  if (filterAmount.value !== undefined) {
    result = result.filter(
      (c) =>
        Math.abs(Number(c.transaction.amount) - filterAmount.value!) < 0.01,
    );
  }
  if (filterMerchant.value) {
    const keyword = filterMerchant.value.toLowerCase();
    result = result.filter((c) =>
      c.transaction.merchant_raw?.toLowerCase().includes(keyword),
    );
  }
  return result;
});

// 获取匹配候选
const fetchCandidates = async () => {
  if (!props.transaction) return;
  candidatesLoading.value = true;
  selectedCandidate.value = null;
  try {
    const res = await getMatchCandidatesApi(props.transaction.id, true);
    candidates.value = res.candidates || [];
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    candidates.value = [];
  } finally {
    candidatesLoading.value = false;
  }
};

// 选择候选
const selectCandidate = (candidate: MatchCandidate) => {
  selectedCandidate.value = candidate;
};

// 执行匹配
const handleMatch = async () => {
  if (!props.transaction || !selectedCandidate.value) return;

  loading.value = true;
  try {
    await manualMatchApi({
      payment_tx_id: props.transaction.id,
      debit_tx_id: selectedCandidate.value.transaction.id,
    });
    message.success($t('detective.reconcile.matchSuccess'));
    emit('success');
    handleClose();
  } catch (error: any) {
    if (error?.response?.status === 404) {
      message.error($t('detective.reconcile.txNotFound'));
    } else if (error?.response?.status === 403) {
      message.error($t('detective.reconcile.noPermission'));
    } else {
      message.error($t('detective.reconcile.matchFailed'));
    }
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const handleClose = () => {
  emit('update:open', false);
  selectedCandidate.value = null;
  candidates.value = [];
  filterAmount.value = undefined;
  filterMerchant.value = '';
};

// 监听弹窗打开
watch(
  () => props.open,
  (newVal) => {
    if (newVal && props.transaction) {
      fetchCandidates();
    }
  },
);

const SourceIcon = computed(() =>
  props.transaction ? getSourceIcon(props.transaction.source) : BankOutlined,
);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[1000] flex items-center justify-center"
      >
        <!-- 遮罩层 -->
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="handleClose"
        ></div>

        <!-- 弹窗主体 -->
        <div
          class="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-50 to-white shadow-2xl"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-gray-100 bg-white/80 px-8 py-5 backdrop-blur"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200"
              >
                <LinkOutlined class="text-xl text-white" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-800">手动匹配交易</h2>
                <p
                  class="text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                >
                  Manual Transaction Matching
                </p>
              </div>
            </div>
            <button
              class="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
              @click="handleClose"
            >
              <CloseOutlined class="text-lg" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-8">
            <div class="compare-grid">
              <!-- 左侧：当前交易 -->
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
                      transaction
                        ? getSourceColorClass(transaction.source)
                        : 'bg-gray-50'
                    "
                  >
                    <component :is="SourceIcon" class="text-xl" />
                  </div>
                  <div>
                    <h3 class="text-base font-bold text-gray-800">
                      {{
                        transaction
                          ? getSourceName(
                              transaction.source,
                              transaction.card_bank,
                            )
                          : '-'
                      }}
                    </h3>
                    <p
                      class="text-[10px] font-bold uppercase tracking-wider text-gray-400"
                    >
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
                          {{
                            transaction.tx_type || transaction.category || '-'
                          }}
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

              <!-- 中间连接器 -->
              <div class="connector-area">
                <div class="connector-line"></div>
                <div class="connector-badge">
                  <SwapOutlined class="text-indigo-500" />
                </div>
              </div>

              <!-- 右侧：匹配候选 -->
              <div
                class="flex flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div class="mb-5 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50"
                    >
                      <BankOutlined class="text-xl text-orange-500" />
                    </div>
                    <div>
                      <h3 class="text-base font-bold text-gray-800">
                        扣款端候选
                      </h3>
                      <p
                        class="text-[10px] font-bold uppercase tracking-wider text-gray-400"
                      >
                        Debit Side Candidates
                      </p>
                    </div>
                  </div>
                  <Tag
                    v-if="candidates.length > 0"
                    color="blue"
                    class="rounded-full px-3 font-bold"
                  >
                    {{ filteredCandidates.length }} 条候选
                  </Tag>
                </div>

                <!-- 筛选条件 -->
                <div class="mb-4 flex gap-2">
                  <InputNumber
                    v-model:value="filterAmount"
                    placeholder="金额"
                    :precision="2"
                    :min="0"
                    size="small"
                    class="w-24"
                    allow-clear
                  />
                  <Input
                    v-model:value="filterMerchant"
                    placeholder="商户关键词"
                    size="small"
                    class="flex-1"
                    allow-clear
                  >
                    <template #prefix>
                      <SearchOutlined class="text-gray-300" />
                    </template>
                  </Input>
                </div>

                <!-- 候选列表 -->
                <div class="candidates-scroll flex-1 space-y-3 overflow-y-auto">
                  <Spin
                    v-if="candidatesLoading"
                    class="flex justify-center py-8"
                  >
                    <template #tip>加载候选中...</template>
                  </Spin>

                  <Empty
                    v-else-if="filteredCandidates.length === 0"
                    description="暂无匹配候选"
                    class="py-8"
                  />

                  <div
                    v-for="candidate in filteredCandidates"
                    v-else
                    :key="candidate.transaction.id"
                    class="candidate-card cursor-pointer rounded-2xl border-2 p-4 transition-all hover:shadow-md"
                    :class="
                      selectedCandidate?.transaction.id ===
                      candidate.transaction.id
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
                        : candidate.transaction.matched
                          ? 'border-orange-200 bg-orange-50/30 hover:border-orange-300'
                          : 'border-gray-100 hover:border-indigo-200'
                    "
                    @click="selectCandidate(candidate)"
                  >
                    <!-- 候选头部 -->
                    <div class="mb-3 flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <Progress
                          type="circle"
                          :percent="Math.round(candidate.confidence * 100)"
                          :size="42"
                          :stroke-color="
                            getConfidenceColor(candidate.confidence)
                          "
                          :status="getConfidenceStatus(candidate.confidence)"
                        />
                        <div>
                          <p
                            class="text-lg font-bold"
                            :style="{
                              color: getConfidenceColor(candidate.confidence),
                            }"
                          >
                            {{ Math.round(candidate.confidence * 100) }}%
                          </p>
                          <p class="text-[10px] text-gray-400">置信度</p>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <Tag
                          v-if="candidate.transaction.matched"
                          color="orange"
                          class="rounded-full"
                        >
                          已匹配
                        </Tag>
                        <CheckCircleFilled
                          v-if="
                            selectedCandidate?.transaction.id ===
                            candidate.transaction.id
                          "
                          class="text-xl text-indigo-500"
                        />
                      </div>
                    </div>

                    <!-- 交易信息 -->
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-gray-500">
                          {{ candidate.transaction.transaction_time }}
                        </span>
                        <span class="text-lg font-bold text-emerald-500">
                          +¥{{
                            Number(candidate.transaction.amount).toFixed(2)
                          }}
                        </span>
                      </div>
                      <p class="truncate text-sm text-gray-700">
                        {{ candidate.transaction.merchant_raw || '-' }}
                      </p>
                      <div
                        v-if="
                          candidate.transaction.card_bank ||
                          candidate.transaction.card_last4
                        "
                        class="flex items-center gap-2 text-xs text-gray-400"
                      >
                        <BankOutlined />
                        <span>
                          {{ candidate.transaction.card_bank || '' }}
                          {{
                            candidate.transaction.card_last4
                              ? `(${candidate.transaction.card_last4})`
                              : ''
                          }}
                        </span>
                      </div>
                    </div>

                    <!-- 评分详情 -->
                    <div class="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                      <div class="score-row">
                        <span class="score-label">时间</span>
                        <Progress
                          :percent="
                            Math.round(candidate.score_detail.time_score * 100)
                          "
                          :show-info="false"
                          size="small"
                          class="score-bar"
                        />
                        <span class="score-value">
                          {{
                            Math.round(candidate.score_detail.time_score * 100)
                          }}%
                        </span>
                      </div>
                      <div class="score-row">
                        <span class="score-label">金额</span>
                        <Progress
                          :percent="
                            Math.round(
                              candidate.score_detail.amount_score * 100,
                            )
                          "
                          :show-info="false"
                          size="small"
                          class="score-bar"
                        />
                        <span class="score-value">
                          {{
                            Math.round(
                              candidate.score_detail.amount_score * 100,
                            )
                          }}%
                        </span>
                      </div>
                      <div class="score-row">
                        <span class="score-label">商户</span>
                        <Progress
                          :percent="
                            Math.round(
                              candidate.score_detail.merchant_score * 100,
                            )
                          "
                          :show-info="false"
                          size="small"
                          class="score-bar"
                        />
                        <span class="score-value">
                          {{
                            Math.round(
                              candidate.score_detail.merchant_score * 100,
                            )
                          }}%
                        </span>
                      </div>
                      <div class="score-row">
                        <span class="score-label">银行卡</span>
                        <Progress
                          :percent="
                            Math.round(
                              candidate.score_detail.bank_card_score * 100,
                            )
                          "
                          :show-info="false"
                          size="small"
                          class="score-bar"
                        />
                        <span class="score-value">
                          {{
                            Math.round(
                              candidate.score_detail.bank_card_score * 100,
                            )
                          }}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer：匹配预览 -->
          <div
            class="border-t border-gray-100 bg-white/90 px-8 py-5 backdrop-blur"
          >
            <div class="flex items-center justify-between">
              <!-- 匹配预览 -->
              <div class="flex items-center gap-4">
                <div
                  v-if="transaction && selectedCandidate"
                  class="flex items-center gap-3"
                >
                  <!-- 支付端预览 -->
                  <div
                    class="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2"
                  >
                    <component
                      :is="getSourceIcon(transaction.source)"
                      class="text-rose-500"
                    />
                    <span class="font-bold text-rose-600">
                      -¥{{ Number(transaction.amount).toFixed(2) }}
                    </span>
                  </div>

                  <SwapOutlined class="text-xl text-gray-300" />

                  <!-- 扣款端预览 -->
                  <div
                    class="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2"
                  >
                    <BankOutlined class="text-emerald-500" />
                    <span class="font-bold text-emerald-600">
                      +¥{{
                        Number(selectedCandidate.transaction.amount).toFixed(2)
                      }}
                    </span>
                  </div>

                  <!-- 置信度 -->
                  <div class="ml-4 flex items-center gap-2">
                    <span class="text-sm text-gray-400">置信度:</span>
                    <span
                      class="text-lg font-bold"
                      :style="{
                        color: getConfidenceColor(selectedCandidate.confidence),
                      }"
                    >
                      {{ Math.round(selectedCandidate.confidence * 100) }}%
                    </span>
                  </div>
                </div>
                <div v-else class="text-sm text-gray-400">
                  请从右侧选择一个匹配候选
                </div>
              </div>

              <!-- 操作按钮 -->
              <Space>
                <Button
                  size="large"
                  class="rounded-xl px-6"
                  @click="handleClose"
                >
                  取消
                </Button>
                <Button
                  type="primary"
                  size="large"
                  class="rounded-xl px-8 shadow-lg shadow-indigo-200"
                  :disabled="!selectedCandidate"
                  :loading="loading"
                  @click="handleMatch"
                >
                  <template #icon><LinkOutlined /></template>
                  确认匹配
                </Button>
              </Space>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .relative {
    transform: scale(0.95) translateY(20px);
  }
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 60px 1fr;
  gap: 0;
  align-items: stretch;
  min-height: 500px;
}

.connector-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .connector-line {
    position: absolute;
    top: 50%;
    right: -24px;
    left: -24px;
    height: 2px;
    background: repeating-linear-gradient(
      to right,
      #e5e7eb,
      #e5e7eb 6px,
      transparent 6px,
      transparent 12px
    );
  }

  .connector-badge {
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    font-size: 18px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
  }
}

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

.candidates-scroll {
  max-height: 380px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;

    &:hover {
      background: #94a3b8;
    }
  }
}

.candidate-card {
  transition: all 0.2s ease;
}

.score-row {
  display: flex;
  gap: 8px;
  align-items: center;

  .score-label {
    width: 48px;
    font-size: 11px;
    color: #9ca3af;
  }

  .score-bar {
    flex: 1;
  }

  .score-value {
    width: 36px;
    font-size: 11px;
    color: #6b7280;
    text-align: right;
  }
}
</style>
