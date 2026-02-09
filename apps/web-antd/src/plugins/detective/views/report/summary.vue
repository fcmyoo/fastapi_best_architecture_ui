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
  DownloadOutlined,
  ReloadOutlined,
  WalletOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  message,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { $t } from '#/locales';
import {
  exportReportApi,
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
const trendStats = ref<LedgerMonthlyTrend[]>([]);
const accountStats = ref<LedgerAccountStats[]>([]);

// 判断是否有数据
const hasData = computed(() => {
  return (
    monthlyStats.value &&
    (monthlyStats.value.income_count > 0 ||
      monthlyStats.value.expense_count > 0)
  );
});

const trendChartRef = ref<HTMLElement | null>(null);
const pieChartRef = ref<HTMLElement | null>(null);
const accountChartRef = ref<HTMLElement | null>(null);
const { setOption: setTrendOption } = useECharts(trendChartRef);
const { setOption: setPieOption } = useECharts(pieChartRef);
const { setOption: setAccountOption } = useECharts(accountChartRef);

const categoryColumns = [
  {
    title: $t('detective.transaction.category'),
    dataIndex: 'category_name',
    key: 'category_name',
  },
  {
    title: $t('detective.report.totalExpense'),
    dataIndex: 'total',
    key: 'total',
    customRender: ({ record }: { record: LedgerCategoryStats }) =>
      record.direction === 'expense' ? `¥${record.total.toFixed(2)}` : '-',
  },
  {
    title: $t('detective.report.totalIncome'),
    dataIndex: 'income',
    key: 'income',
    customRender: ({ record }: { record: LedgerCategoryStats }) =>
      record.direction === 'income' ? `¥${record.total.toFixed(2)}` : '-',
  },
  { title: '交易数', dataIndex: 'count', key: 'count' },
  {
    title: '占比',
    dataIndex: 'percentage',
    key: 'percentage',
    customRender: ({ text }: { text: number }) => `${(text * 100).toFixed(1)}%`,
  },
];

const fetchData = async () => {
  loading.value = true;
  try {
    const statement_month = selectedMonth.value.format('YYYY-MM');

    const [monthlyRes, categoryRes, trendRes, accountRes] = await Promise.all([
      getLedgerMonthlyStatsApi({ statement_month }),
      getLedgerCategoryStatsApi({ statement_month }),
      getLedgerMonthlyTrendApi({ months: 12 }),
      getLedgerAccountStatsApi({ statement_month }),
    ]);
    monthlyStats.value = monthlyRes;
    categoryStats.value = categoryRes;
    trendStats.value = trendRes;
    accountStats.value = accountRes;

    await nextTick();
    renderTrendChart();
    renderPieChart();
    renderAccountChart();
  } catch (error) {
    console.error('Failed to fetch report data:', error);
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
        $t('detective.report.totalExpense'),
        $t('detective.report.totalIncome'),
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
      axisLabel: {
        formatter: (value: number) => `¥${value}`,
      },
    },
    series: [
      {
        name: $t('detective.report.totalExpense'),
        type: 'bar',
        data: trendStats.value.map((item) => item.expense),
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: $t('detective.report.totalIncome'),
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

const renderPieChart = () => {
  if (!pieChartRef.value || categoryStats.value.length === 0) return;

  // 只显示支出分类
  const expenseCategories = categoryStats.value.filter(
    (item) => item.direction === 'expense',
  );

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: expenseCategories.map((item) => ({
          name: item.category_name,
          value: item.total,
        })),
      },
    ],
  };

  setPieOption(option);
};

const renderAccountChart = () => {
  if (!accountChartRef.value || accountStats.value.length === 0) return;

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: [
        $t('detective.report.totalExpense'),
        $t('detective.report.totalIncome'),
      ],
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
        name: $t('detective.report.totalExpense'),
        type: 'bar',
        stack: 'total',
        data: accountStats.value.map((item) => item.expense),
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: $t('detective.report.totalIncome'),
        type: 'bar',
        stack: 'total',
        data: accountStats.value.map((item) => item.income),
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  setAccountOption(option);
};

const handleExport = async (format: 'csv' | 'excel') => {
  try {
    const monthStr = selectedMonth.value.format('YYYY-MM');
    const blob = await exportReportApi({
      statement_month: monthStr,
      format,
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${monthStr}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success($t('detective.report.exportSuccess'));
  } catch {
    message.error($t('detective.report.exportFailed'));
  }
};

watch(selectedMonth, () => {
  fetchData();
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.report.summary')">
    <div class="mb-4 flex items-center justify-between">
      <Space>
        <DatePicker
          v-model:value="selectedMonth"
          picker="month"
          :allow-clear="false"
        />
        <Button @click="fetchData">
          <template #icon><ReloadOutlined /></template>
        </Button>
      </Space>
      <Space>
        <Button @click="handleExport('excel')">
          <template #icon><DownloadOutlined /></template>
          {{ $t('detective.report.exportExcel') }}
        </Button>
        <Button @click="handleExport('csv')">
          <template #icon><DownloadOutlined /></template>
          {{ $t('detective.report.exportCsv') }}
        </Button>
      </Space>
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
        <!-- 汇总统计 -->
        <Row :gutter="16" class="mb-4">
          <Col :span="6">
            <Card>
              <Statistic
                :title="$t('detective.report.totalExpense')"
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
                :title="$t('detective.report.totalIncome')"
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
                :title="$t('detective.report.netAmount')"
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
            <Card :title="$t('detective.report.trend')">
              <div ref="trendChartRef" style="height: 300px"></div>
            </Card>
          </Col>
          <Col :span="8">
            <Card :title="$t('detective.report.distribution')">
              <div ref="pieChartRef" style="height: 300px"></div>
            </Card>
          </Col>
        </Row>

        <!-- 账户统计 -->
        <Row :gutter="16" class="mb-4">
          <Col :span="24">
            <Card :title="$t('detective.ledger.accountStats')">
              <div ref="accountChartRef" style="height: 300px"></div>
            </Card>
          </Col>
        </Row>

        <!-- 分类统计表格 -->
        <Card :title="$t('detective.report.byCategory')">
          <Table
            :columns="categoryColumns"
            :data-source="categoryStats"
            :loading="loading"
            :pagination="false"
            row-key="category_id"
            size="small"
          />
        </Card>
      </template>
    </Spin>
  </Page>
</template>
