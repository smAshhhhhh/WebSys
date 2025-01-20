// 存储所有视频播放器实例
const players = new Map();

// 单个视频流的控制函数
function start(videoElement, streamUrl) {
    if (!videoElement || !streamUrl) {
        console.error('视频元素或流地址为空');
        return;
    }

    const playerId = videoElement.id || `video_${Date.now()}`;
    stop(videoElement); // 先停止当前播放

    if (!streamUrl.trim()) {
        alert("请填写有效的流地址！");
        return;
    }

    try {
        // 创建新的播放器实例
        const player = new ZLMRTCClient.Endpoint({
            element: videoElement,
            zlmsdpUrl: streamUrl,
            recvOnly: true,
            debug: true,
        });

        // 存储播放器实例
        players.set(playerId, player);

        // 监听事件
        player.on(ZLMRTCClient.Events.WEBRTC_ON_REMOTE_STREAMS, function (stream) {
            console.log(`Stream received for ${playerId}:`, stream);
        });

        player.on(ZLMRTCClient.Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, function (state) {
            console.log(`Connection state changed for ${playerId}:`, state);
        });

        player.on(ZLMRTCClient.Events.WEBRTC_ICE_CANDIDATE_ERROR, function () {
            console.error(`ICE negotiation failed for ${playerId}`);
        });

        player.on(ZLMRTCClient.Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, function (error) {
            console.error(`Offer/Answer exchange failed for ${playerId}:`, error);
            stop(videoElement);
        });
    } catch (error) {
        console.error(`Error starting player ${playerId}:`, error);
        alert("无法启动播放器，请检查控制台以获取更多信息。");
    }
}

// 停止播放函数
function stop(videoElement) {
    if (!videoElement) {
        console.error('视频元素为空');
        return;
    }

    const playerId = videoElement.id || `video_${Date.now()}`;
    const player = players.get(playerId);
    if (player) {
        try {
            player.close();
            players.delete(playerId);
            videoElement.srcObject = null;
            videoElement.load();
        } catch (error) {
            console.error(`Error stopping player ${playerId}:`, error);
        }
    }
}

// 教师模式：创建新的视频元素
function createVideoElement() {
    const videoId = 'video_' + Date.now();
    const videoHtml = `
        <div class="video-item">
            <div class="video-wrapper">
                <video id="${videoId}" controls autoplay>
                    您的浏览器不支持 HTML5 视频。
                </video>
                <div class="video-controls">
                    <input type="text" class="stream-url" 
                        value="${APP_CONFIG.DEFAULT_STREAM_URL}" 
                        placeholder="请输入流的 URL">
                    <div class="button-group">
                        <button class="start-btn">开始</button>
                        <button class="stop-btn">停止</button>
                        <button class="remove-btn">删除</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    return videoHtml;
}

// 添加新的视频流
function addNewStream() {
    const streamUrl = document.getElementById('newStreamUrl').value.trim();
    if (!streamUrl) {
        alert('请输入视频流地址');
        return;
    }

    const videoGrid = document.getElementById('videoGrid');
    if (!videoGrid) {
        console.error('找不到视频网格容器');
        return;
    }

    const addButton = document.getElementById('addVideoBtn');
    if (!addButton) {
        console.error('找不到添加按钮');
        return;
    }
    
    // 创建新的视频元素
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createVideoElement();
    const videoItem = tempDiv.firstElementChild;
    
    // 设置流地址
    const urlInput = videoItem.querySelector('.stream-url');
    if (urlInput) {
        urlInput.value = streamUrl;
    }
    
    // 插入到添加按钮之前
    videoGrid.insertBefore(videoItem, addButton);
    
    // 绑定控制按钮事件
    bindVideoControls(videoItem);
    
    // 关闭弹窗
    closeModal();
}

// 绑定视频控制按钮事件
function bindVideoControls(videoItem) {
    if (!videoItem) {
        console.error('视频项为空');
        return;
    }

    const video = videoItem.querySelector('video');
    const urlInput = videoItem.querySelector('.stream-url');
    const startBtn = videoItem.querySelector('.start-btn');
    const stopBtn = videoItem.querySelector('.stop-btn');
    const removeBtn = videoItem.querySelector('.remove-btn'); // 可能不存在

    if (!video || !urlInput || !startBtn || !stopBtn) {
        console.error('找不到必要的控制元素');
        return;
    }

    startBtn.addEventListener('click', () => {
        const streamUrl = urlInput.value.trim();
        if (!streamUrl) {
            alert('请输入流地址');
            return;
        }
        start(video, streamUrl);
    });

    stopBtn.addEventListener('click', () => stop(video));
    
    // 只有在教师模式下才有删除按钮
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            if (confirm('确定要删除此视频窗口吗？')) {
                stop(video);
                videoItem.remove();
            }
        });
    }
}

// 显示添加流弹窗
function showModal() {
    const modal = document.getElementById('addStreamModal');
    if (modal) {
        modal.classList.add('show');
        // 重置输入框的值为默认流地址
        const urlInput = modal.querySelector('#newStreamUrl');
        if (urlInput) {
            urlInput.value = APP_CONFIG.DEFAULT_STREAM_URL;
        }
    }
}

// 关闭弹窗
function closeModal() {
    const modal = document.getElementById('addStreamModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 获取用户角色
    const isTeacher = document.querySelector('.teacher-mode') !== null;

    if (isTeacher) {
        // 教师模式：初始化默认视频窗口的控制
        const defaultVideo = document.querySelector('.video-item');
        if (defaultVideo) {
            bindVideoControls(defaultVideo);
        }

        // 添加新视频按钮事件
        const addBtn = document.getElementById('addVideoBtn');
        if (addBtn) {
            addBtn.addEventListener('click', showModal);
        }
    } else {
        // 学生模式：单个视频流的控制
        const videoItem = document.querySelector('.video-item');
        if (videoItem) {
            bindVideoControls(videoItem);
        }
    }
}); 