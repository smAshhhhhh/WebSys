document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const roleSelect = document.getElementById('role');
    
    // 表单验证规则
    const validators = {
        username: (value) => {
            if (!value) return '用户名不能为空';
            if (value.length < 4 || value.length > 20) return '用户名长度必须在4-20个字符之间';
            if (!/^[a-zA-Z0-9_]+$/.test(value)) return '用户名只能包含字母、数字和下划线';
            return null;
        },
        password: (value) => {
            if (!value) return '密码不能为空';
            if (value.length < 6 || value.length > 20) return '密码长度必须在6-20个字符之间';
            if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/.test(value)) return '密码必须包含字母和数字';
            return null;
        },
        confirm_password: (value, password) => {
            if (!value) return '请确认密码';
            if (value !== password) return '两次输入的密码不一致';
            return null;
        },
        role: (value) => {
            if (!value) return '请选择用户角色';
            return null;
        }
    };

    // 实时验证
    const validateField = (input, fieldName, password = null) => {
        const error = validators[fieldName](input.value, password);
        const formGroup = input.closest('.form-group');
        let errorElement = formGroup.querySelector('.error-message');
        
        if (error) {
            input.classList.add('error');
            if (errorElement) {
                errorElement.textContent = error;
                errorElement.style.display = 'block';
            } else {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = error;
                // 将错误消息插入到合适的位置
                if (input.parentNode.classList.contains('password-container')) {
                    input.parentNode.parentNode.appendChild(errorElement);
                } else {
                    formGroup.appendChild(errorElement);
                }
            }
            return false;
        } else {
            input.classList.remove('error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            return true;
        }
    };

    // 添加实时验证事件监听器
    usernameInput.addEventListener('blur', () => validateField(usernameInput, 'username'));
    passwordInput.addEventListener('blur', () => validateField(passwordInput, 'password'));
    confirmPasswordInput.addEventListener('blur', () => validateField(confirmPasswordInput, 'confirm_password', passwordInput.value));
    roleSelect.addEventListener('change', () => validateField(roleSelect, 'role'));

    // 表单提交处理
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        // 验证所有字段
        const isUsernameValid = validateField(usernameInput, 'username');
        const isPasswordValid = validateField(passwordInput, 'password');
        const isConfirmPasswordValid = validateField(confirmPasswordInput, 'confirm_password', passwordInput.value);
        const isRoleValid = validateField(roleSelect, 'role');

        if (!isUsernameValid || !isPasswordValid || !isConfirmPasswordValid || !isRoleValid) {
            AlertManager.error('请检查输入信息是否正确');
            return;
        }

        // 显示加载状态
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = '注册中...';

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    username: usernameInput.value,
                    password: passwordInput.value,
                    confirm_password: confirmPasswordInput.value,
                    role: roleSelect.value
                })
            });

            const data = await response.json();

            if (data.success) {
                AlertManager.success(data.message || '注册成功');
                // 使用 setTimeout 确保提示消息显示后再跳转
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1000);
            } else {
                AlertManager.error(data.message || '注册失败');
            }
        } catch (error) {
            AlertManager.error('系统错误，请稍后重试');
            console.error('Register error:', error);
        } finally {
            // 恢复按钮状态
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // 添加密码显示切换功能
    const addPasswordToggle = (passwordInput) => {
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'toggle-password';
        toggleButton.setAttribute('aria-label', '显示密码');
        passwordInput.parentNode.appendChild(toggleButton);

        toggleButton.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('show');
            this.setAttribute('aria-label', type === 'password' ? '显示密码' : '隐藏密码');
        });
    };

    // 为两个密码输入框添加显示切换功能
    addPasswordToggle(passwordInput);
    addPasswordToggle(confirmPasswordInput);
}); 