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

class AlertManager {
    static SUCCESS = 'success';
    static ERROR = 'error';
    static WARNING = 'warning';
    static INFO = 'info';

    static show(message, type = AlertManager.INFO, duration = 3000) {
        // 创建提示框元素
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type}`;
        alertElement.innerHTML = `
            <div class="alert-content">
                <span class="alert-message">${message}</span>
                <button class="alert-close">&times;</button>
            </div>
        `;

        // 添加样式
        alertElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 4px;
            z-index: 9999;
            min-width: 250px;
            max-width: 450px;
            animation: slideIn 0.3s ease-in-out;
        `;

        // 根据类型设置颜色
        switch (type) {
            case AlertManager.SUCCESS:
                alertElement.style.backgroundColor = '#4caf50';
                alertElement.style.color = '#fff';
                break;
            case AlertManager.ERROR:
                alertElement.style.backgroundColor = '#f44336';
                alertElement.style.color = '#fff';
                break;
            case AlertManager.WARNING:
                alertElement.style.backgroundColor = '#ff9800';
                alertElement.style.color = '#fff';
                break;
            case AlertManager.INFO:
                alertElement.style.backgroundColor = '#2196f3';
                alertElement.style.color = '#fff';
                break;
        }

        // 添加到页面
        document.body.appendChild(alertElement);

        // 关闭按钮事件
        const closeButton = alertElement.querySelector('.alert-close');
        closeButton.addEventListener('click', () => {
            alertElement.remove();
        });

        // 自动关闭
        setTimeout(() => {
            if (alertElement.parentNode) {
                alertElement.style.animation = 'slideOut 0.3s ease-in-out';
                setTimeout(() => alertElement.remove(), 300);
            }
        }, duration);
    }

    static success(message, duration) {
        this.show(message, AlertManager.SUCCESS, duration);
    }

    static error(message, duration) {
        this.show(message, AlertManager.ERROR, duration);
    }

    static warning(message, duration) {
        this.show(message, AlertManager.WARNING, duration);
    }

    static info(message, duration) {
        this.show(message, AlertManager.INFO, duration);
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .alert {
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }

    .alert-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .alert-close {
        background: none;
        border: none;
        color: inherit;
        font-size: 20px;
        cursor: pointer;
        padding: 0 5px;
        margin-left: 15px;
    }

    .alert-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);
