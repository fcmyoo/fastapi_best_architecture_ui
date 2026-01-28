---
description: '生成规范的 Git 提交信息并执行提交'
---

# Git 提交任务

请分析当前的代码变更，生成符合 Conventional Commits 规范的提交。

## 提交格式

```
<type>(<scope>): <emoji> <subject>

<body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Type 类型与 Emoji

| Type     | Emoji | 说明                   |
| -------- | ----- | ---------------------- |
| feat     | ✨    | 新功能                 |
| fix      | 🐛    | 修复 Bug               |
| docs     | 📝    | 文档更新               |
| style    | 💄    | 代码格式（不影响功能） |
| refactor | ♻️    | 重构                   |
| perf     | ⚡    | 性能优化               |
| test     | ✅    | 测试                   |
| build    | 📦    | 构建                   |
| ci       | 👷    | CI                     |
| chore    | 🔧    | 其他                   |

## Scope 范围

根据变更文件自动识别：

- `apps/web-antd/` → `web-antd`
- `packages/@core/` → `@core/*`
- `packages/effects/` → `effects/*`
- `packages/locales/` → `locales`
- `packages/stores/` → `stores`
- `apps/web-antd/src/plugins/` → `plugins/*`

## 执行步骤

1. 运行 `git status` 查看变更文件
2. 运行 `git diff --staged` 查看已暂存变更（如果有）
3. 运行 `git diff` 查看未暂存变更
4. 分析变更内容，确定 type 和 scope
5. 生成简洁的提交信息（中文描述）
6. **展示提交信息，等待用户确认**
7. 确认后执行 `git add .` 和 `git commit`

## 注意事项

- 提交信息使用中文描述
- 一次提交只做一件事，如果变更过多建议拆分
- 不要提交敏感文件（.env.local, settings.local.json）
- 必须等待用户确认后再执行提交
