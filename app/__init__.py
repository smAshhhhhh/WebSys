from flask import Flask, redirect, url_for
from config import Config
from app.utils.db import get_db_connection

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # 注册蓝图
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp)

    # 确保上传目录存在
    import os
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # 添加根路由重定向
    @app.route('/')
    def index():
        return redirect(url_for('auth.login'))

    return app 