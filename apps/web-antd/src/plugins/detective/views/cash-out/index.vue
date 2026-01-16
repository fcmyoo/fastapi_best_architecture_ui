<script setup lang="ts">
import type {
  CashOutMerchant,
  CashOutStatsByGroup,
  CashOutStatsByMerchant,
  CashOutStatsSummary,
  CreateAccountParam,
  CreateMerchantParam,
  MerchantAccount,
  MerchantGroup,
  Transaction,
} from '#/plugins/detective/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ScanOutlined,
  ShopOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  createMerchantAccountApi,
  createMerchantApi,
  deleteMerchantAccountApi,
  deleteMerchantApi,
  getCashOutStatsByGroupApi,
  getCashOutStatsByMerchantApi,
  getCashOutStatsSummaryApi,
  getGroupsApi,
  getMerchantsApi,
  getTransactionListApi,
  setMerchantGroupApi,
  updateMerchantAccountApi,
  updateMerchantApi,
} from '#/plugins/detective/api';

import ScanMatchModal from './ScanMatchModal.vue';

const loading = ref(false);
const merchants = ref<CashOutMerchant[]>([]);
const summary = ref<CashOutStatsSummary | null>(null);
const statsByMerchant = ref<CashOutStatsByMerchant[]>([]);
const statsByGroup = ref<CashOutStatsByGroup[]>([]);
const groups = ref<MerchantGroup[]>([]);
const statsActiveTab = ref('summary');

// 商户弹窗
const merchantModalVisible = ref(false);
const merchantModalTitle = ref('');
const editingMerchant = ref<CashOutMerchant | null>(null);
const merchantForm = ref<CreateMerchantParam & { group_id?: number }>({
  name: '',
  fee_rate: 0.01,
  note: '',
  group_id: undefined,
});

// 账户弹窗
const accountModalVisible = ref(false);
const editingMerchantId = ref<null | number>(null);
const editingAccount = ref<MerchantAccount | null>(null);
const accountForm = ref<CreateAccountParam>({
  name_pattern: '',
  account_type: 'credit',
  account_pattern: '',
  note: '',
});

// 交易明细抽屉
const txDrawerVisible = ref(false);
const txDrawerTitle = ref('');
const txLoading = ref(false);
const txList = ref<Transaction[]>([]);
const txPagination = ref({ current: 1, pageSize: 20, total: 0 });
const currentMerchant = ref<CashOutMerchant | null>(null);

// 扫描匹配弹窗
const scanModalVisible = ref(false);
const scanMerchant = ref<CashOutMerchant | null>(null);

// 格式化费率为百分比
const formatFeeRate = (rate: string) => {
  return `${(Number.parseFloat(rate) * 100).toFixed(2)}%`;
};

// 格式化金额
const formatAmount = (amount: number | string) => {
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
};

// 获取商户统计
const getMerchantStats = (merchantId: number) => {
  return statsByMerchant.value.find((s) => s.merchant_id === merchantId);
};

// 商户表格列
const merchantColumns = computed(() => [
  {
    title: $t('detective.cashOut.merchantName'),
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: $t('detective.merchantGroup.groupName'),
    dataIndex: 'group_name',
    key: 'group_name',
    width: 120,
  },
  {
    title: $t('detective.cashOut.feeRate'),
    dataIndex: 'fee_rate',
    key: 'fee_rate',
    width: 100,
  },
  {
    title: $t('detective.cashOut.creditAmount'),
    key: 'credit_amount',
    width: 150,
  },
  {
    title: $t('detective.cashOut.transferAmount'),
    key: 'transfer_amount',
    width: 150,
  },
  {
    title: $t('detective.cashOut.fee'),
    key: 'fee',
    width: 120,
  },
  {
    title: $t('detective.cashOut.status'),
    dataIndex: 'is_active',
    key: 'is_active',
    width: 80,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 220,
    fixed: 'right' as const,
  },
]);

// 交易表格列
const txColumns = computed(() => [
  {
    title: $t('detective.transaction.transactionTime'),
    dataIndex: 'transaction_time',
    key: 'transaction_time',
    width: 180,
  },
  {
    title: $t('detective.transaction.source'),
    dataIndex: 'source',
    key: 'source',
    width: 100,
  },
  {
    title: $t('detective.cashOut.txType'),
    key: 'tx_type',
    width: 100,
  },
  {
    title: $t('detective.transaction.amount'),
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    align: 'right' as const,
  },
  {
    title: $t('detective.transaction.merchant'),
    dataIndex: 'merchant_raw',
    key: 'merchant_raw',
    ellipsis: true,
  },
]);

