<script setup lang="ts">
import type {
  LedgerAccountStats,
  LedgerCategoryStats,
  LedgerMonthlyStats,
  LedgerMonthlyTrend,
} from '#/plugins/detective/api';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  WalletOutlined,
} from '@ant-design/icons-vue';
import {
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Spin,
  Statistic,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { $t } from '#/locales';
import {
  getLedgerAccountStatsApi,
  getLedgerCategoryStatsApi,
  getLedgerMonthlyStatsApi,
  getLedgerMonthlyTrendApi,
} from '#/plugins/detective/api';
import { useECharts } from '#/plugins/detective/composables/useECharts';

const loading = ref(false);
const selectedMonth = ref(dayjs());

const monthlyStats = ref<LedgerMonthlyStats | null>(null);
const categoryStats = ref<LedgerCategoryStats[]>([]);
const accountStats = ref<LedgerAccountStats[]>([]);
const trendStats = ref<LedgerMonthlyTrend[]>([]);

const trendChartRef = ref<HTMLElement | null>(null);
const categoryChartRef = ref<HTMLElement | null>(null);
const accountChartRef = ref<HTMLElement | null>(null);
const { setOption: setTrendOption } = useECharts(trendChartRef);
const { setOption: setCategoryOption } = useECharts(categoryChartRef);
const { setOption: setAccountOption } = useECharts(accountChartRef);

// 判断是否有数据
const hasData = computed(() => {
  return (
    monthlyStats.value &&
    (monthlyStats.value.income_count > 0 ||
      monthlyStats.value.expense_count > 0)
  );
});

const fetchData = async () => {
  loading.value = true;
  try {
    const year = selectedMonth.value.year();
    const month = selectedMonth.value.month() + 1;

    const [monthlyRes, categoryRes, accountRes, trendRes] = await Promise.all([
      getLedgerMonthlyStatsApi({ year, month }),
      getLedgerCategoryStatsApi({ year, month }),
      getLedgerAccountStatsApi({ year, month }),
      getLedgerMonthlyTrendApi({ months: 6 }),
    ]);

    monthlyStats.value = monthlyRes;
    categoryStats.value = categoryRes;
    accountStats.value = accountRes;
    trendStats.value = trendRes;

    await nextTick();
    renderTrendChart();
    renderCategoryChart();
    renderAccountChart();
  } catch (error) {
    console.error('Failed to fetch ledger stats:', error);
  } finally {
    loading.value = false;
  }
};

const renderTrendChart = () => {
  if (!trendChartRef.value || trendStats.value.length === 0) return;

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: [
        $t('detective.ledger.expense'),
        $t('detective.ledger.income'),
        $t('detective.ledger.net'),
      ],
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendStats.value.map((item) => item.month),
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => `¥${v}` },
    },
    series: [
      {
        name: $t('detective.ledger.expense'),
        type: 'bar',
        data: trendStats.value.map((item) => item.expense),
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: $t('detective.ledger.income'),
        type: 'bar',
        data: trendStats.value.map((item) => item.income),
        itemStyle: { color: '#52c41a' },
      },
      {
        name: $t('detective.ledger.net'),
        type: 'line',
        data: trendStats.value.map((item) => item.net),
        itemStyle: { color: '#1890ff' },
      },
    ],
  };

  setTrendOption(option);
};

const renderCategoryChart = () => {
  if (!categoryChartRef.value || categoryStats.value.length === 0) return;

  // 只显示支出分类
  const expenseCategories = categoryStats.value.filter(
    (item) => item.direction === 'expense',
  );

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
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: expenseCategories.map((item) => ({
          name: item.category_name,
          value: item.total,
        })),
      },
    ],
  };

  setCategoryOption(option);
};

