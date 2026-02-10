<script setup lang="ts">
import type { VbenFormProps } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';
import type { Reminder } from '#/plugins/detective/api';

import { Page, VbenButton } from '@vben/common-ui';

import { CheckOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { message, Popconfirm, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteReminderApi,
  getRemindersApi,
  markAllRemindersReadApi,
  markReminderReadApi,
} from '#/plugins/detective/api';

defineOptions({ name: 'DetectiveReminderList' });

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [],
  showCollapseButton: false,
  submitButtonOptions: { content: '查询' },
  resetButtonOptions: { content: '重置' },
};

const gridOptions: VxeGridProps<Reminder> = {
  columns: [
    { title: '标题', field: 'title', minWidth: 150 },
    { title: '消息', field: 'message', minWidth: 200 },
    { title: '提醒时间', field: 'remind_at', width: 160 },
    {
      title: '状态',
      field: 'is_read',
      width: 100,
      slots: { default: 'status' },
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
        return await getRemindersApi();
      },
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

async function handleMarkRead(row: Reminder) {
  try {
    await markReminderReadApi(row.id);
    message.success('已标记为已读');
    gridApi.reload();
  } catch {
    //
  }
}

async function handleMarkAllRead() {
  try {
    await markAllRemindersReadApi();
    message.success('全部已标记为已读');
    gridApi.reload();
  } catch {
    //
  }
}

async function handleDelete(row: Reminder) {
  try {
    await deleteReminderApi(row.id);
    message.success('删除成功');
    gridApi.reload();
  } catch {
    //
  }
}
</script>

<template>
  <Page title="提醒管理">
    <template #extra>
      <VbenButton @click="handleMarkAllRead">
        <template #icon><CheckOutlined /></template>
        全部已读
      </VbenButton>
    </template>

    <Grid>
      <template #status="{ row }">
        <Tag :color="row.is_read ? 'default' : 'red'">
          {{ row.is_read ? '已读' : '未读' }}
        </Tag>
      </template>
      <template #action="{ row }">
        <VbenButton
          v-if="!row.is_read"
          type="link"
          size="small"
          @click="handleMarkRead(row)"
        >
          <template #icon><CheckOutlined /></template>
          已读
        </VbenButton>
        <Popconfirm title="确认删除该提醒？" @confirm="handleDelete(row)">
          <VbenButton type="link" danger size="small">
            <template #icon><DeleteOutlined /></template>
            删除
          </VbenButton>
        </Popconfirm>
      </template>
    </Grid>
  </Page>
</template>