// 分组统计表格列
const groupStatsColumns = computed(() => [
  {
    title: $t('detective.merchantGroup.groupName'),
    dataIndex: 'group_name',
    key: 'group_name',
  },
  {
    title: $t('detective.merchantGroup.merchantCount'),
    dataIndex: 'merchant_count',
    key: 'merchant_count',
    width: 100,
    align: 'center' as const,
  },
  {
    title: $t('detective.cashOut.creditAmount'),
    key: 'credit_amount',
    width: 150,
  },
  {
    title: $t('detective.cashOut.transferAmount'),
    key: 'transfer_amount',
    width: 150,
  },
  {
    title: $t('detective.cashOut.fee'),
    key: 'fee',
    width: 120,
  },
  {
    title: $t('detective.cashOut.feeRate'),
    key: 'fee_rate',
    width: 100,
  },
]);

// 计算分组手续费率
const calcGroupFeeRate = (group: CashOutStatsByGroup) => {
  const credit = Number.parseFloat(group.credit_amount) || 0;
  const fee = Number.parseFloat(group.fee) || 0;
  if (credit === 0) return '0.00%';
  return `${((fee / credit) * 100).toFixed(2)}%`;
};

// 加载数据
const fetchData = async () => {
  loading.value = true;
  try {
    const [merchantsRes, summaryRes, statsRes, groupStatsRes, groupsRes] =
      await Promise.all([
        getMerchantsApi(),
        getCashOutStatsSummaryApi(),
        getCashOutStatsByMerchantApi(),
        getCashOutStatsByGroupApi(),
        getGroupsApi(),
      ]);
    merchants.value = merchantsRes;
    summary.value = summaryRes;
    statsByMerchant.value = statsRes;
    statsByGroup.value = groupStatsRes;
    groups.value = groupsRes;
  } catch (error) {
    console.error('Failed to fetch cash out data:', error);
  } finally {
    loading.value = false;
  }
};

// 分组选项
const groupOptions = computed(() =>
  groups.value.map((g) => ({ label: g.name, value: g.id })),
);

// 查看商户交易明细
const viewMerchantTx = async (merchant: CashOutMerchant) => {
  currentMerchant.value = merchant;
  txDrawerTitle.value = `${merchant.name} - ${$t('detective.cashOut.txDetail')}`;
  txDrawerVisible.value = true;
  txPagination.value.current = 1;
  await fetchMerchantTx();
};

// 打开扫描匹配弹窗
const openScanModal = (merchant: CashOutMerchant) => {
  scanMerchant.value = merchant;
  scanModalVisible.value = true;
};

// 获取商户交易
const fetchMerchantTx = async () => {
  if (!currentMerchant.value) return;

  txLoading.value = true;
  try {
    // 使用商户账户的 name_pattern 作为关键字搜索
    const patterns = currentMerchant.value.accounts.map((a) => a.name_pattern);
    // 搜索套现分类的交易
    const res = await getTransactionListApi({
      keyword: patterns[0] || currentMerchant.value.name,
      page: txPagination.value.current,
      size: txPagination.value.pageSize,
    });
    // 过滤出套现相关交易
    txList.value = (res.items || []).filter(
      (tx) =>
        tx.category === 'cash_advance' || tx.category === 'cash_advance_income',
    );
    txPagination.value.total = txList.value.length;
  } catch (error) {
    console.error('Failed to fetch merchant transactions:', error);
  } finally {
    txLoading.value = false;
  }
};

// 打开新增商户弹窗
const openAddMerchantModal = () => {
  merchantModalTitle.value = $t('detective.cashOut.addMerchant');
  editingMerchant.value = null;
  merchantForm.value = {
    name: '',
    fee_rate: 0.01,
    note: '',
    group_id: undefined,
  };
  merchantModalVisible.value = true;
};

// 打开编辑商户弹窗
const openEditMerchantModal = (merchant: CashOutMerchant) => {
  merchantModalTitle.value = $t('detective.cashOut.editMerchant');
  editingMerchant.value = merchant;
  merchantForm.value = {
    name: merchant.name,
    fee_rate: Number.parseFloat(merchant.fee_rate),
    note: merchant.note || '',
    group_id: merchant.group_id ?? undefined,
  };
  merchantModalVisible.value = true;
};