const renderAccountChart = () => {
  if (!accountChartRef.value || accountStats.value.length === 0) return;

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: [$t('detective.ledger.expense'), $t('detective.ledger.income')],
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => `¥${v}` },
    },
    yAxis: {
      type: 'category',
      data: accountStats.value.map((item) => item.account_name),
    },
    series: [
      {
        name: $t('detective.ledger.expense'),
        type: 'bar',
        stack: 'total',
        data: accountStats.value.map((item) => item.expense),
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: $t('detective.ledger.income'),
        type: 'bar',
        stack: 'total',
        data: accountStats.value.map((item) => item.income),
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  setAccountOption(option);
};

watch(selectedMonth, () => {
  fetchData();
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.ledger.title')">
    <!-- 月份选择 -->
    <div class="mb-4 flex items-center justify-between">
      <DatePicker
        v-model:value="selectedMonth"
        picker="month"
        :allow-clear="false"
      />
    </div>

    <Spin :spinning="loading">
      <!-- 无数据提示 -->
      <template v-if="!hasData && !loading">
        <Card>
          <Empty :description="$t('detective.ledger.noData')">
            <template #image>
              <WalletOutlined style="font-size: 64px; color: #d9d9d9" />
            </template>
          </Empty>
          <div class="mt-4 text-center text-gray-500">
            {{ $t('detective.ledger.noDataHint') }}
          </div>
        </Card>
      </template>

      <!-- 有数据时显示统计 -->
      <template v-else>
        <!-- 统计卡片 -->
        <Row :gutter="16" class="mb-4">
          <Col :span="6">
            <Card>
              <Statistic
                :title="$t('detective.ledger.totalExpense')"
                :value="monthlyStats?.total_expense || 0"
                :precision="2"
                prefix="¥"
                :value-style="{ color: '#cf1322' }"
              >
                <template #suffix><ArrowDownOutlined /></template>
              </Statistic>
              <div class="mt-2 text-xs text-gray-400">
                {{ monthlyStats?.expense_count || 0 }}
                {{ $t('detective.ledger.transactions') }}
              </div>
            </Card>
          </Col>
          <Col :span="6">
            <Card>
              <Statistic
                :title="$t('detective.ledger.totalIncome')"
                :value="monthlyStats?.total_income || 0"
                :precision="2"
                prefix="¥"
                :value-style="{ color: '#3f8600' }"
              >
                <template #suffix><ArrowUpOutlined /></template>
              </Statistic>
              <div class="mt-2 text-xs text-gray-400">
                {{ monthlyStats?.income_count || 0 }}
                {{ $t('detective.ledger.transactions') }}
              </div>
            </Card>
          </Col>
          <Col :span="6">
            <Card>
              <Statistic
                :title="$t('detective.ledger.net')"
                :value="monthlyStats?.net || 0"
                :precision="2"
                prefix="¥"
                :value-style="{
                  color: (monthlyStats?.net || 0) >= 0 ? '#3f8600' : '#cf1322',
                }"
              />
            </Card>
          </Col>
          <Col :span="6">
            <Card>
              <Statistic
                :title="$t('detective.ledger.totalCount')"
                :value="
                  (monthlyStats?.expense_count || 0) +
                  (monthlyStats?.income_count || 0)
                "
                :value-style="{ color: '#1890ff' }"
              />
            </Card>
          </Col>
        </Row>

        <!-- 图表 -->
        <Row :gutter="16" class="mb-4">
          <Col :span="16">
            <Card :title="$t('detective.ledger.monthlyTrend')">
              <div ref="trendChartRef" style="height: 300px"></div>
            </Card>
          </Col>
          <Col :span="8">
            <Card :title="$t('detective.ledger.categoryDistribution')">
              <div ref="categoryChartRef" style="height: 300px"></div>
            </Card>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="24">
            <Card :title="$t('detective.ledger.accountStats')">
              <div ref="accountChartRef" style="height: 300px"></div>
            </Card>
          </Col>
        </Row>
      </template>
    </Spin>
  </Page>
</template>
