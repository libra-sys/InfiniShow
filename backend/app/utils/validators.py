"""自定义校验器."""

import re


PHONE_PATTERN = re.compile(r"^1[3-9]\d{9}$")


def validate_phone(phone: str) -> bool:
    """校验手机号."""
    return bool(PHONE_PATTERN.match(phone))


def generate_invite_code(phone: str) -> str:
    """基于手机号生成邀请码."""
    import hashlib
    hash_value = hashlib.md5(phone.encode()).hexdigest()[:8].upper()
    return f"INF{hash_value}"
