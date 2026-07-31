"""全局常量与枚举."""

from enum import Enum


class StrEnum(str, Enum):
    """兼容 Python < 3.11 的字符串枚举."""

    def __str__(self) -> str:
        return self.value


class UserRole(StrEnum):
    """用户角色."""

    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class TaskStatus(StrEnum):
    """任务状态."""

    PENDING = "pending"
    CONNECTING = "connecting"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ReportStatus(StrEnum):
    """报告状态."""

    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class ConclusionLevel(StrEnum):
    """溯源结论等级."""

    CONSISTENT = "consistent"
    DOUBTFUL = "doubtful"
    INCONSISTENT = "inconsistent"


class CreditType(StrEnum):
    """积分变动类型."""

    REGISTER = "register"
    DAILY_CHECKIN = "daily_checkin"
    INVITE = "invite"
    TASK_CONSUME = "task_consume"
    ADMIN_ADJUST = "admin_adjust"


class FileType(StrEnum):
    """文件类型."""

    EXCEL = "excel"
    CSV = "csv"
    TEMPLATE = "template"
    REPORT = "report"
    POSTER = "poster"


class ShareType(StrEnum):
    """分享类型."""

    REPORT = "report"
    POSTER = "poster"


class PolicyStatus(StrEnum):
    """政策状态."""

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


# 业务常量
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
MAX_UPLOAD_SIZE_MB = 10
ALLOWED_UPLOAD_EXTENSIONS = {".xlsx", ".xls", ".csv"}

# 初始用户积分
INITIAL_CREDITS = 10
# 注册奖励
CREDITS_REGISTER = 10
# 签到奖励
CREDITS_DAILY_CHECKIN = 1
# 邀请奖励
CREDITS_INVITE = 3
# 创建任务消耗
CREDITS_TASK_CONSUME = 1

# SSE 事件缓存时间（秒）
SSE_EVENT_CACHE_SECONDS = 300
# SSE 事件缓存最大条数
SSE_EVENT_CACHE_MAX = 1000
