<script setup lang="ts">
import type {
  CashOutMerchant,
  CashOutStatsByMerchant,
  CashOutStatsSummary,
  CreateAccountParam,
  CreateMerchantParam,
  MerchantAccount,
} from '#/plugins/detective/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ShopOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  Collapse,
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
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  createMerchantAccountApi,
  createMerchantApi,
  deleteMerchantAccountApi,
  deleteMerchantApi,
  getCashOutStatsByMerchantApi,
  getCashOutStatsSummaryApi,
  getMerchantsApi,
  updateMerchantAccountApi,
  updateMerchantApi,
} from '#/plugins/detective/api';

const loading = ref(false);
const merchants = ref<CashOutMerchant[]>([]);
const summary = ref<CashOutStatsSummary | null>(null);
const statsByMerchant = ref<CashOutStatsByMerchant[]>([]);

// 商户弹窗
const merchantModalVisible = ref(false);
const merchantModalTitle = ref('');
const editingMerchant = ref<CashOutMerchant | null>(null);
const merchantForm = ref<CreateMerchantParam>({
  name: '',
  fee_rate: 0.01,
  note: '',
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

// 格式化费率为百分比
const formatFeeRate = (rate: string) => {
  return `${(Number.parseFloat(rate) * 100).toFixed(2)}%`;
};

// 格式化金额
const formatAmount = (amount: string) => {
  return `¥${Number.parseFloat(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
};

// 获取商户统计
const getMerchantStats = (merchantId: number) => {
  return statsByMerchant.value.find((s) => s.merchant_id === merchantId);
};

// 加载数据
const fetchData = async () => {
  loading.value = true;
  try {
    const [merchantsRes, summaryRes, statsRes] = await Promise.all([
      getMerchantsApi(),
      getCashOutStatsSummaryApi(),
      getCashOutStatsByMerchantApi(),
    ]);
    merchants.value = merchantsRes;
    summary.value = summaryRes;
    statsByMerchant.value = statsRes;
  } catch (error) {
    console.error('Failed to fetch cash out data:', error);
  } finally {
    loading.value = false;
  }
};

// 打开新增商户弹窗
const openAddMerchantModal = () => {
  merchantModalTitle.value = $t('detective.cashOut.addMerchant');
  editingMerchant.value = null;
  merchantForm.value = { name: '', fee_rate: 0.01, note: '' };
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
  };
  merchantModalVisible.value = true;
};

// 保存商户
const saveMerchant = async () => {
  try {
    if (editingMerchant.value) {
      await updateMerchantApi(editingMerchant.value.id, merchantForm.value);
      message.success($t('common.updateSuccess'));
    } else {
      await createMerchantApi(merchantForm.value);
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

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.cashOut.title')">
    <Spin :spinning="loading">
      <!-- 统计概览 -->
      <Card :title="$t('detective.cashOut.statsTitle')" class="mb-4">
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

        <Collapse v-if="merchants.length > 0">
          <Collapse.Panel
            v-for="merchant in merchants"
            :key="merchant.id"
            :header="merchant.name"
          >
            <template #extra>
              <Space @click.stop>
                <Switch
                  :checked="merchant.is_active"
                  size="small"
                  @change="toggleMerchantStatus(merchant)"
                />
                <Button size="small" @click="openEditMerchantModal(merchant)">
                  <template #icon><EditOutlined /></template>
                </Button>
                <Popconfirm
                  :title="$t('detective.cashOut.deleteMerchantConfirm')"
                  @confirm="deleteMerchant(merchant.id)"
                >
                  <Button size="small" danger>
                    <template #icon><DeleteOutlined /></template>
                  </Button>
                </Popconfirm>
              </Space>
            </template>

            <!-- 商户信息 -->
            <Descriptions :column="4" size="small" class="mb-4">
              <Descriptions.Item :label="$t('detective.cashOut.feeRate')">
                {{ formatFeeRate(merchant.fee_rate) }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('detective.cashOut.note')">
                {{ merchant.note || '-' }}
              </Descriptions.Item>
              <Descriptions.Item :label="$t('detective.cashOut.status')">
                <Tag :color="merchant.is_active ? 'green' : 'default'">
                  {{
                    merchant.is_active
                      ? $t('common.enabled')
                      : $t('common.disabled')
                  }}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item :label="$t('detective.cashOut.createdTime')">
                {{ merchant.created_time }}
              </Descriptions.Item>
            </Descriptions>

            <!-- 商户统计 -->
            <template v-if="getMerchantStats(merchant.id)">
              <div class="mb-4 rounded bg-gray-50 p-3">
                <Space :size="24">
                  <span>
                    {{ $t('detective.cashOut.creditAmount') }}:
                    <span class="font-medium text-red-500">
                      {{
                        formatAmount(
                          getMerchantStats(merchant.id)!.credit_amount,
                        )
                      }}
                    </span>
                    ({{ getMerchantStats(merchant.id)!.credit_tx_count
                    }}{{ $t('detective.cashOut.transactions') }})
                  </span>
                  <span>
                    {{ $t('detective.cashOut.transferAmount') }}:
                    <span class="font-medium text-green-500">
                      {{
                        formatAmount(
                          getMerchantStats(merchant.id)!.transfer_amount,
                        )
                      }}
                    </span>
                    ({{ getMerchantStats(merchant.id)!.transfer_tx_count
                    }}{{ $t('detective.cashOut.transactions') }})
                  </span>
                  <span>
                    {{ $t('detective.cashOut.fee') }}:
                    <span class="font-medium text-orange-500">
                      {{ formatAmount(getMerchantStats(merchant.id)!.fee) }}
                    </span>
                  </span>
                </Space>
              </div>
            </template>

            <!-- 账户列表 -->
            <Divider orientation="left" orientation-margin="0">
              {{ $t('detective.cashOut.accountList') }}
              <Button
                type="link"
                size="small"
                @click="openAddAccountModal(merchant.id)"
              >
                <template #icon><PlusOutlined /></template>
                {{ $t('detective.cashOut.addAccount') }}
              </Button>
            </Divider>

            <Table
              :columns="accountColumns"
              :data-source="merchant.accounts"
              :pagination="false"
              size="small"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'account_type'">
                  <Tag
                    :color="
                      record.account_type === 'credit' ? 'orange' : 'blue'
                    "
                  >
                    {{
                      record.account_type === 'credit'
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
                      @click="openEditAccountModal(merchant.id, record)"
                    >
                      {{ $t('common.edit') }}
                    </Button>
                    <Popconfirm
                      :title="$t('detective.cashOut.deleteAccountConfirm')"
                      @confirm="deleteAccount(record.id)"
                    >
                      <Button type="link" size="small" danger>
                        {{ $t('common.delete') }}
                      </Button>
                    </Popconfirm>
                  </Space>
                </template>
              </template>
            </Table>
          </Collapse.Panel>
        </Collapse>

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
  </Page>
</template>
