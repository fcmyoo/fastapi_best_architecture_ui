<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { Budget, CreateBudgetParams } from '#/plugins/detective/api';

import { computed, ref } from 'vue';

function usedPercent(row: Budget) {
  return ((row.used_amount / row.amount) * 100).toFixed(0);
}

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import { message, Popconfirm, Progress } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  BudgetType,
  createBudgetApi,
  deleteBudgetApi,
  getBudgetsApi,
  updateBudgetApi,
} from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveBudgetList' });

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [],
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
  resetButtonOptions: { content: '重置' },
};

const gridOptions: VxeGridProps<Budget> = {
  columns: [
    { title: '预算名称', field: 'name', minWidth: 150 },
    {
      title: '类型',
      field: 'type',
      width: 100,
      formatter: ({ cellValue }) => {
        const map: Record<string, string> = {
          [BudgetType.Monthly]: '月度',
          [BudgetType.Yearly]: '年度',
          [BudgetType.Custom]: '自定义',
        };
        return map[cellValue] || cellValue;
      },
    },
    { title: '金额', field: 'amount', minWidth: 100 },
    { title: '已用', field: 'used', minWidth: 200, slots: { default: 'used' } },
    { title: '周期', field: 'period', minWidth: 100 },
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
        return await getBudgetsApi();
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// Modal Form Schema
const modalFormSchema = [
  {
    fieldName: 'name',
    label: '预算名称',
    component: 'Input',
    rules: 'required',
  },
  {
    fieldName: 'type',
    label: '类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '月度', value: BudgetType.Monthly },
        { label: '年度', value: BudgetType.Yearly },
        { label: '自定义', value: BudgetType.Custom },
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
    fieldName: 'period',
    label: '周期 (YYYY-MM)',
    component: 'Input', // 应该使用 DatePicker
    help: '例如 2023-10',
  },
];

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: modalFormSchema,
});

const currentId = ref<null | number>(null);
const modalTitle = computed(() => (currentId.value ? '编辑预算' : '新增预算'));

const [Modal, modalApi] = useVbenModal({
  onConfirm: async () => {
    const { valid } = await formApi.validate();
    if (!valid) return;

    modalApi.setState({ confirmLoading: true });
    try {
      const values = await formApi.getValues();
      if (currentId.value) {
        await updateBudgetApi(currentId.value, values);
        message.success('更新成功');
      } else {
        await createBudgetApi(values as CreateBudgetParams);
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

function handleEdit(row: Budget) {
  currentId.value = row.id;
  formApi.setValues(row);
  modalApi.open();
}

async function handleDelete(row: Budget) {
  try {
    await deleteBudgetApi(row.id);
    message.success('删除成功');
    gridApi.query();
  } catch {
    //
  }
}
</script>

<template>
  <Page title="预算管理">
    <template #extra>
      <VbenButton type="primary" @click="handleAdd">
        <template #icon><PlusOutlined /></template>
        新增预算
      </VbenButton>
    </template>

    <Grid>
      <template #used="{ row }">
        <div class="w-full">
          <div class="mb-1 flex justify-between text-xs">
            <span>{{ row.used_amount }}</span>
            <span>{{ usedPercent(row) }}%</span>
          </div>
          <Progress
            :percent="Math.min((row.used_amount / row.amount) * 100, 100)"
            :status="row.used_amount > row.amount ? 'exception' : 'active'"
            :show-info="false"
          />
        </div>
      </template>
      <template #action="{ row }">
        <VbenButton type="link" size="small" @click="handleEdit(row)">
          <template #icon><EditOutlined /></template>
          编辑
        </VbenButton>
        <Popconfirm title="确认删除该预算？" @confirm="handleDelete(row)">
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
