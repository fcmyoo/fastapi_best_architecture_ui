#!/usr/bin/env python3
"""
数据库查询工具 - 用于快速查询 PostgreSQL 数据库
使用方法: python db_query.py "<SQL或表名>"
"""

import sys
import os
from pathlib import Path

def load_env():
    """从 .env.local 加载数据库配置"""
    env_file = Path(__file__).parent.parent / '.env.local'
    config = {}
    if env_file.exists():
        with open(env_file, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    config[key.strip()] = value.strip()
    return config

def get_connection():
    """获取数据库连接"""
    import psycopg2
    config = load_env()
    return psycopg2.connect(
        host=config.get('DATABASE_HOST', 'localhost'),
        port=int(config.get('DATABASE_PORT', 5432)),
        user=config.get('DATABASE_USER', 'postgres'),
        password=config.get('DATABASE_PASSWORD', ''),
        database=config.get('DATABASE_NAME', 'fba')
    )

def format_table(headers, rows, max_width=50):
    """格式化表格输出"""
    if not rows:
        return "No results"

    # 计算列宽
    widths = [len(str(h)) for h in headers]
    for row in rows[:100]:  # 只计算前100行
        for i, cell in enumerate(row):
            cell_str = str(cell) if cell is not None else 'NULL'
            if len(cell_str) > max_width:
                cell_str = cell_str[:max_width-3] + '...'
            widths[i] = max(widths[i], len(cell_str))

    # 构建表格
    sep = '+' + '+'.join('-' * (w + 2) for w in widths) + '+'
    header_row = '|' + '|'.join(f' {str(h):<{w}} ' for h, w in zip(headers, widths)) + '|'

    lines = [sep, header_row, sep]
    for row in rows:
        cells = []
        for cell, w in zip(row, widths):
            cell_str = str(cell) if cell is not None else 'NULL'
            if len(cell_str) > max_width:
                cell_str = cell_str[:max_width-3] + '...'
            cells.append(f' {cell_str:<{w}} ')
        lines.append('|' + '|'.join(cells) + '|')
    lines.append(sep)

    return '\n'.join(lines)

def execute_query(query):
    """执行查询并返回结果"""
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(query)

        if cur.description:
            headers = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            total = len(rows)

            if total > 50:
                rows = rows[:50]
                print(f"显示前 50 行，共 {total} 行\n")
            else:
                print(f"共 {total} 行\n")

            print(format_table(headers, rows))
        else:
            conn.commit()
            print(f"执行成功，影响 {cur.rowcount} 行")
    finally:
        conn.close()

def list_tables():
    """列出所有表"""
    query = """
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
    """
    execute_query(query)

def show_schema(table_name):
    """显示表结构"""
    query = f"""
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = '{table_name}'
    ORDER BY ordinal_position
    """
    execute_query(query)

def main():
    if len(sys.argv) < 2:
        print("用法: python db_query.py <SQL|表名|tables|schema 表名>")
        print("示例:")
        print("  python db_query.py 'SELECT * FROM sys_menu LIMIT 10'")
        print("  python db_query.py sys_menu")
        print("  python db_query.py tables")
        print("  python db_query.py 'schema sys_menu'")
        sys.exit(1)

    arg = ' '.join(sys.argv[1:]).strip()

    # 处理特殊命令
    if arg.lower() == 'tables':
        list_tables()
    elif arg.lower().startswith('schema '):
        table_name = arg[7:].strip()
        show_schema(table_name)
    elif arg.upper().startswith(('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'WITH', 'CREATE', 'ALTER', 'DROP')):
        execute_query(arg)
    else:
        # 假设是表名，查询前20行
        execute_query(f"SELECT * FROM {arg} LIMIT 20")

if __name__ == '__main__':
    main()
