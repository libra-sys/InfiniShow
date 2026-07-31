"""文件 API."""

from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import PlainTextResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.base import ApiResponse
from app.schemas.file import FileRecordResponse, FileUploadResponse
from app.services.file_service import delete_file, download_file, list_files, upload_file

router = APIRouter()


@router.get("/templates", response_model=ApiResponse[list[dict]])
async def list_templates(
    user: User = Depends(get_current_user),
):
    """获取模板下载列表."""
    from app.services.scenario_service import list_scenarios
    scenarios = list_scenarios()
    return ApiResponse(data=[
        {
            "name": f"{s['name']} - 数据模板",
            "scenario": s["code"],
            "download_url": f"/api/v1/scenarios/{s['code']}/template",
        }
        for s in scenarios
    ])


@router.post("/upload", response_model=ApiResponse[FileUploadResponse])
async def upload_file_endpoint(
    file: UploadFile,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """上传文件."""
    content = await file.read()
    file_record = await upload_file(db, user, file.filename or "upload.xlsx", content)
    return ApiResponse(data=FileUploadResponse(
        id=file_record.id,
        original_name=file_record.original_name,
        file_type=file_record.file_type,
        size_bytes=file_record.size_bytes,
        storage_key=file_record.storage_key,
        columns=file_record.columns,
        row_count=file_record.row_count,
    ))


@router.get("", response_model=ApiResponse[list[FileRecordResponse]])
async def list_files_endpoint(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """获取文件列表."""
    files = await list_files(db, user)
    return ApiResponse(data=[FileRecordResponse.model_validate(f) for f in files])


@router.get("/{file_id}/download")
async def download_file_endpoint(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """下载文件."""
    filename, content = await download_file(db, file_id, user)
    import io
    return StreamingResponse(
        io.BytesIO(content),
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.delete("/{file_id}", response_model=ApiResponse[dict])
async def delete_file_endpoint(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """删除文件."""
    await delete_file(db, file_id, user)
    return ApiResponse(data={"message": "删除成功"})
