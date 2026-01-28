# FastAPI Best Architecture UI

## 项目概述
FastAPI Best Architecture 后端项目的前端 UI 实现，基于 Vue Vben Admin 5.x 构建的企业级管理界面。

## 技术栈
- **框架**: Vue 3.5+ + TypeScript 5.8+
- **UI 库**: Ant Design Vue 4.x
- **构建工具**: Vite 6.x + Turbo (Monorepo)
- **包管理**: pnpm 10.x (workspace)
- **状态管理**: Pinia 3.x
- **路由**: Vue Router 4.x
- **样式**: TailwindCSS 3.x + SCSS
- **HTTP 客户端**: Axios
- **国际化**: Vue I18n

## 项目结构
```
├── apps/
│   └── web-antd/          # 主应用 (Ant Design Vue)
│       └── src/
│           ├── adapter/   # 适配器
│           ├── api/       # API 接口
│           ├── layouts/   # 布局
│           ├── locales/   # 国际化
│           ├── plugins/   # 插件模块
│           ├── router/    # 路由
│           ├── store/     # 状态管理
│           ├── types/     # 类型定义
│           ├── utils/     # 工具函数
│           └── views/     # 页面视图
├── packages/
│   ├── @core/             # 核心基础包
│   ├── constants/         # 常量
│   ├── effects/           # 功能效果包
│   ├── icons/             # 图标
│   ├── locales/           # 国际化
│   ├── preferences/       # 偏好设置
│   ├── stores/            # 状态管理
│   ├── styles/            # 样式
│   ├── types/             # 类型定义
│   └── utils/             # 工具函数
├── internal/              # 内部工具 (lint/build 配置)
└── scripts/               # 脚本
```

## API 规范
- 基础路径: `/api/v1/`
- 响应格式: `{ code: 200, data: T, msg: string }`
- Token: Bearer JWT
- 开发环境后端: `http://localhost:8000`
