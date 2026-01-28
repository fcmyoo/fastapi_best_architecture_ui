# 代码风格和规范

## Prettier 配置
- `printWidth`: 80
- `semi`: true (使用分号)
- `singleQuote`: true (使用单引号)
- `trailingComma`: 'all' (尾随逗号)
- `endOfLine`: 'auto'

## ESLint
使用 `@vben/eslint-config` 统一配置

## Stylelint
使用 `@vben/stylelint-config` 统一配置

## Commit 规范
使用 Conventional Commits 规范:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具

## 目录约定
- `api/` - API 接口定义
- `views/` - 页面视图
- `plugins/` - 插件模块 (可插拔功能)
- `store/` - 状态管理
- `router/` - 路由配置
- `locales/` - 国际化资源

## TypeScript
- 使用严格模式
- 优先使用类型推断
- 接口命名使用 PascalCase
