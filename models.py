class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    student_id = db.Column(db.String(20), unique=True, nullable=False)
    avatar = db.Column(db.String(200), default='/images/sourceImg/default_avatar.jpg')
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20))

class Teacher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    teacher_id = db.Column(db.String(20), unique=True, nullable=False)
    avatar = db.Column(db.String(200), default='/images/sourceImg/default_avatar.jpg')
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20)) 