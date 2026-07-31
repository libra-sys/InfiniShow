"""对象存储客户端 — MinIO 或本地文件系统."""

import io
import logging
import os
from typing import Any

from app.config import get_settings

logger = logging.getLogger("infinshow.storage")


class LocalFileStorage:
    """本地文件系统存储（MinIO 不可用时降级使用）."""

    def __init__(self, upload_dir: str):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def upload_file(self, object_name: str, content: bytes, content_type: str = "application/octet-stream") -> None:
        file_path = os.path.join(self.upload_dir, object_name.replace("/", os.sep))
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(content)

    def download_file(self, object_name: str) -> bytes:
        file_path = os.path.join(self.upload_dir, object_name.replace("/", os.sep))
        with open(file_path, "rb") as f:
            return f.read()

    def delete_file(self, object_name: str) -> None:
        file_path = os.path.join(self.upload_dir, object_name.replace("/", os.sep))
        try:
            os.remove(file_path)
        except FileNotFoundError:
            pass

    def get_presigned_url(self, object_name: str, expires: int = 3600) -> str:
        # 本地存储返回相对路径，前端通过 /api/v1/files/download 访问
        return f"/api/v1/files/download/{object_name.split('/')[-1]}"


class MinIOClient:
    """MinIO 客户端封装."""

    def __init__(self):
        settings = get_settings()
        self._settings = settings
        self.bucket_name = settings.minio_bucket_name
        self._bucket_ready = False

        if settings.has_minio:
            try:
                from minio import Minio
                self.client = Minio(
                    settings.minio_endpoint,
                    access_key=settings.minio_access_key,
                    secret_key=settings.minio_secret_key,
                    secure=settings.minio_secure,
                )
                self._is_minio = True
                logger.info("MinIO client initialized: %s", settings.minio_endpoint)
            except Exception as e:
                logger.warning("MinIO init failed, using local storage: %s", e)
                self.client = LocalFileStorage(settings.local_upload_dir)
                self._is_minio = False
        else:
            self.client = LocalFileStorage(settings.local_upload_dir)
            self._is_minio = False
            logger.info("Using local file storage: %s", settings.local_upload_dir)

    def _ensure_bucket(self) -> None:
        """确保 bucket 存在（仅 MinIO 模式）."""
        if not self._is_minio or self._bucket_ready:
            return
        try:
            from minio.error import S3Error
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
            self._bucket_ready = True
        except Exception:
            pass

    def upload_file(self, object_name: str, content: bytes, content_type: str = "application/octet-stream") -> None:
        if self._is_minio:
            self._ensure_bucket()
            self.client.put_object(
                self.bucket_name,
                object_name,
                io.BytesIO(content),
                length=len(content),
                content_type=content_type,
            )
        else:
            self.client.upload_file(object_name, content, content_type)

    def download_file(self, object_name: str) -> bytes:
        if self._is_minio:
            response = self.client.get_object(self.bucket_name, object_name)
            try:
                return response.read()
            finally:
                response.close()
                response.release_conn()
        else:
            return self.client.download_file(object_name)

    def delete_file(self, object_name: str) -> None:
        if self._is_minio:
            self.client.remove_object(self.bucket_name, object_name)
        else:
            self.client.delete_file(object_name)

    def get_presigned_url(self, object_name: str, expires: int = 3600) -> str:
        if self._is_minio:
            from datetime import timedelta
            return self.client.presigned_get_object(
                self.bucket_name,
                object_name,
                expires=timedelta(seconds=expires),
            )
        else:
            return self.client.get_presigned_url(object_name)


minio_client = MinIOClient()
