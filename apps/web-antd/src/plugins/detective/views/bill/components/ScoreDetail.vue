<script setup lang="ts">
import { computed } from 'vue';

import { Card, Col, Progress, Row } from 'ant-design-vue';

import { $t } from '#/locales';

interface ScoreData {
  time_score: number;
  amount_score: number;
  bank_card_score?: number;
  merchant_score?: number;
  channel_score?: number;
  total_score?: number;
  confidence?: number;
  time_diff_hours?: number;
  amount_diff?: number;
}

const props = defineProps<{
  scoreData: ScoreData;
  loading?: boolean;
}>();

const getScoreColor = (score: number) => {
  if (score >= 0.9) return '#52c41a';
  if (score >= 0.7) return '#faad14';
  return '#ff4d4f';
};

const displayTotalScore = computed(() => {
  return props.scoreData.total_score ?? props.scoreData.confidence ?? 0;
});

const dimensions = computed(() => {
  const items = [
    {
      label: $t('detective.reconcile.scoreDetail.amount'),
      weight: '35%',
      score: props.scoreData.amount_score,
      detail: props.scoreData.amount_diff !== undefined
        ? `差 ${props.scoreData.amount_diff}`
        : undefined,
    },
    {
      label: $t('detective.reconcile.scoreDetail.time'),
      weight: '25%',
      score: props.scoreData.time_score,
      detail: props.scoreData.time_diff_hours !== undefined
        ? `差 ${props.scoreData.time_diff_hours.toFixed(1)}h`
        : undefined,
    },
    {
      label: $t('detective.reconcile.scoreDetail.bankCard'),
      weight: '20%',
      score: props.scoreData.bank_card_score ?? 0,
      show: props.scoreData.bank_card_score !== undefined,
    },
    {
      label: $t('detective.transaction.merchant'),
      weight: '10%',
      score: props.scoreData.merchant_score ?? 0,
      show: props.scoreData.merchant_score !== undefined,
    },
    {
      label: $t('detective.reconcile.scoreDetail.channel'),
      weight: '10%',
      score: props.scoreData.channel_score ?? 0,
      show: props.scoreData.channel_score !== undefined,
    },
  ];
  return items.filter((i) => i.show !== false);
});
</script>

<template>
  <Card
    :loading="loading"
    :title="$t('detective.reconcile.explain')"
    size="small"
  >
    <!-- 总分 -->
    <div class="mb-4 flex flex-col items-center">
      <div class="mb-2 text-sm font-medium text-gray-500">
        {{ $t('detective.reconcile.totalConfidence') }}
      </div>
      <Progress
        :percent="Math.round(displayTotalScore * 100)"
        :stroke-color="getScoreColor(displayTotalScore)"
        :stroke-width="16"
        status="active"
        class="w-full max-w-md"
      />
    </div>

    <!-- 5 维度评分 -->
    <Row :gutter="12">
      <Col v-for="dim in dimensions" :key="dim.label" :span="Math.floor(24 / dimensions.length)">
        <div
          class="flex flex-col items-center rounded-lg bg-gray-50 p-3 text-center transition-shadow hover:shadow-md"
        >
          <div class="mb-1 text-xs font-medium text-gray-600">
            {{ dim.label }}
          </div>
          <div class="mb-1 text-[10px] text-gray-400">
            权重 {{ dim.weight }}
          </div>
          <Progress
            type="circle"
            :percent="Math.round(dim.score * 100)"
            :stroke-color="getScoreColor(dim.score)"
            :width="56"
            :stroke-width="10"
          >
            <template #format="{ percent }">
              <span class="text-xs font-bold">{{ percent }}%</span>
            </template>
          </Progress>
          <div
            v-if="dim.detail"
            class="mt-1 text-[10px] text-gray-400"
          >
            {{ dim.detail }}
          </div>
        </div>
      </Col>
    </Row>
  </Card>
</template>
