<script setup lang="ts">
import type {
  MonthlyStats,
  ReportSummary,
  SourceStats,
  SystemStats,
} from '#/plugins/detective/api';

import { nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  LineChartOutlined,
  PieChartOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue';
import { Spin } from 'ant-design-vue';

import { $t } from '#/locales';
import {
  getMonthlyTrendApi,
  getReportSummaryApi,
  getSourceStatsApi,
  getSystemStatsApi,
} from '#/plugins/detective/api';
import { useECharts } from '#/plugins/detective/composables/useECharts';

import StatCard from './components/StatCard.vue';

const loading = ref(false);
const systemStats = ref<null | SystemStats>(null);
const summary = ref<null | ReportSummary>(null);
const monthlyStats = ref<MonthlyStats[]>([]);
const sourceStats = ref<SourceStats[]>([]);

const trendChartRef = ref<HTMLElement | null>(null);
const sourceChartRef = ref<HTMLElement | null>(null);
const categoryChartRef = ref<HTMLElement | null>(null);
const { setOption: setTrendOption } = useECharts(trendChartRef);
const { setOption: setSourceOption } = useECharts(sourceChartRef);
const { setOption: setCategoryOption } = useECharts(categoryChartRef);

const fetchData = async () => {
  loading.value = true;
  try {
    const [statsRes, summaryRes, monthlyRes, sourceRes] = await Promise.all([
      getSystemStatsApi(),
      getReportSummaryApi({}),
      getMonthlyTrendApi({ months: 6 }),
      getSourceStatsApi({}),
    ]);
    systemStats.value = statsRes;
    summary.value = summaryRes;
    monthlyStats.value = monthlyRes;
    sourceStats.value = sourceRes;

    await nextTick();
    renderTrendChart();
    renderSourceChart();
    renderCategoryChart();
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

const renderTrendChart = () => {
  if (!trendChartRef.value || monthlyStats.value.length === 0) return;

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: [
        $t('detective.report.totalExpense'),
        $t('detective.report.totalIncome'),
      ],
      bottom: 0,
      itemGap: 24,
      textStyle: { color: '#6b7280', fontSize: 11 },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: monthlyStats.value.map((item) => item.month),
      axisLine: { lineStyle: { color: '#f3f4f6' } },
      axisTick: { show: false },
      axisLabel: { color: '#9ca3af', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f9fafb' } },
      axisLabel: { formatter: (v: number) => `¥${v}`, color: '#9ca3af' },
    },
    series: [
      {
        name: $t('detective.report.totalExpense'),
        type: 'bar',
        barWidth: 12,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#f43f5e' }, // rose-500
        data: monthlyStats.value.map((item) => item.expense),
      },
      {
        name: $t('detective.report.totalIncome'),
        type: 'bar',
        barWidth: 12,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#10b981' }, // emerald-500
        data: monthlyStats.value.map((item) => item.income),
      },
    ],
  };

  setTrendOption(option);
};

const renderSourceChart = () => {
  if (!sourceChartRef.value || sourceStats.value.length === 0) return;

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: {
      orient: 'vertical',
      left: 'left',
      bottom: 0,
      itemGap: 8,
      textStyle: { fontSize: 11, color: '#6b7280' },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#374151',
          },
        },
        data: sourceStats.value.map((item) => ({
          name: item.source,
          value: item.expense,
        })),
      },
    ],
  };

  setSourceOption(option);
};

