<script setup lang="ts">
import type {
  MonthlyStats,
  ReportSummary,
  SourceStats,
  SystemStats,
} from '#/plugins/detective/api';

import { onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue';
import { Card, Col, Row, Statistic } from 'ant-design-vue';
import * as echarts from 'echarts';

import { $t } from '#/locales';
import {
  getMonthlyTrendApi,
  getReportSummaryApi,
  getSourceStatsApi,
  getSystemStatsApi,
} from '#/plugins/detective/api';

const loading = ref(false);
const systemStats = ref<null | SystemStats>(null);
const summary = ref<null | ReportSummary>(null);
const monthlyStats = ref<MonthlyStats[]>([]);
const sourceStats = ref<SourceStats[]>([]);

const trendChartRef = ref<HTMLElement | null>(null);
const sourceChartRef = ref<HTMLElement | null>(null);
const categoryChartRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let sourceChart: echarts.ECharts | null = null;
let categoryChart: echarts.ECharts | null = null;

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

  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: [
        $t('detective.report.totalExpense'),
        $t('detective.report.totalIncome'),
      ],
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlyStats.value.map((item) => item.month),
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => `¥${v}` },
    },
    series: [
      {
        name: $t('detective.report.totalExpense'),
        type: 'bar',
        data: monthlyStats.value.map((item) => item.expense),
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: $t('detective.report.totalIncome'),
        type: 'bar',
        data: monthlyStats.value.map((item) => item.income),
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  trendChart.setOption(option);
};

const renderSourceChart = () => {
  if (!sourceChartRef.value || sourceStats.value.length === 0) return;

  if (!sourceChart) {
    sourceChart = echarts.init(sourceChartRef.value);
  }

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: sourceStats.value.map((item) => ({
          name: item.source,
          value: item.expense,
        })),
      },
    ],
  };

  sourceChart.setOption(option);
};

const renderCategoryChart = () => {
  if (!categoryChartRef.value || !summary.value) return;

  if (!categoryChart) {
    categoryChart = echarts.init(categoryChartRef.value);
  }

  const matchSummary = summary.value.match_summary;
  const option = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: '70%',
        data: [
          {
            value: matchSummary?.matched_count || 0,
            name: $t('detective.transaction.matchedOptions.true'),
            itemStyle: { color: '#52c41a' },
          },
          {
            value: matchSummary?.unmatched_count || 0,
            name: $t('detective.transaction.matchedOptions.false'),
            itemStyle: { color: '#ff4d4f' },
          },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  };

  categoryChart.setOption(option);
};

const handleResize = () => {
  trendChart?.resize();
  sourceChart?.resize();
  categoryChart?.resize();
};

onMounted(() => {
  fetchData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  trendChart?.dispose();
  sourceChart?.dispose();
  categoryChart?.dispose();
});
</script>

<template>
  <Page :title="$t('detective.dashboard.title')">
    <!-- 统计卡片 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('detective.dashboard.totalBills')"
            :value="systemStats?.total_bills || 0"
            :value-style="{ color: '#1890ff' }"
          >
            <template #prefix><FileTextOutlined /></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('detective.dashboard.totalTransactions')"
            :value="systemStats?.total_transactions || 0"
            :value-style="{ color: '#722ed1' }"
          >
            <template #prefix><SwapOutlined /></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('detective.report.totalExpense')"
            :value="summary?.total_expense || 0"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#cf1322' }"
          >
            <template #suffix><ArrowDownOutlined /></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('detective.report.totalIncome')"
            :value="summary?.total_income || 0"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#3f8600' }"
          >
            <template #suffix><ArrowUpOutlined /></template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('detective.report.netAmount')"
            :value="summary?.net_amount || 0"
            :precision="2"
            prefix="¥"
            :value-style="{
              color: (summary?.net_amount || 0) >= 0 ? '#3f8600' : '#cf1322',
            }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('detective.report.matchRate')"
            :value="(summary?.match_summary?.match_rate || 0) * 100"
            :precision="1"
            suffix="%"
          >
            <template #prefix><CheckCircleOutlined /></template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('detective.dashboard.matchedCount')"
            :value="summary?.match_summary?.matched_count || 0"
            :value-style="{ color: '#52c41a' }"
          />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('detective.dashboard.unmatchedCount')"
            :value="summary?.match_summary?.unmatched_count || 0"
            :value-style="{ color: '#ff4d4f' }"
          />
        </Card>
      </Col>
    </Row>

    <!-- 图表 -->
    <Row :gutter="16">
      <Col :span="12">
        <Card :title="$t('detective.report.trend')">
          <div ref="trendChartRef" style="height: 300px"></div>
        </Card>
      </Col>
      <Col :span="6">
        <Card :title="$t('detective.report.distribution')">
          <div ref="sourceChartRef" style="height: 300px"></div>
        </Card>
      </Col>
      <Col :span="6">
        <Card :title="$t('detective.dashboard.matchStatus')">
          <div ref="categoryChartRef" style="height: 300px"></div>
        </Card>
      </Col>
    </Row>
  </Page>
</template>
