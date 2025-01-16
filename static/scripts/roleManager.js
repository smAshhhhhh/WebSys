// 角色管理模块
class RoleManager {
    constructor() {
        this.toggle = document.querySelector('.toggle');
        this.roleInputs = document.querySelectorAll('input[name="role"]');
        this.init();
    }

    init() {
        // 初始化角色状态
        this.updateRoleInputs();
        
        // 监听切换事件
        if (this.toggle) {
            this.toggle.addEventListener('change', () => {
                // 触发卡片翻转动画
                const flipCard = document.querySelector('.flip-card__inner');
                if (flipCard) {
                    flipCard.style.transition = 'transform 0.6s';
                    flipCard.style.transform = this.toggle.checked ? 
                        'rotateY(180deg)' : 'rotateY(0deg)';
                }
                
                this.updateRoleInputs();
                // 同步状态到所有页面
                this.syncRoleState();
            });
        }

        // 监听storage事件实现跨页面同步
        window.addEventListener('storage', (event) => {
            if (event.key === 'currentRole' && this.toggle) {
                this.toggle.checked = event.newValue === 'teacher';
                this.updateRoleInputs();
            }
        });

        // 恢复上次选择的角色
        const savedRole = localStorage.getItem('currentRole');
        if (savedRole && this.toggle) {
            this.toggle.checked = savedRole === 'teacher';
            this.updateRoleInputs();
        }
    }

    // 同步角色状态到所有页面
    syncRoleState() {
        const role = this.getCurrentRole();
        localStorage.setItem('currentRole', role);
    }

    // 更新所有角色输入值
    updateRoleInputs() {
        const role = this.getCurrentRole();
        this.roleInputs.forEach(input => {
            input.value = role;
        });
    }

    // 获取当前角色
    getCurrentRole() {
        return this.toggle?.checked ? 'teacher' : 'student';
    }
}

// 初始化角色管理器
document.addEventListener('DOMContentLoaded', () => {
    new RoleManager();
});
