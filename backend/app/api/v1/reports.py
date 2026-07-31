"""报告 API."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db, pagination_params
from app.core.exceptions import BusinessException, NotFoundException
from app.models.report import Report
from app.models.task import Task
from app.models.user import User
from app.schemas.base import ApiResponse, PaginationParams
from app.schemas.report import ReportDetailResponse, ReportListItem

router = APIRouter()


@router.post("/demo", response_model=ApiResponse[dict])
async def create_demo_report(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """复制示例报告（允许匿名访问）."""
    scenario_code = body.get("scenario_code", "S01")
    result = await db.execute(
        select(Report).where(Report.title.like(f"%{scenario_code}%示例报告%")).limit(1)
    )
    source = result.scalar_one_or_none()
    if not source:
        raise NotFoundException("示例报告尚未生成")

    # 复制报告
    import ulid
    new_report = Report(
        id=str(ulid.new()),
        user_id="anonymous",
        task_id=source.task_id,
        title=f"示例报告 - {scenario_code}",
        overall_score=source.overall_score,
        health_scores=source.health_scores,
        kpis=source.kpis,
        charts=source.charts,
        conclusions=source.conclusions,
        actions=source.actions,
        raw_data_summary=source.raw_data_summary,
        status=source.status,
        markdown_content=source.markdown_content,
    )
    db.add(new_report)
    await db.commit()
    await db.refresh(new_report)

    return ApiResponse(data={
        "report_id": new_report.id,
        "task_id": source.task_id,
        "redirect_url": f"/reports/{new_report.id}?mode=demo",
    })


@router.get("/{report_id}/health-score", response_model=ApiResponse[dict])
async def get_health_score(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取经营健康度评分."""
    report = await db.get(Report, report_id)
    if not report or report.user_id != user.id:
        raise NotFoundException("报告不存在")

    return ApiResponse(data={
        "report_id": report.id,
        "total_score": report.overall_score,
        "dimensions": report.health_scores or [],
        "score_source": "ai",
    })


