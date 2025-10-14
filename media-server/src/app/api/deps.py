from fastapi import Depends, HTTPException

from app.config.manager import ConfigManager
from app.services.audio_preprocessor import AudioPreprocessor
from app.services.cache_manager import CacheManager
from app.services.jit_transcoder import JITTranscoder
from app.services.preload_strategy import PreloadStrategy
from app.services.session_manager import SessionManager


async def get_cache_manager():
    return CacheManager()


async def get_jit_transcoder():
    return JITTranscoder()


async def get_preload_strategy(
    jit_transcoder: JITTranscoder = Depends(get_jit_transcoder),
):
    """获取预加载策略实例"""
    config = ConfigManager()
    max_preload_tasks = getattr(config.app_settings, "max_preload_tasks", 2)
    return PreloadStrategy(jit_transcoder, max_preload_tasks)


async def get_session_manager(
    jit_transcoder: JITTranscoder = Depends(get_jit_transcoder),
):
    # 如果启用混合模式，传入音频预处理器
    audio_preprocessor = None
    config = ConfigManager()
    if config.app_settings.enable_hybrid_mode:
        audio_preprocessor = AudioPreprocessor()
    return SessionManager(jit_transcoder, audio_preprocessor)


async def get_audio_preprocessor():
    """获取音频预处理器实例"""
    config = ConfigManager()
    if config.app_settings.enable_hybrid_mode is False:
        raise HTTPException(status_code=400, detail="混合转码模式未启用")
    return AudioPreprocessor()
