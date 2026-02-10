<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { Category, CreateCategoryParams } from '#/plugins/detective/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import { message, Popconfirm } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  CategoryType,
  createCategoryApi,
  deleteCategoryApi,
  getCategoryTreeApi,
  updateCategoryApi,
} from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveCategoryList' });

const formOptions: VbenFormProps = {
  // 搜索表单配置
  collapsed: false,
  schema: [],
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
  resetButtonOptions: { content: '重置' },
};

const gridOptions: VxeGridProps<Category> = {
  columns: [
    { title: '分类名称', field: 'name', treeNode: true, minWidth: 200 },
    {
      title: '类型',
      field: 'type',
      width: 100,
      formatter: ({ cellValue }) => {
        return cellValue === CategoryType.Expense ? '支出' : '收入';
      },
    },
    { title: '图标', field: 'icon', width: 100 },
    { title: '排序', field: 'sort_order', width: 100 },
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
  treeConfig: {
    transform: false, // data is already tree
    rowField: 'id',
    parentField: 'parent_id',
    childrenField: 'children',
  },
  pagerConfig: {
    enabled: false,
  },
  proxyConfig: {
    ajax: {
      query: async () => {
        return await getCategoryTreeApi();
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// Modal Form Schema
const modalFormSchema = [
  {
    fieldName: 'name',
    label: '分类名称',
    component: 'Input',
    rules: 'required',
  },
  {
    fieldName: 'type',
    label: '类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '支出', value: CategoryType.Expense },
        { label: '收入', value: CategoryType.Income },
      ],
    },
    rules: 'required',
  },
  {
    fieldName: 'parent_id',
    label: '父分类',
    component: 'TreeSelect', // 需要处理 TreeSelect 数据源，简单起见先用 InputNumber 或者 Select
    componentProps: {
      // 实际项目中这里需要动态获取分类树作为选项
      placeholder: '顶级分类留空',
      allowClear: true,
    },
  },
  {
    fieldName: 'icon',
    label: '图标',
    component: 'Input',
  },
  {
    fieldName: 'sort_order',
    label: '排序',
    component: 'InputNumber',
    defaultValue: 0,
  },
];

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: modalFormSchema,
});

const currentId = ref<null | number>(null);
const modalTitle = computed(() => (currentId.value ? '编辑分类' : '新增分类'));

const [Modal, modalApi] = useVbenModal({
  onConfirm: async () => {
    const { valid } = await formApi.validate();
    if (!valid) return;

    modalApi.setState({ confirmLoading: true });
    try {
      const values = await formApi.getValues();
      if (currentId.value) {
        await updateCategoryApi(currentId.value, values);
        message.success('更新成功');
      } else {
        await createCategoryApi(values as CreateCategoryParams);
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

function handleEdit(row: Category) {
  currentId.value = row.id;
  formApi.setValues(row);
  modalApi.open();
}

async function handleDelete(row: Category) {
  try {
    await deleteCategoryApi(row.id);
    message.success('删除成功');
    gridApi.query();
  } catch {
    //
  }
}
</script>

<template>
  <Page title="分类管理">
    <template #extra>
      <VbenButton type="primary" @click="handleAdd">
        <template #icon><PlusOutlined /></template>
        新增分类
      </VbenButton>
    </template>

    <Grid>
      <template #action="{ row }">
        <VbenButton type="link" size="small" @click="handleEdit(row)">
          <template #icon><EditOutlined /></template>
          编辑
        </VbenButton>
        <Popconfirm title="确认删除该分类？" @confirm="handleDelete(row)">
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
