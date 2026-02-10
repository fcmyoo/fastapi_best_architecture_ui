<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { Account, CreateAccountParams } from '#/plugins/detective/api';

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
  AccountType,
  createAccountApi,
  deleteAccountApi,
  getAccountsApi,
  updateAccountApi,
} from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveAccountList' });

const formOptions: VbenFormProps = {
  // 搜索表单配置
  collapsed: false,
  schema: [
    {
      fieldName: 'name',
      label: '账户名称',
      component: 'Input',
    },
    {
      fieldName: 'type',
      label: '账户类型',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部', value: undefined },
          { label: '现金', value: AccountType.Cash },
          { label: '借记卡', value: AccountType.DebitCard },
          { label: '信用卡', value: AccountType.CreditCard },
          { label: '支付宝', value: AccountType.Alipay },
          { label: '微信', value: AccountType.Wechat },
          { label: '其他', value: AccountType.Other },
        ],
      },
    },
  ],
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
  resetButtonOptions: { content: '重置' },
};

const gridOptions: VxeGridProps<Account> = {
  columns: [
    { title: '账户名称', field: 'name', minWidth: 150 },
    {
      title: '类型',
      field: 'type',
      width: 100,
      formatter: ({ cellValue }) => {
        const map: Record<string, string> = {
          [AccountType.Cash]: '现金',
          [AccountType.DebitCard]: '借记卡',
          [AccountType.CreditCard]: '信用卡',
          [AccountType.Alipay]: '支付宝',
          [AccountType.Wechat]: '微信',
          [AccountType.Other]: '其他',
        };
        return map[cellValue] || cellValue;
      },
    },
    { title: '余额', field: 'balance', minWidth: 100 },
    { title: '信用额度', field: 'credit_limit', minWidth: 100 },
    { title: '描述', field: 'description', minWidth: 150 },
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
  pagerConfig: {
    enabled: false, // 账户数量通常不多，不分页
  },
  proxyConfig: {
    ajax: {
      query: async (_params, formValues) => {
        return await getAccountsApi(formValues);
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// Modal Form Schema
const modalFormSchema = [
  {
    fieldName: 'name',
    label: '账户名称',
    component: 'Input',
    rules: 'required',
  },
  {
    fieldName: 'type',
    label: '账户类型',
    component: 'Select',
    componentProps: {
      options: [
        { label: '现金', value: AccountType.Cash },
        { label: '借记卡', value: AccountType.DebitCard },
        { label: '信用卡', value: AccountType.CreditCard },
        { label: '支付宝', value: AccountType.Alipay },
        { label: '微信', value: AccountType.Wechat },
        { label: '其他', value: AccountType.Other },
      ],
    },
    rules: 'required',
  },
  {
    fieldName: 'balance',
    label: '余额',
    component: 'InputNumber',
    componentProps: {
      precision: 2,
      class: 'w-full',
    },
    defaultValue: 0,
    rules: 'required',
  },
  {
    fieldName: 'credit_limit',
    label: '信用额度',
    component: 'InputNumber',
    componentProps: {
      precision: 2,
      class: 'w-full',
    },
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
const modalTitle = computed(() => (currentId.value ? '编辑账户' : '新增账户'));

const [Modal, modalApi] = useVbenModal({
  onConfirm: async () => {
    const { valid } = await formApi.validate();
    if (!valid) return;

    modalApi.setState({ confirmLoading: true });
    try {
      const values = await formApi.getValues();
      if (currentId.value) {
        await updateAccountApi(currentId.value, values);
        message.success('更新成功');
      } else {
        await createAccountApi(values as CreateAccountParams);
        message.success('创建成功');
      }
      modalApi.close();
      gridApi.query();
    } catch {
      // 错误处理由 request 拦截器统一处理，这里仅关闭 loading
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

function handleEdit(row: Account) {
  currentId.value = row.id;
  formApi.setValues(row);
  modalApi.open();
}

async function handleDelete(row: Account) {
  try {
    await deleteAccountApi(row.id);
    message.success('删除成功');
    gridApi.query();
  } catch {
    //
  }
}
</script>

<template>
  <Page title="账户管理">
    <template #extra>
      <VbenButton type="primary" @click="handleAdd">
        <template #icon><PlusOutlined /></template>
        新增账户
      </VbenButton>
    </template>

    <Grid>
      <template #action="{ row }">
        <VbenButton type="link" size="small" @click="handleEdit(row)">
          <template #icon><EditOutlined /></template>
          编辑
        </VbenButton>
        <Popconfirm title="确认删除该账户？" @confirm="handleDelete(row)">
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
