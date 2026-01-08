# @core 核心包

> [返回根目录](../../CLAUDE.md) > packages > @core

Vben Admin 核心基础包集合，提供设计系统、工具函数、类型定义等基础能力。

## 子包索引

| 包名 | 路径 | 说明 |
|------|------|------|
| @vben-core/design | `base/design/` | 设计系统 (CSS/主题) |
| @vben-core/icons | `base/icons/` | 图标组件 |
| @vben-core/shared | `base/shared/` | 共享工具函数 |
| @vben-core/typings | `base/typings/` | TypeScript 类型定义 |
| @vben-core/composables | `composables/` | Vue 组合式函数 |
| @vben-core/preferences | `preferences/` | 偏好设置管理 |
| @vben-core/form-ui | `ui-kit/form-ui/` | 表单组件 |
| @vben-core/layout-ui | `ui-kit/layout-ui/` | 布局组件 |
| @vben-core/menu-ui | `ui-kit/menu-ui/` | 菜单组件 |
| @vben-core/popup-ui | `ui-kit/popup-ui/` | 弹窗组件 |
| @vben-core/shadcn-ui | `ui-kit/shadcn-ui/` | Shadcn 风格组件 |
| @vben-core/tabs-ui | `ui-kit/tabs-ui/` | 标签页组件 |

## base/shared 工具函数

### 缓存 (`cache/`)
- `storage-manager.ts` - 本地存储管理

### 颜色 (`color/`)
- `color.ts` - 颜色处理
- `convert.ts` - 颜色转换
- `generator.ts` - 颜色生成

### 工具 (`utils/`)
- `cn.ts` - 类名合并
- `date.ts` - 日期处理
- `diff.ts` - 对象差异
- `dom.ts` - DOM 操作
- `download.ts` - 文件下载
- `inference.ts` - 类型推断
- `merge.ts` - 对象合并
- `tree.ts` - 树形数据处理
- `unique.ts` - 唯一值生成

## composables 组合式函数

- `use-is-mobile.ts` - 移动端检测
- `use-layout-style.ts` - 布局样式
- `use-namespace.ts` - 命名空间
- `use-scroll-lock.ts` - 滚动锁定
- `use-sortable.ts` - 拖拽排序

## preferences 偏好设置

- `config.ts` - 配置定义
- `constants.ts` - 常量
- `preferences.ts` - 偏好管理

## 测试文件

测试位于各模块的 `__tests__/` 目录，使用 Vitest 运行。
