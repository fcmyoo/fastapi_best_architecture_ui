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
  Dropdown,
  Empty,
  Menu,
  MenuItem,
  message,
  Modal,
  Space,
  Spin,
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

const getPaymentStatusText = (status: string | undefined) => {
  const textMap: Record<string, string> = {
    unpaid: $t('detective.creditCard.paymentStatusOptions.unpaid'),
    partial: $t('detective.creditCard.paymentStatusOptions.partial'),
    paid: $t('detective.creditCard.paymentStatusOptions.paid'),
  };
  return textMap[status || ''] || status || '-';
};

const handleCardClick = (card: CreditCardSummary) => {
  router.push({
    path: `/detective/credit-card/${card.card_id}/transactions`,
    query: {
      bankCode: card.bank_code,
      cardLast4: card.card_last4 || '',
      bankName: card.bank_name,
    },
  });
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
    <div class="mb-6 flex items-center justify-between">
      <Space>
        <Button @click="fetchData" class="!rounded-xl">
          <template #icon><ReloadOutlined /></template>
          {{ $t('common.refresh') }}
        </Button>
      </Space>
      <Space>
        <Dropdown :disabled="fetching">
          <Button :loading="fetching" class="!rounded-xl">
            <MailOutlined />
            {{ $t('detective.creditCard.fetchFromEmail') }}
            <DownOutlined />
          </Button>
          <template #overlay>
            <Menu class="!rounded-xl">
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
        <Button
          type="primary"
          @click="emailImportModalVisible = true"
          class="!rounded-xl shadow-lg shadow-blue-500/20"
        >
          <template #icon><MailOutlined /></template>
          {{ $t('detective.creditCard.import') }}
        </Button>
      </Space>
    </div>

    <Spin :spinning="loading">
      <Empty
        v-if="!loading && dataSource.length === 0"
        :description="$t('detective.creditCard.noCard')"
        class="py-20"
      >
        <template #image>
          <div
            class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-50"
          >
            <CreditCardOutlined class="text-4xl text-gray-300" />
          </div>
        </template>
        <p class="text-gray-400">{{ $t('detective.creditCard.noCardHint') }}</p>
      </Empty>

      <div
        v-else
        class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="card in dataSource"
          :key="card.card_id"
          class="group relative cursor-pointer overflow-hidden rounded-[24px] border border-white/60 bg-gradient-to-br from-white to-blue-50/30 p-6 shadow-lg shadow-blue-100/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200/50"
          @click="handleCardClick(card)"
        >
          <!-- Decoration Background -->
          <div
            class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-100/20 to-transparent blur-2xl transition-all duration-500 group-hover:bg-blue-200/30"
          ></div>

          <!-- Header -->
          <div class="relative z-10 mb-6 flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 shadow-sm ring-1 ring-indigo-100"
              >
                <CreditCardOutlined class="text-xl" />
              </div>
              <div>
                <h3 class="text-base font-bold text-gray-800">
                  {{ card.bank_name }}
                </h3>
                <p
                  class="text-[10px] font-bold uppercase tracking-widest text-gray-400"
                >
                  Credit Card
                </p>
              </div>
            </div>
            <div
              v-if="card.latest_bill"
              class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              :class="{
                'bg-rose-50 text-rose-600':
                  card.latest_bill.payment_status === 'unpaid',
                'bg-emerald-50 text-emerald-600':
                  card.latest_bill.payment_status === 'paid',
                'bg-amber-50 text-amber-600':
                  card.latest_bill.payment_status === 'partial',
              }"
            >
              {{ getPaymentStatusText(card.latest_bill.payment_status) }}
            </div>
          </div>

          <!-- Card Number -->
          <div class="relative z-10 mb-8">
            <div
              class="font-mono text-lg font-bold tracking-widest text-gray-700"
            >
              **** **** **** {{ card.card_last4 || '****' }}
            </div>
          </div>

          <!-- Footer Info -->
          <div class="relative z-10 grid grid-cols-2 gap-y-4">
            <div>
              <p
                class="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400"
              >
                {{ $t('detective.creditCard.creditLimit') }}
              </p>
              <p class="font-mono text-sm font-bold text-gray-700">
                {{ formatAmount(card.credit_limit) }}
              </p>
            </div>

            <div v-if="card.latest_bill">
              <p
                class="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400"
              >
                {{ $t('detective.creditCard.latestBill') }}
              </p>
              <p class="font-mono text-sm font-bold text-rose-600">
                {{ formatAmount(card.latest_bill.bill_amount) }}
              </p>
            </div>

            <div v-if="card.latest_bill">
              <p
                class="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400"
              >
                {{ $t('detective.creditCard.billDate') }}
              </p>
              <p class="font-mono text-xs font-medium text-gray-600">
                {{ formatDate(card.latest_bill.bill_date) }}
              </p>
            </div>

            <div v-if="card.latest_bill">
              <p
                class="mb-1 text-[9px] font-bold uppercase tracking-widest text-gray-400"
              >
                {{ $t('detective.creditCard.dueDate') }}
              </p>
              <p class="font-mono text-xs font-medium text-gray-600">
                {{ formatDate(card.latest_bill.due_date) }}
              </p>
            </div>

            <div v-else class="col-span-2 py-2">
              <p class="text-xs italic text-gray-400">
                {{ $t('detective.creditCard.noBill') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Spin>

    <!-- 邮件导入弹窗 -->
    <Modal
      v-model:open="emailImportModalVisible"
      :title="$t('detective.creditCard.import')"
      :footer="null"
      class="rounded-[24px]"
    >
      <div class="py-6">
        <Upload
          :custom-request="handleEmailImport"
          :show-upload-list="false"
          accept=".eml"
        >
          <div
            class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 transition-colors hover:border-indigo-400 hover:bg-indigo-50"
          >
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
            >
              <MailOutlined class="text-xl text-indigo-500" />
            </div>
            <p class="text-sm font-medium text-gray-600">
              {{ $t('detective.creditCard.selectEmlFile') }}
            </p>
          </div>
        </Upload>
        <p class="mt-4 text-center text-xs text-gray-400">
          {{ $t('detective.creditCard.importTip') }}
        </p>
      </div>
    </Modal>
  </Page>
</template>

<style scoped></style>
