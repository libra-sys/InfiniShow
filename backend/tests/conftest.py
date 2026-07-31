"""Pytest 全局 fixture."""

import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest.fixture(scope="session")
def event_loop():
    """全局事件循环."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """测试 HTTP 客户端."""
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient) -> str:
    """获取测试用 auth token."""
    # 尝试登录获取 token，失败则注册
    resp = await client.post("/api/v1/auth/login", json={
        "phone": "13800000000",
        "password": "Test@1234",
    })
    if resp.status_code == 200:
        return resp.json()["data"]["access_token"]

    # 注册新用户
    resp = await client.post("/api/v1/auth/register", json={
        "phone": "13800000000",
        "password": "Test@1234",
        "nickname": "测试用户",
    })
    if resp.status_code in (200, 201):
        return resp.json()["data"]["access_token"]

    # 返回空 token（测试会因 401 跳过）
    return ""


@pytest_asyncio.fixture
async def auth_headers(auth_token: str) -> dict[str, str]:
    """带认证的请求头."""
    if auth_token:
        return {"Authorization": f"Bearer {auth_token}"}
    return {}
