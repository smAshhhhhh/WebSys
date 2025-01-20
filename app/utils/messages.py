class Messages:
    # 登录相关消息
    LOGIN_SUCCESS = "登录成功"
    LOGIN_INVALID_CREDENTIALS = "用户名或密码错误"
    LOGIN_ACCOUNT_LOCKED = "账户已被锁定，请联系管理员"
    LOGIN_REQUIRED = "请先登录"
    LOGIN_ROLE_INVALID = "无效的用户角色"
    
    # 注册相关消息
    REGISTER_SUCCESS = "注册成功"
    REGISTER_USERNAME_EXISTS = "用户名已存在"
    REGISTER_ID_EXISTS = "学号/教师编号已存在"
    REGISTER_INVALID_USERNAME = "用户名必须是4-20个字符，只能包含字母、数字和下划线"
    REGISTER_INVALID_PASSWORD = "密码必须是6-20个字符，至少包含一个字母和一个数字"
    REGISTER_PASSWORD_MISMATCH = "两次输入的密码不一致"
    
    # 系统消息
    SYSTEM_ERROR = "系统错误，请稍后重试"
    
    # 个人信息相关消息
    PROFILE_UPDATE_SUCCESS = "个人信息更新成功"
    PROFILE_UPDATE_FAILED = "个人信息更新失败"
    AVATAR_UPLOAD_SUCCESS = "头像上传成功"
    AVATAR_UPLOAD_FAILED = "头像上传失败"
    AVATAR_TYPE_ERROR = "只支持 PNG、JPG、JPEG 和 GIF 格式的图片"
    AVATAR_SIZE_ERROR = "图片大小不能超过5MB"
