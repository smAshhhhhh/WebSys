import os

class Config:
    # 基本配置
    SECRET_KEY = 'your_secret_key'  # 请在生产环境中使用安全的密钥
    
    # 数据库配置
    DB_CONFIG = {
        'host': 'localhost',
        'user': 'root',
        'password': 'mysql233',
        'database': 'bishe',
        'charset': 'utf8mb4'
    }
    
    # 文件上传配置
    UPLOAD_FOLDER = os.path.join('app', 'static', 'images', 'avatars')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}