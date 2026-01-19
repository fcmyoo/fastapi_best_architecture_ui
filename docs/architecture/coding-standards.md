# 编码规范

> 本文档供 AI 开发助手遵循项目编码规范

## Vue 组件规范

### 文件结构

```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed } from 'vue';
import type { PropType } from 'vue';

// 2. Props 定义
interface Props {
  title: string;
  data?: Record<string, any>;
}
const props = withDefaults(defineProps<Props>(), {
  data: () => ({}),
});

// 3. Emits 定义
const emit = defineEmits<{
  (e: 'update', value: string): void;
  (e: 'close'): void;
}>();

// 4. 响应式数据
const loading = ref(false);
const list = ref<any[]>([]);

// 5. 计算属性
const isEmpty = computed(() => list.value.length === 0);

// 6. 方法
function handleSubmit() {
  // ...
}

// 7. 生命周期
onMounted(() => {
  // ...
});
</script>

<template>
  <!-- 模板内容 -->
</template>

<style lang="scss" scoped>
/* 样式 */
</style>
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `UserList.vue` |
| 组件名 | PascalCase | `UserList` |
| Props | camelCase | `userName` |
| Events | kebab-case | `@update-user` |
| 变量/函数 | camelCase | `getUserInfo` |
| 常量 | UPPER_SNAKE | `MAX_COUNT` |
| 类型/接口 | PascalCase | `UserInfo` |

## TypeScript 规范

### 类型定义

```typescript
// 接口定义
interface UserInfo {
  id: number;
  name: string;
  email?: string;
}

// 类型别名
type Status = 'active' | 'inactive' | 'pending';

// 泛型
function fetchData<T>(url: string): Promise<T> {
  // ...
}
```

### 禁止事项

- ❌ 使用 `any`（除非必要并注释原因）
- ❌ 使用 `@ts-ignore`（使用 `@ts-expect-error` 并说明）
- ❌ 非空断言 `!` 滥用

## API 接口规范

### 文件结构

```typescript
// apps/web-antd/src/api/user.ts
import { requestClient } from '#/api/request';

// 类型定义
export interface UserInfo {
  id: number;
  name: string;
}

export interface UserQuery {
  page?: number;
  size?: number;
  name?: string;
}

// API 函数
export function getUserList(params: UserQuery) {
  return requestClient.get<UserInfo[]>('/sys/users', { params });
}

export function getUserById(id: number) {
  return requestClient.get<UserInfo>(`/sys/users/${id}`);
}

export function createUser(data: Partial<UserInfo>) {
  return requestClient.post<UserInfo>('/sys/users', data);
}

export function updateUser(id: number, data: Partial<UserInfo>) {
  return requestClient.put<UserInfo>(`/sys/users/${id}`, data);
}

export function deleteUser(id: number) {
  return requestClient.delete(`/sys/users/${id}`);
}
```

## 国际化规范

### 使用方式

```vue
<template>
  <!-- 模板中 -->
  <span>{{ $t('common.save') }}</span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 脚本中
const message = t('common.success');
</script>
```

### 语言文件

- 中文: `apps/web-antd/src/locales/langs/zh-CN/`
- 英文: `apps/web-antd/src/locales/langs/en-US/`
- 必须同时维护两种语言

## 样式规范

### TailwindCSS 优先

```vue
<template>
  <!-- 优先使用 Tailwind -->
  <div class="flex items-center justify-between p-4">
    <span class="text-lg font-bold">Title</span>
  </div>
</template>
```

### SCSS 补充

```scss
// 仅在 Tailwind 无法满足时使用
.custom-component {
  // 使用 CSS 变量
  color: var(--primary-color);

  // 嵌套不超过 3 层
  &__header {
    // ...
  }
}
```

## Git 提交规范

### Conventional Commits

```
<type>(<scope>): <emoji> <subject>

<body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Type 类型

| Type | Emoji | 说明 |
|------|-------|------|
| feat | ✨ | 新功能 |
| fix | 🐛 | 修复 Bug |
| docs | 📝 | 文档更新 |
| style | 💄 | 代码格式 |
| refactor | ♻️ | 重构 |
| perf | ⚡ | 性能优化 |
| test | ✅ | 测试 |
| build | 📦 | 构建 |
| ci | 👷 | CI |
| chore | 🔧 | 其他 |

### Scope 范围

- `web-antd` - 主应用
- `@core/*` - 核心包
- `effects/*` - 功能包
- `locales` - 国际化
- `plugins/*` - 插件模块
