"""任务服务."""

import asyncio
import json
import logging
import ulid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    CREDITS_TASK_CONSUME,
    SSE_EVENT_CACHE_MAX,
    SSE_EVENT_CACHE_SECONDS,
    TaskStatus,
)
from app.core.exceptions import InsufficientCreditsException, NotFoundException
from app.models.credit_log import CreditLog
from app.models.file_record import FileRecord
from app.models.task import Task
from app.models.user import User
from app.services.infini_client import infini_client
from app.services.redis_client import get_redis

logger = logging.getLogger("infinshow.task")


async def create_task(
    db: AsyncSession,
    user: User,
    scenario_code: str,
    scenario_name: str,
    title: str | None = None,
    prompt_text: str | None = None,
    file_ids: list[str] | None = None,
    quick_fields: dict[str, Any] | None = None,
) -> Task:
    """创建分析任务."""
    # 检查额度
    if user.credits < CREDITS_TASK_CONSUME:
        raise InsufficientCreditsException()

    # 生成连接ID
    conn_id = f"conn_{str(ulid.new()).lower()}"

    task = Task(
        user_id=user.id,
        scenario_code=scenario_code,
        scenario_name=scenario_name,
        title=title or f"{scenario_name}经营分析",
        status=TaskStatus.PENDING.value,
        progress=0,
        conn_id=conn_id,
        prompt_text=prompt_text,
        chat_settings=quick_fields,
    )
    db.add(task)

    # 扣减额度
    user.credits -= CREDITS_TASK_CONSUME
    credit_log = CreditLog(
        user_id=user.id,
        type="task_consume",
        amount=-CREDITS_TASK_CONSUME,
        balance=user.credits,
        related_id=task.id,
    )
    db.add(credit_log)

    # 关联文件
    if file_ids:
        for file_id in file_ids:
            file_record = await db.get(FileRecord, file_id)
            if file_record and file_record.user_id == user.id:
                file_record.task_id = task.id

    await db.commit()
    await db.refresh(task)

    return task


async def start_task(task_id: str) -> None:
    """启动任务（后台异步执行）."""
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        task = await db.get(Task, task_id)
        if not task:
            return

        task.status = TaskStatus.CONNECTING.value
        task.started_at = datetime.now(timezone.utc)
        await db.commit()

        try:
            # 加载用户上传的文件
            from sqlalchemy import select as _select
            result = await db.execute(
                _select(FileRecord).where(FileRecord.task_id == task.id)
            )
            task_files = list(result.scalars().all())

            # 从文件中提取数据摘要，注入 prompt 上下文
            file_summaries = []
            file_contents: list[tuple[str, bytes]] = []  # (file_name, content)

            for f in task_files:
                try:
                    from app.services.minio_client import minio_client
                    content = minio_client.download_file(f.storage_key)
                    from app.services.prompt_engineering import build_file_summary_prompt
                    summary = build_file_summary_prompt(content, f.original_name)
                    summary["file_type"] = f.file_type
                    file_summaries.append(summary)
                    file_contents.append((f.original_name, content))
                except Exception as e:
                    logger.warning("Failed to read file %s: %s", f.original_name, e)

            # 使用提示词工程构建结构化 prompt
            from app.services.prompt_engineering import build_system_prompt
            user_inputs = task.chat_settings if isinstance(task.chat_settings, dict) else None

            # 如果有场景模板 prompt_text，作为补充上下文
            scenario_prompt = task.prompt_text or ""
            system_prompt = build_system_prompt(
                scenario_code=task.scenario_code,
                user_inputs=user_inputs,
                file_summaries=file_summaries if file_summaries else None,
            )

            # 如果场景模板有额外指令，追加到末尾
            if scenario_prompt and "请分析" in scenario_prompt:
                system_prompt = f"{system_prompt}\n\n# 场景补充指令\n{scenario_prompt}"

            logger.info("Prompt length: %d chars, files: %d", len(system_prompt), len(task_files))

            # 官方规范：先连 SSE，再发 newTask
            task.status = TaskStatus.RUNNING.value
            await db.commit()

            # 预生成 taskId（UUID，用于幂等控制）
            import uuid as _uuid
            infini_task_id = str(_uuid.uuid4())
            task.task_id = infini_task_id
            await db.commit()

            # 先启动 SSE 监听（后台 task），再发 newTask
            sse_task = asyncio.create_task(_listen_sse_events(task.id, task.conn_id))

            # 短暂等待确保 SSE 连接已建立
            await asyncio.sleep(0.5)

            # 如果有文件，先上传到 InfiniSynapse 任务工作区
            # 官方端点: POST /api/tools/taskUpload/:taskId
            for file_name, file_content in file_contents:
                try:
                    # 写临时文件供上传
                    import tempfile, os
                    tmp_path = os.path.join(tempfile.gettempdir(), f"infinshow_{infini_task_id}_{file_name}")
                    with open(tmp_path, "wb") as tmp_f:
                        tmp_f.write(file_content)
                    await infini_client.upload_to_task(
                        task_id=infini_task_id,
                        file_path=tmp_path,
                        subdir="upload_documents",
                        naming="original",
                    )
                    os.remove(tmp_path)
                    logger.info("Uploaded file %s to task %s", file_name, infini_task_id)
                except Exception as e:
                    logger.warning("Failed to upload file %s to InfiniSynapse: %s", file_name, e)

            # 发送 newTask（带结构化提示词）
            result = await infini_client.new_task(
                conn_id=task.conn_id,
                text=system_prompt,
                task_id=infini_task_id,
            )
            logger.info("newTask result: code=%s", result.get("code") if isinstance(result, dict) else "N/A")

            # 等待 SSE 监听完成
            await sse_task

        except Exception as e:
            logger.error("Task %s failed: %s", task_id, e)
            task.status = TaskStatus.FAILED.value
            task.error_message = str(e)
            await db.commit()


