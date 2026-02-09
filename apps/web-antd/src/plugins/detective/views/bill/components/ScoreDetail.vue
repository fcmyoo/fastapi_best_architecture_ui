<script setup lang="ts">
import type { MatchCandidate } from '#/plugins/detective/api';

import { Progress } from 'ant-design-vue';

defineProps<{
  scoreDetail: MatchCandidate['score_detail'];
}>();
</script>

<template>
  <div class="space-y-1.5 border-t border-gray-100 pt-3">
    <div class="score-row">
      <span class="score-label">时间</span>
      <Progress
        :percent="Math.round(scoreDetail.time_score * 100)"
        :show-info="false"
        size="small"
        class="score-bar"
      />
      <span class="score-value">
        {{ Math.round(scoreDetail.time_score * 100) }}%
      </span>
    </div>
    <div class="score-row">
      <span class="score-label">金额</span>
      <Progress
        :percent="Math.round(scoreDetail.amount_score * 100)"
        :show-info="false"
        size="small"
        class="score-bar"
      />
      <span class="score-value">
        {{ Math.round(scoreDetail.amount_score * 100) }}%
      </span>
    </div>
    <div class="score-row">
      <span class="score-label">商户</span>
      <Progress
        :percent="Math.round(scoreDetail.merchant_score * 100)"
        :show-info="false"
        size="small"
        class="score-bar"
      />
      <span class="score-value">
        {{ Math.round(scoreDetail.merchant_score * 100) }}%
      </span>
    </div>
    <div class="score-row">
      <span class="score-label">银行卡</span>
      <Progress
        :percent="Math.round(scoreDetail.bank_card_score * 100)"
        :show-info="false"
        size="small"
        class="score-bar"
      />
      <span class="score-value">
        {{ Math.round(scoreDetail.bank_card_score * 100) }}%
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
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
