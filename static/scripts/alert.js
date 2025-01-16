// 统一提示控制
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert');
    
    alerts.forEach(alert => {
        // 设置1秒后自动消失
        setTimeout(() => {
            alert.remove();
        }, 2000);

    });
});
