# 插件开发规范

> 本文档定义了 `apps/web-antd/src/plugins/` 目录下插件模块的开发规范

## 目录结构

```
plugins/
└── 插件名/
    ├── api/
    │   └── index.ts          # API 接口定义与导出
    ├── views/
    │   ├── index.vue         # 主视图
    │   ├── data.ts           # 表格列/表单 schema 配置
    │   └── [其他视图].vue
    ├── routes/
    │   └── index.ts          # 路由配置
    └── langs/                # 国际化资源 (必须)
        ├── zh-CN/
        │   └── 插件名.json   # ⚠️ 文件名必须与插件名一致
        └── en-US/
            └── 插件名.json
```

## 国际化文件命名规范 (重要)

**⚠️ i18n 文件名必须与插件名保持一致！**

```
# ✅ 正确
plugins/detective/langs/zh-CN/detective.json
plugins/dict/langs/zh-CN/dict.json
plugins/notice/langs/zh-CN/notice.json

# ❌ 错误 - 不要使用 index.json
plugins/detective/langs/zh-CN/index.json
```

**⚠️ JSON 文件内容不要嵌套插件名！**

```json
// ✅ 正确 - detective.json 内容直接是翻译内容
{
  "title": "嘎嘎侦探",
  "bill": {
    "title": "账单管理"
  }
}

// ❌ 错误 - 不要在内容中再嵌套 "detective"
{
  "detective": {
    "title": "嘎嘎侦探",
    "bill": {
      "title": "账单管理"
    }
  }
}
```

**原因**：`loadLocalesMapFromDir` 使用**文件名**作为消息的顶层 key：
- 文件 `detective.json` + 内容 `{ "bill": {...} }` → 访问 `$t('detective.bill.xxx')` ✅
- 文件 `detective.json` + 内容 `{ "detective": { "bill": {...} } }` → 访问 `$t('detective.detective.bill.xxx')` ❌

## 导入规范

### 1. 路径别名

项目使用 `#/` 作为 `src/` 目录的路径别名，**禁止使用相对路径 `../` 跨目录导入**。

```typescript
// ✅ 正确
import { requestClient } from '#/api/request';
import type { PaginationResult } from '#/types';

// ❌ 错误
import { requestClient } from '../../api/request';
```

### 2. 插件 API 导入

```typescript
// ✅ 正确 - 使用绝对路径别名
import type { SysNoticeResult } from '#/plugins/notice/api';
import { getNoticeListApi } from '#/plugins/notice/api';

// ❌ 错误 - 使用相对路径
import type { SysNoticeResult } from '../api';
import { getNoticeListApi } from '../../api';
```

### 3. 适配器导入

```typescript
// 表单适配器
import { useVbenForm } from '#/adapter/form';

// 表格适配器
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
```

### 4. @vben 包导入

```typescript
// 通用 UI 组件
import { Page, useVbenModal, useVbenDrawer, VbenButton, confirm } from '@vben/common-ui';

// 图标
import { MaterialSymbolsAdd } from '@vben/icons';

// 国际化
import { $t } from '@vben/locales';

// 工具函数
import { downloadFileFromBlob } from '@vben/utils';

// 类型定义
import type { Recordable } from '@vben/types';
```

### 5. Ant Design Vue 导入

```typescript
import { Table, Button, Space, Tag, Modal, message } from 'ant-design-vue';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons-vue';
```

### 6. 同目录文件导入

同目录下的文件使用相对路径 `./`：

```typescript
// 同目录下的配置文件
import { querySchema, schema, useColumns } from './data';

// 同目录下的组件
import ExtraModal from './preview.vue';
```

### 7. 插件内部视图导入

```typescript
// ✅ 正确 - 使用绝对路径别名
import DictData from '#/plugins/dict/views/dict-data.vue';

// ❌ 错误 - 使用相对路径
import DictData from '../dict-data.vue';
```

## 导入顺序

按以下顺序组织导入语句，每组之间空一行：

```typescript
// 1. 类型导入 (type imports)
import type { VbenFormProps } from '@vben/common-ui';
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SysNoticeResult } from '#/plugins/notice/api';

// 2. Vue 核心
import { computed, ref, reactive, onMounted } from 'vue';

// 3. @vben 包
import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

// 4. 第三方库
import { message } from 'ant-design-vue';

// 5. 项目内部模块 (#/ 路径)
import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getNoticeListApi } from '#/plugins/notice/api';

// 6. 同目录文件 (./)
import { querySchema, useColumns } from './data';
```

## API 文件规范

### 文件结构

```typescript
// api/index.ts

import type { Recordable } from '@vben/types';
import type { PaginationResult } from '#/types';
import { requestClient } from '#/api/request';

// 1. 查询参数接口
export interface QueryXxxParams {
  name?: string;
  page?: number;
  size?: number;
}

// 2. 创建/更新参数接口
export interface XxxParams {
  name: string;
  // ...
}

// 3. 返回结果接口
export interface XxxResult extends XxxParams {
  id: number;
  created_time: string;
  updated_time: string;
}

// 4. API 函数
export async function getXxxListApi(params: QueryXxxParams) {
  return requestClient.get<PaginationResult<XxxResult>>('/api/v1/xxx', { params });
}

export async function createXxxApi(data: XxxParams) {
  return requestClient.post('/api/v1/xxx', data);
}

export async function updateXxxApi(pk: number, data: XxxParams) {
  return requestClient.put(`/api/v1/xxx/${pk}`, data);
}

export async function deleteXxxApi(pk: number) {
  return requestClient.delete(`/api/v1/xxx/${pk}`);
}
```

## 路由配置规范

```typescript
// routes/index.ts

import type { RouteRecordRaw } from 'vue-router';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    name: 'PluginName',
    path: '/plugin-name',
    meta: {
      title: $t('plugin.title'),
      icon: 'mdi:icon-name',
      order: 10,
    },
    children: [
      {
        name: 'PluginNameChild',
        path: '/plugin-name/child',
        component: () => import('#/plugins/plugin_name/views/index.vue'),
        meta: {
          title: $t('plugin.child.title'),
          icon: 'mdi:child-icon',
        },
      },
      // 有子路由的父路由必须添加 redirect
      {
        name: 'PluginNameParent',
        path: '/plugin-name/parent',
        redirect: '/plugin-name/parent/first-child',
        meta: {
          title: $t('plugin.parent.title'),
          icon: 'mdi:parent-icon',
        },
        children: [
          {
            name: 'PluginNameFirstChild',
            path: '/plugin-name/parent/first-child',
            component: () => import('#/plugins/plugin_name/views/first.vue'),
            meta: {
              title: $t('plugin.parent.first'),
            },
          },
        ],
      },
    ],
  },
];

export default routes;
```

## 视图组件规范

```vue
<script lang="ts" setup>
// 按导入顺序规范组织导入

import type { VbenFormProps } from '@vben/common-ui';
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { XxxResult } from '#/plugins/xxx/api';

import { computed, ref } from 'vue';

import { Page, useVbenModal, VbenButton } from '@vben/common-ui';
import { MaterialSymbolsAdd } from '@vben/icons';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getXxxListApi, createXxxApi } from '#/plugins/xxx/api';

import { querySchema, useColumns } from './data';

// 组件逻辑...
</script>

<template>
  <Page auto-content-height>
    <!-- 模板内容 -->
  </Page>
</template>
```
