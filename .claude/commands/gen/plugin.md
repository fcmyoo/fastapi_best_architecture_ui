---
description: "生成插件模块骨架"
---

# 插件模块生成

为 **$ARGUMENTS** 生成完整的插件模块骨架。

## 生成位置

`apps/web-antd/src/plugins/{plugin-name}/`

## 目录结构

```
plugins/{plugin-name}/
├── api/
│   └── index.ts           # API 接口
├── views/
│   └── index.vue          # 主页面
├── routes/
│   └── index.ts           # 路由配置
├── langs/
│   ├── zh-CN/
│   │   └── {plugin}.json  # 中文语言
│   └── en-US/
│       └── {plugin}.json  # 英文语言
└── TODO.md                # 开发计划
```

## 生成文件

### 1. API 接口 (api/index.ts)

```typescript
import { requestClient } from '#/api/request';

// TODO: 定义类型和接口
```

### 2. 主页面 (views/index.vue)

```vue
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="p-4">
    <a-card :title="$t('{plugin}.title')">
      <!-- TODO: 页面内容 -->
    </a-card>
  </div>
</template>
```

### 3. 路由配置 (routes/index.ts)

```typescript
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/{plugin}',
    name: '{Plugin}',
    component: () => import('../views/index.vue'),
    meta: {
      title: '{plugin}.title',
      icon: 'ant-design:appstore-outlined',
    },
  },
];

export default routes;
```

### 4. 中文语言 (langs/zh-CN/{plugin}.json)

```json
{
  "title": "{Plugin} 管理"
}
```

### 5. 英文语言 (langs/en-US/{plugin}.json)

```json
{
  "title": "{Plugin} Management"
}
```

### 6. 开发计划 (TODO.md)

```markdown
# {Plugin} 插件开发计划

## 功能需求
- [ ] TODO

## 开发进度
- [ ] API 接口
- [ ] 页面视图
- [ ] 路由配置
- [ ] 国际化
```

## 执行步骤

1. 解析插件名称（kebab-case）
2. 创建目录结构
3. 生成所有模板文件
4. 提示用户：
   - 在 `apps/web-antd/src/router/routes/modules/` 注册路由
   - 在 `apps/web-antd/src/locales/langs/` 注册语言文件

## 命名规范

| 输入 | plugin-name | Plugin | 文件名 |
|------|-------------|--------|--------|
| 数据分析 | data-analysis | DataAnalysis | data-analysis |
| 用户反馈 | user-feedback | UserFeedback | user-feedback |
