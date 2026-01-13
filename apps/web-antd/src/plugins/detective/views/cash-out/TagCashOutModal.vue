<script setup lang="ts">
import type {
  CashOutMerchant,
  CreateMerchantParam,
  Transaction,
} from '#/plugins/detective/api';

import { computed, ref, watch } from 'vue';

import { PlusOutlined } from '@ant-design/icons-vue';
import {
  Checkbox,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
  Spin,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  getMerchantsApi,
  linkMerchantApi,
  tagCashOutApi,
  untagCashOutApi,
} from '#/plugins/detective/api';

const props = defineProps<{
  open: boolean;
  transaction: null | Transaction;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}>();

const loading = ref(false);
const merchants = ref<CashOutMerchant[]>([]);
const merchantsLoading = ref(false);

// 选择模式: existing=选择已有商户, new=创建新商户
const selectMode = ref<'existing' | 'new'>('existing');
const selectedMerchantId = ref<null | number>(null);
const newMerchant = ref<CreateMerchantParam>({
  name: '',
  fee_rate: 0,
  note: '',
});
const tagSimilar = ref(true);

// 是否是套现交易
const isCashOutTx = computed(() => {
  return (
    props.transaction?.category === 'cash_advance' ||
    props.transaction?.category === 'cash_advance_income'
  );
});

// 弹窗标题
const modalTitle = computed(() => {
  if (isCashOutTx.value) {
    return $t('detective.cashOut.untagTitle');
  }
  return props.transaction?.direction === 'income'
    ? $t('detective.cashOut.linkTitle')
    : $t('detective.cashOut.tagTitle');
});

// 加载商户列表
const loadMerchants = async () => {
  merchantsLoading.value = true;
  try {
    merchants.value = await getMerchantsApi({ is_active: true });
    // 默认选中第一个
    if (merchants.value.length > 0 && !selectedMerchantId.value) {
      selectedMerchantId.value = merchants.value[0]!.id;
    }
  } catch (error) {
    console.error('Failed to load merchants:', error);
  } finally {
    merchantsLoading.value = false;
  }
};

// 监听弹窗打开
watch(
  () => props.open,
  (val) => {
    if (val) {
      loadMerchants();
      // 预填充商户名
      if (props.transaction?.merchant_raw) {
        newMerchant.value.name = props.transaction.merchant_raw;
      }
    } else {
      // 重置状态
      selectMode.value = 'existing';
      selectedMerchantId.value = null;
      newMerchant.value = { name: '', fee_rate: 0, note: '' };
      tagSimilar.value = true;
    }
  },
);

// 格式化金额
const formatAmount = (amount: number | string, direction: string) => {
  const prefix = direction === 'expense' ? '-' : '+';
  return `${prefix}¥${Number(amount).toFixed(2)}`;
};

