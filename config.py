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
    UPLOAD_FOLDER = 'app/static/images/avatars'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB

    # 资源路径配置
    # 默认头像
    DEFAULT_AVATAR = 'images/sourceImg/default_avatar.jpg'
    # 默认logo
    LOGO_IMAGE = 'images/sourceImg/logo.png'  # 使用正斜杠和相对路径
    
    # 视频流配置
    DEFAULT_STREAM_URL = 'http://172.30.201.23/index/api/webrtc?app=live&stream=test&type=play'

    # 安全配置
    SECRET_KEY = 'your_secret_key'  # 用于session加密
    
    # 其他系统配置
    SYSTEM_NAME = '智能监控系统'
    VERSION = '1.0.0'