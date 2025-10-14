from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """错误响应"""

    error: str = Field(..., description="错误类型")
    message: str = Field(..., description="错误描述")
    details: dict[str, Any] | None = Field(None, description="详细信息")
    timestamp: datetime = Field(default_factory=datetime.now, description="错误时间")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "FileNotFound",
                "message": "指定的视频文件不存在",
                "details": {
                    "file_path": "/nonexistent/video.mkv",
                    "suggestion": "请检查文件路径是否正确",
                },
                "timestamp": "2024-01-01T12:00:00Z",
            }
        }
