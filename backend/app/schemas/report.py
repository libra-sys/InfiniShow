"""报告相关 Schema."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class HealthScore(BaseModel):
    """健康度维度."""

    dimension: str
    score: int = Field(..., ge=0, le=100)
    weight: float


class KpiItem(BaseModel):
    """KPI 指标."""

    name: str
    value: str | float | int
    unit: str | None = None
    trend: str | None = None
    yoy: str | None = None


class ConclusionItem(BaseModel):
    """溯源结论项."""

    metric: str
    value: str
    level: str
    source_rows: list[int]
    formula: str | None = None
    verification_process: str | None = None


class ActionItem(BaseModel):
    """行动建议项."""

    title: str
    priority: str
    description: str
    expected_effect: str | None = None


class ReportDetailResponse(BaseModel):
    """报告详情响应."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    title: str
    overall_score: str | None
    health_scores: list[HealthScore] | None
    kpis: list[KpiItem] | None
    charts: list[dict[str, Any]] | None
    conclusions: list[ConclusionItem] | None
    actions: list[ActionItem] | None
    raw_data_summary: dict[str, Any] | None
    markdown_content: str | None
    pdf_url: str | None
    created_at: datetime
    updated_at: datetime


class ReportListItem(BaseModel):
    """报告列表项."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    title: str
    overall_score: str | None
    created_at: datetime


class ReportExportRequest(BaseModel):
    """报告导出请求."""

    format: str = Field(default="pdf", pattern=r"^(pdf|markdown)$")


class ReportCompareRequest(BaseModel):
    """报告对比请求."""

    report_ids: list[str] = Field(..., min_length=2, max_length=4)
