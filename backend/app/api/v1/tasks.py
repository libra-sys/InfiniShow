"""任务 API."""

import asyncio
import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, pagination_params
from app.core.exceptions import BusinessException
from app.models.user import User
from app.schemas.base import ApiResponse, PaginationParams
from app.schemas.task import TaskCreateRequest, TaskResponse, TaskSummary
from app.services.scenario_service import build_demo_csv, build_prompt, validate_inputs
from app.services.task_service import (
    ask_task,
    create_task,
    delete_task,
    get_cached_events,
    get_task,
    list_tasks,
    start_task,
)

router = APIRouter()


@router.post("/quick", response_model=ApiResponse[TaskResponse])
async def quick_create_task(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """表单数据快速创建分析任务."""
    scenario_code = body.get("scenario_code", "")
    inputs = body.get("inputs", {})

    errors = validate_inputs(scenario_code, inputs)
    if errors:
        raise BusinessException(f"输入校验失败: {'; '.join(errors)}")

    prompt = build_prompt(scenario_code, inputs) or ""
    scenario_name = body.get("scenario_name", scenario_code)
    title = body.get("title", f"{scenario_name} - 快速分析")

    task = await create_task(
        db,
        user=user,
        scenario_code=scenario_code,
        scenario_name=scenario_name,
        title=title,
        prompt_text=prompt,
        file_ids=[],
        quick_fields=inputs,
    )
    asyncio.create_task(start_task(task.id))
    return ApiResponse(data=TaskResponse.model_validate(task))


@router.get("/{task_id}/status", response_model=ApiResponse[dict])
async def get_task_status(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """查询任务聚合状态."""
    task = await get_task(db, task_id, user)
    return ApiResponse(data={
        "task_id": task.id,
        "status": task.status,
        "progress": task.progress,
        "current_step": task.current_event_id,
        "report_id": None,
        "error_message": task.error_message,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None,
    })


@router.get("/{task_id}/pending-inputs", response_model=ApiResponse[dict])
async def get_pending_inputs(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """查询待用户确认的问题列表（人工介入）."""
    task = await get_task(db, task_id, user)
    # 从 Redis 读取缓存的待确认问题
    from app.services.redis_client import get_redis
    redis = await get_redis()
    raw = await redis.get(f"pending_inputs:{task_id}")
    if raw:
        questions = json.loads(raw)
    else:
        questions = []
    return ApiResponse(data={"task_id": task_id, "status": task.status, "questions": questions})


@router.post("/{task_id}/resolve-inputs", response_model=ApiResponse[dict])
async def resolve_pending_inputs(
    task_id: str,
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """提交用户确认结果，继续分析（人工介入）."""
    task = await get_task(db, task_id, user)
    resolutions = body.get("resolutions", [])

    # 将修正后的字段映射追加到任务上下文，调用 askResponse 继续
    resolution_text = json.dumps(resolutions, ensure_ascii=False)
    result = await ask_task(db, task_id, f"用户确认结果：{resolution_text}，请继续分析。", user)

    # 清除待确认缓存
    from app.services.redis_client import get_redis
    redis = await get_redis()
    await redis.delete(f"pending_inputs:{task_id}")

    return ApiResponse(data={"task_id": task_id, "status": "running", "result": result})


@router.post("", response_model=ApiResponse[TaskResponse])
async def create_task_endpoint(
    request: TaskCreateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """创建分析任务."""
    task = await create_task(
        db,
        user=user,
        scenario_code=request.scenario_code,
        scenario_name=request.scenario_name,
        title=request.title,
        prompt_text=request.prompt_text,
        file_ids=request.file_ids,
        quick_fields=request.quick_fields,
    )

    # 后台启动任务
    asyncio.create_task(start_task(task.id))

    return ApiResponse(data=TaskResponse.model_validate(task))


@router.get("", response_model=ApiResponse[dict])
async def list_tasks_endpoint(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pagination: PaginationParams = Depends(pagination_params),
):
    """获取任务列表."""
    result = await list_tasks(db, user, pagination.page, pagination.page_size)
    return ApiResponse(
        data={
            "items": [TaskSummary.model_validate(t).model_dump() for t in result["items"]],
            "meta": result["meta"],
        }
    )


@router.get("/{task_id}", response_model=ApiResponse[TaskResponse])
async def get_task_endpoint(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取任务详情."""
    task = await get_task(db, task_id, user)
    return ApiResponse(data=TaskResponse.model_validate(task))


@router.get("/{task_id}/events")
async def task_events_endpoint(
    task_id: str,
    last_event_id: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """任务 SSE 事件流."""
    # 验证任务归属
    task = await get_task(db, task_id, user)

    async def event_generator():
        # 先发送缓存事件
        cached = await get_cached_events(task_id, last_event_id)
        for event in cached:
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

        # 如果任务已完成，发送结束事件
        if task.status in ("completed", "failed", "cancelled"):
            yield f"data: {json.dumps({'type': 'end', 'task_id': task_id, 'status': task.status})}\n\n"
            return

        # 持续监听新事件
        import time
        from app.services.redis_client import get_redis

        redis = await get_redis()
        cache_key = f"sse_events:{task_id}"
        last_len = len(cached)

        while True:
            events = await redis.lrange(cache_key, last_len, -1)
            for event_str in events:
                event = json.loads(event_str)
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                last_len += 1

                if event.get("type") in ("complete", "completed", "error", "failed"):
                    return

            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/{task_id}/ask", response_model=ApiResponse[dict])
async def ask_task_endpoint(
    task_id: str,
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """任务追问."""
    question = body.get("question", "")
    if not question:
        from app.core.exceptions import BusinessException
        raise BusinessException("问题不能为空")
    result = await ask_task(db, task_id, question, user)
    return ApiResponse(data=result)


@router.delete("/{task_id}", response_model=ApiResponse[dict])
async def delete_task_endpoint(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除任务."""
    await delete_task(db, task_id, user)
    return ApiResponse(data={"message": "删除成功"})
