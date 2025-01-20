// 定义一个变量用于存储 ZLMRTCClient 实例
let player = null;

// 启动播放流的函数
function start() {
    stop(); // 在启动新播放器之前，先停止任何现有的播放器
    const streamUrl = document.getElementById("streamUrl").value.trim(); // 获取用户输入的流 URL

    if (!streamUrl) {
        alert("请填写有效的流地址！");
        return;
    }

    try {
        // 创建 ZLMRTCClient 的 Endpoint 实例
        player = new ZLMRTCClient.Endpoint({
            element: document.getElementById("video"), // 绑定到视频元素
            zlmsdpUrl: streamUrl, // 流的 URL
            recvOnly: true, // 仅接收模式（播放模式）
            debug: true, // 启用调试日志
        });

        // 监听远程流事件
        player.on(ZLMRTCClient.Events.WEBRTC_ON_REMOTE_STREAMS, function (stream) {
            console.log("Stream received:", stream);
        });

        // 监听连接状态变化事件
        player.on(ZLMRTCClient.Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, function (state) {
            console.log("Connection state changed:", state);
        });

        // 监听 ICE 候选错误事件
        player.on(ZLMRTCClient.Events.WEBRTC_ICE_CANDIDATE_ERROR, function () {
            console.error("ICE negotiation failed.");
        });

        // 监听 Offer/Answer 交换失败事件
        player.on(ZLMRTCClient.Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, function (error) {
            console.error("Offer/Answer exchange failed:", error);
            stop(); // 发生错误时停止播放
        });
    } catch (error) {
        console.error("启动播放器时发生错误:", error);
        alert("无法启动播放器，请检查控制台以获取更多信息。");
    }
}

// 停止播放流的函数
function stop() {
    if (player) {
        player.close(); // 关闭 ZLMRTCClient 实例
        player = null;

        const videoElement = document.getElementById("video");
        videoElement.srcObject = null; // 清除视频源
        videoElement.load(); // 重新加载视频元素
    }
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 可以在这里添加其他初始化代码
}); 