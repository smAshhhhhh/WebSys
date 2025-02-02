from flask import render_template, request, jsonify, session, redirect, url_for, current_app
import pymysql
import os
import subprocess
import psutil
from datetime import datetime
from werkzeug.utils import secure_filename
from app.auth import bp
from app.auth.utils import validate_username, validate_password, login_required, allowed_file
from app.utils.db import get_db_connection
from app.utils.messages import Messages
import signal

@bp.route('/')
def index():
    return redirect(url_for('auth.login'))

@bp.route('/login', methods=['GET', 'POST'])
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
                    SELECT u.*, s.student_id, s.email, s.phone, s.avatar, s.nickname 
                    FROM users u 
                    LEFT JOIN students s ON u.id = s.user_id 
                    WHERE u.username = %s AND u.password = %s AND u.role = %s
                """, (username, password, role))
            else:
                cursor.execute("""
                    SELECT u.*, t.teacher_id, t.email, t.phone, t.avatar, t.nickname 
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
                session['nickname'] = user.get('nickname', '')
                if role == 'student':
                    session['id_number'] = user['student_id']
                else:
                    session['id_number'] = user['teacher_id']
                
                return jsonify({
                    'success': True,
                    'redirect': url_for('auth.dashboard')
                })
            else:
                return jsonify({
                    'success': False,
                    'message': Messages.LOGIN_INVALID_CREDENTIALS
                })
        finally:
            cursor.close()
            conn.close()
    
    return render_template('auth/login.html')

@bp.route('/register', methods=['GET', 'POST'])
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
                'redirect': url_for('auth.login')
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

    return render_template('auth/register.html')

@bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('auth/dashboard.html')

@bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))

@bp.route('/profile')
@login_required
def profile():
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
            return redirect(url_for('auth.login'))
        
        return render_template('auth/profile.html', user=user)
    finally:
        cursor.close()
        conn.close()

@bp.route('/update_profile', methods=['POST'])
@login_required
def update_profile():
    email = request.form.get('email')
    phone = request.form.get('phone')
    nickname = request.form.get('nickname')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        conn.begin()
        if session['role'] == 'student':
            cursor.execute("""
                UPDATE students 
                SET email = %s, phone = %s, nickname = %s 
                WHERE user_id = %s
            """, (email, phone, nickname, session['user_id']))
        else:
            cursor.execute("""
                UPDATE teachers 
                SET email = %s, phone = %s, nickname = %s 
                WHERE user_id = %s
            """, (email, phone, nickname, session['user_id']))
        
        conn.commit()
        # 更新session中的昵称
        session['nickname'] = nickname
        return jsonify({'success': True, 'message': '个人信息更新成功'})
    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'message': str(e)})
    finally:
        cursor.close()
        conn.close()

@bp.route('/upload_avatar', methods=['POST'])
@login_required
def upload_avatar():
    if 'avatar' not in request.files:
        return jsonify({'success': False, 'message': Messages.AVATAR_UPLOAD_FAILED})
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'success': False, 'message': Messages.AVATAR_UPLOAD_FAILED})
    
    if file and allowed_file(file.filename, current_app.config['ALLOWED_EXTENSIONS']):
        try:
            # 生成安全的文件名
            filename = secure_filename(f"{session['username']}_{file.filename}")
            # 确保上传目录存在
            os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
            # 构建完整的文件路径
            filepath = os.path.join(current_app.root_path, 'static', 'images', 'avatars', filename)
            
            # 保存文件
            file.save(filepath)
            # 设置相对于static目录的路径
            avatar_path = f'images/avatars/{filename}'
            
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
                    old_avatar_path = os.path.join(current_app.root_path, 'static', session['avatar'])
                    if os.path.exists(old_avatar_path):
                        os.remove(old_avatar_path)
                
                conn.commit()
                # 更新session中的头像路径
                session['avatar'] = avatar_path
                
                return jsonify({
                    'success': True,
                    'message': Messages.AVATAR_UPLOAD_SUCCESS,
                    'avatar_url': url_for('static', filename=avatar_path)
                })
            finally:
                cursor.close()
                conn.close()
        except Exception as e:
            print(f"Error uploading avatar: {str(e)}")  # 添加错误日志
            return jsonify({'success': False, 'message': Messages.AVATAR_UPLOAD_FAILED})
    
    return jsonify({'success': False, 'message': Messages.AVATAR_TYPE_ERROR})

