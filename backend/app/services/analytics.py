"""数据埋点服务."""

import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("infinshow.analytics")

# 核心事件清单
EVENT_TYPES = {
    "page_view": "页面切换",
    "button_click": "按钮点击",
    "scenario_select": "选择场景",
    "task_create": "创建分析任务",
    "task_complete": "任务完成",
    "task_fail": "任务失败",
    "report_view": "查看报告",
    "trace_expand": "展开溯源抽屉",
    "follow_up_ask": "发起追问",
    "share_generate": "生成分享链接",
    "share_visit": "访问分享链接",
    "invite_convert": "邀请转化",
    "credit_consume": "消耗额度",
    "credit_grant": "发放额度",
    "policy_click": "点击政策链接",
}


async def track_event(
    event_name: str,
    user_id: str | None = None,
    anonymous_id: str | None = None,
    properties: dict[str, Any] | None = None,
) -> None:
    """记录埋点事件.

    Args:
        event_name: 事件名（见 EVENT_TYPES）
        user_id: 用户 ID（已登录）
        anonymous_id: 匿名 ID（未登录）
        properties: 事件属性
    """
    if event_name not in EVENT_TYPES:
        logger.warning("Unknown event type: %s", event_name)

    event = {
        "event_name": event_name,
        "user_id": user_id,
        "anonymous_id": anonymous_id,
        "properties": properties or {},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # 记录到日志（生产环境可替换为 PostHog/自建 collector）
    logger.info("analytics_event: %s", event)

    # 可选：写入 Redis 异步队列后续批量写入
    try:
        from app.services.redis_client import get_redis
        redis = await get_redis()
        await redis.lpush("analytics_events", __import__("json").dumps(event, ensure_ascii=False))
    except Exception:
        pass  # 埋点失败不影响主流程


async def track_batch(events: list[dict[str, Any]]) -> None:
    """批量记录事件."""
    for evt in events:
        await track_event(
            evt.get("event_name", ""),
            user_id=evt.get("user_id"),
            anonymous_id=evt.get("anonymous_id"),
            properties=evt.get("properties"),
        )