async def _listen_sse_events(task_id: str, conn_id: str) -> None:
    """监听 InfiniSynapse SSE 事件并缓存到 Redis.

    官方 SSE 事件类型：
    - message.partial: Agent 正在输出（流式）
    - message.add: Agent 新增消息
    - notification: 通知（type=error 为失败）
    - heartbeat: 保活
    - message.ask: Agent 请求用户输入（如 upload_file_to_sandbox）
    - completion_result: 任务完成
    """
    redis = await get_redis()
    cache_key = f"sse_events:{task_id}"

    async for event in infini_client.connect_sse(conn_id):
        event_id = str(ulid.new())

        # 解析官方事件结构
        event_type = event.get("type", "unknown")
        message = event.get("message", {})
        msg_type = message.get("type", "") if isinstance(message, dict) else ""
        msg_say = message.get("say", "") if isinstance(message, dict) else ""
        msg_text = message.get("text", "") if isinstance(message, dict) else ""

        # 判断任务状态（基于实测 SSE 事件流）
        # 事件流: say(reasoning/text 流式输出) → success(完成) 或 ask(请求输入) 或 error(失败)
        is_complete = (
            event_type == "success"
            or msg_type == "success"
            or msg_type == "completion_result"
        )
        is_error = (
            event_type == "error"
            or msg_type == "error"
        )
        is_ask = (
            msg_type == "ask"
            or event_type == "ask"
        )

        event_data = {
            "event_id": event_id,
            "type": "complete" if is_complete else ("error" if is_error else ("ask" if is_ask else "progress")),
            "task_id": task_id,
            "payload": event,
            "raw_type": event_type,
            "msg_type": msg_type,
            "msg_say": msg_say,
            "text": msg_text,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # 缓存到 Redis List
        await redis.rpush(cache_key, json.dumps(event_data, default=str))
        await redis.expire(cache_key, SSE_EVENT_CACHE_SECONDS)
        await redis.ltrim(cache_key, -SSE_EVENT_CACHE_MAX, -1)

        # 更新任务进度
        if is_complete:
            await _complete_task(task_id)
            break
        elif is_error:
            error_msg = msg_text or str(event)
            await _fail_task(task_id, error_msg)
            break
        elif is_ask:
            # Agent 请求用户输入，缓存问题到 Redis 供前端拉取
            await redis.set(
                f"pending_inputs:{task_id}",
                json.dumps([{"field": "input", "question": msg_text[:500] or "请提供更多信息"}], ensure_ascii=False),
                ex=3600,
            )


async def _complete_task(task_id: str) -> None:
    """完成任务 — 从 SSE 事件中提取 AI 输出并创建报告."""
    from app.db.session import AsyncSessionLocal
    from app.models.report import Report
    from app.core.constants import ReportStatus

    async with AsyncSessionLocal() as db:
        task = await db.get(Task, task_id)
        if not task:
            return

        task.status = TaskStatus.COMPLETED.value
        task.progress = 100
        task.completed_at = datetime.now(timezone.utc)

        # 从 Redis 提取 AI 完整输出文本
        redis = await get_redis()
        cache_key = f"sse_events:{task_id}"
        events_raw = await redis.lrange(cache_key, 0, -1)

        full_text = ""
        for event_str in events_raw:
            evt = json.loads(event_str)
            text = evt.get("text", "")
            say_type = evt.get("msg_say", "")
            # 只收集 say=text 类型的输出（跳过 reasoning 推理过程）
            if text and say_type in ("text", "", None):
                full_text += text

        # 尝试从 AI 输出中解析 JSON 结构化报告
        report_data = _parse_ai_output(full_text)

        # 创建报告记录
        if report_data or full_text:
            import ulid as _ulid
            report = Report(
                id=str(_ulid.new()),
                task_id=task.id,
                title=task.title or f"{task.scenario_name}经营分析报告",
                overall_score=report_data.get("overall_score"),
                health_scores=report_data.get("health_scores", []),
                kpis=report_data.get("kpis", []),
                charts=report_data.get("charts", []),
                conclusions=report_data.get("conclusions", []),
                actions=report_data.get("actions", []),
                raw_data_summary={"full_text_length": len(full_text), "event_count": len(events_raw)},
                status=ReportStatus.COMPLETED.value,
                markdown_content=full_text,
            )
            db.add(report)
            logger.info("Report created for task %s, score: %s", task_id, report_data.get("overall_score"))

        await db.commit()


def _parse_ai_output(text: str) -> dict[str, Any]:
    """从 AI 输出文本中提取结构化 JSON 报告.

    AI 输出可能包含 ```json ... ``` 代码块，也可能直接是 JSON。
    """
    import re

    # 尝试提取 ```json ... ``` 代码块
    json_match = re.search(r'```json\s*\n(.*?)\n```', text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # 尝试提取 { ... } JSON 对象
    brace_match = re.search(r'\{[^{}]*"overall_score"[^{}]*\}', text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(0))
        except json.JSONDecodeError:
            pass

    # 尝试整个文本解析
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    # 返回空结构，保留原始文本
    return {}


async def _fail_task(task_id: str, error: str) -> None:
    """标记任务失败."""
    from app.db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        task = await db.get(Task, task_id)
        if task:
            task.status = TaskStatus.FAILED.value
            task.error_message = error
            await db.commit()


async def get_cached_events(task_id: str, last_event_id: str | None = None) -> list[dict]:
    """获取缓存的 SSE 事件（支持断点续传）."""
    redis = await get_redis()
    cache_key = f"sse_events:{task_id}"

    events = await redis.lrange(cache_key, 0, -1)
    result = []
    found_last = last_event_id is None

    for event_str in events:
        event = json.loads(event_str)
        if not found_last:
            if event.get("event_id") == last_event_id:
                found_last = True
            continue
        result.append(event)

    return result


async def list_tasks(db: AsyncSession, user: User, page: int = 1, page_size: int = 20) -> dict:
    """获取用户的任务列表."""
    total_result = await db.execute(
        select(func.count()).where(Task.user_id == user.id)
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        select(Task)
        .where(Task.user_id == user.id)
        .order_by(desc(Task.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    tasks = result.scalars().all()

    return {
        "items": tasks,
        "meta": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": (total + page_size - 1) // page_size,
        },
    }


async def get_task(db: AsyncSession, task_id: str, user: User) -> Task:
    """获取任务详情."""
    task = await db.get(Task, task_id)
    if not task or task.user_id != user.id:
        raise NotFoundException("任务不存在")
    return task


async def delete_task(db: AsyncSession, task_id: str, user: User) -> None:
    """删除任务."""
    task = await get_task(db, task_id, user)
    await db.delete(task)
    await db.commit()

    # 删除 InfiniSynapse 上的任务
    if task.task_id:
        try:
            await infini_client.delete_tasks([task.task_id])
        except Exception as e:
            logger.warning("Failed to delete InfiniSynapse task: %s", e)


async def ask_task(db: AsyncSession, task_id: str, question: str, user: User) -> dict:
    """任务追问 — 使用提示词工程构建追问上下文."""
    task = await get_task(db, task_id, user)
    if not task.task_id:
        raise NotFoundException("任务尚未完成，无法追问")

    # 构建结构化追问 prompt
    from app.services.prompt_engineering import build_followup_prompt
    report_context = None
    if task.report:
        report_context = {
            "overall_score": task.report.overall_score,
            "health_scores": task.report.health_scores or [],
        }
    followup_prompt = build_followup_prompt(question, report_context)

    result = await infini_client.ask_response(task.task_id, followup_prompt)
    return result
