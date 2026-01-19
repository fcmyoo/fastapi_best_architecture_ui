---
description: "生成页面视图组件"
---

# 页面视图生成

为 **$ARGUMENTS** 生成页面视图组件。

## 生成位置

`apps/web-antd/src/views/{module}/index.vue`

## 页面类型选择

请先确认页面类型：
1. **列表页** - 带表格、搜索、CRUD 操作
2. **表单页** - 纯表单页面
3. **详情页** - 数据展示页面
4. **空白页** - 基础模板

## 列表页模板

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useI18n } from 'vue-i18n';

// TODO: 导入 API
// import { get{Module}List, delete{Module} } from '#/api/{module}';

const { t } = useI18n();

// 状态
const loading = ref(false);
const dataSource = ref<any[]>([]);
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0,
});

// 搜索表单
const searchForm = ref({
  // TODO: 根据需求添加搜索字段
});

// 表格列定义
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  // TODO: 根据需求添加列
  {
    title: t('common.action'),
    key: 'action',
    width: 150,
    fixed: 'right',
  },
];

// 获取数据
async function fetchData() {
  loading.value = true;
  try {
    // TODO: 调用 API
    // const res = await get{Module}List({
    //   page: pagination.value.current,
    //   size: pagination.value.pageSize,
    //   ...searchForm.value,
    // });
    // dataSource.value = res.data;
    // pagination.value.total = res.total;
  } finally {
    loading.value = false;
  }
}

// 搜索
function handleSearch() {
  pagination.value.current = 1;
  fetchData();
}

// 重置
function handleReset() {
  searchForm.value = {};
  handleSearch();
}

// 删除
async function handleDelete(id: number) {
  // TODO: 调用删除 API
  message.success(t('common.deleteSuccess'));
  fetchData();
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="p-4">
    <!-- 搜索区域 -->
    <a-card class="mb-4">
      <a-form layout="inline">
        <!-- TODO: 添加搜索字段 -->
        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSearch">
              {{ $t('common.search') }}
            </a-button>
            <a-button @click="handleReset">
              {{ $t('common.reset') }}
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 表格区域 -->
    <a-card>
      <template #extra>
        <a-button type="primary">
          {{ $t('common.add') }}
        </a-button>
      </template>

      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small">
                {{ $t('common.edit') }}
              </a-button>
              <a-popconfirm
                :title="$t('common.confirmDelete')"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" danger size="small">
                  {{ $t('common.delete') }}
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>
```

## 执行步骤

1. 解析模块名称
2. 询问页面类型
3. 询问是否需要关联 API 文件
4. 生成页面组件
5. 提示用户配置路由
