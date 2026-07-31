"""场景配置 API."""

from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from app.schemas.base import ApiResponse
from app.services.scenario_service import get_scenario, list_scenarios

router = APIRouter()


@router.get("", response_model=ApiResponse[list[dict[str, Any]]])
async def get_scenarios():
    """获取全部场景配置."""
    return ApiResponse(data=list_scenarios())


@router.get("/{code}", response_model=ApiResponse[dict[str, Any]])
async def get_scenario_detail(code: str):
    """获取单个场景详情."""
    scenario = get_scenario(code)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景不存在")
    return ApiResponse(data={
        "code": code,
        "name": scenario.get("name"),
        "icon": scenario.get("icon"),
        "target": scenario.get("target"),
        "dimensions": scenario.get("dimensions", []),
        "default_metrics": scenario.get("default_metrics", []),
        "form_groups": scenario.get("form_groups", []),
        "prompt_template": scenario.get("prompt_template", ""),
    })


@router.get("/{code}/template", response_class=PlainTextResponse)
async def download_scenario_template(code: str):
    """下载场景 CSV 模板."""
    scenario = get_scenario(code)
    if not scenario:
        raise HTTPException(status_code=404, detail="场景不存在")

    # 根据场景字段生成 CSV 表头模板
    headers: list[str] = []
    for group in scenario.get("form_groups", []):
        for field in group.get("fields", []):
            headers.append(field["key"])

    csv_line = ",".join(headers)
    return PlainTextResponse(
        content=f"{csv_line}\n",
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={code}_template.csv"},
    )
