<script setup lang="ts">
import type { BillDetailItem, MatchCandidate } from '#/plugins/detective/api';

import { ref, watch } from 'vue';

import { CloseOutlined, LinkOutlined, SwapOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

import { $t } from '#/locales';
import { getMatchCandidatesApi, manualMatchApi } from '#/plugins/detective/api';

import CandidateList from './CandidateList.vue';
import MatchForm from './MatchForm.vue';
import MatchPreview from './MatchPreview.vue';

const props = defineProps<{
  open: boolean;
  transaction: BillDetailItem | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}>();

// 状态
const loading = ref(false);
const candidatesLoading = ref(false);
const candidates = ref<MatchCandidate[]>([]);
const selectedCandidate = ref<MatchCandidate | null>(null);

// 获取匹配候选
const fetchCandidates = async () => {
  if (!props.transaction) return;
  candidatesLoading.value = true;
  selectedCandidate.value = null;
  try {
    const res = await getMatchCandidatesApi(props.transaction.id, true);
    candidates.value = res.candidates || [];
  } catch (error) {
    console.error('Failed to fetch candidates:', error);
    candidates.value = [];
  } finally {
    candidatesLoading.value = false;
  }
};

// 执行匹配
const handleMatch = async () => {
  if (!props.transaction || !selectedCandidate.value) return;

  loading.value = true;
  try {
    await manualMatchApi({
      payment_tx_id: props.transaction.id,
      debit_tx_id: selectedCandidate.value.transaction.id,
    });
    message.success($t('detective.reconcile.matchSuccess'));
    emit('success');
    handleClose();
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404) {
      message.error($t('detective.reconcile.txNotFound'));
    } else if (status === 403) {
      message.error($t('detective.reconcile.noPermission'));
    } else {
      message.error($t('detective.reconcile.matchFailed'));
    }
  } finally {
    loading.value = false;
  }
};

// 关闭弹窗
const handleClose = () => {
  emit('update:open', false);
  selectedCandidate.value = null;
  candidates.value = [];
};

// 监听弹窗打开
watch(
  () => props.open,
  (newVal) => {
    if (newVal && props.transaction) {
      fetchCandidates();
    }
  },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[1000] flex items-center justify-center"
      >
        <!-- 遮罩层 -->
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="handleClose"
        ></div>

        <!-- 弹窗主体 -->
        <div
          class="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-50 to-white shadow-2xl"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b border-gray-100 bg-white/80 px-8 py-5 backdrop-blur"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200"
              >
                <LinkOutlined class="text-xl text-white" />
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-800">手动匹配交易</h2>
                <p
                  class="text-[11px] font-semibold uppercase tracking-widest text-gray-400"
                >
                  Manual Transaction Matching
                </p>
              </div>
            </div>
            <button
              class="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600"
              @click="handleClose"
            >
              <CloseOutlined class="text-lg" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-8">
            <div class="compare-grid">
              <!-- 左侧：当前交易 -->
              <MatchForm :transaction="transaction" />

              <!-- 中间连接器 -->
              <div class="connector-area">
                <div class="connector-line"></div>
                <div class="connector-badge">
                  <SwapOutlined class="text-indigo-500" />
                </div>
              </div>

              <!-- 右侧：匹配候选 -->
              <CandidateList
                v-model:selectedCandidate="selectedCandidate"
                :candidates="candidates"
                :loading="candidatesLoading"
              />
            </div>
          </div>

          <!-- Footer：匹配预览 -->
          <MatchPreview
            :transaction="transaction"
            :selected-candidate="selectedCandidate"
            :loading="loading"
            @cancel="handleClose"
            @match="handleMatch"
          />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .relative {
    transform: scale(0.95) translateY(20px);
  }
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 60px 1fr;
  gap: 0;
  align-items: stretch;
  min-height: 500px;
}

.connector-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .connector-line {
    position: absolute;
    top: 50%;
    right: -24px;
    left: -24px;
    height: 2px;
    background: repeating-linear-gradient(
      to right,
      #e5e7eb,
      #e5e7eb 6px,
      transparent 6px,
      transparent 12px
    );
  }

  .connector-badge {
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    font-size: 18px;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
  }
}
</style>