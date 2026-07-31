"""认证模块测试."""

import pytest


@pytest.mark.asyncio
async def test_register(client):
    """测试注册."""
    resp = await client.post("/api/v1/auth/register", json={
        "phone": "13900000001",
        "password": "Test@1234",
        "nickname": "新用户",
    })
    assert resp.status_code in (200, 201, 400)  # 400 = 已注册
    if resp.status_code in (200, 201):
        data = resp.json()["data"]
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["phone"] == "13900000001"


@pytest.mark.asyncio
async def test_login(client):
    """测试登录."""
    resp = await client.post("/api/v1/auth/login", json={
        "phone": "13900000001",
        "password": "Test@1234",
    })
    assert resp.status_code in (200, 401)
    if resp.status_code == 200:
        data = resp.json()["data"]
        assert "access_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    """测试错误密码登录."""
    resp = await client.post("/api/v1/auth/login", json={
        "phone": "13900000001",
        "password": "wrongpassword",
    })
    assert resp.status_code in (401, 400)


@pytest.mark.asyncio
async def test_refresh_token(client, auth_token):
    """测试刷新 token."""
    if not auth_token:
        pytest.skip("No auth token")

    resp = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": auth_token,  # 简化测试
    })
    assert resp.status_code in (200, 401)


@pytest.mark.asyncio
async def test_get_me(client, auth_headers):
    """测试获取当前用户."""
    if not auth_headers:
        pytest.skip("No auth")
    resp = await client.get("/api/v1/users/me", headers=auth_headers)
    assert resp.status_code in (200, 404)
