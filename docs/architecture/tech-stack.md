# 技术栈说明

> 本文档供 AI 开发助手理解项目技术栈

## 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue | 3.5+ | 前端框架 |
| TypeScript | 5.8+ | 类型系统 |
| Vite | 6.x | 构建工具 |
| pnpm | 10.x | 包管理（Monorepo） |

## UI 组件库

| 技术 | 版本 | 用途 |
|------|------|------|
| Ant Design Vue | 4.x | UI 组件库 |
| TailwindCSS | 3.x | 原子化 CSS |
| SCSS | - | 样式预处理 |

## 状态管理与路由

| 技术 | 版本 | 用途 |
|------|------|------|
| Pinia | 3.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |

## 网络请求

| 技术 | 用途 |
|------|------|
| Axios | HTTP 客户端 |
| Socket.io-client | WebSocket |

## 国际化

| 技术 | 用途 |
|------|------|
| Vue I18n | 多语言支持 |

## Monorepo 结构

```
项目根目录/
├── apps/
│   └── web-antd/          # 主应用（Ant Design Vue）
├── packages/
│   ├── @core/             # 核心基础包
│   ├── effects/           # 功能效果包
│   ├── locales/           # 国际化
│   ├── stores/            # 状态管理
│   └── ...
└── internal/              # 构建/lint 配置
```

## 后端 API

- 基础路径: `/api/v1/`
- 响应格式: `{ code: number, data: T, msg: string }`
- 认证方式: Bearer JWT
- 开发环境: `http://localhost:8000`

## 开发命令

```bash
pnpm install          # 安装依赖
pnpm dev:antd         # 开发模式
pnpm build:antd       # 构建
pnpm check:type       # 类型检查
pnpm lint             # 代码检查
```
