document.addEventListener('DOMContentLoaded', function() {
    // 显示消息函数
    function showMessage(message, type = 'error') {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // 触发重排以启动动画
        messageDiv.offsetHeight;
        messageDiv.classList.add('show');

        // 3秒后移除消息
        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => {
                messageDiv.remove();
            }, 300);
        }, 3000);
    }

    // 密码显示/隐藏功能
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('show');
        });
    });

    // 验证密码格式
    function validatePassword(password) {
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/.test(password);
    }

    // 表单提交处理
    const form = document.getElementById('changePasswordForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current_password').value;
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            // 验证当前密码不为空
            if (!currentPassword) {
                showMessage('请输入当前密码');
                return;
            }
            
            // 验证新密码格式
            if (!validatePassword(newPassword)) {
                showMessage('新密码必须包含字母和数字，长度在6-20个字符之间');
                return;
            }
            
            // 验证新密码不能与当前密码相同
            if (newPassword === currentPassword) {
                showMessage('新密码不能与当前密码相同');
                return;
            }
            
            // 验证两次密码是否一致
            if (newPassword !== confirmPassword) {
                showMessage('两次输入的新密码不一致');
                return;
            }
            
            // 获取提交按钮
            const submitBtn = form.querySelector('.save-btn');
            
            // 禁用按钮并显示加载状态
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.textContent = '修改中...';
            
            // 发送修改密码请求
            fetch('/auth/change_password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.message, 'success');
                    // 清空表单
                    form.reset();
                    // 如果需要重新登录，延迟跳转
                    if (data.redirect) {
                        setTimeout(() => {
                            window.location.href = data.redirect;
                        }, 1500);
                    }
                } else {
                    showMessage(data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('修改密码失败，请重试');
            })
            .finally(() => {
                // 恢复按钮状态
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.textContent = '修改密码';
            });
        });
    }
}); 