const renderCategoryChart = () => {
  if (!categoryChartRef.value || !summary.value) return;

  const matchSummary = summary.value.match_summary;
  const option = {
    tooltip: { trigger: 'item' },
    legend: {
      bottom: 0,
      itemGap: 16,
      textStyle: { fontSize: 11, color: '#6b7280' },
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        data: [
          {
            value: matchSummary?.matched_count || 0,
            name: $t('detective.transaction.matchedOptions.true'),
            itemStyle: { color: '#10b981' }, // emerald-500
          },
          {
            value: matchSummary?.unmatched_count || 0,
            name: $t('detective.transaction.matchedOptions.false'),
            itemStyle: { color: '#f43f5e' }, // rose-500
          },
        ],
      },
    ],
  };

  setCategoryOption(option);
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.dashboard.title')">
    <Spin :spinning="loading">
      <div class="space-y-6 pb-8">
        <!-- 统计卡片组 1: 系统概览 -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            :title="$t('detective.dashboard.totalBills')"
            :value="systemStats?.total_bills || 0"
            icon-bg-color="bg-blue-50"
            icon-color="text-blue-500"
          >
            <template #icon><FileTextOutlined /></template>
          </StatCard>
          <StatCard
            :title="$t('detective.dashboard.totalTransactions')"
            :value="systemStats?.total_transactions || 0"
            icon-bg-color="bg-purple-50"
            icon-color="text-purple-500"
          >
            <template #icon><SwapOutlined /></template>
          </StatCard>
          <StatCard
            :title="$t('detective.report.totalExpense')"
            :value="summary?.total_expense || 0"
            :precision="2"
            prefix="¥"
            value-color="text-rose-500"
            icon-bg-color="bg-rose-50"
            icon-color="text-rose-500"
          >
            <template #icon><ArrowDownOutlined /></template>
          </StatCard>
          <StatCard
            :title="$t('detective.report.totalIncome')"
            :value="summary?.total_income || 0"
            :precision="2"
            prefix="¥"
            value-color="text-emerald-500"
            icon-bg-color="bg-emerald-50"
            icon-color="text-emerald-500"
          >
            <template #icon><ArrowUpOutlined /></template>
          </StatCard>
        </div>

        <!-- 统计卡片组 2: 匹配与净额 -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            :title="$t('detective.report.netAmount')"
            :value="summary?.net_amount || 0"
            :precision="2"
            prefix="¥"
            :value-color="
              (summary?.net_amount || 0) >= 0
                ? 'text-emerald-500'
                : 'text-rose-500'
            "
            icon-bg-color="bg-indigo-50"
            icon-color="text-indigo-500"
          >
            <template #icon><SwapOutlined /></template>
          </StatCard>
          <StatCard
            :title="$t('detective.report.matchRate')"
            :value="(summary?.match_summary?.match_rate || 0) * 100"
            :precision="1"
            suffix="%"
            value-color="text-indigo-600"
            icon-bg-color="bg-indigo-50"
            icon-color="text-indigo-500"
          >
            <template #icon><CheckCircleOutlined /></template>
          </StatCard>
          <StatCard
            :title="$t('detective.dashboard.matchedCount')"
            :value="summary?.match_summary?.matched_count || 0"
            value-color="text-emerald-500"
            icon-bg-color="bg-emerald-50"
            icon-color="text-emerald-500"
          >
            <template #icon><CheckCircleOutlined /></template>
          </StatCard>
          <StatCard
            :title="$t('detective.dashboard.unmatchedCount')"
            :value="summary?.match_summary?.unmatched_count || 0"
            value-color="text-rose-500"
            icon-bg-color="bg-rose-50"
            icon-color="text-rose-500"
          >
            <template #icon><CloseCircleOutlined /></template>
          </StatCard>
        </div>

        <!-- 图表区域 -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <!-- 趋势图 -->
          <div
            class="flex flex-col rounded-[24px] border border-white bg-white p-6 shadow-sm"
          >
            <div class="mb-6 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-400"
                >
                  <LineChartOutlined />
                </div>
                <div>
                  <h3 class="text-base font-bold text-gray-800">
                    {{ $t('detective.report.trend') }}
                  </h3>
                  <p
                    class="text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    Monthly Transaction Trend
                  </p>
                </div>
              </div>
            </div>
            <div ref="trendChartRef" class="h-[300px] w-full"></div>
          </div>

          <!-- 分布与状态 (组合在一个Grid中) -->
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <!-- 来源分布 -->
            <div
              class="flex flex-col rounded-[24px] border border-white bg-white p-6 shadow-sm"
            >
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500"
                >
                  <PieChartOutlined />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-800">
                    {{ $t('detective.report.distribution') }}
                  </h3>
                  <p
                    class="text-[9px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    Source Distribution
                  </p>
                </div>
              </div>
              <div ref="sourceChartRef" class="h-[240px] w-full"></div>
            </div>

            <!-- 匹配状态 -->
            <div
              class="flex flex-col rounded-[24px] border border-white bg-white p-6 shadow-sm"
            >
              <div class="mb-4 flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500"
                >
                  <CheckCircleOutlined />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-gray-800">
                    {{ $t('detective.dashboard.matchStatus') }}
                  </h3>
                  <p
                    class="text-[9px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    Match Status
                  </p>
                </div>
              </div>
              <div ref="categoryChartRef" class="h-[240px] w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </Spin>
  </Page>
</template>