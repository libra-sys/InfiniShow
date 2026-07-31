"""认证 API."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse
from app.schemas.base import ApiResponse
from app.schemas.user import UserRegisterRequest
from app.services.user_service import authenticate_user, create_user, get_user_by_phone

router = APIRouter()


@router.post("/register", response_model=ApiResponse[dict])
async def register(
    request: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """用户注册."""
    user = await create_user(
        db,
        phone=request.phone,
        password=request.password,
        nickname=request.nickname,
        invite_code=request.invite_code,
    )
    return ApiResponse(data={"message": "注册成功", "user_id": user.id})


@router.post("/login", response_model=ApiResponse[TokenResponse])
async def login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """用户登录."""
    user = await authenticate_user(db, request.phone, request.password)

    access_token = create_access_token(user.id, {"role": user.role})
    refresh_token = create_refresh_token(user.id)

    # 设置 httpOnly cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,  # 生产环境设为 True
        samesite="lax",
        max_age=900,
    )

    return ApiResponse(data=TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=900,
        user_id=user.id,
        role=user.role,
    ))


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
async def refresh_token(
    request: RefreshTokenRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """刷新 Access Token."""
    payload = decode_token(request.refresh_token)
    if not payload or payload.get("type") != "refresh":
        from app.core.exceptions import UnauthorizedException
        raise UnauthorizedException("Refresh Token 无效或已过期")

    user_id = payload.get("sub")
    user = await db.get(User, user_id)
    if not user or not user.is_active:
        from app.core.exceptions import UnauthorizedException
        raise UnauthorizedException()

    new_access = create_access_token(user.id, {"role": user.role})
    new_refresh = create_refresh_token(user.id)

    response.set_cookie(
        key="access_token",
        value=new_access,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=900,
    )

    return ApiResponse(data=TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=900,
        user_id=user.id,
        role=user.role,
    ))


@router.post("/logout", response_model=ApiResponse[dict])
async def logout(response: Response):
    """用户登出."""
    response.delete_cookie("access_token")
    return ApiResponse(data={"message": "登出成功"})
