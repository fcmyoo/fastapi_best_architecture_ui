<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import type {
  BillTransactionItem,
  CreditCardBillSummary,
} from '#/plugins/detective/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DollarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue';
import { Button, InputNumber, Select, Spin, Tooltip } from 'ant-design-vue';

import { $t } from '#/locales';
import {
  getCardBillsApi,
  getCreditCardBillTransactionsApi,
  getCreditCardsApi,
} from '#/plugins/detective/api';
import {
  formatDate,
  formatDateTime,
  formatDirectionalAmount,
} from '#/plugins/detective/utils/format';

defineOptions({ name: 'DetectiveCreditCardTransactions' });

const route = useRoute();
const router = useRouter();
const { setTabTitle } = useTabs();

const loading = ref(false);
const bills = ref<CreditCardBillSummary[]>([]);
const transactions = ref<BillTransactionItem[]>([]);
const selectedBillId = ref<number | undefined>(undefined);
const chartMaxAmount = ref<number>(10_000);

// Charts Refs
const trendChartRef = ref<EchartsUIType>();
const merchantChartRef = ref<EchartsUIType>();
const categoryChartRef = ref<EchartsUIType>();
const timeAnalysisChartRef = ref<EchartsUIType>();

const { renderEcharts: renderTrendChart } = useEcharts(trendChartRef);
const { renderEcharts: renderMerchantChart } = useEcharts(merchantChartRef);
const { renderEcharts: renderCategoryChart } = useEcharts(categoryChartRef);
const { renderEcharts: renderTimeAnalysisChart } =
  useEcharts(timeAnalysisChartRef);

// Query Params
const cardId = computed(() => route.params.cardId as string);
const queryBankCode = computed(() => route.query.bankCode as string);
const queryCardLast4 = computed(() => route.query.cardLast4 as string);
const queryBankName = computed(() => route.query.bankName as string);

const pageTitle = computed(() => {
  if (queryBankName.value) {
    return `${queryBankName.value} (*${queryCardLast4.value || '****'})`;
  }
  return $t('detective.creditCard.cardTransactions');
});

const selectedBill = computed(() => {
  return bills.value.find((b) => b.id === selectedBillId.value);
});

// Helpers
const formatBillAmount = (amount: null | number | undefined) => {
  if (amount === null || amount === undefined) return '-';
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
};

const getPaymentStatusText = (status: string | undefined) => {
  const textMap: Record<string, string> = {
    unpaid: $t('detective.creditCard.paymentStatusOptions.unpaid'),
    partial: $t('detective.creditCard.paymentStatusOptions.partial'),
    paid: $t('detective.creditCard.paymentStatusOptions.paid'),
  };
  return textMap[status || ''] || status || '-';
};

