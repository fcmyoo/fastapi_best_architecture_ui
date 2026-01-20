<script setup lang="ts">
import type {
  CashOutMerchant,
  GroupTransactionItem,
  GroupTransactionSummary,
  MerchantGroupDetail,
  SearchTransactionItem,
} from '#/plugins/detective/api';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ArrowLeftOutlined,
  CreditCardOutlined,
  DollarOutlined,
  PlusOutlined,
  SwapOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  batchLinkTransactionsToGroupApi,
  getGroupDetailApi,
  getGroupTransactionsApi,
  getMerchantsApi,
  linkTransactionToGroupApi,
  searchTransactionsApi,
  setMerchantGroupApi,
} from '#/plugins/detective/api';

const route = useRoute();
const router = useRouter();

const groupId = computed(() => Number(route.params.groupId));

// 状态
const loading = ref(false);
const groupDetail = ref<MerchantGroupDetail | null>(null);
const transactions = ref<GroupTransactionItem[]>([]);
const summary = ref<GroupTransactionSummary | null>(null);

// 筛选类型
const filterType = ref<'all' | 'expense' | 'income'>('all');

// 搜索关键词
const searchKeyword = ref('');

// 日期范围
const dateRange = ref<[string, string] | null>(null);

// 分页
const currentPage = ref(1);
const pageSize = ref(20);

// 前端筛选后的交易列表
const filteredTransactions = computed(() => {
  let result = transactions.value;

  // 类型筛选
  if (filterType.value !== 'all') {
    result = result.filter((t) => t.direction === filterType.value);
  }

  // 关键词搜索（商户名称）
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase();
    result = result.filter(
      (t) =>
        t.merchant_raw.toLowerCase().includes(keyword) ||
        t.merchant_name.toLowerCase().includes(keyword),
    );
  }

  // 日期范围筛选
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const [start, end] = dateRange.value;
    const startDate = new Date(start).setHours(0, 0, 0, 0);
    const endDate = new Date(end).setHours(23, 59, 59, 999);
    result = result.filter((t) => {
      const txDate = new Date(t.transaction_time).getTime();
      return txDate >= startDate && txDate <= endDate;
    });
  }

  return result;
});

// 当前页数据
const pagedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTransactions.value.slice(start, end);
});

// 筛选变化时重置页码
watch(
  [filterType, searchKeyword, dateRange],
  () => {
    currentPage.value = 1;
  },
  { deep: true },
);

// 重置筛选
const resetFilters = () => {
  filterType.value = 'all';
  searchKeyword.value = '';
  dateRange.value = null;
  currentPage.value = 1;
};

// 计算差额（回款 - 刷卡）
const diffAmount = computed(() => {
  if (!summary.value) return '0';
  const income = Number.parseFloat(summary.value.income_amount) || 0;
  const expense = Number.parseFloat(summary.value.expense_amount) || 0;
  return (income - expense).toFixed(2);
});

// 关联商户名称
const merchantNames = computed(() => {
  if (!groupDetail.value?.merchants?.length) return '-';
  return groupDetail.value.merchants.map((m) => m.name).join('、');
});

// 返回列表
const goBack = () => {
  router.push('/detective/cash-out/groups');
};

// 加载分组详情
const fetchGroupDetail = async () => {
  try {
    groupDetail.value = await getGroupDetailApi(groupId.value);
  } catch (error) {
    console.error('Failed to fetch group detail:', error);
  }
};

// 一次性加载所有交易
const fetchTransactions = async () => {
  loading.value = true;
  try {
    const res = await getGroupTransactionsApi(groupId.value, {
      page: 1,
      size: 1000, // 一次性加载所有数据
    });
    transactions.value = res.transactions || [];
    summary.value = res.summary || null;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
  } finally {
    loading.value = false;
  }
};

// 分页变化
const onPageChange = (page: number, size: number) => {
  currentPage.value = page;
  pageSize.value = size;
};

