// 存储所有视频播放器实例
const players = new Map();

// 存储MediaRecorder实例和录制的数据
let mediaRecorder = null;
let recordedChunks = [];

// 检查支持的MIME类型
function getSupportedMimeType() {
    const possibleTypes = [
        'video/mp4;codecs=h264,aac',
        'video/webm;codecs=h264,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus'
    ];
    
    for (const type of possibleTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return null;
}

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

    const addButtonContainer = videoGrid.querySelector('.video-item:last-child');
    if (!addButtonContainer) {
        console.error('找不到添加按钮容器');
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
    videoGrid.insertBefore(videoItem, addButtonContainer);
    
    // 绑定控制按钮事件
    bindVideoControls(videoItem);
    
    // 关闭弹窗
    closeModal();
}

// 截图功能
function takeScreenshot(videoElement) {
    // 检查视频是否正在播放
    if (!videoElement.srcObject) {
        alert('请先开始视频流播放');
        return;
    }

    try {
        // 创建canvas元素
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        // 在canvas上绘制当前视频帧
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // 将canvas内容转换为blob
        canvas.toBlob(function(blob) {
            // 创建FormData对象
            const formData = new FormData();
            formData.append('screenshot', blob, 'screenshot.jpg');
            
            // 发送到服务器
            fetch('/auth/screenshot', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('截图成功');
                } else {
                    alert(data.message || '截图失败');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('截图失败，请重试');
            });
        }, 'image/jpeg', 0.95); // 使用JPEG格式，95%的质量
    } catch (error) {
        console.error('Screenshot error:', error);
        alert('截图失败，请重试');
    }
}

// 开始录像
function startRecording(videoElement, recordBtn) {
    if (!videoElement.srcObject) {
        alert('请先开始视频流播放');
        return;
    }

    try {
        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            throw new Error('浏览器不支持视频录制');
        }

        // 创建MediaRecorder实例
        mediaRecorder = new MediaRecorder(videoElement.srcObject, {
            mimeType: mimeType,
            videoBitsPerSecond: 2500000 // 2.5Mbps
        });

        // 处理录制的数据
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        // 录制停止时的处理
        mediaRecorder.onstop = function() {
            // 创建Blob对象
            const blob = new Blob(recordedChunks, {
                type: mimeType
            });

            // 创建FormData对象
            const formData = new FormData();
            const fileExtension = mimeType.startsWith('video/mp4') ? '.mp4' : '.webm';
            formData.append('video', blob, 'recording' + fileExtension);

            // 发送到服务器
            fetch('/auth/save_recording', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('录制已保存');
                } else {
                    alert(data.message || '保存录制失败');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('保存录制失败，请重试');
            })
            .finally(() => {
                // 清理录制数据
                recordedChunks = [];
                recordBtn.textContent = '开始录像';
                recordBtn.classList.remove('recording');
            });
        };

        // 开始录制
        recordedChunks = [];
        mediaRecorder.start(1000); // 每秒生成一个数据片段
        recordBtn.textContent = '停止录像';
        recordBtn.classList.add('recording');
        
    } catch (error) {
        console.error('Recording error:', error);
        alert('无法开始录制：' + error.message);
    }
}

// 停止录像
function stopRecording(recordBtn) {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
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
    const screenshotBtn = videoItem.querySelector('.screenshot-btn');
    const recordBtn = videoItem.querySelector('.record-btn');
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
    
    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', () => takeScreenshot(video));
    }
    
    if (recordBtn) {
        recordBtn.addEventListener('click', () => {
            if (recordBtn.classList.contains('recording')) {
                stopRecording(recordBtn);
            } else {
                startRecording(video, recordBtn);
            }
        });
    }
    
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