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

    // 头像上传处理
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    const profileAvatar = document.querySelector('.profile-avatar');
    
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            // 创建文件输入元素
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            
            // 监听文件选择
            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // 检查文件类型和大小
                    if (!file.type.startsWith('image/')) {
                        showMessage('请选择图片文件');
                        return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                        showMessage('图片大小不能超过5MB');
                        return;
                    }

                    // 创建FormData对象
                    const formData = new FormData();
                    formData.append('avatar', file);

                    // 禁用按钮并显示加载状态
                    changeAvatarBtn.disabled = true;
                    changeAvatarBtn.classList.add('loading');
                    changeAvatarBtn.textContent = '上传中...';

                    // 发送上传请求
                    fetch('/auth/upload_avatar', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // 更新头像显示
                            profileAvatar.src = data.avatar_url;
                            // 更新所有显示用户头像的地方
                            document.querySelectorAll('.user-avatar').forEach(avatar => {
                                avatar.src = data.avatar_url;
                            });
                            showMessage(data.message, 'success');
                        } else {
                            showMessage(data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showMessage('上传失败，请重试');
                    })
                    .finally(() => {
                        // 恢复按钮状态
                        changeAvatarBtn.disabled = false;
                        changeAvatarBtn.classList.remove('loading');
                        changeAvatarBtn.textContent = '更换头像';
                    });
                }
            });
            
            // 触发文件选择
            fileInput.click();
        });
    }

    // 表单提交处理
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 收集表单数据
            const formData = new FormData(profileForm);
            
            // 获取提交按钮
            const submitBtn = profileForm.querySelector('.save-btn');
            
            // 禁用按钮并显示加载状态
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.textContent = '保存中...';
            
            // 发送更新请求
            fetch(profileForm.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage('个人信息更新成功', 'success');
                } else {
                    showMessage(data.message || '更新失败，请重试');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage('更新失败，请重试');
            })
            .finally(() => {
                // 恢复按钮状态
                submitBtn.disabled = false;
                submitBtn.classList.remove('loading');
                submitBtn.textContent = '保存更改';
            });
        });
    }
}); 