@bp.route('/test_db')
def test_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        return jsonify({
            'success': True,
            'message': '数据库连接成功'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'数据库连接失败: {str(e)}'
        })

@bp.route('/change_password', methods=['GET', 'POST'])
@login_required
def change_password():
    if request.method == 'POST':
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        # 验证新密码格式
        if not validate_password(new_password):
            return jsonify({
                'success': False,
                'message': '新密码必须包含字母和数字，长度在6-20个字符之间'
            })
        
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        try:
            # 验证当前密码
            cursor.execute("""
                SELECT * FROM users 
                WHERE id = %s AND password = %s
            """, (session['user_id'], current_password))
            
            user = cursor.fetchone()
            if not user:
                return jsonify({
                    'success': False,
                    'message': '当前密码错误'
                })
            
            # 更新密码
            cursor.execute("""
                UPDATE users 
                SET password = %s 
                WHERE id = %s
            """, (new_password, session['user_id']))
            
            conn.commit()
            
            # 清除会话，要求用户重新登录
            session.clear()
            
            return jsonify({
                'success': True,
                'message': '密码修改成功，请重新登录',
                'redirect': url_for('auth.login')
            })
            
        except Exception as e:
            conn.rollback()
            return jsonify({
                'success': False,
                'message': str(e)
            })
        finally:
            cursor.close()
            conn.close()
    
    return render_template('auth/change_password.html')

@bp.route('/observe')
@login_required
def observe():
    return render_template('auth/observe.html')

@bp.route('/record')
@login_required
def record():
    conn = get_db_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        # 获取用户的截图记录
        cursor.execute("""
            SELECT id, filename, created_at, description 
            FROM screenshots 
            WHERE user_id = %s 
            ORDER BY created_at DESC
        """, (session['user_id'],))
        screenshots = cursor.fetchall()
        
        # 获取用户的录像记录
        cursor.execute("""
            SELECT id, filename, created_at, duration, description 
            FROM recordings 
            WHERE user_id = %s 
            ORDER BY created_at DESC
        """, (session['user_id'],))
        recordings = cursor.fetchall()
        
        return render_template('auth/record.html', 
                             screenshots=screenshots,
                             recordings=recordings)
    finally:
        cursor.close()
        conn.close()

@bp.route('/delete_record', methods=['POST'])
@login_required
def delete_record():
    try:
        record_type = request.form.get('type')  # 'screenshot' 或 'recording'
        record_id = request.form.get('id')
        
        if not record_type or not record_id:
            return jsonify({'success': False, 'message': '参数不完整'})
            
        conn = get_db_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        try:
            # 获取文件信息
            if record_type == 'screenshot':
                cursor.execute("SELECT filename FROM screenshots WHERE id = %s AND user_id = %s",
                             (record_id, session['user_id']))
                table_name = 'screenshots'
            else:
                cursor.execute("SELECT filename FROM recordings WHERE id = %s AND user_id = %s",
                             (record_id, session['user_id']))
                table_name = 'recordings'
                
            record = cursor.fetchone()
            if not record:
                return jsonify({'success': False, 'message': '记录不存在或无权限删除'})
                
            # 删除文件
            filepath = os.path.join(current_app.root_path, 'static', record['filename'])
            if os.path.exists(filepath):
                os.remove(filepath)
                
            # 删除数据库记录
            cursor.execute(f"DELETE FROM {table_name} WHERE id = %s AND user_id = %s",
                         (record_id, session['user_id']))
            conn.commit()
            
            return jsonify({'success': True, 'message': '删除成功'})
            
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        return jsonify({'success': False, 'message': f'删除失败: {str(e)}'})

@bp.route('/screenshot', methods=['POST'])
@login_required
def take_screenshot():
    try:
        if 'screenshot' not in request.files:
            return jsonify({'success': False, 'message': '未接收到截图数据'})

        screenshot = request.files['screenshot']
        if not screenshot:
            return jsonify({'success': False, 'message': '截图数据为空'})

        # 生成文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"screenshot_{session['user_id']}_{timestamp}.jpg"
        
        # 确保目录存在
        screenshots_dir = os.path.join(current_app.root_path, 'static', 'records', 'screenshots')
        os.makedirs(screenshots_dir, exist_ok=True)
        
        # 保存文件的完整路径
        filepath = os.path.join(screenshots_dir, filename)
        
        # 保存文件
        screenshot.save(filepath)
        
        # 检查文件是否成功保存
        if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
            return jsonify({'success': False, 'message': '截图保存失败'})
        
        # 数据库中保存的相对路径（使用正斜杠）
        db_filename = 'records/screenshots/' + filename
        
        # 保存到数据库
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO screenshots (user_id, filename, created_at) VALUES (%s, %s, %s)",
                (session['user_id'], db_filename, datetime.now())
            )
            conn.commit()
            
            return jsonify({
                'success': True,
                'message': '截图成功',
                'filename': filename
            })
        finally:
            cursor.close()
            conn.close()
            
    except Exception as e:
        print(f"截图错误: {str(e)}")  # 添加错误日志
        return jsonify({'success': False, 'message': f'系统错误: {str(e)}'})

