# effects 效果包

> [返回根目录](../../CLAUDE.md) > packages > effects

提供权限控制、通用 UI、请求封装等功能效果。

## 子包索引

| 包名 | 路径 | 说明 |
|------|------|------|
| @vben/access | `access/` | 权限控制 |
| @vben/common-ui | `common-ui/` | 通用 UI 组件 |
| @vben/hooks | `hooks/` | Vue 钩子函数 |
| @vben/layouts | `layouts/` | 布局组件 |
| @vben/plugins | `plugins/` | 插件集合 |
| @vben/request | `request/` | HTTP 请求封装 |

## @vben/request 请求模块

### 核心文件
- `request-client/` - 请求客户端
  - `request-client.ts` - 主客户端类
  - `modules/downloader.ts` - 文件下载
  - `modules/uploader.ts` - 文件上传

### 依赖
- `axios` - HTTP 客户端
- `qs` - 查询字符串处理

### 使用方式
```typescript
import { RequestClient } from '@vben/request';

const client = new RequestClient({
  baseURL: '/api',
});

// 添加拦截器
client.addRequestInterceptor({ ... });
client.addResponseInterceptor({ ... });
```

## @vben/access 权限模块

提供路由权限生成、权限指令等功能。

### 核心函数
- `generateAccessible()` - 生成可访问路由

## @vben/common-ui 通用组件

- 页面组件
- 加载组件
- Tippy 提示

## @vben/layouts 布局

- BasicLayout - 基础布局
- IFrameView - 内嵌页面

## @vben/hooks 钩子

- `useAppConfig` - 应用配置
