import pymysql
import config

def init_database():
    # 连接MySQL（不指定数据库）
    conn = pymysql.connect(
        host=config.db_config['host'],
        user=config.db_config['user'],
        password=config.db_config['password']
    )
    
    cursor = conn.cursor()
    
    try:
        # 创建数据库
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {config.db_config['database']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"数据库 {config.db_config['database']} 创建成功或已存在")
        
        # 使用数据库
        cursor.execute(f"USE {config.db_config['database']}")
        
        # 创建用户表
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(20) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('student', 'teacher') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """)
        print("用户表创建成功或已存在")
        
        # 检查是否存在测试用户
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        # 如果没有用户，创建测试账号
        if user_count == 0:
            test_users = [
                ('student1', '123456', 'student'),
                ('teacher1', '123456', 'teacher')
            ]
            cursor.executemany(
                "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                test_users
            )
            conn.commit()
            print("测试用户创建成功")
        
        print("数据库初始化完成！")
        
    except Exception as e:
        print(f"错误: {str(e)}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    init_database() 