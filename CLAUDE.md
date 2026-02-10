# FastAPI Best Architecture UI

> 基于 Vue Vben Admin 5.x 构建的前端 UI

## 技术栈

- Vue 3.5+ / TypeScript 5.8+ / Ant Design Vue 4.x
- Vite 6.x + Turbo (Monorepo) / pnpm 10.x
- Pinia 3.x / Vue Router 4.x / TailwindCSS 3.x + SCSS / Axios / Vue I18n

## 常用命令

- `pnpm install` / `pnpm dev:antd` / `pnpm build:antd`
- `pnpm check:type` / `pnpm lint`

## 目录约定

主应用: `apps/web-antd/`，核心包: `packages/@core/`，效果包: `packages/effects/`

- `api/` - API 接口 | `views/` - 页面视图 | `plugins/` - 插件模块
- `store/` - 状态管理 | `router/` - 路由配置 | `locales/` - 国际化资源

## API 规范

- 基础路径: `/api/v1/`，响应: `{ code: 200, data: T, msg: string }`，Token: Bearer JWT
- 后端开发地址: `http://localhost:8000`

## 环境变量

`.env` 通用 / `.env.development` 开发 / `.env.production` 生产

## 数据库查询

```bash
python scripts/db_query.py "<SQL或表名>"
```

示例: `python scripts/db_query.py sys_menu` | `python scripts/db_query.py tables` | `python scripts/db_query.py "schema sys_menu"`

当用户提到"查数据库"、"看看表"、"sys_menu"、"菜单表"等，直接执行查询。
