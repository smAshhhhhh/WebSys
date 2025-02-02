import cv2
import torch
import subprocess

# 1. 加载训练好的 YOLO 模型
model = torch.hub.load('D:/Code/github/yolov5', 'custom', path='runs/train/exp11/weights/best.pt', source='local')

# 2. 输入和输出流地址
input_stream = "rtsp://192.168.0.144:554/11"  # 输入 RTSP 流
output_stream = "rtmp://172.26.83.182/live/video10"  # 输出 RTMP 流地址

# 3. 打开 RTSP 视频流
cap = cv2.VideoCapture(input_stream)
if not cap.isOpened():
    print("无法打开输入流")
    exit()

# 4. 获取视频属性
fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25  # 默认 FPS 为 25
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

command = [
    'ffmpeg',
    '-re',  # 模拟实时流
    '-f', 'rawvideo',  # 输入为原始视频流
    '-vcodec', 'rawvideo',  # 输入原始格式
    '-pix_fmt', 'bgr24',  # OpenCV 默认颜色格式
    '-s', f'{width}x{height}',  # 分辨率
    '-r', '30',  # 帧率
    '-i', '-',  # 从标准输入读取流
    '-c:v', 'libx264',  # 使用 H.264 编码器
    '-pix_fmt', 'yuv420p',  # 输出格式
    '-preset', 'ultrafast',  # 编码速度优化
    '-tune', 'zerolatency',  # 低延迟优化
    '-g', '30',  # 设置关键帧间隔为 25 帧
    '-f', 'flv',  # 输出格式为 FLV (RTMP 默认使用 FLV 格式)
    output_stream,  # 输出流地址
]

# 6. 启动 FFmpeg 子进程
proc = subprocess.Popen(command, stdin=subprocess.PIPE)

# 7. 读取和处理每一帧
while True:
    ret, frame = cap.read()
    if not ret:
        print("无法读取帧")
        break

    # 8. 使用 YOLO 模型进行检测
    results = model(frame)

    # 9. 绘制检测框和标签
    boxes = results.xyxy[0].cpu().numpy()  # 获取检测结果
    for box in boxes:
        x1, y1, x2, y2, conf, cls = box
        if conf > 0.5:  # 设置置信度阈值
            label = f'{model.names[int(cls)]}: {conf:.2f}'
            # 绘制检测框
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (255, 0, 0), 2)
            # 绘制标签
            cv2.putText(frame, label, (int(x1), int(y1) - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 0, 0), 2)

    # 10. 将处理后的帧推送到 FFmpeg
    proc.stdin.write(frame.tobytes())

# 11. 释放资源
cap.release()
proc.stdin.close()
proc.wait()
cv2.destroyAllWindows()
