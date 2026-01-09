# web-antd 主应用

> [返回根目录](../../CLAUDE.md) > apps > web-antd

FastAPI Best Architecture 的主前端应用，基于 Ant Design Vue 构建。

## 入口文件

| 文件               | 说明                         |
| ------------------ | ---------------------------- |
| `src/main.ts`      | 应用入口，初始化偏好设置     |
| `src/bootstrap.ts` | 应用启动，注册插件/路由/状态 |
| `src/app.vue`      | 根组件                       |

## 目录结构

```
src/
├── adapter/          # 组件适配器 (表单/表格)
├── api/              # API 接口
│   ├── core/         # 核心接口 (auth/user/menu)
│   └── request.ts    # 请求客户端配置
├── layouts/          # 布局组件
├── locales/          # 国际化资源
├── plugins/          # 插件模块
├── router/           # 路由配置
├── store/            # 状态管理
├── types/            # 类型定义
├── utils/            # 工具函数
└── views/            # 页面视图
```

## API 接口

### 核心接口 (`api/core/`)

- `auth.ts` - 认证 (登录/登出/刷新Token/验证码)
- `user.ts` - 用户信息
- `menu.ts` - 菜单管理

### 业务接口

- `dept.ts` - 部门管理
- `role.ts` - 角色管理
- `data-permission.ts` - 数据权限
- `log.ts` - 日志
- `monitor.ts` - 监控
- `scheduler.ts` - 调度任务
- `plugin.ts` - 插件管理

## 插件模块 (`plugins/`)

| 插件             | 说明                           |
| ---------------- | ------------------------------ |
| `aliyun_sms`     | 阿里云短信                     |
| `code_generator` | 代码生成器                     |
| `config`         | 系统配置                       |
| `detective`      | 嘎嘎侦探 (账单对账/信用卡管理) |
| `dict`           | 数据字典                       |
| `email`          | 邮件服务                       |
| `notice`         | 通知公告                       |
| `oauth2`         | OAuth2 登录                    |

## 路由模块 (`router/routes/modules/`)

- `dashboard.ts` - 仪表盘
- `system.ts` - 系统管理
- `log.ts` - 日志管理
- `monitor.ts` - 监控管理
- `scheduler.ts` - 调度管理
- `profile.ts` - 个人中心
- `demos.ts` - 演示页面
- `vben.ts` - Vben 示例

## 状态管理 (`store/`)

- `auth.ts` - 认证状态 (登录/登出/用户信息)
- `dict.ts` - 字典缓存
- `websocket.ts` - WebSocket 连接

## 环境变量

```bash
# .env
VITE_APP_TITLE=FBA UI
VITE_APP_NAMESPACE=fba-ui

# .env.development
VITE_PORT=5173
VITE_GLOB_API_URL=http://localhost:8000
```

## 依赖包

- `@vben/access` - 权限控制
- `@vben/common-ui` - 通用 UI
- `@vben/hooks` - 钩子函数
- `@vben/layouts` - 布局
- `@vben/locales` - 国际化
- `@vben/plugins` - 插件
- `@vben/request` - HTTP 请求
- `@vben/stores` - 状态管理
- `ant-design-vue` - UI 组件库
- `socket.io-client` - WebSocket

## 开发命令

```bash
pnpm dev:antd      # 开发模式
pnpm build:antd    # 构建
```