// 确认操作
const handleOk = async () => {
  if (!props.transaction) return;

  loading.value = true;
  try {
    if (isCashOutTx.value) {
      // 取消标注
      await untagCashOutApi(props.transaction.id);
      message.success($t('detective.cashOut.untagSuccess'));
    } else if (props.transaction.direction === 'income') {
      // 储蓄卡收入 - 关联商户
      if (!selectedMerchantId.value) {
        message.warning($t('detective.cashOut.selectMerchantHint'));
        loading.value = false;
        return;
      }
      const res = await linkMerchantApi(props.transaction.id, {
        merchant_id: selectedMerchantId.value,
      });
      message.success(
        $t('detective.cashOut.tagSuccess', {
          count: res.similar_updated_count,
        }),
      );
    } else {
      // 信用卡/支出 - 标注套现
      if (selectMode.value === 'existing') {
        if (!selectedMerchantId.value) {
          message.warning($t('detective.cashOut.selectMerchantHint'));
          loading.value = false;
          return;
        }
        const res = await tagCashOutApi(props.transaction.id, {
          merchant_id: selectedMerchantId.value,
        });
        message.success(
          $t('detective.cashOut.tagSuccess', {
            count: res.similar_updated_count,
          }),
        );
      } else {
        if (!newMerchant.value.name) {
          message.warning($t('detective.cashOut.merchantNameRequired'));
          loading.value = false;
          return;
        }
        const res = await tagCashOutApi(props.transaction.id, {
          new_merchant: newMerchant.value,
        });
        message.success(
          $t('detective.cashOut.tagSuccess', {
            count: res.similar_updated_count,
          }),
        );
      }
    }

    emit('update:open', false);
    emit('success');
  } catch (error) {
    console.error('Failed to tag cash out:', error);
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit('update:open', false);
};
</script>

<template>
  <Modal
    :open="open"
    :title="modalTitle"
    :confirm-loading="loading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <!-- 交易信息 -->
    <Descriptions :column="1" size="small" bordered class="mb-4">
      <Descriptions.Item :label="$t('detective.transaction.transactionTime')">
        {{ transaction?.transaction_time }}
      </Descriptions.Item>
      <Descriptions.Item :label="$t('detective.transaction.amount')">
        <span
          :class="
            transaction?.direction === 'expense'
              ? 'text-red-500'
              : 'text-green-500'
          "
        >
          {{
            formatAmount(
              transaction?.amount || 0,
              transaction?.direction || 'expense',
            )
          }}
        </span>
      </Descriptions.Item>
      <Descriptions.Item :label="$t('detective.transaction.merchant')">
        {{ transaction?.merchant_raw }}
      </Descriptions.Item>
    </Descriptions>

    <!-- 取消标注确认 -->
    <template v-if="isCashOutTx">
      <div class="text-center text-gray-500">
        {{ $t('detective.cashOut.untagConfirm') }}
      </div>
    </template>

    <!-- 选择商户 -->
    <template v-else>
      <Spin :spinning="merchantsLoading">
        <div class="mb-2 font-medium">
          {{ $t('detective.cashOut.selectMerchant') }}
        </div>

        <Radio.Group v-model:value="selectMode" class="mb-3 w-full">
          <Space direction="vertical" class="w-full">
            <!-- 已有商户列表 -->
            <Radio value="existing" class="w-full">
              <span>{{ $t('detective.cashOut.existingMerchant') }}</span>
            </Radio>
            <div v-if="selectMode === 'existing'" class="ml-6">
              <Radio.Group v-model:value="selectedMerchantId" class="w-full">
                <Space direction="vertical" class="w-full">
                  <Radio
                    v-for="merchant in merchants"
                    :key="merchant.id"
                    :value="merchant.id"
                    class="w-full"
                  >
                    <span>{{ merchant.name }}</span>
                    <Tag class="ml-2" color="blue">
                      {{ (parseFloat(merchant.fee_rate) * 100).toFixed(2) }}%
                    </Tag>
                    <span class="text-xs text-gray-400">
                      ({{ merchant.accounts.length
                      }}{{ $t('detective.cashOut.accountUnit') }})
                    </span>
                  </Radio>
                </Space>
              </Radio.Group>
              <div
                v-if="merchants.length === 0"
                class="py-4 text-center text-gray-400"
              >
                {{ $t('detective.cashOut.noMerchant') }}
              </div>
            </div>

            <!-- 新建商户 -->
            <Radio value="new">
              <PlusOutlined />
              <span class="ml-1">{{
                $t('detective.cashOut.newMerchant')
              }}</span>
            </Radio>
            <div v-if="selectMode === 'new'" class="ml-6">
              <Form layout="vertical" size="small">
                <Form.Item
                  :label="$t('detective.cashOut.merchantName')"
                  required
                >
                  <Input v-model:value="newMerchant.name" />
                </Form.Item>
                <Form.Item :label="$t('detective.cashOut.feeRate')">
                  <InputNumber
                    v-model:value="newMerchant.fee_rate"
                    :min="0"
                    :max="1"
                    :step="0.001"
                    :precision="4"
                    style="width: 100%"
                  >
                    <template #addonAfter>
                      {{ (newMerchant.fee_rate * 100).toFixed(2) }}%
                    </template>
                  </InputNumber>
                </Form.Item>
                <Form.Item :label="$t('detective.cashOut.note')">
                  <Input v-model:value="newMerchant.note" />
                </Form.Item>
              </Form>
            </div>
          </Space>
        </Radio.Group>

        <!-- 同时标注相似交易 -->
        <div class="mt-4 border-t pt-3">
          <Checkbox v-model:checked="tagSimilar">
            {{ $t('detective.cashOut.tagSimilar') }}
          </Checkbox>
        </div>
      </Spin>
    </template>
  </Modal>
</template>
