import os

class Config:
    # 基本配置
    SECRET_KEY = 'your-secret-key'  # 用于session加密
    SYSTEM_NAME = '视频监控系统'
    VERSION = 'v1.0.0'

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
    LOGO_IMAGE = 'images/sourceImg/logo.png'
    
    # 视频流配置
    DEFAULT_STREAM_URL = 'http://172.18.103.221/index/api/webrtc?app=live&stream=video2&type=play'

    # 记录文件存储配置
    RECORD_BASE_DIR = 'app/static/records'
    SCREENSHOTS_FOLDER = 'app/static/records/screenshots'
    RECORDINGS_FOLDER = 'app/static/records/recordings'
    RECORD_URL_PREFIX = '/static/records'

    # 文件类型限制
    ALLOWED_IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg'}
    ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm'}
    
    # 文件大小限制
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500MB

    # 视频录制配置
    MAX_RECORDING_DURATION = 3600  # 最大录制时长（秒）
    VIDEO_QUALITY = {
        'resolution': '1280x720',  # 视频分辨率
        'framerate': '30',  # 帧率
        'bitrate': '1M'  # 比特率
    }