"""i18n 国际化服务."""

from typing import Any

# 错误消息翻译资源
MESSAGES: dict[str, dict[str, str]] = {
    "zh-CN": {
        "user_not_found": "用户不存在",
        "task_not_found": "任务不存在",
        "report_not_found": "报告不存在",
        "share_not_found": "分享不存在或已失效",
        "share_expired": "分享已过期",
        "password_error": "密码错误",
        "credits_insufficient": "分析额度不足",
        "file_too_large": "文件大小超过限制",
        "file_type_not_allowed": "文件类型不允许",
        "task_failed": "分析任务失败",
        "rate_limit_exceeded": "请求频率超限",
        "token_expired": "会话已过期，请重新登录",
        "scenario_not_found": "场景不存在",
        "validation_error": "参数校验失败",
        "invite_code_invalid": "邀请码无效",
        "invite_already_bound": "已绑定邀请关系，无法重复领取",
    },
    "en": {
        "user_not_found": "User not found",
        "task_not_found": "Task not found",
        "report_not_found": "Report not found",
        "share_not_found": "Share not found or expired",
        "share_expired": "Share has expired",
        "password_error": "Password incorrect",
        "credits_insufficient": "Insufficient credits",
        "file_too_large": "File size exceeds limit",
        "file_type_not_allowed": "File type not allowed",
        "task_failed": "Analysis task failed",
        "rate_limit_exceeded": "Rate limit exceeded",
        "token_expired": "Session expired, please log in again",
        "scenario_not_found": "Scenario not found",
        "validation_error": "Validation error",
        "invite_code_invalid": "Invalid invite code",
        "invite_already_bound": "Invite relationship already bound",
    },
}

DEFAULT_LANG = "zh-CN"


def get_message(key: str, lang: str = DEFAULT_LANG, **kwargs: Any) -> str:
    """获取国际化消息."""
    lang_messages = MESSAGES.get(lang, MESSAGES[DEFAULT_LANG])
    msg = lang_messages.get(key, MESSAGES[DEFAULT_LANG].get(key, key))
    if kwargs:
        try:
            return msg.format(**kwargs)
        except (KeyError, IndexError):
            pass
    return msg


def get_user_lang(user: Any) -> str:
    """获取用户语言偏好."""
    if user and hasattr(user, "preferred_language") and user.preferred_language:
        return user.preferred_language
    return DEFAULT_LANG
