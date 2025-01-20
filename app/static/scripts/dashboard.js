document.addEventListener('DOMContentLoaded', function() {
    // 侧边栏菜单项点击处理
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除其他项的激活状态
            navItems.forEach(i => i.classList.remove('active'));
            // 添加当前项的激活状态
            this.classList.add('active');
        });
    });

    // 响应式侧边栏处理
    function handleResponsive() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth <= 768) {
            sidebar.style.transform = 'translateX(0)';
            mainContent.style.marginLeft = '60px';
        } else {
            sidebar.style.transform = 'none';
            mainContent.style.marginLeft = 'var(--sidebar-width)';
        }
    }

    // 监听窗口大小变化
    window.addEventListener('resize', handleResponsive);
    // 初始化时执行一次
    handleResponsive();
}); 