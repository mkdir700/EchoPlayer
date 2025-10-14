"""健康检查 API

提供服务状态检查接口,用于监控服务是否正常运行
"""

import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    """健康检查接口

    Returns:
        SuccessResponse: 服务正常运行的响应
    """
    return {"message": "ok"}
