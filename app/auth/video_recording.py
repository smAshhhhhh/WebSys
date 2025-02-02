import os
import subprocess
from datetime import datetime
from flask import current_app

def save_recording(video_file, user_id):
    """保存录制的视频文件"""
    try:
        # 获取原始文件扩展名
        original_filename = video_file.filename
        extension = original_filename.rsplit('.', 1)[1].lower()
        
        # 生成文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        temp_filename = f"temp_recording_{user_id}_{timestamp}.{extension}"
        final_filename = f"recording_{user_id}_{timestamp}.mp4"
        
        # 确保目录存在
        recordings_dir = os.path.join(current_app.root_path, 'static', 'records', 'recordings')
        os.makedirs(recordings_dir, exist_ok=True)
        
        # 临时文件和最终文件的路径
        temp_filepath = os.path.join(recordings_dir, temp_filename)
        final_filepath = os.path.join(recordings_dir, final_filename)
        
        # 保存原始文件
        video_file.save(temp_filepath)
        
        # 检查文件是否成功保存
        if not os.path.exists(temp_filepath) or os.path.getsize(temp_filepath) == 0:
            return False, "视频保存失败"
        
        try:
            # 转换为MP4格式（如果需要）
            if extension != 'mp4':
                command = [
                    'ffmpeg',
                    '-i', temp_filepath,
                    '-c:v', 'libx264',  # 视频编码器
                    '-preset', 'fast',   # 编码速度
                    '-crf', '22',        # 视频质量
                    '-c:a', 'aac',       # 音频编码器
                    '-strict', 'experimental',
                    '-movflags', '+faststart',  # 优化MP4文件结构
                    final_filepath
                ]
                
                # 执行转换
                subprocess.run(command, check=True, capture_output=True)
                
                # 删除临时文件
                os.remove(temp_filepath)
                
                # 检查转换后的文件
                if not os.path.exists(final_filepath) or os.path.getsize(final_filepath) == 0:
                    return False, "视频格式转换失败"
            else:
                # 如果已经是MP4格式，直接重命名
                os.rename(temp_filepath, final_filepath)
        
            # 获取视频时长
            duration = 0
            try:
                duration_cmd = [
                    'ffprobe',
                    '-v', 'error',
                    '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1',
                    final_filepath
                ]
                duration = float(subprocess.check_output(duration_cmd).decode().strip())
            except Exception as e:
                print(f"获取视频时长错误: {str(e)}")
                # 如果无法获取时长，不影响保存
                duration = 0
            
            # 返回相对路径
            relative_path = os.path.join('records', 'recordings', final_filename).replace('\\', '/')
            
            return True, {
                'filename': relative_path,
                'duration': int(duration)
            }
            
        except subprocess.CalledProcessError as e:
            print(f"视频转换错误: {e.stderr.decode() if e.stderr else str(e)}")
            return False, "视频格式转换失败"
            
    except Exception as e:
        print(f"保存视频错误: {str(e)}")
        return False, str(e)

def convert_webm_to_mp4(filepath):
    """将WebM格式转换为MP4格式（如果需要）"""
    try:
        output_filepath = filepath.rsplit('.', 1)[0] + '.mp4'
        command = [
            'ffmpeg',
            '-i', filepath,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '22',
            '-c:a', 'aac',
            '-strict', 'experimental',
            output_filepath
        ]
        
        subprocess.run(command, check=True, capture_output=True)
        
        # 检查转换后的文件
        if os.path.exists(output_filepath) and os.path.getsize(output_filepath) > 0:
            # 删除原WebM文件
            os.remove(filepath)
            return True, output_filepath
        else:
            return False, "转换后的文件无效"
            
    except Exception as e:
        print(f"视频转换错误: {str(e)}")
        return False, str(e) 