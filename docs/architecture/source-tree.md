# 源码结构

> 本文档供 AI 开发助手理解项目目录结构

## 项目根目录

```
fastapi_best_architecture_ui/
├── apps/                    # 应用目录
│   └── web-antd/            # 主应用（Ant Design Vue）
├── packages/                # 共享包
│   ├── @core/               # 核心基础包
│   ├── effects/             # 功能效果包
│   ├── constants/           # 常量定义
│   ├── icons/               # 图标资源
│   ├── locales/             # 国际化
│   ├── preferences/         # 偏好设置
│   ├── stores/              # 状态管理
│   ├── styles/              # 样式
│   ├── types/               # 类型定义
│   └── utils/               # 工具函数
├── internal/                # 内部工具
│   ├── lint-configs/        # 代码规范配置
│   ├── node-utils/          # Node 工具
│   ├── tailwind-config/     # Tailwind 配置
│   ├── tsconfig/            # TypeScript 配置
│   └── vite-config/         # Vite 配置
├── docs/                    # 文档
└── scripts/                 # 脚本
```

## 主应用结构 (apps/web-antd/)

```
apps/web-antd/
├── src/
│   ├── adapter/             # 组件适配器
│   │   ├── form.ts          # 表单适配
│   │   └── component/       # 组件适配
│   │
│   ├── api/                 # API 接口
│   │   ├── core/            # 核心接口
│   │   │   ├── auth.ts      # 认证
│   │   │   ├── user.ts      # 用户
│   │   │   └── menu.ts      # 菜单
│   │   ├── request.ts       # 请求客户端
│   │   └── *.ts             # 业务接口
│   │
│   ├── layouts/             # 布局组件
│   │   └── basic.vue        # 基础布局
│   │
│   ├── locales/             # 国际化
│   │   └── langs/
│   │       ├── zh-CN/       # 中文
│   │       └── en-US/       # 英文
│   │
│   ├── plugins/             # 插件模块
│   │   ├── detective/       # 嘎嘎侦探
│   │   ├── dict/            # 数据字典
│   │   ├── config/          # 系统配置
│   │   └── ...
│   │
│   ├── router/              # 路由
│   │   ├── index.ts         # 路由入口
│   │   ├── guard.ts         # 路由守卫
│   │   └── routes/
│   │       └── modules/     # 路由模块
│   │
│   ├── store/               # 状态管理
│   │   ├── auth.ts          # 认证状态
│   │   ├── dict.ts          # 字典缓存
│   │   └── websocket.ts     # WebSocket
│   │
│   ├── types/               # 类型定义
│   │
│   ├── utils/               # 工具函数
│   │
│   ├── views/               # 页面视图
│   │   ├── _core/           # 核心页面
│   │   │   ├── authentication/  # 登录
│   │   │   └── fallback/        # 错误页
│   │   ├── dashboard/       # 仪表盘
│   │   ├── system/          # 系统管理
│   │   ├── log/             # 日志
│   │   ├── monitor/         # 监控
│   │   └── ...
│   │
│   ├── main.ts              # 入口文件
│   ├── bootstrap.ts         # 启动文件
│   └── app.vue              # 根组件
│
├── public/                  # 静态资源
├── .env                     # 环境变量
├── .env.development         # 开发环境
├── .env.production          # 生产环境
└── vite.config.mts          # Vite 配置
```

## 插件模块结构

```
plugins/{plugin-name}/
├── api/                     # API 接口
│   └── index.ts
├── views/                   # 页面视图
│   └── index.vue
├── routes/                  # 路由配置
│   └── index.ts
├── langs/                   # 国际化
│   ├── zh-CN/
│   │   └── {plugin}.json
│   └── en-US/
│       └── {plugin}.json
├── types/                   # 类型定义（可选）
│   └── index.ts
└── TODO.md                  # 开发计划（可选）
```

## 核心包结构 (packages/@core/)

| 包名 | 用途 |
|------|------|
| `design` | 设计系统 |
| `icons` | 图标 |
| `shared` | 共享工具 |
| `typings` | 类型定义 |
| `composables` | 组合式函数 |
| `preferences` | 偏好设置 |
| `ui-kit` | UI 组件 |

## 功能包结构 (packages/effects/)

| 包名 | 用途 |
|------|------|
| `access` | 权限控制 |
| `common-ui` | 通用 UI |
| `hooks` | 钩子函数 |
| `layouts` | 布局 |
| `plugins` | 插件 |
| `request` | HTTP 请求 |

## 关键文件路径

| 用途 | 路径 |
|------|------|
| 请求客户端 | `apps/web-antd/src/api/request.ts` |
| 路由配置 | `apps/web-antd/src/router/routes/modules/` |
| 认证状态 | `apps/web-antd/src/store/auth.ts` |
| 中文语言 | `apps/web-antd/src/locales/langs/zh-CN/` |
| 英文语言 | `apps/web-antd/src/locales/langs/en-US/` |
| 全局样式 | `packages/styles/` |
| 全局类型 | `packages/types/` |
