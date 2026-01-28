# 匹配候选 UI 重构计划

## 任务描述
在未匹配交易页的手动匹配弹窗中，点击支付侧交易后调用新 API 获取匹配候选，重新设计页面布局为主从结构。

## API 接口
```
GET /api/v1/detective/transactions/{tx_id}/match-candidates?match_card=true
```

## 执行步骤

### 1. 新增 API 接口定义
- 文件: `apps/web-antd/src/plugins/detective/api/reconcile.ts`
- 添加类型定义和 API 函数

### 2. 新增国际化文本
- 文件: `langs/zh-CN/detective.json` 和 `langs/en-US/detective.json`
- 添加置信度、评分详情等文本

### 3. 重构手动匹配弹窗
- 文件: `views/report/unmatched.vue`
- 主从布局：上方支付端选择，下方候选展示
- 候选卡片显示置信度和评分详情

## 状态
- [x] 创建计划文件
- [ ] 新增 API 接口定义
- [ ] 新增国际化文本
- [ ] 重构手动匹配弹窗布局
