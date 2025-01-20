import pymysql
from flask import current_app

def get_db_connection():
    """获取数据库连接"""
    return pymysql.connect(**current_app.config['DB_CONFIG']) 