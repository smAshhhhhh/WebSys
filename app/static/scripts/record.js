// 删除记录
function deleteRecord(type, id) {
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('id', id);

    fetch('/auth/delete_record', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 删除成功后刷新页面
            location.reload();
        } else {
            alert(data.message || '删除失败');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('删除失败，请重试');
    });
}

// 显示图片查看器
function showImage(imageSrc) {
    const viewer = document.querySelector('.image-viewer');
    const image = viewer.querySelector('img');
    image.src = imageSrc;
    viewer.classList.add('active');
    // 阻止滚动
    document.body.style.overflow = 'hidden';
}

// 隐藏图片查看器
function hideImageViewer() {
    const viewer = document.querySelector('.image-viewer');
    viewer.classList.remove('active');
    // 恢复滚动
    document.body.style.overflow = '';
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 为所有视频添加错误处理
    document.querySelectorAll('video').forEach(video => {
        video.addEventListener('error', function() {
            this.style.display = 'none';
            const errorMsg = document.createElement('div');
            errorMsg.className = 'video-error';
            errorMsg.textContent = '视频加载失败';
            this.parentElement.appendChild(errorMsg);
        });
    });

    // 为所有图片添加错误处理
    document.querySelectorAll('img').forEach(img => {
        if (!img.classList.contains('user-avatar')) {  // 排除用户头像
            img.addEventListener('error', function() {
                this.style.display = 'none';
                const errorMsg = document.createElement('div');
                errorMsg.className = 'image-error';
                errorMsg.textContent = '图片加载失败';
                this.parentElement.appendChild(errorMsg);
            });
        }
    });

    // 图片查看器的键盘事件
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideImageViewer();
        }
    });
}); 