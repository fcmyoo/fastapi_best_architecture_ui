<script setup lang="ts">
import type { BillDetailItem, MatchCandidate } from '#/plugins/detective/api';

import {
  BankOutlined,
  LinkOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue';
import { Button, Space } from 'ant-design-vue';

import { getSourceIcon } from '#/plugins/detective/utils/source';

defineProps<{
  transaction: BillDetailItem | null;
  selectedCandidate: MatchCandidate | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'match'): void;
}>();

// 获取置信度颜色
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return '#52c41a';
  if (confidence >= 0.6) return '#faad14';
  return '#ff4d4f';
};
</script>

<template>
  <div class="border-t border-gray-100 bg-white/90 px-8 py-5 backdrop-blur">
    <div class="flex items-center justify-between">
      <!-- 匹配预览 -->
      <div class="flex items-center gap-4">
        <div
          v-if="transaction && selectedCandidate"
          class="flex items-center gap-3"
        >
          <!-- 支付端预览 -->
          <div class="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2">
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
              +¥{{ Number(selectedCandidate.transaction.amount).toFixed(2) }}
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
        <div v-else class="text-sm text-gray-400">请从右侧选择一个匹配候选</div>
      </div>

      <!-- 操作按钮 -->
      <Space>
        <Button size="large" class="rounded-xl px-6" @click="emit('cancel')">
          取消
        </Button>
        <Button
          type="primary"
          size="large"
          class="rounded-xl px-8 shadow-lg shadow-indigo-200"
          :disabled="!selectedCandidate"
          :loading="loading"
          @click="emit('match')"
        >
          <template #icon><LinkOutlined /></template>
          确认匹配
        </Button>
      </Space>
    </div>
  </div>
</template>
