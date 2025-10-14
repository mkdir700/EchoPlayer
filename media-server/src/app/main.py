import logging
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from .api.router import router as api_router
from .schemas.common import ErrorResponse
from .services.audio_preprocessor import AudioPreprocessor
from .services.cache_manager import CacheManager
from .services.jit_transcoder import JITTranscoder
from .services.session_manager import SessionManager
from .utils.log_config import configure_uvicorn_logging, setup_logging
from .config import ConfigManager

config = ConfigManager()
settings = config.app_settings

# 配置统一日志系统
setup_logging(level="INFO" if not settings.debug else "DEBUG")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    _ = app
    # 启动时初始化
    logger.info("🚀 EchoPlayer 转码服务启动中...")
    logger.info("📁 会话目录: %s", settings.sessions_root)
    logger.info("🎬 FFmpeg 路径: %s", settings.ffmpeg_path)
    logger.info("🎬 FFProbe 路径: %s", settings.ffprobe_path)

    # 混合转码模式检查
    if settings.enable_hybrid_mode:
        logger.info("🎵 混合转码模式已启用")
        logger.info("📁 音频缓存目录: %s", settings.audio_cache_root)

    # 初始化核心服务
    jit_transcoder = JITTranscoder()

    # 初始化音频预处理器（混合模式）
    audio_preprocessor = None
    if settings.enable_hybrid_mode:
        audio_preprocessor = AudioPreprocessor()
        await audio_preprocessor.start_background_tasks()
        logger.info("🎵 音频预处理器已启动")

    cache_manager = CacheManager()
    session_manager = SessionManager(jit_transcoder, audio_preprocessor)

    # 启动后台清理任务
    cache_manager.start_background_cleanup(jit_transcoder)

    yield

    # 关闭时清理
    logger.info("🛑 转码服务关闭中...")

    session_manager.shutdown()
    jit_transcoder.shutdown()

    # 关闭音频预处理器
    if audio_preprocessor:
        audio_preprocessor.shutdown()
        logger.info("🎵 音频预处理器已关闭")


# 创建 FastAPI 应用
app = FastAPI(
    title="EchoPlayer Backend Service",
    description="高性能视频实时转码服务，支持 H.265/AC3/DTS 等格式转码为浏览器兼容的 HLS 流",
    version="1.0.0",
    lifespan=lifespan,
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://127.0.0.1:8799",
        "http://localhost:5500",
        "http://localhost:8799",
        "file://",  # 支持本地文件访问
    ],  # 允许本地开发和文件访问
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有头部
)

app.include_router(api_router)

# 挂载静态文件服务（用于 HLS 分片文件）
sessions_path = Path(settings.sessions_root)
if sessions_path.exists():
    app.mount("/sessions", StaticFiles(directory=str(sessions_path)), name="sessions")

# 挂载调试/静态资源，便于直接访问调试页面
assets_path = Path(__file__).resolve().parents[2] / "assets"
if assets_path.exists():
    app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")

# 为分段转码添加片段文件服务支持
# 注意：分段文件通过API路由 /api/segment/segments/{segment_id}/{file_name} 提供


@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    """处理验证错误"""
    _ = request
    return JSONResponse(
        status_code=422,
        content=ErrorResponse(
            error="ValidationError",
            message="请求参数验证失败",
            details={"errors": exc.errors()},
        ).model_dump(),
    )


@app.exception_handler(FileNotFoundError)
async def file_not_found_handler(request, exc):
    """处理文件不存在错误"""
    _ = request
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(
            error="FileNotFound",
            message=str(exc),
            details={"suggestion": "请检查文件路径是否正确"},
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def uncatch_error_handler(request, exc):
    """处理未捕获的异常"""
    _ = request
    logger.exception(exc)
    return JSONResponse(
        status_code=404,
        content=ErrorResponse(
            error="InternalError",
            message="内部异常",
            details={"suggestion": "请查看日志文件"},
        ).model_dump(),
    )


def main():
    """主入口函数"""

    # 配置 uvicorn 日志
    configure_uvicorn_logging()

    logger.info("🎬 启动 EchoPlayer 转码服务...")

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
        access_log=True,
        log_config=None,  # 使用我们的自定义配置
    )


if __name__ == "__main__":
    main()
