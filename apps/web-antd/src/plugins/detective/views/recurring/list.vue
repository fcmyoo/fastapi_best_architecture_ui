<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  CreateRecurringParams,
  RecurringTransaction,
} from '#/plugins/detective/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import { message, Popconfirm, Switch } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createRecurringTransactionApi,
  deleteRecurringTransactionApi,
  FrequencyType,
  getRecurringTransactionsApi,
  RecurringType,
  updateRecurringTransactionApi,
} from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveRecurringList' });

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [],
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
  resetButtonOptions: { content: '重置' },
};

const gridOptions: VxeGridProps<RecurringTransaction> = {
  columns: [
    { title: '名称', field: 'name', minWidth: 150 },
    {
      title: '类型',
      field: 'type',
      width: 100,
      formatter: ({ cellValue }) => {
        const map: Record<string, string> = {
          [RecurringType.Expense]: '支出',
          [RecurringType.Income]: '收入',
          [RecurringType.Transfer]: '转账',
        };
        return map[cellValue] || cellValue;
      },
    },
    { title: '金额', field: 'amount', minWidth: 100 },
    {
      title: '频率',
      field: 'frequency',
      minWidth: 100,
      formatter: ({ cellValue }) => {
        const map: Record<string, string> = {
          [FrequencyType.Daily]: '每日',
          [FrequencyType.Weekly]: '每周',
          [FrequencyType.Monthly]: '每月',
          [FrequencyType.Yearly]: '每年',
        };
        return map[cellValue] || cellValue;
      },
    },
    { title: '下次运行', field: 'next_run_date', minWidth: 120 },
    {
      title: '启用',
      field: 'is_active',
      width: 100,
      slots: { default: 'active' },
    },
    {
      title: '操作',
      field: 'action',
      fixed: 'right',
      width: 140,
      slots: { default: 'action' },
    },
  ],
  toolbarConfig: {
    custom: true,
    refresh: true,
  },
  height: 'auto',
  proxyConfig: {
    ajax: {
      query: async () => {
        return await getRecurringTransactionsApi();
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// Modal Form Schema
const modalFormSchema = [
  {
    fieldName: 'name',
    label: '名称',
    component: 'Input',
    rules: 'required',
  },
  {
    fieldName: 'type',
    label: '类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '支出', value: RecurringType.Expense },
        { label: '收入', value: RecurringType.Income },
        { label: '转账', value: RecurringType.Transfer },
      ],
    },
    rules: 'required',
  },
  {
    fieldName: 'amount',
    label: '金额',
    component: 'InputNumber',
    componentProps: {
      precision: 2,
      class: 'w-full',
    },
    rules: 'required',
  },
  {
    fieldName: 'frequency',
    label: '频率',
    component: 'Select',
    componentProps: {
      options: [
        { label: '每日', value: FrequencyType.Daily },
        { label: '每周', value: FrequencyType.Weekly },
        { label: '每月', value: FrequencyType.Monthly },
        { label: '每年', value: FrequencyType.Yearly },
      ],
    },
    rules: 'required',
  },
  {
    fieldName: 'interval',
    label: '间隔',
    component: 'InputNumber',
    defaultValue: 1,
    help: '例如：每 2 个月',
  },
  {
    fieldName: 'start_date',
    label: '开始日期',
    component: 'DatePicker', // Simple input for now or date picker component string
    componentProps: {
      valueFormat: 'YYYY-MM-DD',
      class: 'w-full',
    },
    rules: 'required',
  },
  {
    fieldName: 'description',
    label: '描述',
    component: 'Textarea',
  },
];

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: modalFormSchema,
});

const currentId = ref<null | number>(null);
const modalTitle = computed(() =>
  currentId.value ? '编辑周期交易' : '新增周期交易',
);

const [Modal, modalApi] = useVbenModal({
  onConfirm: async () => {
    const { valid } = await formApi.validate();
    if (!valid) return;

    modalApi.setState({ confirmLoading: true });
    try {
      const values = await formApi.getValues();
      if (currentId.value) {
        await updateRecurringTransactionApi(currentId.value, values);
        message.success('更新成功');
      } else {
        await createRecurringTransactionApi(values as CreateRecurringParams);
        message.success('创建成功');
      }
      modalApi.close();
      gridApi.query();
    } catch {
      //
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
});

function handleAdd() {
  currentId.value = null;
  formApi.resetForm();
  modalApi.open();
}

function handleEdit(row: RecurringTransaction) {
  currentId.value = row.id;
  formApi.setValues(row);
  modalApi.open();
}

async function handleDelete(row: RecurringTransaction) {
  try {
    await deleteRecurringTransactionApi(row.id);
    message.success('删除成功');
    gridApi.query();
  } catch {
    //
  }
}

async function handleActiveChange(row: RecurringTransaction) {
  try {
    await updateRecurringTransactionApi(row.id, { is_active: !row.is_active });
    message.success('状态更新成功');
    gridApi.reload(); // Refresh to ensure sync
  } catch {
    // Revert switch if failed? VxeTable handles data binding but ideally we reload.
  }
}
</script>

<template>
  <Page title="周期交易">
    <template #extra>
      <VbenButton type="primary" @click="handleAdd">
        <template #icon><PlusOutlined /></template>
        新增交易
      </VbenButton>
    </template>

    <Grid>
      <template #active="{ row }">
        <Switch
          :checked="row.is_active"
          @click="() => handleActiveChange(row)"
          size="small"
        />
      </template>
      <template #action="{ row }">
        <VbenButton type="link" size="small" @click="handleEdit(row)">
          <template #icon><EditOutlined /></template>
          编辑
        </VbenButton>
        <Popconfirm title="确认删除该交易？" @confirm="handleDelete(row)">
          <VbenButton type="link" danger size="small">
            <template #icon><DeleteOutlined /></template>
            删除
          </VbenButton>
        </Popconfirm>
      </template>
    </Grid>

    <Modal :title="modalTitle">
      <Form />
    </Modal>
  </Page>
</template>
