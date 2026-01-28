---
description: 'TypeScript 类型检查'
---

# TypeScript 类型检查

运行 TypeScript 类型检查并分析错误。

## 执行步骤

1. 运行 `pnpm check:type` 执行类型检查
2. 解析错误输出
3. 按文件分组展示错误
4. 提供修复建议

## 输出格式

### 📊 检查结果

| 状态        | 数量 |
| ----------- | ---- |
| ❌ 类型错误 | X    |
| ⚠️ 警告     | X    |

### ❌ 类型错误详情

#### 文件: `path/to/file.ts`

| 行号 | 错误代码 | 错误描述 | 修复建议 |
| ---- | -------- | -------- | -------- |

### 💡 常见问题修复

#### TS2322: 类型不匹配

```typescript
// 错误
const value: string = 123;

// 修复
const value: number = 123;
// 或
const value: string = '123';
```

#### TS2339: 属性不存在

```typescript
// 错误
obj.unknownProp;

// 修复：添加类型定义
interface MyObj {
  unknownProp: string;
}
```

#### TS7006: 隐式 any

```typescript
// 错误
function fn(param) {}

// 修复
function fn(param: string) {}
```
