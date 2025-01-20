import re
from functools import wraps
from flask import session, redirect, url_for

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def validate_username(username):
    """验证用户名格式"""
    if not username or len(username) < 4 or len(username) > 20:
        return False
    return bool(re.match(r'^[a-zA-Z0-9_]+$', username))

def validate_password(password):
    """验证密码格式"""
    if not password or len(password) < 6 or len(password) > 20:
        return False
    return bool(re.match(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$', password))

def allowed_file(filename, allowed_extensions):
    """检查文件类型是否允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions 