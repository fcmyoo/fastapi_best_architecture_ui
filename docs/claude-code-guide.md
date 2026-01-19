# Claude Code 配置指南

> 本文档记录项目的 Claude Code 配置，包括自定义命令、代理、钩子等。

## 配置概览

本项目的 Claude Code 配置分为两部分：
1. **BMad 敏捷工作流**：通用的敏捷开发框架（已有）
2. **项目定制配置**：针对 Vue 3 + TypeScript + Ant Design Vue 技术栈的定制

## 目录结构

```
.claude/
├── commands/                    # 自定义命令
│   ├── BMad/                    # BMad 敏捷工作流
│   │   ├── agents/              # 10 个角色代理
│   │   └── tasks/               # 23 个任务模板
│   ├── db.md                    # 数据库查询
│   ├── commit.md                # Git 提交
│   ├── review.md                # 代码审查
│   ├── gen/                     # 代码生成命令组
│   │   ├── api.md               # API 接口生成
│   │   ├── view.md              # 页面视图生成
│   │   └── plugin.md            # 插件模块生成
│   └── check/                   # 检查命令组
│       ├── i18n.md              # 国际化检查
│       └── type.md              # 类型检查
│
├── agents/                      # 子代理
│   └── vue-expert.md            # Vue 技术专家
│
├── settings.json                # Hooks 配置
└── settings.local.json          # MCP 服务器配置

.bmad-core/                      # BMad 核心文件（不要修改）
├── agents/                      # 角色定义
├── tasks/                       # 任务定义
├── templates/                   # 模板
├── checklists/                  # 检查清单
├── workflows/                   # 工作流
└── core-config.yaml             # 核心配置

docs/architecture/               # 技术规范文档（供 BMad dev 加载）
├── coding-standards.md          # 编码规范
├── tech-stack.md                # 技术栈说明
└── source-tree.md               # 源码结构
```

## 自定义命令

### 核心命令

#### `/commit` - Git 提交
生成符合 Conventional Commits 规范的提交信息。

```bash
# 使用方式
/commit
```

特性：
- 自动分析 git diff
- 生成 type(scope): emoji subject 格式
- 中文描述
- 等待用户确认后执行

#### `/review` - 代码审查
审查当前分支的代码变更。

```bash
# 审查整个分支
/review

# 审查指定路径
/review src/views/user
```

审查维度：
- 代码质量（ESLint、命名、逻辑）
- Vue/TypeScript 规范
- 安全检查
- 国际化
- 性能

### 代码生成命令

#### `/gen__api` - API 接口生成
```bash
/gen__api 用户管理
```

生成位置：`apps/web-antd/src/api/{module}.ts`

#### `/gen__view` - 页面视图生成
```bash
/gen__view 用户列表
```

生成位置：`apps/web-antd/src/views/{module}/index.vue`

支持页面类型：
- 列表页（表格 + 搜索 + CRUD）
- 表单页
- 详情页
- 空白页

#### `/gen__plugin` - 插件模块生成
```bash
/gen__plugin 数据分析
```

生成完整插件结构：
```
plugins/{plugin-name}/
├── api/index.ts
├── views/index.vue
├── routes/index.ts
├── langs/zh-CN/{plugin}.json
├── langs/en-US/{plugin}.json
└── TODO.md
```

### 检查命令

#### `/check__i18n` - 国际化检查
```bash
/check__i18n
```

检查内容：
- 扫描 `$t()` 和 `t()` 调用
- 对比 zh-CN 和 en-US 语言文件
- 报告缺失的翻译键

#### `/check__type` - TypeScript 检查
```bash
/check__type
```

执行 `pnpm check:type` 并分析错误。

### 数据库命令

#### `/db` - 数据库查询
```bash
/db sys_menu
/db "SELECT * FROM sys_menu WHERE path LIKE '%detective%'"
/db tables
/db "schema sys_menu"
```

## 子代理

### vue-expert - Vue 技术专家

**触发词**：组件、Vue、Pinia、响应式、Ant Design、表格、表单、路由、性能、优化

**专业领域**：
- Vue 3 Composition API
- TypeScript 类型定义
- Ant Design Vue 组件
- Pinia 状态管理
- Vue Router 路由
- 性能优化

## Hooks 配置

### 危险命令拦截

配置文件：`.claude/settings.json`

自动拦截以下命令：
- `rm -rf *` - 防止误删文件
- `git reset --hard *` - 防止丢失未提交更改
- `git push --force *` - 防止强制推送
- `git push -f *` - 防止强制推送

## MCP 服务器

### PostgreSQL 数据库

配置文件：`.claude/settings.local.json`

提供数据库直连查询能力，支持：
- SQL 查询
- 表结构查看
- 数据浏览

## BMad 敏捷工作流

### 角色代理

| 命令 | 角色 | 用途 |
|------|------|------|
| `/dev` | James (开发者) | 代码实现、调试、重构 |
| `/qa` | QA 专家 | 质量保证、测试 |
| `/pm` | 项目经理 | 项目管理 |
| `/po` | 产品负责人 | 产品规划 |
| `/architect` | 架构师 | 架构设计 |
| `/analyst` | 分析师 | 需求分析 |
| `/sm` | Scrum Master | 敏捷流程 |
| `/ux-expert` | UX 专家 | 用户体验 |

### 常用任务

| 命令 | 用途 |
|------|------|
| `/create-next-story` | 创建下一个故事 |
| `/apply-qa-fixes` | 应用 QA 修复 |
| `/document-project` | 项目文档化 |
| `/review-story` | 审查故事 |
| `/test-design` | 测试设计 |

## 技术规范文档

BMad `dev` 角色启动时自动加载以下文档：

### coding-standards.md
- Vue 组件规范
- TypeScript 规范
- API 接口规范
- 国际化规范
- 样式规范
- Git 提交规范

### tech-stack.md
- 核心框架版本
- UI 组件库
- 状态管理
- 网络请求
- Monorepo 结构

### source-tree.md
- 项目目录结构
- 主应用结构
- 插件模块结构
- 核心包结构

## 配置更新记录

### 2025-01-19

**新增配置**：
1. 技术规范文档
   - `docs/architecture/coding-standards.md`
   - `docs/architecture/tech-stack.md`
   - `docs/architecture/source-tree.md`

2. 自定义命令
   - `.claude/commands/commit.md`
   - `.claude/commands/review.md`
   - `.claude/commands/gen/api.md`
   - `.claude/commands/gen/view.md`
   - `.claude/commands/gen/plugin.md`
   - `.claude/commands/check/i18n.md`
   - `.claude/commands/check/type.md`

3. 子代理
   - `.claude/agents/vue-expert.md`

4. Hooks 配置
   - `.claude/settings.json`

**设计原则**：
- 不修改 BMad 系统，独立并行
- 针对项目技术栈定制
- 补充 BMad 期望的技术规范文档
