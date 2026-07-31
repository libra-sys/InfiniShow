"""Celery 兼容层 — 无 Redis 时直接同步执行任务."""

import asyncio
import logging
import functools
from typing import Any, Callable

from app.config import get_settings

logger = logging.getLogger("infinshow.tasks")


class _TaskWrapper:
    """模拟 Celery task 对象，支持 .delay() 调用."""

    def __init__(self, func: Callable):
        self._func = func
        functools.update_wrapper(self, func)

    def __call__(self, *args, **kwargs):
        return self._func(*args, **kwargs)

    def delay(self, *args, **kwargs):
        """异步调用 — 有 Celery 时走 Celery，否则在线程池中执行."""
        settings = get_settings()
        if settings.has_redis:
            try:
                # 尝试用真实 Celery
                from app.tasks.celery_app import celery_app
                task = celery_app.signature(self._func.__name__, args=args, kwargs=kwargs)
                return task.apply_async()
            except Exception as e:
                logger.warning("Celery dispatch failed, running sync: %s", e)

        # 无 Celery：在新线程中异步执行（不阻塞请求）
        import threading
        def _run():
            try:
                self._func(*args, **kwargs)
            except Exception as e:
                logger.error("Task execution failed: %s", e)

        thread = threading.Thread(target=_run, daemon=True)
        thread.start()
        logger.info("Task %s dispatched in thread", self._func.__name__)
        return {"status": "accepted"}


def task(func: Callable) -> _TaskWrapper:
    """装饰器：替换 celery_app.task，无 Celery 时降级为线程执行."""
    return _TaskWrapper(func)
