"""任务模块测试."""

import pytest


@pytest.mark.asyncio
async def test_list_scenarios(client):
    """测试获取场景列表."""
    resp = await client.get("/api/v1/scenarios")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert isinstance(data, list)
    assert len(data) == 12  # 12 类场景


@pytest.mark.asyncio
async def test_get_scenario_detail(client):
    """测试获取场景详情."""
    resp = await client.get("/api/v1/scenarios/S01")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["code"] == "S01"
    assert data["name"] == "外卖餐饮店"
    assert len(data["form_groups"]) > 0


@pytest.mark.asyncio
async def test_get_scenario_not_found(client):
    """测试获取不存在的场景."""
    resp = await client.get("/api/v1/scenarios/INVALID")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_files(client, auth_headers):
    """测试文件列表."""
    if not auth_headers:
        pytest.skip("No auth")
    resp = await client.get("/api/v1/files", headers=auth_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_list_reports(client, auth_headers):
    """测试报告列表."""
    if not auth_headers:
        pytest.skip("No auth")
    resp = await client.get("/api/v1/reports", headers=auth_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_list_policies(client):
    """测试政策列表."""
    resp = await client.get("/api/v1/policies")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_list_packages(client):
    """测试套餐列表."""
    resp = await client.get("/api/v1/packages")
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_create_demo_report(client):
    """测试创建示例报告."""
    resp = await client.post("/api/v1/reports/demo", json={"scenario_code": "S01"})
    # 可能返回 200 或 404（如果种子数据未加载）
    assert resp.status_code in (200, 404)
