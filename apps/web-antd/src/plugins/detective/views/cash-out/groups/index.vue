<script setup lang="ts">
import type {
  CreateMerchantGroupParam,
  MerchantGroup,
} from '#/plugins/detective/api';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  DeleteOutlined,
  EditOutlined,
  FolderOpenOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Switch,
  Table,
} from 'ant-design-vue';

import { $t } from '#/locales';
import {
  createGroupApi,
  deleteGroupApi,
  getGroupsApi,
  updateGroupApi,
} from '#/plugins/detective/api';

const loading = ref(false);
const groups = ref<MerchantGroup[]>([]);

// 弹窗状态
const modalVisible = ref(false);
const editingGroup = ref<MerchantGroup | null>(null);
const form = ref<CreateMerchantGroupParam & { is_active?: boolean }>({
  name: '',
  note: '',
});

const isEdit = computed(() => !!editingGroup.value);
const modalTitle = computed(() =>
  isEdit.value
    ? $t('detective.merchantGroup.editGroup')
    : $t('detective.merchantGroup.addGroup'),
);

// 表格列定义
const columns = computed(() => [
  {
    dataIndex: 'name',
    key: 'name',
    title: $t('detective.merchantGroup.groupName'),
  },
  {
    align: 'center' as const,
    dataIndex: 'merchant_count',
    key: 'merchant_count',
    title: $t('detective.merchantGroup.merchantCount'),
    width: 100,
  },
  {
    dataIndex: 'note',
    ellipsis: true,
    key: 'note',
    title: $t('detective.merchantGroup.note'),
  },
  {
    dataIndex: 'is_active',
    key: 'is_active',
    title: $t('detective.merchantGroup.status'),
    width: 80,
  },
  {
    dataIndex: 'created_time',
    key: 'created_time',
    title: $t('detective.merchantGroup.createdTime'),
    width: 180,
  },
  {
    fixed: 'right' as const,
    key: 'action',
    title: $t('common.action'),
    width: 120,
  },
]);

// 加载数据
const fetchData = async () => {
  loading.value = true;
  try {
    groups.value = await getGroupsApi();
  } catch (error) {
    console.error('Failed to fetch groups:', error);
  } finally {
    loading.value = false;
  }
};

// 打开新增弹窗
const openAddModal = () => {
  editingGroup.value = null;
  form.value = { name: '', note: '' };
  modalVisible.value = true;
};

// 打开编辑弹窗
const openEditModal = (record: MerchantGroup) => {
  editingGroup.value = record;
  form.value = {
    is_active: record.is_active,
    name: record.name,
    note: record.note || '',
  };
  modalVisible.value = true;
};

// 保存
const handleSave = async () => {
  if (!form.value.name.trim()) {
    message.warning($t('detective.merchantGroup.nameRequired'));
    return;
  }
  try {
    if (isEdit.value && editingGroup.value) {
      await updateGroupApi(editingGroup.value.id, form.value);
      message.success($t('common.updateSuccess'));
    } else {
      await createGroupApi(form.value);
      message.success($t('common.createSuccess'));
    }
    modalVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('Failed to save group:', error);
  }
};

// 切换状态
const toggleStatus = async (record: MerchantGroup) => {
  try {
    await updateGroupApi(record.id, { is_active: !record.is_active });
    fetchData();
  } catch (error) {
    console.error('Failed to toggle status:', error);
  }
};

// 删除
const handleDelete = async (id: number) => {
  try {
    await deleteGroupApi(id);
    message.success($t('common.deleteSuccess'));
    fetchData();
  } catch (error) {
    console.error('Failed to delete group:', error);
  }
};

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page :title="$t('detective.merchantGroup.title')">
    <Spin :spinning="loading">
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>{{ $t('detective.merchantGroup.groupList') }}</span>
            <Button type="primary" @click="openAddModal">
              <template #icon><PlusOutlined /></template>
              {{ $t('detective.merchantGroup.addGroup') }}
            </Button>
          </div>
        </template>

        <Table
          v-if="groups.length > 0"
          :columns="columns"
          :data-source="groups"
          :pagination="false"
          :scroll="{ x: 700 }"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'is_active'">
              <Switch
                :checked="record.is_active"
                size="small"
                @change="toggleStatus(record as MerchantGroup)"
              />
            </template>
            <template v-else-if="column.key === 'note'">
              {{ record.note || '-' }}
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button
                  type="link"
                  size="small"
                  @click="openEditModal(record as MerchantGroup)"
                >
                  <template #icon><EditOutlined /></template>
                </Button>
                <Popconfirm
                  :title="$t('detective.merchantGroup.deleteConfirm')"
                  @confirm="handleDelete(record.id)"
                >
                  <Button type="link" size="small" danger>
                    <template #icon><DeleteOutlined /></template>
                  </Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>

        <!-- 空状态 -->
        <div v-else class="py-12 text-center text-gray-400">
          <FolderOpenOutlined style="font-size: 48px" />
          <p class="mt-4">{{ $t('detective.merchantGroup.noData') }}</p>
          <Button type="primary" class="mt-4" @click="openAddModal">
            <template #icon><PlusOutlined /></template>
            {{ $t('detective.merchantGroup.addGroup') }}
          </Button>
        </div>
      </Card>
    </Spin>

    <!-- 新增/编辑弹窗 -->
    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSave">
      <Form layout="vertical" class="mt-4">
        <Form.Item :label="$t('detective.merchantGroup.groupName')" required>
          <Input
            v-model:value="form.name"
            :placeholder="$t('detective.merchantGroup.namePlaceholder')"
          />
        </Form.Item>
        <Form.Item :label="$t('detective.merchantGroup.note')">
          <Input.TextArea
            v-model:value="form.note"
            :rows="3"
            :placeholder="$t('detective.merchantGroup.notePlaceholder')"
          />
        </Form.Item>
        <Form.Item v-if="isEdit" :label="$t('detective.merchantGroup.status')">
          <Switch v-model:checked="form.is_active" />
          <span class="ml-2">
            {{ form.is_active ? $t('common.enabled') : $t('common.disabled') }}
          </span>
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