// 保存商户
const saveMerchant = async () => {
  try {
    const { group_id, ...merchantData } = merchantForm.value;
    const newGroupId = group_id ?? null;
    if (editingMerchant.value) {
      await updateMerchantApi(editingMerchant.value.id, merchantData);
      // 如果分组有变化，单独更新分组
      if (editingMerchant.value.group_id !== newGroupId) {
        await setMerchantGroupApi(editingMerchant.value.id, {
          group_id: newGroupId,
        });
      }
      message.success($t('common.updateSuccess'));
    } else {
      const newMerchant = await createMerchantApi(merchantData);
      // 如果选择了分组，设置分组
      if (newGroupId) {
        await setMerchantGroupApi(newMerchant.id, { group_id: newGroupId });
      }
      message.success($t('common.createSuccess'));
    }
    merchantModalVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('Failed to save merchant:', error);
  }
};

// 删除商户
const deleteMerchant = async (merchantId: number) => {
  try {
    await deleteMerchantApi(merchantId);
    message.success($t('common.deleteSuccess'));
    fetchData();
  } catch (error) {
    console.error('Failed to delete merchant:', error);
  }
};

// 切换商户状态
const toggleMerchantStatus = async (merchant: CashOutMerchant) => {
  try {
    await updateMerchantApi(merchant.id, { is_active: !merchant.is_active });
    fetchData();
  } catch (error) {
    console.error('Failed to toggle merchant status:', error);
  }
};

// 打开新增账户弹窗
const openAddAccountModal = (merchantId: number) => {
  editingMerchantId.value = merchantId;
  editingAccount.value = null;
  accountForm.value = {
    name_pattern: '',
    account_type: 'credit',
    account_pattern: '',
    note: '',
  };
  accountModalVisible.value = true;
};

// 打开编辑账户弹窗
const openEditAccountModal = (merchantId: number, account: MerchantAccount) => {
  editingMerchantId.value = merchantId;
  editingAccount.value = account;
  accountForm.value = {
    name_pattern: account.name_pattern,
    account_type: account.account_type,
    account_pattern: account.account_pattern || '',
    note: account.note || '',
  };
  accountModalVisible.value = true;
};

// 保存账户
const saveAccount = async () => {
  if (!editingMerchantId.value) return;
  try {
    if (editingAccount.value) {
      await updateMerchantAccountApi(
        editingAccount.value.id,
        accountForm.value,
      );
      message.success($t('common.updateSuccess'));
    } else {
      await createMerchantAccountApi(
        editingMerchantId.value,
        accountForm.value,
      );
      message.success($t('common.createSuccess'));
    }
    accountModalVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('Failed to save account:', error);
  }
};

// 删除账户
const deleteAccount = async (accountId: number) => {
  try {
    await deleteMerchantAccountApi(accountId);
    message.success($t('common.deleteSuccess'));
    fetchData();
  } catch (error) {
    console.error('Failed to delete account:', error);
  }
};

// 账户类型选项
const accountTypeOptions = computed(() => [
  {
    value: 'credit',
    label: $t('detective.cashOut.accountTypeCredit'),
  },
  {
    value: 'transfer',
    label: $t('detective.cashOut.accountTypeTransfer'),
  },
]);

// 账户表格列
const accountColumns = [
  {
    title: $t('detective.cashOut.accountType'),
    dataIndex: 'account_type',
    key: 'account_type',
    width: 100,
  },
  {
    title: $t('detective.cashOut.namePattern'),
    dataIndex: 'name_pattern',
    key: 'name_pattern',
  },
  {
    title: $t('detective.cashOut.accountPattern'),
    dataIndex: 'account_pattern',
    key: 'account_pattern',
  },
  {
    title: $t('detective.cashOut.note'),
    dataIndex: 'note',
    key: 'note',
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 120,
  },
];

// 获取交易类型显示
const getTxTypeDisplay = (category: string | undefined) => {
  if (category === 'cash_advance') {
    return { label: $t('detective.cashOut.cashAdvance'), color: 'orange' };
  }
  if (category === 'cash_advance_income') {
    return { label: $t('detective.cashOut.cashAdvanceIncome'), color: 'blue' };
  }
  return { label: '-', color: 'default' };
};