// Chart Logic
const updateCharts = () => {
  if (transactions.value.length === 0) {
    renderTrendChart({});
    renderMerchantChart({});
    renderCategoryChart({});
    renderTimeAnalysisChart({});
    return;
  }

  // Data Containers
  const dailyData = new Map<string, number>();
  const merchantData = new Map<string, number>();
  const categoryData = new Map<string, number>();
  const timeData = {
    '00-06': 0, // Night
    '06-12': 0, // Morning
    '12-18': 0, // Afternoon
    '18-24': 0, // Evening
  };

  const limit = chartMaxAmount.value;

  transactions.value.forEach((tx) => {
    if (tx.direction === 'expense') {
      const amount = Number(tx.amount);

      // Filter by Amount
      if (limit !== undefined && limit !== null && amount >= limit) {
        return;
      }

      const date = new Date(tx.transaction_time);
      const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      dailyData.set(dateStr, (dailyData.get(dateStr) || 0) + amount);

      const merchant = tx.merchant_raw || 'Unknown';
      merchantData.set(merchant, (merchantData.get(merchant) || 0) + amount);

      const category = tx.category_name || 'Uncategorized';
      categoryData.set(category, (categoryData.get(category) || 0) + amount);

      const hour = date.getHours();
      if (hour >= 0 && hour < 6) timeData['00-06'] += 1;
      else if (hour >= 6 && hour < 12) timeData['06-12'] += 1;
      else if (hour >= 12 && hour < 18) timeData['12-18'] += 1;
      else timeData['18-24'] += 1;
    }
  });

  // --- 1. Daily Trend Chart ---
  const sortedDates = [...dailyData.keys()].sort();
  const sortedAmounts = sortedDates.map((d) =>
    (dailyData.get(d) || 0).toFixed(2),
  );

  renderTrendChart({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: '{b}<br/>支出: ¥{c}',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sortedDates,
      axisTick: { alignWithLabel: true },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
    },
    series: [
      {
        name: '支出',
        type: 'bar',
        barWidth: '60%',
        data: sortedAmounts,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#f43f5e' }, // rose-500
              { offset: 1, color: '#fda4af' }, // rose-300
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  });

  // --- 2. Top Merchants Chart ---
  const sortedMerchants = [...merchantData.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5
    .map(([name, value]) => ({ name, value }));

  renderMerchantChart({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#6b7280', fontSize: 10 },
    },
    series: [
      {
        name: '商户',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: sortedMerchants,
      },
    ],
  });

  // --- 3. Category Distribution Chart ---
  const sortedCategories = [...categoryData.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  renderCategoryChart({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'center',
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: '#6b7280', fontSize: 10 },
    },
    series: [
      {
        name: '分类',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: sortedCategories,
      },
    ],
  });

  // --- 4. Time Analysis Chart (Radar/Bar) ---
  // Using Bar for clearer comparison of counts
  renderTimeAnalysisChart({
    tooltip: { trigger: 'axis' },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['凌晨', '上午', '下午', '晚上'],
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#f3f4f6' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
    },
    series: [
      {
        name: '交易笔数',
        type: 'bar',
        barWidth: '50%',
        data: [
          timeData['00-06'],
          timeData['06-12'],
          timeData['12-18'],
          timeData['18-24'],
        ],
        itemStyle: {
          color: '#6366f1', // indigo-500
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  });
};

// Data Fetching
const fetchBills = async () => {
  loading.value = true;
  try {
    let bankCode = queryBankCode.value;
    let last4 = queryCardLast4.value || null;

    if (bankCode) {
      setTabTitle(`${queryBankName.value} (${last4 || '****'})`);
    } else {
      const cards = await getCreditCardsApi();
      const card = cards.find(
        (c) => String(c.card_id) === String(cardId.value),
      );
      if (card) {
        bankCode = card.bank_code;
        last4 = card.card_last4;
        setTabTitle(`${card.bank_name} (${card.card_last4 || '****'})`);
      }
    }

    if (!bankCode) return;

    const res = await getCardBillsApi(bankCode, last4);
    bills.value = res.bills || [];

    if (bills.value.length > 0) {
      selectedBillId.value = bills.value[0]?.id;
    }
  } catch (error) {
    console.error('Failed to fetch bills:', error);
  } finally {
    loading.value = false;
  }
};

const fetchTransactions = async () => {
  if (!selectedBillId.value) return;
  loading.value = true;
  try {
    const res = await getCreditCardBillTransactionsApi(selectedBillId.value);
    const month = res.bill_info?.statement_month || '';
    transactions.value = (res.transactions || []).map((t) => ({
      ...t,
      statement_month: month,
    }));
    updateCharts();
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
  } finally {
    loading.value = false;
  }
};

watch(selectedBillId, () => {
  fetchTransactions();
});

watch(chartMaxAmount, () => {
  updateCharts();
});

const handleBack = () => {
  router.push('/detective/credit-card/list');
};

onMounted(() => {
  fetchBills();
});
</script>

<template>
  <Page :title="pageTitle">
    <template #extra>
      <Button type="text" class="!flex items-center gap-1" @click="handleBack">
        <ArrowLeftOutlined />
        {{ $t('detective.creditCard.backToList') }}
      </Button>
    </template>

    <div class="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <!-- Bill Summary Card -->
      <div
        class="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1677FF] to-[#4096ff] p-6 text-white shadow-xl shadow-blue-200/50 md:p-8"
      >
        <div
          class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        ></div>
        <div
          class="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl"
        ></div>

        <div
          class="relative z-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between"
        >
          <div class="space-y-6">
            <div>
              <p
                class="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-100/80"
              >
                {{ $t('detective.creditCard.statementMonth') }}
              </p>
              <div class="flex items-center gap-4">
                <Select
                  v-model:value="selectedBillId"
                  :bordered="false"
                  class="custom-select min-w-[160px] !text-2xl !font-bold !text-white"
                  popup-class-name="custom-select-dropdown"
                  :placeholder="$t('common.pleaseSelect')"
                >
                  <Select.Option
                    v-for="bill in bills"
                    :key="bill.id"
                    :value="bill.id"
                  >
                    {{ bill.statement_month }}
                  </Select.Option>
                  <template #suffixIcon>
                    <CalendarOutlined class="text-white/70" />
                  </template>
                </Select>
              </div>
            </div>

            <div v-if="selectedBill" class="flex gap-8">
              <div>
                <p
                  class="mb-1 text-[9px] font-bold uppercase tracking-widest text-blue-100/60"
                >
                  {{ $t('detective.creditCard.billDate') }}
                </p>
                <p class="font-mono text-sm font-medium">
                  {{ formatDate(selectedBill.bill_date) }}
                </p>
              </div>
              <div>
                <p
                  class="mb-1 text-[9px] font-bold uppercase tracking-widest text-blue-100/60"
                >
                  {{ $t('detective.creditCard.dueDate') }}
                </p>
                <p class="font-mono text-sm font-medium">
                  {{ formatDate(selectedBill.due_date) }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="selectedBill"
            class="flex flex-col items-start gap-2 md:items-end"
          >
            <div
              class="mb-1 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
            >
              {{ getPaymentStatusText(selectedBill.payment_status) }}
            </div>
            <div class="text-left md:text-right">
              <p
                class="text-[10px] font-bold uppercase tracking-widest text-blue-100/80"
              >
                {{ $t('detective.creditCard.billAmount') }}
              </p>
              <p class="font-mono text-4xl font-bold tracking-tight">
                {{ formatBillAmount(selectedBill.bill_amount) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Layout: Grid -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <!-- Left: Analysis Panel -->
        <div class="space-y-6 lg:col-span-5">
          <!-- Filter Control -->
          <div class="rounded-[24px] bg-white p-6 shadow-lg shadow-gray-100/50">
            <div class="mb-4 flex items-center justify-between">
              <h3
                class="text-xs font-bold uppercase tracking-widest text-gray-400"
              >
                统计过滤
              </h3>
              <Tooltip placement="top">
                <template #title>
                  <div class="max-w-[300px] p-1 text-xs leading-5">
                    <p class="mb-2 font-bold text-white/90">功能说明：</p>
                    <ul class="list-disc space-y-1 pl-4 text-white/80">
                      <li>
                        当你在该输入框中输入一个金额（例如
                        5000）时，下方所有的图表（趋势图、商户排行、分类分布、时段分析）将自动过滤掉金额大于或等于该值的交易，只统计小于该金额的“小额交易”。
                      </li>
                      <li>如果留空，则统计所有交易。</li>
                    </ul>
                  </div>
                </template>
                <InfoCircleOutlined
                  class="cursor-help text-base text-gray-300 transition-colors hover:text-indigo-500"
                />
              </Tooltip>
            </div>

            <div
              class="group relative flex items-center rounded-xl border border-transparent bg-gray-50 px-3 py-1 transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 hover:bg-gray-100"
            >
              <span
                class="mr-2 text-lg font-bold text-gray-400 transition-colors group-focus-within:text-indigo-500"
              >
                ¥
              </span>
              <InputNumber
                v-model:value="chartMaxAmount"
                :bordered="false"
                :controls="false"
                :min="0"
                :step="100"
                class="!w-full !bg-transparent !pl-0 !text-gray-700 !shadow-none placeholder:text-gray-400"
                placeholder="全部金额"
              />
              <span
                class="ml-2 text-xs font-medium uppercase tracking-wider text-gray-400 transition-colors group-focus-within:text-indigo-400"
              >
                Limit
              </span>
            </div>
          </div>

          <!-- Daily Trend -->
          <div class="rounded-[24px] bg-white p-6 shadow-lg shadow-gray-100/50">
            <h3
              class="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400"
            >
              每日支出趋势
            </h3>
            <div class="h-[200px] w-full">
              <EchartsUI ref="trendChartRef" width="100%" height="100%" />
            </div>
          </div>

          <!-- Top Merchants -->
          <div class="rounded-[24px] bg-white p-6 shadow-lg shadow-gray-100/50">
            <h3
              class="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400"
            >
              商户消费排行
            </h3>
            <div class="h-[200px] w-full">
              <EchartsUI ref="merchantChartRef" width="100%" height="100%" />
            </div>
          </div>

          <!-- Category Distribution -->
          <div class="rounded-[24px] bg-white p-6 shadow-lg shadow-gray-100/50">
            <h3
              class="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400"
            >
              消费分类分布
            </h3>
            <div class="h-[200px] w-full">
              <EchartsUI ref="categoryChartRef" width="100%" height="100%" />
            </div>
          </div>

          <!-- Time Analysis -->
          <div class="rounded-[24px] bg-white p-6 shadow-lg shadow-gray-100/50">
            <h3
              class="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400"
            >
              消费时段分析
            </h3>
            <div class="h-[200px] w-full">
              <EchartsUI
                ref="timeAnalysisChartRef"
                width="100%"
                height="100%"
              />
            </div>
          </div>
        </div>

        <!-- Right: Transaction List -->
        <div class="lg:col-span-7">
          <div class="rounded-[24px] bg-white p-6 shadow-lg shadow-gray-100/50">
            <div class="mb-6 flex items-center justify-between px-2">
              <h3
                class="flex items-center gap-2 text-base font-bold text-gray-800"
              >
                <CreditCardOutlined />
                {{ $t('detective.transaction.list') }}
              </h3>
              <span
                class="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500"
              >
                {{ transactions.length }} TXNS
              </span>
            </div>

            <Spin :spinning="loading">
              <div v-if="transactions.length > 0" class="space-y-2">
                <!-- Header Row (Hidden on mobile) -->
                <div
                  class="hidden grid-cols-12 gap-4 border-b border-gray-100 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 md:grid"
                >
                  <div class="col-span-5">
                    {{ $t('detective.transaction.merchantName') }}
                  </div>
                  <div class="col-span-3">
                    {{ $t('detective.transaction.transactionTime') }}
                  </div>
                  <div class="col-span-2 text-right">
                    {{ $t('detective.transaction.amount') }}
                  </div>
                  <div class="col-span-2 text-right">
                    {{ $t('detective.transaction.direction') }}
                  </div>
                </div>

                <!-- Data Rows -->
                <div
                  v-for="tx in transactions"
                  :key="tx.id"
                  class="group grid grid-cols-1 items-center gap-2 rounded-xl border border-transparent p-4 transition-all hover:border-gray-100 hover:bg-gray-50/80 md:grid-cols-12 md:gap-4 md:py-3"
                >
                  <!-- Merchant -->
                  <div class="col-span-5 flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm"
                    >
                      <DollarOutlined />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate font-bold text-gray-700">
                        {{ tx.merchant_raw || '-' }}
                      </p>
                      <p class="text-xs text-gray-400 md:hidden">
                        {{ formatDateTime(tx.transaction_time) }}
                      </p>
                    </div>
                  </div>

                  <!-- Time -->
                  <div
                    class="col-span-3 hidden font-mono text-xs font-medium text-gray-500 md:block"
                  >
                    {{ formatDateTime(tx.transaction_time) }}
                  </div>

                  <!-- Amount -->
                  <div class="col-span-2 text-left md:text-right">
                    <span
                      class="font-mono text-base font-bold"
                      :class="
                        tx.direction === 'expense'
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      "
                    >
                      {{ formatDirectionalAmount(tx.amount, tx.direction) }}
                    </span>
                  </div>

                  <!-- Status/Direction -->
                  <div
                    class="col-span-2 flex items-center justify-between md:justify-end"
                  >
                    <span class="text-xs text-gray-400 md:hidden">{{
                      $t('detective.transaction.direction')
                    }}</span>
                    <div
                      class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      :class="
                        tx.direction === 'expense'
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-emerald-50 text-emerald-600'
                      "
                    >
                      {{
                        tx.direction === 'expense'
                          ? $t('detective.transaction.directionOptions.expense')
                          : $t('detective.transaction.directionOptions.income')
                      }}
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="flex flex-col items-center justify-center py-20 text-gray-400"
              >
                <div
                  class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50"
                >
                  <DollarOutlined class="text-2xl text-gray-300" />
                </div>
                <p>{{ $t('common.noData') }}</p>
              </div>
            </Spin>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style lang="less">
/* Override Ant Design Select Styles for the transparent header look */
.custom-select {
  .ant-select-selector {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding-left: 0 !important;
  }
  .ant-select-selection-item {
    color: white !important;
    font-size: 1.5rem !important; /* text-2xl */
    font-weight: 700 !important; /* font-bold */
    padding-right: 24px !important;
  }
  .ant-select-arrow {
    color: rgba(255, 255, 255, 0.7) !important;
  }
}
</style>
