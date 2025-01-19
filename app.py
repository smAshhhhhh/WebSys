from flask import Flask, render_template, request, redirect, url_for, jsonify, session
import pymysql
import config
from messages import Messages
import re
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # 请在生产环境中使用安全的密钥

# MySQL数据库连接
def get_db_connection():
    return pymysql.connect(**config.db_config)

# 用户名和密码的验证规则
def validate_username(username):
    if not username or len(username) < 4 or len(username) > 20:
        return False
    return bool(re.match(r'^[a-zA-Z0-9_]+$', username))

def validate_password(password):
    if not password or len(password) < 6 or len(password) > 20:
        return False
    return bool(re.match(r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$', password))

# 头像上传配置
UPLOAD_FOLDER = 'static/images/avatars'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# 确保上传目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        
        # 验证角色是否有效
        if role not in ['student', 'teacher']:
            return jsonify({
                'success': False,
                'message': Messages.LOGIN_ROLE_INVALID
            })
        
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)  # 使用字典游标
        try:
            # 获取用户信息和详细信息
            if role == 'student':
                cursor.execute("""
                    SELECT u.*, s.student_id, s.email, s.phone, s.avatar 
                    FROM users u 
                    LEFT JOIN students s ON u.id = s.user_id 
                    WHERE u.username = %s AND u.password = %s AND u.role = %s
                """, (username, password, role))
            else:
                cursor.execute("""
                    SELECT u.*, t.teacher_id, t.email, t.phone, t.avatar 
                    FROM users u 
                    LEFT JOIN teachers t ON u.id = t.user_id 
                    WHERE u.username = %s AND u.password = %s AND u.role = %s
                """, (username, password, role))
            
            user = cursor.fetchone()
            
            if user:
                # 存储用户信息到session
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['role'] = user['role']
                session['avatar'] = user.get('avatar', '/images/sourceImg/default_avatar.jpg')
                if role == 'student':
                    session['id_number'] = user['student_id']
                else:
                    session['id_number'] = user['teacher_id']
                
                return jsonify({
                    'success': True,
                    'redirect': url_for('dashboard')
                })
            else:
                return jsonify({
                    'success': False,
                    'message': Messages.LOGIN_INVALID_CREDENTIALS
                })
        finally:
            cursor.close()
            conn.close()
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        role = request.form['role']
        id_number = request.form['id_number']  # 学号或教师编号

        # 验证用户名格式
        if not validate_username(username):
            return jsonify({
                'success': False,
                'message': Messages.REGISTER_INVALID_USERNAME
            })

        # 验证密码格式
        if not validate_password(password):
            return jsonify({
                'success': False,
                'message': Messages.REGISTER_INVALID_PASSWORD
            })

        # 验证两次密码是否一致
        if password != confirm_password:
            return jsonify({
                'success': False,
                'message': Messages.REGISTER_PASSWORD_MISMATCH
            })

        # 验证角色是否有效
        if role not in ['student', 'teacher']:
            return jsonify({
                'success': False,
                'message': Messages.LOGIN_ROLE_INVALID
            })

        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # 检查用户名是否已存在
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': Messages.REGISTER_USERNAME_EXISTS
                })

            # 检查学号/教师编号是否已存在
            if role == 'student':
                cursor.execute("SELECT * FROM students WHERE student_id = %s", (id_number,))
            else:
                cursor.execute("SELECT * FROM teachers WHERE teacher_id = %s", (id_number,))
            if cursor.fetchone():
                return jsonify({
                    'success': False,
                    'message': Messages.REGISTER_ID_EXISTS
                })

            # 开始事务
            conn.begin()

            # 插入用户基本信息
            cursor.execute(
                "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                (username, password, role)
            )
            user_id = cursor.lastrowid

            # 插入角色特定信息
            if role == 'student':
                cursor.execute(
                    "INSERT INTO students (user_id, student_id) VALUES (%s, %s)",
                    (user_id, id_number)
                )
            else:
                cursor.execute(
                    "INSERT INTO teachers (user_id, teacher_id) VALUES (%s, %s)",
                    (user_id, id_number)
                )

            conn.commit()
            return jsonify({
                'success': True,
                'message': Messages.REGISTER_SUCCESS,
                'redirect': url_for('login')
            })
        except Exception as e:
            conn.rollback()
            return jsonify({
                'success': False,
                'message': Messages.SYSTEM_ERROR
            })
        finally:
            cursor.close()
            conn.close()

    return render_template('register.html')

@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template('dashboard.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/profile')
def profile():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        if session['role'] == 'student':
            cursor.execute("""
                SELECT u.username, s.* 
                FROM users u 
                JOIN students s ON u.id = s.user_id 
                WHERE u.id = %s
            """, (session['user_id'],))
        else:
            cursor.execute("""
                SELECT u.username, t.* 
                FROM users u 
                JOIN teachers t ON u.id = t.user_id 
                WHERE u.id = %s
            """, (session['user_id'],))
        
        user = cursor.fetchone()
        if not user:
            session.clear()
            return redirect(url_for('login'))
        
        return render_template('profile.html', user=user)
    finally:
        cursor.close()
        conn.close()

@app.route('/update_profile', methods=['POST'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'})
    
    email = request.form.get('email')
    phone = request.form.get('phone')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        conn.begin()
        if session['role'] == 'student':
            cursor.execute("""
                UPDATE students 
                SET email = %s, phone = %s 
                WHERE user_id = %s
            """, (email, phone, session['user_id']))
        else:
            cursor.execute("""
                UPDATE teachers 
                SET email = %s, phone = %s 
                WHERE user_id = %s
            """, (email, phone, session['user_id']))
        
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)})
    finally:
        cursor.close()
        conn.close()

@app.route('/upload_avatar', methods=['POST'])
def upload_avatar():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'})
    
    try:
        if 'avatar' not in request.files:
            return jsonify({'success': False, 'message': '没有文件被上传'})
        
        file = request.files['avatar']
        if file.filename == '':
            return jsonify({'success': False, 'message': '没有选择文件'})
        
        if file and allowed_file(file.filename):
            # 生成安全的文件名
            filename = secure_filename(f"{session['username']}_{file.filename}")
            filepath = os.path.join(app.root_path, UPLOAD_FOLDER, filename)
            
            # 保存文件
            file.save(filepath)
            
            # 更新数据库中的头像路径
            avatar_path = f'/images/avatars/{filename}'
            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                conn.begin()
                if session['role'] == 'student':
                    cursor.execute("""
                        UPDATE students 
                        SET avatar = %s 
                        WHERE user_id = %s
                    """, (avatar_path, session['user_id']))
                else:
                    cursor.execute("""
                        UPDATE teachers 
                        SET avatar = %s 
                        WHERE user_id = %s
                    """, (avatar_path, session['user_id']))
                
                # 删除旧头像文件（如果存在且不是默认头像）
                if session.get('avatar') and 'default_avatar' not in session['avatar']:
                    old_avatar_path = os.path.join(app.root_path, 'static', session['avatar'].lstrip('/'))
                    if os.path.exists(old_avatar_path):
                        os.remove(old_avatar_path)
                
                conn.commit()
                # 更新session中的头像路径
                session['avatar'] = avatar_path
                
                return jsonify({
                    'success': True,
                    'avatar_url': url_for('static', filename=f'images/avatars/{filename}')
                })
            finally:
                cursor.close()
                conn.close()
        
        return jsonify({'success': False, 'message': '不支持的文件类型'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
