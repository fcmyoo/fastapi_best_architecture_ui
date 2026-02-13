<script setup lang="ts">
import type { MatchCandidate } from '#/plugins/detective/api';

import { computed, ref } from 'vue';

import {
  BankOutlined,
  CheckCircleFilled,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { Empty, Input, InputNumber, Progress, Spin, Tag } from 'ant-design-vue';

import ScoreDetail from './ScoreDetail.vue';

const props = defineProps<{
  candidates: MatchCandidate[];
  loading: boolean;
  selectedCandidate: MatchCandidate | null;
}>();

const emit = defineEmits<{
  (e: 'update:selectedCandidate', value: MatchCandidate | null): void;
}>();

// 筛选条件
const filterAmount = ref<number | undefined>(undefined);
const filterMerchant = ref<string>('');

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
  let result = props.candidates;
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

const handleSelect = (candidate: MatchCandidate) => {
  emit('update:selectedCandidate', candidate);
};
</script>

<template>
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
          <h3 class="text-base font-bold text-gray-800">扣款端候选</h3>
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
      <Spin v-if="loading" class="flex justify-center py-8">
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
          selectedCandidate?.transaction.id === candidate.transaction.id
            ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
            : candidate.transaction.matched
              ? 'border-orange-200 bg-orange-50/30 hover:border-orange-300'
              : 'border-gray-100 hover:border-indigo-200'
        "
        @click="handleSelect(candidate)"
      >
        <!-- 候选头部 -->
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Progress
              type="circle"
              :percent="Math.round(candidate.confidence * 100)"
              :size="42"
              :stroke-color="getConfidenceColor(candidate.confidence)"
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
                selectedCandidate?.transaction.id === candidate.transaction.id
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
              +¥{{ Number(candidate.transaction.amount).toFixed(2) }}
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
        <ScoreDetail :score-data="candidate.score_detail" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
</style>