@router.get("/{report_id}/metrics/{metric_id}/trace", response_model=ApiResponse[dict])
async def get_metric_trace(
    report_id: str,
    metric_id: str,
    page: int = 1,
    page_size: int = 10,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取指标溯源详情."""
    report = await db.get(Report, report_id)
    if not report or report.user_id != user.id:
        raise NotFoundException("报告不存在")

    conclusions = report.conclusions or []
    metric = None
    for c in conclusions:
        if c.get("metric_id") == metric_id or c.get("metric") == metric_id:
            metric = c
            break

    if not metric:
        raise NotFoundException("指标不存在")

    # 模拟原始数据行（实际应从文件存储读取）
    source_rows = metric.get("source_rows", [])
    sample_rows = [
        {"row_id": f"row_{r}", "value": metric.get("value", "")}
        for r in source_rows[:page_size]
    ]

    return ApiResponse(data={
        "metric_id": metric_id,
        "metric_name": metric.get("metric", ""),
        "conclusion": metric.get("level", ""),
        "formula": metric.get("formula", ""),
        "row_count": len(source_rows),
        "rows": sample_rows,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": len(source_rows),
        },
    })


@router.get("/{report_id}/metrics/{metric_id}/export")
async def export_metric_data(
    report_id: str,
    metric_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """导出指标关联的原始数据 CSV."""
    report = await db.get(Report, report_id)
    if not report or report.user_id != user.id:
        raise NotFoundException("报告不存在")

    conclusions = report.conclusions or []
    metric = None
    for c in conclusions:
        if c.get("metric_id") == metric_id or c.get("metric") == metric_id:
            metric = c
            break

    if not metric:
        raise NotFoundException("指标不存在")

    source_rows = metric.get("source_rows", [])
    csv_lines = ["row_id,value"]
    for r in source_rows:
        csv_lines.append(f"row_{r},{metric.get('value', '')}")

    return PlainTextResponse(
        content="\n".join(csv_lines),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=metric_{metric_id}_data.csv"},
    )


@router.get("/{report_id}/pdf")
async def download_report_pdf(
    report_id: str,
    embed_qr: bool = True,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """下载 PDF 报告."""
    report = await db.get(Report, report_id)
    if not report or report.user_id != user.id:
        raise NotFoundException("报告不存在")

    from app.utils.pdf_generator import generate_report_pdf
    report_dict = {
        "title": report.title,
        "overall_score": report.overall_score,
        "health_scores": report.health_scores or [],
        "kpis": report.kpis or [],
        "conclusions": report.conclusions or [],
        "actions": report.actions or [],
    }
    pdf_bytes = generate_report_pdf(report_dict)

    if embed_qr:
        from app.utils.pdf_generator import embed_qr_code
        qr_url = f"https://app.infinisynapse.cn/reports/{report_id}?source=pdf_qr"
        pdf_bytes = embed_qr_code(pdf_bytes, qr_url)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.pdf"},
    )


@router.get("/{report_id}/markdown", response_class=PlainTextResponse)
async def download_report_markdown(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """下载 Markdown 报告."""
    report = await db.get(Report, report_id)
    if not report or report.user_id != user.id:
        raise NotFoundException("报告不存在")

    content = report.markdown_content or f"# {report.title}\n\n报告内容为空。"
    return PlainTextResponse(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.md"},
    )


@router.get("", response_model=ApiResponse[dict])
async def list_reports(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    pagination: PaginationParams = Depends(pagination_params),
):
    """获取报告列表."""
    from sqlalchemy import func

    total_result = await db.execute(
        select(func.count()).where(Report.user_id == user.id)
    )
    total = total_result.scalar() or 0

    result = await db.execute(
        select(Report)
        .where(Report.user_id == user.id)
        .order_by(desc(Report.created_at))
        .offset((pagination.page - 1) * pagination.page_size)
        .limit(pagination.page_size)
    )
    reports = result.scalars().all()

    return ApiResponse(
        data={
            "items": [ReportListItem.model_validate(r).model_dump(mode="json") for r in reports],
            "meta": {
                "page": pagination.page,
                "page_size": pagination.page_size,
                "total": total,
                "total_pages": (total + pagination.page_size - 1) // pagination.page_size,
            },
        }
    )


@router.get("/by-task/{task_id}", response_model=ApiResponse[ReportDetailResponse])
async def get_report_by_task(
    task_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """根据任务 ID 获取报告."""
    result = await db.execute(
        select(Report).where(Report.task_id == task_id, Report.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundException("报告尚未生成")
    return ApiResponse(data=ReportDetailResponse.model_validate(report))


@router.get("/{report_id}", response_model=ApiResponse[ReportDetailResponse])
async def get_report(
    report_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取报告详情."""
    report = await db.get(Report, report_id)
    if not report or report.user_id != user.id:
        raise NotFoundException("报告不存在")
    return ApiResponse(data=ReportDetailResponse.model_validate(report))


@router.post("/{report_id}/export", response_model=ApiResponse[dict])
async def export_report(
    report_id: str,
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """导出报告."""
    report = await db.get(Report, report_id)
    if not report or report.user_id != user.id:
        raise NotFoundException("报告不存在")

    fmt = body.get("format", "pdf")
    if fmt == "markdown" and report.markdown_content:
        return ApiResponse(data={"format": "markdown", "content": report.markdown_content})

    # PDF 导出触发 Celery 任务
    from app.tasks.report_tasks import generate_report_pdf
    generate_report_pdf.delay(report_id)

    return ApiResponse(data={"format": fmt, "url": report.pdf_url or "", "status": "processing"})


@router.post("/compare", response_model=ApiResponse[dict])
async def compare_reports(
    body: dict,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """对比报告."""
    report_ids = body.get("report_ids", [])
    if len(report_ids) < 2:
        from app.core.exceptions import BusinessException
        raise BusinessException("至少选择 2 份报告进行对比")

    result = await db.execute(
        select(Report).where(Report.id.in_(report_ids), Report.user_id == user.id)
    )
    reports = result.scalars().all()

    return ApiResponse(data={
        "comparison": {
            "reports": [{"id": r.id, "title": r.title, "score": r.overall_score} for r in reports],
        }
    })
