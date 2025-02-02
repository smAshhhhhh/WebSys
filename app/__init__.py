from flask import Flask, redirect, url_for
from config import Config
from app.utils.db import get_db_connection

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # 注册蓝图
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp)

    # 确保必要的目录存在
    import os
    required_dirs = [
        app.config['UPLOAD_FOLDER'],
        app.config['RECORD_BASE_DIR'],
        app.config['SCREENSHOTS_FOLDER'],
        app.config['RECORDINGS_FOLDER']
    ]
    for directory in required_dirs:
        os.makedirs(directory, exist_ok=True)

    # 添加根路由重定向
    @app.route('/')
    def index():
        return redirect(url_for('auth.login'))

    return app 