// 来源选项
const sourceLabels: Record<string, string> = {
  wechat: '微信',
  alipay: '支付宝',
  credit_card: '信用卡',
  bank: '银行卡',
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.cashOut.title')">
    <Spin :spinning="loading">
      <!-- 统计概览 -->
      <Card :title="$t('detective.cashOut.statsTitle')" class="mb-4">
        <Tabs v-model:active-key="statsActiveTab">
          <!-- 汇总统计 -->
          <Tabs.TabPane
            key="summary"
            :tab="$t('detective.cashOut.statsSummary')"
          >
            <Row :gutter="16">
              <Col :span="6">
                <Statistic
                  :title="$t('detective.cashOut.totalCredit')"
                  :value="summary?.total_credit_amount || '0'"
                  :precision="2"
                  prefix="¥"
                  :value-style="{ color: '#cf1322' }"
                />
                <div class="mt-1 text-xs text-gray-400">
                  {{ summary?.credit_tx_count || 0 }}
                  {{ $t('detective.cashOut.transactions') }}
                </div>
              </Col>
              <Col :span="6">
                <Statistic
                  :title="$t('detective.cashOut.totalTransfer')"
                  :value="summary?.total_transfer_amount || '0'"
                  :precision="2"
                  prefix="¥"
                  :value-style="{ color: '#3f8600' }"
                />
                <div class="mt-1 text-xs text-gray-400">
                  {{ summary?.transfer_tx_count || 0 }}
                  {{ $t('detective.cashOut.transactions') }}
                </div>
              </Col>
              <Col :span="6">
                <Statistic
                  :title="$t('detective.cashOut.totalFee')"
                  :value="summary?.total_fee || '0'"
                  :precision="2"
                  prefix="¥"
                  :value-style="{ color: '#fa8c16' }"
                />
              </Col>
              <Col :span="6">
                <Statistic
                  :title="$t('detective.cashOut.avgFeeRate')"
                  :value="
                    summary
                      ? (parseFloat(summary.avg_fee_rate) * 100).toFixed(2)
                      : '0'
                  "
                  suffix="%"
                  :value-style="{ color: '#1890ff' }"
                />
                <div class="mt-1 text-xs text-gray-400">
                  {{ summary?.merchant_count || 0 }}
                  {{ $t('detective.cashOut.merchantCount') }}
                </div>
              </Col>
            </Row>
          </Tabs.TabPane>

          <!-- 按分组统计 -->
          <Tabs.TabPane
            key="byGroup"
            :tab="$t('detective.cashOut.statsByGroup')"
          >
            <Table
              :columns="groupStatsColumns"
              :data-source="statsByGroup"
              :pagination="false"
              size="small"
              row-key="group_id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'credit_amount'">
                  <span class="text-red-500">
                    {{ formatAmount(record.credit_amount) }}
                  </span>
                  <span class="ml-1 text-xs text-gray-400">
                    ({{ record.credit_tx_count }}笔)
                  </span>
                </template>
                <template v-else-if="column.key === 'transfer_amount'">
                  <span class="text-green-500">
                    {{ formatAmount(record.transfer_amount) }}
                  </span>
                  <span class="ml-1 text-xs text-gray-400">
                    ({{ record.transfer_tx_count }}笔)
                  </span>
                </template>
                <template v-else-if="column.key === 'fee'">
                  <span class="text-orange-500">
                    {{ formatAmount(record.fee) }}
                  </span>
                </template>
                <template v-else-if="column.key === 'fee_rate'">
                  <span class="text-blue-500">
                    {{ calcGroupFeeRate(record as CashOutStatsByGroup) }}
                  </span>
                </template>
              </template>
            </Table>
            <div
              v-if="statsByGroup.length === 0"
              class="py-8 text-center text-gray-400"
            >
              {{ $t('detective.merchantGroup.noData') }}
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>

      <!-- 商户列表 -->
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>{{ $t('detective.cashOut.merchantList') }}</span>
            <Button type="primary" @click="openAddMerchantModal">
              <template #icon><PlusOutlined /></template>
              {{ $t('detective.cashOut.addMerchant') }}
            </Button>
          </div>
        </template>

        <Table
          v-if="merchants.length > 0"
          :columns="merchantColumns"
          :data-source="merchants"
          :pagination="false"
          :scroll="{ x: 900 }"
          row-key="id"
          :expand-column-width="48"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a @click="viewMerchantTx(record as CashOutMerchant)">
                {{ record.name }}
              </a>
            </template>
            <template v-else-if="column.key === 'group_name'">
              <Tag v-if="record.group_name" color="blue">
                {{ record.group_name }}
              </Tag>
              <span v-else class="text-gray-400">
                {{ $t('detective.merchantGroup.noGroup') }}
              </span>
            </template>
            <template v-else-if="column.key === 'fee_rate'">
              {{ formatFeeRate(record.fee_rate) }}
            </template>
            <template v-else-if="column.key === 'credit_amount'">
              <span class="text-red-500">
                {{
                  formatAmount(
                    getMerchantStats(record.id)?.credit_amount || '0',
                  )
                }}
              </span>
              <span class="ml-1 text-xs text-gray-400">
                ({{ getMerchantStats(record.id)?.credit_tx_count || 0 }}笔)
              </span>
            </template>
            <template v-else-if="column.key === 'transfer_amount'">
              <span class="text-green-500">
                {{
                  formatAmount(
                    getMerchantStats(record.id)?.transfer_amount || '0',
                  )
                }}
              </span>
              <span class="ml-1 text-xs text-gray-400">
                ({{ getMerchantStats(record.id)?.transfer_tx_count || 0 }}笔)
              </span>
            </template>
            <template v-else-if="column.key === 'fee'">
              <span class="text-orange-500">
                {{ formatAmount(getMerchantStats(record.id)?.fee || '0') }}
              </span>
            </template>
            <template v-else-if="column.key === 'is_active'">
              <Switch
                :checked="record.is_active"
                size="small"
                @change="toggleMerchantStatus(record as CashOutMerchant)"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button
                  type="link"
                  size="small"
                  @click="openScanModal(record as CashOutMerchant)"
                >
                  <template #icon><ScanOutlined /></template>
                  {{ $t('detective.cashOut.scanMatch') }}
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="viewMerchantTx(record as CashOutMerchant)"
                >
                  {{ $t('detective.cashOut.viewTx') }}
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="openEditMerchantModal(record as CashOutMerchant)"
                >
                  <template #icon><EditOutlined /></template>
                </Button>
                <Popconfirm
                  :title="$t('detective.cashOut.deleteMerchantConfirm')"
                  @confirm="deleteMerchant(record.id)"
                >
                  <Button type="link" size="small" danger>
                    <template #icon><DeleteOutlined /></template>
                  </Button>
                </Popconfirm>
              </Space>
            </template>
          </template>

          <!-- 展开行：账户配置 -->
          <template #expandedRowRender="{ record }">
            <div class="bg-gray-50 p-4">
              <Descriptions :column="3" size="small" class="mb-4">
                <Descriptions.Item :label="$t('detective.cashOut.note')">
                  {{ record.note || '-' }}
                </Descriptions.Item>
                <Descriptions.Item :label="$t('detective.cashOut.createdTime')">
                  {{ record.created_time }}
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left" orientation-margin="0">
                {{ $t('detective.cashOut.accountList') }}
                <Button
                  type="link"
                  size="small"
                  @click="openAddAccountModal(record.id)"
                >
                  <template #icon><PlusOutlined /></template>
                  {{ $t('detective.cashOut.addAccount') }}
                </Button>
              </Divider>

              <Table
                :columns="accountColumns"
                :data-source="record.accounts"
                :pagination="false"
                size="small"
                row-key="id"
              >
                <template #bodyCell="{ column, record: acc }">
                  <template v-if="column.key === 'account_type'">
                    <Tag
                      :color="acc.account_type === 'credit' ? 'orange' : 'blue'"
                    >
                      {{
                        acc.account_type === 'credit'
                          ? $t('detective.cashOut.accountTypeCredit')
                          : $t('detective.cashOut.accountTypeTransfer')
                      }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <Space>
                      <Button
                        type="link"
                        size="small"
                        @click="
                          openEditAccountModal(
                            record.id,
                            acc as MerchantAccount,
                          )
                        "
                      >
                        {{ $t('common.edit') }}
                      </Button>
                      <Popconfirm
                        :title="$t('detective.cashOut.deleteAccountConfirm')"
                        @confirm="deleteAccount(acc.id)"
                      >
                        <Button type="link" size="small" danger>
                          {{ $t('common.delete') }}
                        </Button>
                      </Popconfirm>
                    </Space>
                  </template>
                </template>
              </Table>
            </div>
          </template>
        </Table>

        <!-- 空状态 -->
        <div v-else class="py-12 text-center text-gray-400">
          <ShopOutlined style="font-size: 48px" />
          <p class="mt-4">{{ $t('detective.cashOut.noMerchant') }}</p>
          <Button type="primary" class="mt-4" @click="openAddMerchantModal">
            <template #icon><PlusOutlined /></template>
            {{ $t('detective.cashOut.addMerchant') }}
          </Button>
        </div>
      </Card>
    </Spin>

    <!-- 商户弹窗 -->
    <Modal
      v-model:open="merchantModalVisible"
      :title="merchantModalTitle"
      @ok="saveMerchant"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item :label="$t('detective.cashOut.merchantName')" required>
          <Input v-model:value="merchantForm.name" />
        </Form.Item>
        <Form.Item :label="$t('detective.merchantGroup.groupName')">
          <Select
            v-model:value="merchantForm.group_id"
            :options="groupOptions"
            :placeholder="$t('detective.merchantGroup.selectGroup')"
            allow-clear
          />
        </Form.Item>
        <Form.Item :label="$t('detective.cashOut.feeRate')">
          <InputNumber
            v-model:value="merchantForm.fee_rate"
            :min="0"
            :max="1"
            :step="0.001"
            :precision="4"
            style="width: 100%"
          >
            <template #addonAfter>
              {{
                merchantForm.fee_rate
                  ? `${(merchantForm.fee_rate * 100).toFixed(2)}%`
                  : ''
              }}
            </template>
          </InputNumber>
        </Form.Item>
        <Form.Item :label="$t('detective.cashOut.note')">
          <Input.TextArea v-model:value="merchantForm.note" :rows="2" />
        </Form.Item>
      </Form>
    </Modal>

    <!-- 账户弹窗 -->
    <Modal
      v-model:open="accountModalVisible"
      :title="
        editingAccount
          ? $t('detective.cashOut.editAccount')
          : $t('detective.cashOut.addAccount')
      "
      @ok="saveAccount"
    >
      <Form layout="vertical" class="mt-4">
        <Form.Item :label="$t('detective.cashOut.accountType')" required>
          <Select
            v-model:value="accountForm.account_type"
            :options="accountTypeOptions"
          />
        </Form.Item>
        <Form.Item :label="$t('detective.cashOut.namePattern')" required>
          <Input v-model:value="accountForm.name_pattern" />
          <div class="mt-1 text-xs text-gray-400">
            {{ $t('detective.cashOut.namePatternHint') }}
          </div>
        </Form.Item>
        <Form.Item :label="$t('detective.cashOut.accountPattern')">
          <Input v-model:value="accountForm.account_pattern" />
          <div class="mt-1 text-xs text-gray-400">
            {{ $t('detective.cashOut.accountPatternHint') }}
          </div>
        </Form.Item>
        <Form.Item :label="$t('detective.cashOut.note')">
          <Input v-model:value="accountForm.note" />
        </Form.Item>
      </Form>
    </Modal>

    <!-- 交易明细抽屉 -->
    <Modal
      v-model:open="txDrawerVisible"
      :title="txDrawerTitle"
      width="900px"
      :footer="null"
    >
      <Spin :spinning="txLoading">
        <Table
          :columns="txColumns"
          :data-source="txList"
          :pagination="false"
          size="small"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'source'">
              {{ sourceLabels[record.source] || record.source }}
            </template>
            <template v-else-if="column.key === 'tx_type'">
              <Tag :color="getTxTypeDisplay(record.category).color">
                {{ getTxTypeDisplay(record.category).label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'amount'">
              <span
                :class="
                  record.direction === 'expense'
                    ? 'text-red-500'
                    : 'text-green-500'
                "
              >
                {{ record.direction === 'expense' ? '-' : '+'
                }}{{ formatAmount(record.amount) }}
              </span>
            </template>
          </template>
        </Table>
        <div v-if="txList.length === 0" class="py-8 text-center text-gray-400">
          {{ $t('detective.cashOut.noTxData') }}
        </div>
      </Spin>
    </Modal>

    <!-- 扫描匹配弹窗 -->
    <ScanMatchModal
      v-model:open="scanModalVisible"
      :merchant="scanMerchant"
      @success="fetchData"
    />
  </Page>
</template>
