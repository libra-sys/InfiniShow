"""应用配置管理."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """应用配置."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = Field(default=False)
    log_level: str = Field(default="INFO")
    secret_key: str = Field(default="dev-secret-key-change-in-production")
    access_token_expire_minutes: int = Field(default=15)
    refresh_token_expire_days: int = Field(default=7)

    # CORS
    allowed_origins: str = "http://localhost:5173"

    # Database — 可选，不配置时用 SQLite
    database_url: str = Field(default="sqlite+aiosqlite:///./infinshow.db")
    database_url_sync: str = Field(default="sqlite:///./infinshow.db")

    # Redis — 可选，不配置时用内存缓存
    redis_url: str = Field(default="")
    celery_broker_url: str = Field(default="")
    celery_result_backend: str = Field(default="")

    # Object Storage — 可选，不配置时用本地文件系统
    minio_endpoint: str = Field(default="")
    minio_access_key: str = Field(default="")
    minio_secret_key: str = Field(default="")
    minio_bucket_name: str = Field(default="infinshow")
    minio_secure: bool = Field(default=False)

    # 本地文件存储目录（MinIO 不可用时使用）
    local_upload_dir: str = Field(default="./uploads")

    # InfiniSynapse
    infinisynapse_api_key: str = Field(default="")
    infinisynapse_base_url: str = Field(default="https://app.infinisynapse.cn")

    # Rate Limits
    rate_limit_general: str = Field(default="100/minute")
    rate_limit_login: str = Field(default="5/minute")
    rate_limit_task_create: str = Field(default="10/hour")

    @field_validator("allowed_origins")
    @classmethod
    def _validate_allowed_origins(cls, v: str) -> str:
        if not v:
            return "http://localhost:5173"
        return v

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def has_redis(self) -> bool:
        return bool(self.redis_url and self.redis_url.startswith("redis"))

    @property
    def has_minio(self) -> bool:
        return bool(self.minio_endpoint and self.minio_access_key)

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.database_url


@lru_cache
def get_settings() -> Settings:
    """获取应用配置单例."""
    return Settings()
