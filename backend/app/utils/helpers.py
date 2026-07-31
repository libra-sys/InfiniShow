"""通用辅助函数."""

import secrets
import string
import ulid


def generate_ulid() -> str:
    """生成 ULID."""
    return str(ulid.new())


def generate_token(length: int = 32) -> str:
    """生成随机 Token."""
    return "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(length))


def generate_share_token() -> str:
    """生成分享 Token."""
    return secrets.token_urlsafe(32)


def mask_phone(phone: str) -> str:
    """手机号脱敏."""
    if len(phone) != 11:
        return phone
    return f"{phone[:3]}****{phone[-4:]}"
