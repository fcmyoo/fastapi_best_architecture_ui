<script setup lang="ts">
import type { CreditCardSummary } from '#/plugins/detective/api';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  CreditCardOutlined,
  DownOutlined,
  MailOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Menu,
  MenuItem,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Upload,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  fetchEmailBillsApi,
  getCreditCardsApi,
  parseEmailBillApi,
} from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveCreditCardList' });

const router = useRouter();
const loading = ref(false);
const dataSource = ref<CreditCardSummary[]>([]);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await getCreditCardsApi();
    dataSource.value = res || [];
  } catch (error) {
    console.error('Failed to fetch credit cards:', error);
  } finally {
    loading.value = false;
  }
};

const formatAmount = (amount: null | number | undefined) => {
  if (amount === null || amount === undefined) return '-';
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
};

const formatDate = (dateStr: null | string | undefined) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getPaymentStatusColor = (status: string | undefined) => {
  const colorMap: Record<string, string> = {
    unpaid: 'error',
    partial: 'warning',
    paid: 'success',
  };
  return colorMap[status || ''] || 'default';
};

const getPaymentStatusText = (status: string | undefined) => {
  const textMap: Record<string, string> = {
    unpaid: $t('detective.creditCard.paymentStatusOptions.unpaid'),
    partial: $t('detective.creditCard.paymentStatusOptions.partial'),
    paid: $t('detective.creditCard.paymentStatusOptions.paid'),
  };
  return textMap[status || ''] || status || '-';
};

const handleCardClick = (card: CreditCardSummary) => {
  const cardLast4 = card.card_last4 || 'null';
  router.push(`/detective/credit-card/${card.bank_code}/${cardLast4}/bills`);
};

// 邮件导入
const emailImportModalVisible = ref(false);
const uploading = ref(false);

// 邮箱收取
const fetching = ref(false);
const fetchMonthsOptions = [
  { label: $t('detective.creditCard.fetchMonths.3'), value: 3 },
  { label: $t('detective.creditCard.fetchMonths.6'), value: 6 },
  { label: $t('detective.creditCard.fetchMonths.12'), value: 12 },
  { label: $t('detective.creditCard.fetchMonths.24'), value: 24 },
];

const handleFetchFromEmail = async (months: number) => {
  fetching.value = true;
  try {
    const res = await fetchEmailBillsApi(months);
    message.success(res.message || $t('detective.creditCard.fetchStarted'));
    setTimeout(() => fetchData(), 3000);
  } catch (error: any) {
    if (error?.response?.status === 403) {
      message.error($t('detective.creditCard.fetchConfigError'));
    } else {
      message.error($t('detective.creditCard.fetchFailed'));
    }
  } finally {
    fetching.value = false;
  }
};

const handleEmailImport = async (options: any) => {
  const { file } = options;
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    await parseEmailBillApi(formData);
    message.success($t('detective.creditCard.importSuccess'));
    emailImportModalVisible.value = false;
    fetchData();
  } catch {
    message.error($t('detective.creditCard.importFailed'));
  } finally {
    uploading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.creditCard.title')">
    <div class="mb-4 flex items-center justify-between">
      <Space>
        <Button @click="fetchData">
          <template #icon><ReloadOutlined /></template>
          {{ $t('common.refresh') }}
        </Button>
      </Space>
      <Space>
        <Dropdown :disabled="fetching">
          <Button :loading="fetching">
            <MailOutlined />
            {{ $t('detective.creditCard.fetchFromEmail') }}
            <DownOutlined />
          </Button>
          <template #overlay>
            <Menu>
              <MenuItem
                v-for="opt in fetchMonthsOptions"
                :key="opt.value"
                @click="handleFetchFromEmail(opt.value)"
              >
                {{ opt.label }}
              </MenuItem>
            </Menu>
          </template>
        </Dropdown>
        <Button type="primary" @click="emailImportModalVisible = true">
          <template #icon><MailOutlined /></template>
          {{ $t('detective.creditCard.import') }}
        </Button>
      </Space>
    </div>

    <Spin :spinning="loading">
      <Empty
        v-if="!loading && dataSource.length === 0"
        :description="$t('detective.creditCard.noCard')"
      >
        <template #image>
          <CreditCardOutlined style="font-size: 64px; color: #d9d9d9" />
        </template>
        <p class="text-gray-400">{{ $t('detective.creditCard.noCardHint') }}</p>
      </Empty>

      <Row v-else :gutter="[16, 16]">
        <Col
          v-for="card in dataSource"
          :key="card.card_id"
          :xs="24"
          :sm="12"
          :lg="8"
          :xl="6"
        >
          <Card
            hoverable
            class="credit-card-item"
            @click="handleCardClick(card)"
          >
            <template #title>
              <Space>
                <CreditCardOutlined />
                <span>{{ card.bank_name }}</span>
              </Space>
            </template>
            <template #extra>
              <Tag
                v-if="card.latest_bill"
                :color="getPaymentStatusColor(card.latest_bill.payment_status)"
              >
                {{ getPaymentStatusText(card.latest_bill.payment_status) }}
              </Tag>
            </template>

            <div class="card-number text-gray-500">
              **** **** **** {{ card.card_last4 || '****' }}
            </div>

            <div class="mt-4 space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-500">{{
                  $t('detective.creditCard.creditLimit')
                }}</span>
                <span class="font-medium">{{
                  formatAmount(card.credit_limit)
                }}</span>
              </div>

              <template v-if="card.latest_bill">
                <div class="flex justify-between">
                  <span class="text-gray-500">{{
                    $t('detective.creditCard.latestBill')
                  }}</span>
                  <span class="font-medium text-red-500">{{
                    formatAmount(card.latest_bill.bill_amount)
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">{{
                    $t('detective.creditCard.billDate')
                  }}</span>
                  <span>{{ formatDate(card.latest_bill.bill_date) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">{{
                    $t('detective.creditCard.dueDate')
                  }}</span>
                  <span>{{ formatDate(card.latest_bill.due_date) }}</span>
                </div>
              </template>
              <div v-else class="text-center text-gray-400">
                {{ $t('detective.creditCard.noBill') }}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Spin>

    <!-- 邮件导入弹窗 -->
    <Modal
      v-model:open="emailImportModalVisible"
      :title="$t('detective.creditCard.import')"
      :footer="null"
    >
      <div class="py-4">
        <Upload
          :custom-request="handleEmailImport"
          :show-upload-list="false"
          accept=".eml"
        >
          <Button type="primary" :loading="uploading" block>
            <template #icon><MailOutlined /></template>
            {{ $t('detective.creditCard.selectEmlFile') }}
          </Button>
        </Upload>
        <p class="mt-2 text-center text-gray-400">
          {{ $t('detective.creditCard.importTip') }}
        </p>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.credit-card-item {
  cursor: pointer;
  transition: all 0.3s;
}

.credit-card-item:hover {
  box-shadow:
    0 4px 12px rgb(0 0 0 / 10%),
    0 2px 4px rgb(0 0 0 / 6%);
  transform: translateY(-4px);
}

.card-number {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  letter-spacing: 2px;
}
</style>
