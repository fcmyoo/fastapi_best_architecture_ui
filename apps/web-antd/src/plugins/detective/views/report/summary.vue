<script setup lang="ts">
import type {
  CategoryStats,
  MonthlyStats,
  ReportSummary,
  SourceStats,
} from '#/plugins/detective/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  DatePicker,
  message,
  Row,
  Space,
  Statistic,
  Table,
} from 'ant-design-vue';
import * as echarts from 'echarts';

import { $t } from '#/locales';
import {
  exportReportApi,
  getCategoryStatsApi,
  getMonthlyStatsApi,
  getReportSummaryApi,
  getSourceStatsApi,
} from '#/plugins/detective/api';

const loading = ref(false);
const statementMonth = ref<string>('');
const summary = ref<null | ReportSummary>(null);
const categoryStats = ref<CategoryStats[]>([]);
const monthlyStats = ref<MonthlyStats[]>([]);
const sourceStats = ref<SourceStats[]>([]);

const trendChartRef = ref<HTMLElement | null>(null);
const pieChartRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

const categoryColumns = [
  {
    title: $t('detective.transaction.category'),
    dataIndex: 'category',
    key: 'category',
  },
  {
    title: $t('detective.report.totalExpense'),
    dataIndex: 'expense',
    key: 'expense',
    customRender: ({ text }: { text: number }) => `¥${text.toFixed(2)}`,
  },
  {
    title: $t('detective.report.totalIncome'),
    dataIndex: 'income',
    key: 'income',
    customRender: ({ text }: { text: number }) => `¥${text.toFixed(2)}`,
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
    const params = statementMonth.value
      ? { statement_month: statementMonth.value }
      : {};
    const [summaryRes, categoryRes, monthlyRes, sourceRes] = await Promise.all([
      getReportSummaryApi(params),
      getCategoryStatsApi(params),
      getMonthlyStatsApi({ months: 12 }),
      getSourceStatsApi(params),
    ]);
    summary.value = summaryRes;
    categoryStats.value = categoryRes;
    monthlyStats.value = monthlyRes;
    sourceStats.value = sourceRes;

    renderTrendChart();
    renderPieChart();
  } catch (error) {
    console.error('Failed to fetch report data:', error);
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
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: [
        $t('detective.report.totalExpense'),
        $t('detective.report.totalIncome'),
      ],
    },
    xAxis: {
      type: 'category',
      data: monthlyStats.value.map((item) => item.month),
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
        type: 'line',
        data: monthlyStats.value.map((item) => item.expense),
        itemStyle: { color: '#ff4d4f' },
        smooth: true,
      },
      {
        name: $t('detective.report.totalIncome'),
        type: 'line',
        data: monthlyStats.value.map((item) => item.income),
        itemStyle: { color: '#52c41a' },
        smooth: true,
      },
    ],
  };

  trendChart.setOption(option);
};

const renderPieChart = () => {
  if (!pieChartRef.value || sourceStats.value.length === 0) return;

  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value);
  }

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
            fontSize: 20,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: sourceStats.value.map((item) => ({
          name: item.source,
          value: item.expense,
        })),
      },
    ],
  };

  pieChart.setOption(option);
};

const handleExport = async (format: 'csv' | 'excel') => {
  try {
    const blob = await exportReportApi({
      statement_month: statementMonth.value || undefined,
      format,
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${statementMonth.value || 'all'}.${format === 'excel' ? 'xlsx' : 'csv'}`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success($t('detective.report.exportSuccess'));
  } catch {
    message.error($t('detective.report.exportFailed'));
  }
};

onMounted(() => {
  fetchData();

  window.addEventListener('resize', () => {
    trendChart?.resize();
    pieChart?.resize();
  });
});
</script>

<template>
  <Page :title="$t('detective.report.summary')">
    <div class="mb-4 flex items-center justify-between">
      <Space>
        <DatePicker
          v-model:value="statementMonth"
          picker="month"
          :placeholder="$t('detective.bill.statementMonth')"
          format="YYYY-MM"
          value-format="YYYY-MM"
          allow-clear
        />
        <Button type="primary" @click="fetchData">
          {{ $t('common.search') }}
        </Button>
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

    <!-- 汇总统计 -->
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card>
          <Statistic
            :title="$t('detective.report.totalExpense')"
            :value="summary?.total_expense || 0"
            :precision="2"
            prefix="¥"
            :value-style="{ color: '#cf1322' }"
          >
            <template #suffix>
              <ArrowDownOutlined />
            </template>
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
            <template #suffix>
              <ArrowUpOutlined />
            </template>
          </Statistic>
        </Card>
      </Col>
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

    <!-- 分类统计表格 -->
    <Card :title="$t('detective.report.byCategory')">
      <Table
        :columns="categoryColumns"
        :data-source="categoryStats"
        :loading="loading"
        :pagination="false"
        row-key="category"
        size="small"
      />
    </Card>
  </Page>
</template>
