"""InfiniSynapse 客户端测试."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.mark.asyncio
async def test_infini_client_init():
    """测试客户端初始化."""
    from app.services.infini_client import InfiniSynapseClient

    with patch("app.services.infini_client.get_settings") as mock_settings:
        mock_settings.return_value = MagicMock(
            infinisynapse_base_url="https://app.infinisynapse.cn",
            infinisynapse_api_key="test-key",
        )
        client = InfiniSynapseClient()
        assert client.base_url == "https://app.infinisynapse.cn"
        assert client.api_key == "test-key"


@pytest.mark.asyncio
async def test_new_task_payload():
    """测试 newTask 请求构建."""
    from app.services.infini_client import InfiniSynapseClient

    with patch("app.services.infini_client.get_settings") as mock_settings:
        mock_settings.return_value = MagicMock(
            infinisynapse_base_url="https://app.infinisynapse.cn",
            infinisynapse_api_key="test-key",
        )
        client = InfiniSynapseClient()

        # Mock session
        mock_session = AsyncMock()
        mock_resp = AsyncMock()
        mock_resp.status = 200
        mock_resp.json = AsyncMock(return_value={"task_id": "test-123", "status": "ok"})
        mock_session.post = MagicMock(return_value=AsyncMock(__aenter__=AsyncMock(return_value=mock_resp)))
        client._session = mock_session

        result = await client.new_task("conn-123", "分析数据")
        assert isinstance(result, dict)


@pytest.mark.asyncio
async def test_scenario_service():
    """测试场景服务."""
    from app.services.scenario_service import get_scenario, list_scenarios, validate_inputs

    scenarios = list_scenarios()
    assert len(scenarios) == 12
    assert scenarios[0]["code"] == "S01"

    s01 = get_scenario("S01")
    assert s01 is not None
    assert s01["name"] == "外卖餐饮店"

    # 校验必填字段
    errors = validate_inputs("S01", {})
    assert len(errors) > 0  # 缺必填字段

    errors = validate_inputs("S01", {"total_orders": 100, "total_revenue": 5000})
    assert len(errors) == 0


@pytest.mark.asyncio
async def test_pdf_generator():
    """测试 PDF 生成."""
    from app.utils.pdf_generator import generate_report_pdf

    report = {
        "title": "测试报告",
        "overall_score": "B+",
        "health_scores": [
            {"dimension": "盈利能力", "score": 75, "weight": 0.25},
        ],
        "kpis": [{"name": "GMV", "value": "36000", "unit": "元"}],
        "conclusions": [{"metric": "GMV", "value": "36000", "level": "consistent", "source_rows": [1, 2]}],
        "actions": [{"title": "优化效率", "priority": "高", "description": "测试建议"}],
    }
    pdf_bytes = generate_report_pdf(report)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 0


@pytest.mark.asyncio
async def test_chart_renderer():
    """测试图表配置生成."""
    from app.utils.chart_renderer import to_pie_option, to_bar_option, to_radar_option

    pie = to_pie_option("测试", [{"name": "A", "value": 100}])
    assert pie["series"][0]["type"] == "pie"

    bar = to_bar_option("测试", ["A", "B"], [{"name": "销量", "data": [10, 20]}])
    assert bar["series"][0]["type"] == "bar"

    radar = to_radar_option("测试", [{"name": "维度1", "max": 100}], [{"name": "当前", "value": [80]}])
    assert radar["series"][0]["type"] == "radar"


@pytest.mark.asyncio
async def test_i18n():
    """测试 i18n 服务."""
    from app.services.i18n import get_message

    assert get_message("user_not_found", "zh-CN") == "用户不存在"
    assert get_message("user_not_found", "en") == "User not found"
    assert get_message("nonexistent_key") == "nonexistent_key"


@pytest.mark.asyncio
async def test_analytics():
    """测试埋点服务."""
    from app.services.analytics import track_event, EVENT_TYPES

    assert "task_create" in EVENT_TYPES
    # track_event 不应抛异常
    await track_event("task_create", user_id="test", properties={"scenario": "S01"})
