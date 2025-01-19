document.addEventListener('DOMContentLoaded', function() {
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
                        alert('请选择图片文件');
                        return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                        alert('图片大小不能超过5MB');
                        return;
                    }

                    // 创建FormData对象
                    const formData = new FormData();
                    formData.append('avatar', file);

                    // 发送上传请求
                    fetch('/upload_avatar', {
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
                        } else {
                            alert(data.message || '上传失败，请重试');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('上传失败，请重试');
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
            
            // 发送更新请求
            fetch(profileForm.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('个人信息更新成功');
                } else {
                    alert(data.message || '更新失败，请重试');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('更新失败，请重试');
            });
        });
    }
}); 