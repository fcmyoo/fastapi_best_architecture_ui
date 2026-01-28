# 开发命令

## 常用命令

### 开发
```bash
pnpm dev:antd          # 启动开发服务器 (Ant Design Vue 应用)
```

### 构建
```bash
pnpm build:antd        # 构建生产版本
pnpm build:analyze     # 构建并分析包大小
```

### 代码检查
```bash
pnpm lint              # ESLint 检查
pnpm format            # Prettier 格式化
pnpm check:type        # TypeScript 类型检查
pnpm check             # 运行所有检查 (循环依赖、依赖、类型、拼写)
```

### 测试
```bash
pnpm test:unit         # 运行单元测试 (Vitest)
pnpm test:e2e          # 运行端到端测试 (Playwright)
```

### 其他
```bash
pnpm clean             # 清理构建产物
pnpm reinstall         # 重新安装依赖
pnpm commit            # 交互式提交 (czg)
pnpm update:deps       # 更新依赖
```

## Windows 系统命令
```bash
dir                    # 列出目录 (等同于 ls)
type                   # 查看文件内容 (等同于 cat)
findstr                # 搜索文本 (等同于 grep)
where                  # 查找命令位置 (等同于 which)
```

## 环境要求
- Node.js >= 20.10.0
- pnpm >= 9.12.0
