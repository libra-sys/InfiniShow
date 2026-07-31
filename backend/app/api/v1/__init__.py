"""API V1 路由聚合."""

from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.destroy import router as destroy_router
from app.api.v1.files import router as files_router
from app.api.v1.invite import router as invite_router
from app.api.v1.policies import router as policies_router
from app.api.v1.payments import router as payments_router
from app.api.v1.reports import router as reports_router
from app.api.v1.scenarios import router as scenarios_router
from app.api.v1.shares import router as shares_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["认证"])
api_router.include_router(users_router, prefix="/users", tags=["用户"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["任务"])
api_router.include_router(files_router, prefix="/files", tags=["文件"])
api_router.include_router(reports_router, prefix="/reports", tags=["报告"])
api_router.include_router(scenarios_router, prefix="/scenarios", tags=["场景"])
api_router.include_router(shares_router, prefix="/shares", tags=["分享"])
api_router.include_router(policies_router, prefix="/policies", tags=["政策"])
api_router.include_router(payments_router, tags=["付费模块"])
api_router.include_router(invite_router, prefix="/invite", tags=["邀请/积分"])
api_router.include_router(destroy_router, prefix="/destroy", tags=["数据销毁"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin后台"])