// 格式化金额
const formatAmount = (amount: string, direction: 'expense' | 'income') => {
  const num = Number.parseFloat(amount);
  const prefix = direction === 'income' ? '+' : '-';
  return `${prefix}¥${Math.abs(num).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
};

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
};

// ==================== 添加商户功能 ====================
const addMerchantModalVisible = ref(false);
const addMerchantLoading = ref(false);
const ungroupedMerchants = ref<CashOutMerchant[]>([]);
const selectedMerchantId = ref<null | number>(null);

// 打开添加商户弹窗
const openAddMerchantModal = async () => {
  addMerchantModalVisible.value = true;
  addMerchantLoading.value = true;
  selectedMerchantId.value = null;
  try {
    const merchants = await getMerchantsApi();
    // 过滤出未分组的商户
    ungroupedMerchants.value = merchants.filter((m) => m.group_id === null);
  } catch (error) {
    console.error('Failed to fetch merchants:', error);
  } finally {
    addMerchantLoading.value = false;
  }
};

// 确认添加商户
const handleAddMerchant = async () => {
  if (!selectedMerchantId.value) {
    message.warning($t('detective.merchantGroup.selectMerchantHint'));
    return;
  }
  try {
    await setMerchantGroupApi(selectedMerchantId.value, {
      group_id: groupId.value,
    });
    message.success($t('common.operationSuccess'));
    addMerchantModalVisible.value = false;
    fetchGroupDetail();
  } catch (error) {
    console.error('Failed to add merchant:', error);
  }
};

// ==================== 添加回款功能 ====================
const addIncomeModalVisible = ref(false);
const searchKeywordInput = ref('');
const searchLoading = ref(false);
const searchResults = ref<SearchTransactionItem[]>([]);
const selectedTransactionIds = ref<number[]>([]);
const linkLoading = ref(false);

// 搜索来源选项
const searchSources = ref(['wechat', 'alipay', 'bank']);

// 搜索结果筛选
const searchFilterDateRange = ref<[string, string] | null>(null);
const searchFilterMinAmount = ref<null | number>(null);
const searchFilterMaxAmount = ref<null | number>(null);

// 筛选后的搜索结果
const filteredSearchResults = computed(() => {
  let results = searchResults.value;

  // 日期筛选
  if (
    searchFilterDateRange.value &&
    searchFilterDateRange.value[0] &&
    searchFilterDateRange.value[1]
  ) {
    const [start, end] = searchFilterDateRange.value;
    const startDate = new Date(start).setHours(0, 0, 0, 0);
    const endDate = new Date(end).setHours(23, 59, 59, 999);
    results = results.filter((t) => {
      const txDate = new Date(t.transaction_time).getTime();
      return txDate >= startDate && txDate <= endDate;
    });
  }

  // 金额筛选
  if (searchFilterMinAmount.value !== null) {
    results = results.filter(
      (t) => Number.parseFloat(t.amount) >= searchFilterMinAmount.value!,
    );
  }
  if (searchFilterMaxAmount.value !== null) {
    results = results.filter(
      (t) => Number.parseFloat(t.amount) <= searchFilterMaxAmount.value!,
    );
  }

  return results;
});

// 打开添加回款弹窗
const openAddIncomeModal = () => {
  addIncomeModalVisible.value = true;
  searchKeywordInput.value = '';
  searchResults.value = [];
  selectedTransactionIds.value = [];
  // 重置筛选
  searchFilterDateRange.value = null;
  searchFilterMinAmount.value = null;
  searchFilterMaxAmount.value = null;
};

// 重置搜索筛选
const resetSearchFilters = () => {
  searchFilterDateRange.value = null;
  searchFilterMinAmount.value = null;
  searchFilterMaxAmount.value = null;
};

// 搜索交易
const handleSearchTransactions = async () => {
  if (!searchKeywordInput.value.trim()) {
    message.warning($t('detective.merchantGroup.searchKeywordRequired'));
    return;
  }
  searchLoading.value = true;
  try {
    const res = await searchTransactionsApi({
      keyword: searchKeywordInput.value.trim(),
      sources: searchSources.value.join(','),
      size: 100, // 一次加载较多数据
    });
    // 只显示收入类型的交易
    searchResults.value = (res.items || []).filter(
      (t) => t.direction === 'income',
    );
    selectedTransactionIds.value = [];
  } catch (error) {
    console.error('Failed to search transactions:', error);
  } finally {
    searchLoading.value = false;
  }
};

// 计算已选交易的金额合计
const selectedTotalAmount = computed(() => {
  const selected = searchResults.value.filter((t) =>
    selectedTransactionIds.value.includes(t.id),
  );
  const total = selected.reduce(
    (sum, t) => sum + Number.parseFloat(t.amount),
    0,
  );
  return total.toFixed(2);
});

// 确认添加回款
const handleAddIncome = async () => {
  if (selectedTransactionIds.value.length === 0) {
    message.warning($t('detective.merchantGroup.selectTransactionHint'));
    return;
  }

  linkLoading.value = true;
  try {
    const ids = selectedTransactionIds.value;
    ids.length === 1
      ? await linkTransactionToGroupApi(ids[0]!, { group_id: groupId.value })
      : await batchLinkTransactionsToGroupApi({
          group_id: groupId.value,
          transaction_ids: ids,
        });
    message.success(
      $t('detective.merchantGroup.addIncomeSuccess', {
        count: ids.length,
      }),
    );
    addIncomeModalVisible.value = false;
    fetchTransactions();
  } catch (error) {
    console.error('Failed to link transactions:', error);
  } finally {
    linkLoading.value = false;
  }
};

// 格式化搜索结果金额
const formatSearchAmount = (amount: string) => {
  const num = Number.parseFloat(amount);
  return `+¥${Math.abs(num).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
};

// 格式化搜索结果时间
const formatSearchTime = (time: string) => {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

// 来源显示名称
const sourceLabels: Record<string, string> = {
  wechat: '微信',
  alipay: '支付宝',
  bank: '储蓄卡',
};

// 搜索结果表格列
const searchResultColumns = computed(() => [
  {
    dataIndex: 'merchant_raw',
    key: 'merchant_raw',
    title: $t('detective.merchantGroup.merchantName'),
    width: 200,
  },
  {
    align: 'right' as const,
    dataIndex: 'amount',
    key: 'amount',
    title: $t('detective.merchantGroup.amount'),
    width: 120,
  },
  {
    dataIndex: 'transaction_time',
    key: 'transaction_time',
    title: $t('detective.merchantGroup.transactionTime'),
    width: 150,
  },
  {
    dataIndex: 'card_bank',
    key: 'card_info',
    title: $t('detective.merchantGroup.cardInfo'),
    width: 140,
  },
  {
    dataIndex: 'source',
    key: 'source',
    title: $t('detective.merchantGroup.source'),
    width: 80,
  },
]);

onMounted(() => {
  fetchGroupDetail();
  fetchTransactions();
});
</script>

<template>
  <Page :title="groupDetail?.name || $t('detective.merchantGroup.groupDetail')">
    <template #extra>
      <Button @click="goBack">
        <template #icon><ArrowLeftOutlined /></template>
        {{ $t('common.back') }}
      </Button>
    </template>

    <Spin :spinning="loading">
      <!-- 关联商户 -->
      <Card size="small" class="mb-4">
        <div class="flex items-center justify-between">
          <div class="text-gray-500">
            {{ $t('detective.merchantGroup.linkedMerchants') }}:
            <span class="text-gray-700">{{ merchantNames }}</span>
          </div>
          <Button size="small" @click="openAddMerchantModal">
            <template #icon><PlusOutlined /></template>
            {{ $t('detective.merchantGroup.addMerchant') }}
          </Button>
        </div>
      </Card>

      <!-- 汇总统计 -->
      <Row :gutter="16" class="mb-4">
        <Col :span="8">
          <Card>
            <Statistic
              :title="$t('detective.merchantGroup.incomeStats')"
              :value="summary?.income_amount || '0'"
              :precision="2"
              prefix="¥"
              :value-style="{ color: '#52c41a' }"
            >
              <template #suffix>
                <Typography.Text type="secondary" class="text-sm">
                  {{ summary?.income_count || 0
                  }}{{ $t('detective.merchantGroup.transactions') }}
                </Typography.Text>
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="8">
          <Card>
            <Statistic
              :title="$t('detective.merchantGroup.creditStats')"
              :value="summary?.expense_amount || '0'"
              :precision="2"
              prefix="¥"
              :value-style="{ color: '#ff4d4f' }"
            >
              <template #suffix>
                <Typography.Text type="secondary" class="text-sm">
                  {{ summary?.expense_count || 0
                  }}{{ $t('detective.merchantGroup.transactions') }}
                </Typography.Text>
              </template>
            </Statistic>
          </Card>
        </Col>
        <Col :span="8">
          <Card>
            <Statistic
              :title="$t('detective.merchantGroup.diffAmount')"
              :value="diffAmount"
              :precision="2"
              prefix="¥"
              :value-style="{
                color: Number(diffAmount) >= 0 ? '#52c41a' : '#ff4d4f',
              }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 筛选 -->
      <Card size="small" class="mb-4">
        <Space direction="vertical" class="w-full" :size="12">
          <!-- 类型筛选 -->
          <div class="flex items-center gap-4">
            <Radio.Group v-model:value="filterType" button-style="solid">
              <Radio.Button value="all">
                <SwapOutlined class="mr-1" />
                {{ $t('detective.merchantGroup.filterAll') }} ({{
                  transactions.length
                }})
              </Radio.Button>
              <Radio.Button value="income">
                <DollarOutlined class="mr-1" />
                {{ $t('detective.merchantGroup.filterIncome') }} ({{
                  transactions.filter((t) => t.direction === 'income').length
                }})
              </Radio.Button>
              <Radio.Button value="expense">
                <CreditCardOutlined class="mr-1" />
                {{ $t('detective.merchantGroup.filterCredit') }} ({{
                  transactions.filter((t) => t.direction === 'expense').length
                }})
              </Radio.Button>
            </Radio.Group>
          </div>

          <!-- 搜索和日期筛选 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <Input.Search
                v-model:value="searchKeyword"
                :placeholder="$t('detective.merchantGroup.searchPlaceholder')"
                allow-clear
                style="width: 280px"
              />
              <DatePicker.RangePicker
                v-model:value="dateRange"
                :placeholder="[
                  $t('detective.merchantGroup.startDate'),
                  $t('detective.merchantGroup.endDate'),
                ]"
                style="width: 280px"
                value-format="YYYY-MM-DD"
              />
              <Button @click="resetFilters">{{ $t('common.reset') }}</Button>
            </div>
            <Button type="primary" @click="openAddIncomeModal">
              <template #icon><PlusOutlined /></template>
              {{ $t('detective.merchantGroup.addIncome') }}
            </Button>
          </div>
        </Space>
      </Card>

      <!-- 交易列表 -->
      <Card :title="$t('detective.merchantGroup.transactionList')">
        <List
          v-if="filteredTransactions.length > 0"
          :data-source="pagedTransactions"
          item-layout="horizontal"
          :pagination="{
            current: currentPage,
            pageSize,
            total: filteredTransactions.length,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) =>
              `${$t('common.total')} ${total} ${$t('common.items')}`,
            onChange: onPageChange,
            onShowSizeChange: onPageChange,
          }"
        >
          <template #renderItem="{ item }">
            <List.Item>
              <List.Item.Meta>
                <template #title>
                  <div class="flex items-center justify-between">
                    <span>{{ item.merchant_raw }}</span>
                    <span
                      class="font-medium"
                      :class="[
                        item.direction === 'income'
                          ? 'text-green-500'
                          : 'text-red-500',
                      ]"
                    >
                      {{ formatAmount(item.amount, item.direction) }}
                    </span>
                  </div>
                </template>
                <template #description>
                  <div class="flex items-center justify-between text-gray-400">
                    <div>
                      <span>{{ formatTime(item.transaction_time) }}</span>
                      <Tag class="ml-2" size="small">
                        {{ item.merchant_name }}
                      </Tag>
                    </div>
                    <span>{{ item.card_bank }}({{ item.card_last4 }})</span>
                  </div>
                </template>
              </List.Item.Meta>
            </List.Item>
          </template>
        </List>

        <Empty
          v-else
          :description="$t('detective.merchantGroup.noTransactions')"
        />
      </Card>
    </Spin>

    <!-- 添加商户弹窗 -->
    <Modal
      v-model:open="addMerchantModalVisible"
      :title="$t('detective.merchantGroup.addMerchant')"
      :confirm-loading="addMerchantLoading"
      @ok="handleAddMerchant"
    >
      <Spin :spinning="addMerchantLoading">
        <div class="py-4">
          <div class="mb-4 text-gray-500">
            {{
              $t('detective.merchantGroup.addMerchantHint', {
                name: groupDetail?.name,
              })
            }}
          </div>
          <Select
            v-model:value="selectedMerchantId"
            :placeholder="$t('detective.merchantGroup.selectMerchant')"
            style="width: 100%"
            :options="
              ungroupedMerchants.map((m) => ({ value: m.id, label: m.name }))
            "
            :not-found-content="
              $t('detective.merchantGroup.noUngroupedMerchant')
            "
          />
        </div>
      </Spin>
    </Modal>

    <!-- 添加回款弹窗 -->
    <Modal
      v-model:open="addIncomeModalVisible"
      :title="$t('detective.merchantGroup.addIncome')"
      :width="900"
      :confirm-loading="linkLoading"
      @ok="handleAddIncome"
    >
      <div class="py-2">
        <!-- 搜索区域 -->
        <div class="mb-4">
          <div class="mb-2 font-medium">
            {{ $t('detective.merchantGroup.searchTransaction') }}
          </div>
          <div class="flex items-center gap-2">
            <Input
              v-model:value="searchKeywordInput"
              :placeholder="
                $t('detective.merchantGroup.searchKeywordPlaceholder')
              "
              style="width: 300px"
              @press-enter="handleSearchTransactions"
            />
            <Button
              type="primary"
              :loading="searchLoading"
              @click="handleSearchTransactions"
            >
              {{ $t('common.search') }}
            </Button>
          </div>
          <div class="mt-2 flex items-center gap-2 text-gray-500">
            <span>{{ $t('detective.merchantGroup.searchSource') }}:</span>
            <Select
              v-model:value="searchSources"
              mode="multiple"
              style="width: 280px"
              :options="[
                { value: 'wechat', label: sourceLabels.wechat },
                { value: 'alipay', label: sourceLabels.alipay },
                { value: 'bank', label: sourceLabels.bank },
              ]"
            />
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-if="searchResults.length > 0" class="mb-4">
          <!-- 筛选条件 -->
          <div
            class="mb-3 flex flex-wrap items-center gap-3 rounded bg-gray-50 p-3"
          >
            <div class="flex items-center gap-2">
              <span class="text-gray-500">
                {{ $t('detective.merchantGroup.filterDate') }}:
              </span>
              <DatePicker.RangePicker
                v-model:value="searchFilterDateRange"
                style="width: 240px"
                value-format="YYYY-MM-DD"
                size="small"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-500">
                {{ $t('detective.merchantGroup.filterAmount') }}:
              </span>
              <InputNumber
                v-model:value="searchFilterMinAmount"
                :placeholder="$t('detective.merchantGroup.minAmount')"
                :min="0"
                style="width: 100px"
                size="small"
              />
              <span class="text-gray-400">-</span>
              <InputNumber
                v-model:value="searchFilterMaxAmount"
                :placeholder="$t('detective.merchantGroup.maxAmount')"
                :min="0"
                style="width: 100px"
                size="small"
              />
            </div>
            <Button size="small" @click="resetSearchFilters">
              {{ $t('common.reset') }}
            </Button>
          </div>

          <div class="mb-2 flex items-center justify-between">
            <span class="font-medium">
              {{ $t('detective.merchantGroup.searchResults') }}
              ({{ filteredSearchResults.length }}/{{ searchResults.length }})
            </span>
          </div>
          <div class="max-h-80 overflow-y-auto rounded border">
            <Table
              :data-source="filteredSearchResults"
              :columns="searchResultColumns"
              :pagination="false"
              :scroll="{ y: 300 }"
              size="small"
              row-key="id"
              :row-selection="{
                selectedRowKeys: selectedTransactionIds,
                onChange: (keys: number[]) => (selectedTransactionIds = keys),
              }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'merchant_raw'">
                  <div>{{ record.merchant_raw }}</div>
                  <div class="text-xs text-gray-400">
                    {{ record.description || '' }}
                  </div>
                </template>
                <template v-else-if="column.key === 'amount'">
                  <span class="text-green-500">{{
                    formatSearchAmount(record.amount)
                  }}</span>
                </template>
                <template v-else-if="column.key === 'transaction_time'">
                  {{ formatSearchTime(record.transaction_time) }}
                </template>
                <template v-else-if="column.key === 'card_info'">
                  {{ record.card_bank
                  }}{{ record.card_last4 ? `(${record.card_last4})` : '' }}
                </template>
                <template v-else-if="column.key === 'source'">
                  <Tag size="small">{{ sourceLabels[record.source] }}</Tag>
                </template>
              </template>
            </Table>
          </div>
        </div>

        <Empty
          v-else-if="searchKeywordInput && !searchLoading"
          :description="$t('detective.merchantGroup.noSearchResults')"
        />

        <!-- 已选统计 -->
        <div
          v-if="selectedTransactionIds.length > 0"
          class="mt-3 text-gray-500"
        >
          {{
            $t('detective.merchantGroup.selectedSummary', {
              count: selectedTransactionIds.length,
              amount: selectedTotalAmount,
            })
          }}
        </div>
      </div>
    </Modal>
  </Page>
</template>
