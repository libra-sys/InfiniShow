"""MinIO 客户端封装."""

import io
from functools import lru_cache
from typing import BinaryIO

from minio import Minio
from minio.error import S3Error

from app.config import get_settings


@lru_cache
def get_minio_client() -> Minio:
    """获取 MinIO 客户端单例."""
    settings = get_settings()
    return Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )


class MinioStorage:
    """MinIO 存储操作类."""

    def __init__(self) -> None:
        self.client = get_minio_client()
        self.bucket_name = get_settings().minio_bucket_name
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        """确保存储桶存在."""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
        except S3Error as e:
            raise RuntimeError(f"MinIO bucket operation failed: {e}") from e

    def upload_file(
        self,
        object_name: str,
        data: BinaryIO | bytes,
        length: int,
        content_type: str = "application/octet-stream",
    ) -> str:
        """上传文件."""
        if isinstance(data, bytes):
            data = io.BytesIO(data)
        self.client.put_object(
            self.bucket_name,
            object_name,
            data,
            length,
            content_type=content_type,
        )
        return object_name

    def download_file(self, object_name: str) -> bytes:
        """下载文件."""
        response = self.client.get_object(self.bucket_name, object_name)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def get_presigned_url(self, object_name: str, expires: int = 3600) -> str:
        """获取临时访问 URL."""
        return self.client.presigned_get_object(self.bucket_name, object_name, expires=expires)

    def delete_file(self, object_name: str) -> None:
        """删除文件."""
        self.client.remove_object(self.bucket_name, object_name)
