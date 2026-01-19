# 数据库查询助手

快速查询 PostgreSQL 数据库的工具。

## 数据库连接信息

从 `.env.local` 读取配置：
- Host: 47.108.87.171
- Port: 5432
- Database: fba
- User: postgres

## 使用方式

用户输入: $ARGUMENTS

## 执行指令

根据用户输入执行相应的数据库查询：

1. **如果用户输入是 SQL 语句**（以 SELECT/INSERT/UPDATE/DELETE/WITH 开头）：
   - 直接执行该 SQL

2. **如果用户输入是表名**（如 `sys_menu`）：
   - 执行 `SELECT * FROM {表名} LIMIT 20`

3. **如果用户输入是搜索条件**（如 `sys_menu where path like '%cash%'`）：
   - 解析并执行相应查询

4. **如果用户输入 `tables`**：
   - 列出所有表名

5. **如果用户输入 `schema {表名}`**：
   - 显示表结构

## 执行方法

使用 Python 脚本执行查询：

```python
import psycopg2
import json

conn = psycopg2.connect(
    host='47.108.87.171',
    port=5432,
    user='postgres',
    password='<从.env.local读取>',
    database='fba'
)
cur = conn.cursor()
cur.execute("<SQL>")
# 格式化输出结果
```

## 输出格式

- 以表格形式展示查询结果
- 显示受影响的行数
- 如果结果过多，只显示前 50 行并提示总数

## 常用查询示例

- `/db sys_menu` - 查看菜单表
- `/db SELECT * FROM sys_menu WHERE path LIKE '%detective%'` - 查询 detective 相关菜单
- `/db tables` - 列出所有表
- `/db schema sys_menu` - 查看 sys_menu 表结构
