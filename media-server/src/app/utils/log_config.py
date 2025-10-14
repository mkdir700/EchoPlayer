"""
统一日志配置模块
为FastAPI和应用程序提供一致的日志格式
"""

import logging
import logging.config
import sys
from datetime import datetime
from typing import Any


class EchoPlayerFormatter(logging.Formatter):
    """EchoPlayer 统一日志格式化器"""

    # 日志级别颜色映射
    LEVEL_COLORS = {
        "DEBUG": "\033[37m",  # 白色
        "INFO": "\033[32m",  # 绿色
        "WARNING": "\033[33m",  # 黄色
        "ERROR": "\033[31m",  # 红色
        "CRITICAL": "\033[35m",  # 紫色
    }

    RESET = "\033[0m"

    def __init__(self, use_colors: bool = True):
        super().__init__()
        self.use_colors = use_colors

    def format(self, record: logging.LogRecord) -> str:
        """格式化日志记录"""

        # 获取时间戳
        timestamp = datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S")

        # 获取日志级别
        level = record.levelname

        # 获取模块名
        module = record.name

        # 简化模块名显示
        if module.startswith("app."):
            module = module[4:]  # 移除 "app." 前缀
        elif module == "uvicorn.access":
            module = "access"
        elif module.startswith("uvicorn"):
            module = "server"

        # 获取消息
        message = record.getMessage()

        # 应用颜色（如果启用）
        if self.use_colors:
            level_color = self.LEVEL_COLORS.get(level, "")
            level = f"{level_color}{level}{self.RESET}"
            module = f"\033[36m{module}{self.RESET}"  # 青色

        # 格式化最终消息
        formatted = f"{timestamp} [{level}] {module}: {message}"

        # 如果有异常信息，添加到末尾
        if record.exc_info:
            formatted += f"\n{self.formatException(record.exc_info)}"

        return formatted


# 移除自定义的访问日志格式化器，使用uvicorn默认的


def setup_logging(level: str = "INFO", use_colors: bool = True) -> None:
    """
    配置统一的日志系统

    Args:
        level: 日志级别
        use_colors: 是否使用颜色
    """

    # 创建根日志器
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))

    # 移除现有的处理器
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # 创建控制台处理器
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(EchoPlayerFormatter(use_colors=use_colors))

    # 添加处理器到根日志器
    root_logger.addHandler(console_handler)

    # 配置特定日志器

    # 设置应用程序日志级别
    app_logger = logging.getLogger("app")
    app_logger.setLevel(getattr(logging, level.upper()))

    # 配置uvicorn日志
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(logging.INFO)

    # 配置uvicorn访问日志
    access_logger = logging.getLogger("uvicorn.access")
    access_logger.setLevel(logging.INFO)

    # 设置第三方库的日志级别
    logging.getLogger("multipart").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)

    # 禁用一些过于冗长的日志
    logging.getLogger("watchfiles.main").disabled = True


def get_uvicorn_log_config() -> dict[str, Any]:
    """
    获取uvicorn的日志配置

    Returns:
        uvicorn日志配置字典
    """

    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "()": EchoPlayerFormatter,
                "use_colors": True,
            },
            "access": {
                "()": "uvicorn.logging.AccessFormatter",
                "fmt": '%(levelprefix)s %(client_addr)s - "%(request_line)s" %(status_code)s',
                "use_colors": True,
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
            "access": {
                "formatter": "access",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
            "uvicorn.error": {
                "handlers": ["default"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["access"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }


def configure_uvicorn_logging() -> None:
    """配置uvicorn使用统一的日志格式"""
    log_config = get_uvicorn_log_config()
    logging.config.dictConfig(log_config)
