class UserManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // 从页面元素获取当前用户
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            this.currentUser = usernameElement.textContent || '';
        }
        this.updateUI();
    }

    clearCurrentUser() {
        this.currentUser = null;
        this.updateUI();
        window.location.href = '/login';
    }

    updateUI() {
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = this.currentUser || '未登录';
        }
    }
}

// 初始化UserManager
const userManager = new UserManager();

// 暴露接口给其他模块使用
window.userManager = userManager;