@bp.route('/save_recording', methods=['POST'])
@login_required
def save_recording():
    try:
        if 'video' not in request.files:
            return jsonify({'success': False, 'message': '未接收到视频数据'})

        video_file = request.files['video']
        if not video_file:
            return jsonify({'success': False, 'message': '视频数据为空'})

        # 获取原始文件扩展名
        original_filename = video_file.filename
        extension = original_filename.rsplit('.', 1)[1].lower()
        
        # 生成文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_filename = f"temp_recording_{session['user_id']}_{timestamp}.{extension}"
        final_filename = f"recording_{session['user_id']}_{timestamp}.mp4"
        
        # 确保目录存在
        recordings_dir = os.path.join(current_app.root_path, 'static', 'records', 'recordings')
        os.makedirs(recordings_dir, exist_ok=True)
        
        # 临时文件和最终文件的路径
        temp_filepath = os.path.join(recordings_dir, temp_filename)
        final_filepath = os.path.join(recordings_dir, final_filename)
        
        # 保存原始文件
        video_file.save(temp_filepath)
        
        # 检查文件是否成功保存
        if not os.path.exists(temp_filepath) or os.path.getsize(temp_filepath) == 0:
            return jsonify({'success': False, 'message': '视频保存失败'})
        
        try:
            # 转换为MP4格式（如果需要）
            if extension != 'mp4':
                command = [
                    'ffmpeg',
                    '-i', temp_filepath,
                    '-c:v', 'libx264',  # 视频编码器
                    '-preset', 'fast',   # 编码速度
                    '-crf', '22',        # 视频质量
                    '-c:a', 'aac',       # 音频编码器
                    '-strict', 'experimental',
                    '-movflags', '+faststart',  # 优化MP4文件结构
                    final_filepath
                ]
                
                # 执行转换
                result = subprocess.run(command, capture_output=True, text=True)
                if result.returncode != 0:
                    print(f"FFmpeg转换错误: {result.stderr}")
                    return jsonify({'success': False, 'message': '视频格式转换失败'})
                
                # 删除临时文件
                os.remove(temp_filepath)
                
                # 检查转换后的文件
                if not os.path.exists(final_filepath) or os.path.getsize(final_filepath) == 0:
                    return jsonify({'success': False, 'message': '视频格式转换失败'})
            else:
                # 如果已经是MP4格式，直接重命名
                os.rename(temp_filepath, final_filepath)
        
            # 获取视频时长
            duration = 0
            try:
                duration_cmd = [
                    'ffprobe',
                    '-v', 'error',
                    '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1',
                    final_filepath
                ]
                duration = float(subprocess.check_output(duration_cmd).decode().strip())
            except Exception as e:
                print(f"获取视频时长错误: {str(e)}")
                duration = 0
            
            # 数据库中保存的相对路径
            db_filename = os.path.join('records', 'recordings', final_filename).replace('\\', '/')
            
            # 保存到数据库
            conn = get_db_connection()
            cursor = conn.cursor()
            try:
                cursor.execute(
                    "INSERT INTO recordings (user_id, filename, duration, created_at) VALUES (%s, %s, %s, %s)",
                    (session['user_id'], db_filename, int(duration), datetime.now())
                )
                conn.commit()
                
                return jsonify({
                    'success': True,
                    'message': '视频保存成功',
                    'filename': final_filename,
                    'duration': int(duration)
                })
            finally:
                cursor.close()
                conn.close()
                
        except subprocess.CalledProcessError as e:
            print(f"视频转换错误: {e.stderr.decode() if e.stderr else str(e)}")
            return jsonify({'success': False, 'message': '视频格式转换失败'})
            
    except Exception as e:
        print(f"保存视频错误: {str(e)}")
        return jsonify({'success': False, 'message': f'系统错误: {str(e)}'})