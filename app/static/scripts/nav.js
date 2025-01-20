document.addEventListener('DOMContentLoaded', function() {
    // 用户菜单处理
    const userMenu = document.querySelector('.user-menu');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (userMenu && dropdownMenu) {
        // 鼠标进入时显示菜单
        userMenu.addEventListener('mouseenter', function() {
            dropdownMenu.style.opacity = '1';
            dropdownMenu.style.visibility = 'visible';
            dropdownMenu.style.transform = 'translateY(0)';
        });

        // 鼠标离开时隐藏菜单
        userMenu.addEventListener('mouseleave', function() {
            dropdownMenu.style.opacity = '0';
            dropdownMenu.style.visibility = 'hidden';
            dropdownMenu.style.transform = 'translateY(-10px)';
        });

        // 点击用户菜单外部时关闭菜单
        document.addEventListener('click', function(event) {
            if (!userMenu.contains(event.target)) {
                dropdownMenu.style.opacity = '0';
                dropdownMenu.style.visibility = 'hidden';
                dropdownMenu.style.transform = 'translateY(-10px)';
            }
        });
    }
}); 