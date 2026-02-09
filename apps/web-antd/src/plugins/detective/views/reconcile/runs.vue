<script setup lang="ts">
import type { ReconcileRun } from '#/plugins/detective/api';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  DatePicker,
  message,
  Modal,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  getReconcileRunProgressApi,
  getReconcileRunsApi,
  runReconcileApi,
} from '#/plugins/detective/api';

const router = useRouter();
const loading = ref(false);
const dataSource = ref<ReconcileRun[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
});

const runModalVisible = ref(false);
const running = ref(false);
const runForm = reactive({
  statement_month: '',
});

const runStatusOptions = computed(() => [
  {
    label: $t('detective.reconcile.runStatusOptions.pending'),
    value: 'pending',
    color: 'default',
  },
  {
    label: $t('detective.reconcile.runStatusOptions.running'),
    value: 'running',
    color: 'processing',
  },
  {
    label: $t('detective.reconcile.runStatusOptions.success'),
    value: 'success',
    color: 'success',
  },
  {
    label: $t('detective.reconcile.runStatusOptions.failed'),
    value: 'failed',
    color: 'error',
  },
]);

const columns = computed(() => [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: $t('detective.reconcile.statementMonth'),
    dataIndex: 'statement_month',
    key: 'statement_month',
    width: 120,
  },
  {
    title: $t('detective.reconcile.status'),
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: $t('detective.reconcile.matchedCount'),
    dataIndex: 'matched_count',
    key: 'matched_count',
    width: 100,
  },
  {
    title: $t('detective.reconcile.autoConfirmedCount'),
    dataIndex: 'auto_confirmed',
    key: 'auto_confirmed',
    width: 100,
  },
  {
    title: $t('detective.reconcile.pendingCount'),
    dataIndex: 'pending',
    key: 'pending',
    width: 100,
  },
  {
    title: $t('detective.reconcile.totalPayment'),
    dataIndex: 'total_payment',
    key: 'total_payment',
    width: 100,
  },
  {
    title: $t('detective.reconcile.totalDebit'),
    dataIndex: 'total_debit',
    key: 'total_debit',
    width: 100,
  },
  {
    title: $t('detective.reconcile.createdTime'),
    dataIndex: 'created_time',
    key: 'created_time',
    width: 180,
  },
  {
    title: $t('detective.reconcile.finishedTime'),
    dataIndex: 'finished_time',
    key: 'finished_time',
    width: 180,
  },
  {
    title: $t('common.action'),
    key: 'action',
    width: 100,
    fixed: 'right' as const,
  },
]);

const getStatusOption = (status: string) => {
  return (
    runStatusOptions.value.find((o) => o.value === status) ||
    runStatusOptions.value[0]
  );
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.current,
      size: pagination.pageSize,
    };
    const res = await getReconcileRunsApi(params);
    dataSource.value = res.items || [];
    pagination.total = res.total || 0;
  } catch (error) {
    console.error('Failed to fetch reconcile runs:', error);
  } finally {
    loading.value = false;
  }
};

const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchData();
};

const handleRunReconcile = async () => {
  if (!runForm.statement_month) {
    message.warning('请选择账期');
    return;
  }
  running.value = true;
  try {
    const run = await runReconcileApi(runForm.statement_month);
    message.success('对账任务已启动');
    runModalVisible.value = false;
    // 轮询进度
    pollRunProgress(run.id);
    fetchData();
  } catch {
    message.error('启动对账失败');
  } finally {
    running.value = false;
  }
};

const pollRunProgress = async (runId: number) => {
  const poll = async () => {
    try {
      const progress = await getReconcileRunProgressApi(runId);
      if (progress.status === 'running') {
        setTimeout(poll, 2000);
      } else {
        fetchData();
        if (progress.status === 'success') {
          message.success('对账完成');
        } else if (progress.status === 'failed') {
          message.error('对账失败');
        }
      }
    } catch (error) {
      console.error('Failed to poll progress:', error);
    }
  };
  poll();
};

const handleRowClick = (record: ReconcileRun) => {
  router.push(`/detective/reconcile/runs/${record.id}`);
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.reconcile.runs')">
    <div class="mb-4 flex items-center justify-between">
      <Space>
        <Button @click="fetchData">
          <template #icon><ReloadOutlined /></template>
          {{ $t('common.refresh') }}
        </Button>
      </Space>
      <Button type="primary" @click="runModalVisible = true">
        <template #icon><PlayCircleOutlined /></template>
        {{ $t('detective.reconcile.runReconcile') }}
      </Button>
    </div>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 1100 }"
      row-key="id"
      :custom-row="
        (record: ReconcileRun) => ({
          onClick: () => handleRowClick(record),
          style: 'cursor: pointer',
        })
      "
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <Tag :color="getStatusOption(record.status)?.color">
            {{ getStatusOption(record.status)?.label }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'matched_count'">
          {{ record.matched_count ?? '-' }}
        </template>
        <template v-else-if="column.key === 'auto_confirmed'">
          {{ record.auto_confirmed ?? '-' }}
        </template>
        <template v-else-if="column.key === 'pending'">
          {{ record.pending ?? '-' }}
        </template>
        <template v-else-if="column.key === 'total_payment'">
          {{ record.total_payment ?? '-' }}
        </template>
        <template v-else-if="column.key === 'total_debit'">
          {{ record.total_debit ?? '-' }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            type="link"
            size="small"
            @click.stop="handleRowClick(record as ReconcileRun)"
          >
            <template #icon><EyeOutlined /></template>
            {{ $t('common.detail') }}
          </Button>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="runModalVisible"
      :title="$t('detective.reconcile.runReconcile')"
      :confirm-loading="running"
      @ok="handleRunReconcile"
    >
      <div class="py-4">
        <label class="mb-2 block">{{
          $t('detective.reconcile.statementMonth')
        }}</label>
        <DatePicker
          v-model:value="runForm.statement_month"
          picker="month"
          format="YYYY-MM"
          value-format="YYYY-MM"
          style="width: 100%"
        />
      </div>
    </Modal>
  </Page>
</template>
