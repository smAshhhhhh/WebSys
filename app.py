from flask import Flask, render_template, request, redirect, url_for, flash
import pymysql
import config
from messages import Messages

app = Flask(__name__)
app.secret_key = 'your_secret_key'

# MySQL数据库
def get_db_connection():
    return pymysql.connect(**config.db_config) #config


@app.route('/')
def index():
    return redirect(url_for('login'))

#登录
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "SELECT * FROM users WHERE username = %s AND password = %s AND role = %s",
                (username, password, role)
            )
            user = cursor.fetchone()
            
            if user:
                if role == 'student':
                    return redirect(url_for('student_dashboard'))
                else:
                    return redirect(url_for('teacher_dashboard'))
            else:
                flash(Messages.LOGIN_INVALID_CREDENTIALS)
        finally:
            cursor.close()
            conn.close()
    
    return render_template('login.html')

#注册
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        confirm_password = request.form['confirmpassword']
        role = request.form['role']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            # 检查用户名是否已存在
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                flash(Messages.REGISTER_USERNAME_EXISTS)
                return render_template('register.html', role=role)
                
            # 检查密码是否一致
            if password != confirm_password:
                flash(Messages.REGISTER_PASSWORD_MISMATCH)
                return render_template('register.html', role=role)
                
            # 插入新用户
            cursor.execute(
                "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                (username, password, role)
            )
            conn.commit()
            flash(Messages.REGISTER_SUCCESS)
            return redirect(url_for('login'))
        except Exception as e:
            conn.rollback()
            flash(Messages.REGISTER_FAILED.format(str(e)))
            return redirect(url_for('register'))
        finally:
            cursor.close()
            conn.close()
    
    return render_template('register.html')

@app.route('/student/dashboard')
def student_dashboard():
    return "Student Dashboard"

@app.route('/teacher/dashboard')
def teacher_dashboard():
    return "Teacher Dashboard"


if __name__ == '__main__':
    app.run(debug = True)
