# internal 内部工具

> [返回根目录](../CLAUDE.md) > internal

构建工具、代码规范配置等内部包。

## 子包索引

| 包名 | 路径 | 说明 |
|------|------|------|
| @vben/commitlint-config | `lint-configs/commitlint-config/` | Git 提交规范 |
| @vben/eslint-config | `lint-configs/eslint-config/` | ESLint 配置 |
| @vben/prettier-config | `lint-configs/prettier-config/` | Prettier 配置 |
| @vben/stylelint-config | `lint-configs/stylelint-config/` | Stylelint 配置 |
| @vben/node-utils | `node-utils/` | Node.js 工具函数 |
| @vben/tailwind-config | `tailwind-config/` | TailwindCSS 配置 |
| @vben/tsconfig | `tsconfig/` | TypeScript 配置 |
| @vben/vite-config | `vite-config/` | Vite 构建配置 |

## @vben/eslint-config

ESLint 规则配置，包含：
- JavaScript/TypeScript 规则
- Vue 规则
- Import 排序
- Prettier 集成

## @vben/vite-config

Vite 构建配置，包含：
- 应用配置 (`config/application.ts`)
- 库配置 (`config/library.ts`)
- 插件配置 (`plugins/`)
  - `archiver.ts` - 打包压缩
  - `extra-app-config.ts` - 额外配置
  - `inject-app-loading/` - 加载动画注入
  - `inject-metadata.ts` - 元数据注入
  - `license.ts` - 许可证
  - `print.ts` - 打印信息
  - `vxe-table.ts` - VXE Table 配置

## @vben/node-utils

Node.js 工具函数：
- `fs.ts` - 文件系统
- `git.ts` - Git 操作
- `hash.ts` - 哈希计算
- `monorepo.ts` - Monorepo 工具
- `path.ts` - 路径处理
- `prettier.ts` - Prettier 格式化
- `spinner.ts` - 命令行加载动画

## @vben/tsconfig

TypeScript 配置预设：
- `base.json` - 基础配置
- `library.json` - 库配置
- `node.json` - Node.js 配置
- `web.json` - Web 配置
- `web-app.json` - Web 应用配置
