"""
文件哈希计算工具
用于生成文件资产指纹和配置文件 hash
"""

import hashlib
import json
from pathlib import Path
from typing import Any


def calculate_asset_hash(file_path: str | Path) -> str:
    """
    计算资产文件哈希（采样策略：首尾8MB + 文件信息）

    Args:
        file_path: 文件路径

    Returns:
        str: 16位哈希值
    """
    file_path = Path(file_path)

    if not file_path.exists():
        raise FileNotFoundError(f"文件不存在: {file_path}")

    # 获取文件基本信息
    stat = file_path.stat()

    # 创建 SHA256 哈希对象
    hasher = hashlib.sha256()

    # 添加文件元数据
    hasher.update(str(file_path.absolute()).encode())
    hasher.update(str(stat.st_size).encode())
    hasher.update(str(int(stat.st_mtime)).encode())

    file_size = stat.st_size
    sample_size = 8 * 1024 * 1024  # 8MB

    with file_path.open("rb") as f:
        # 如果文件小于 16MB，读取全部
        if file_size <= sample_size * 2:
            content = f.read()
            hasher.update(content)
        else:
            # 读取文件开头 8MB
            head_data = f.read(sample_size)
            hasher.update(head_data)

            # 读取文件结尾 8MB
            f.seek(-sample_size, 2)  # 从文件末尾向前偏移
            tail_data = f.read(sample_size)
            hasher.update(tail_data)

    # 返回前16位
    return hasher.hexdigest()[:16]


def calculate_profile_hash(profile_config: dict[str, Any], version: str = "0") -> str:
    """
    计算编码配置文件哈希

    Args:
        profile_config: 编码配置字典
        version: 配置版本号

    Returns:
        str: 16位哈希值
    """
    # 添加版本号到配置
    config_with_version = {"version": version, **profile_config}

    # 确保字典键顺序稳定
    config_json = json.dumps(config_with_version, sort_keys=True, ensure_ascii=False)

    # 计算 SHA256 哈希
    hasher = hashlib.sha256()
    hasher.update(config_json.encode("utf-8"))

    # 返回前16位
    return hasher.hexdigest()[:16]


def calculate_window_id(time_seconds: float, window_duration: float) -> int:
    """
    计算时间点对应的窗口ID

    Args:
        time_seconds: 时间点（秒）
        window_duration: 窗口时长（秒）

    Returns:
        int: 窗口ID
    """
    return int(time_seconds // window_duration)


def get_cache_path(
    cache_root: str | Path, asset_hash: str, profile_hash: str, window_id: int
) -> Path:
    """
    生成缓存路径

    Args:
        cache_root: 缓存根目录
        asset_hash: 资产哈希
        profile_hash: 配置哈希
        window_id: 窗口ID

    Returns:
        Path: 缓存目录路径
    """
    cache_root = Path(cache_root)
    window_dir = f"win_{window_id:06d}"

    return cache_root / asset_hash / profile_hash / window_dir
