"""图表数据转 ECharts 配置工具."""

from typing import Any


def to_pie_option(title: str, data: list[dict[str, Any]]) -> dict[str, Any]:
    """生成饼图/环形图配置.

    Args:
        title: 图表标题
        data: [{name, value}, ...]
    """
    return {
        "title": {"text": title, "left": "center"},
        "tooltip": {"trigger": "item", "formatter": "{b}: {c} ({d}%)"},
        "legend": {"orient": "vertical", "left": "left"},
        "series": [{
            "name": title,
            "type": "pie",
            "radius": ["40%", "70%"],
            "avoidLabelOverlap": False,
            "label": {"show": True, "formatter": "{b}: {d}%"},
            "data": data,
        }],
    }


def to_line_option(
    title: str,
    x_data: list[str],
    series: list[dict[str, Any]],
    dual_y: bool = False,
) -> dict[str, Any]:
    """生成折线图配置.

    Args:
        title: 图表标题
        x_data: X 轴数据
        series: [{name, data}, ...]
        dual_y: 是否双 Y 轴
    """
    y_axis: list[dict[str, Any]] = [{"type": "value"}]
    if dual_y:
        y_axis = [{"type": "value", "name": "数量", "position": "left"},
                   {"type": "value", "name": "天数", "position": "right"}]
        for i, s in enumerate(series):
            s["yAxisIndex"] = min(i, 1)

    return {
        "title": {"text": title, "left": "center"},
        "tooltip": {"trigger": "axis"},
        "legend": {"data": [s["name"] for s in series], "top": "bottom"},
        "xAxis": {"type": "category", "data": x_data},
        "yAxis": y_axis,
        "series": [{"type": "line", "smooth": True, "areaStyle": {"opacity": 0.1}, **s} for s in series],
    }


def to_bar_option(
    title: str,
    x_data: list[str],
    series: list[dict[str, Any]],
    show_profit_loss: bool = False,
) -> dict[str, Any]:
    """生成柱状图配置.

    Args:
        title: 图表标题
        x_data: X 轴数据
        series: [{name, data}, ...]
        show_profit_loss: 红绿色标注盈亏
    """
    series_config = []
    for s in series:
        item_style = {}
        if show_profit_loss:
            item_style = {
                "color": {"type": "function", "params": {"value": "return value >= 0 ? '#10b981' : '#ef4444'"}}
            }
        series_config.append({"type": "bar", "label": {"show": True, "position": "top"}, "itemStyle": item_style, **s})

    return {
        "title": {"text": title, "left": "center"},
        "tooltip": {"trigger": "axis", "axisPointer": {"type": "shadow"}},
        "legend": {"data": [s["name"] for s in series], "top": "bottom"},
        "xAxis": {"type": "category", "data": x_data},
        "yAxis": {"type": "value"},
        "series": series_config,
    }


def to_radar_option(title: str, indicators: list[dict[str, Any]], series_data: list[dict[str, Any]]) -> dict[str, Any]:
    """生成雷达图配置.

    Args:
        title: 图表标题
        indicators: [{name, max}, ...]
        series_data: [{name, value: [v1, v2, ...]}, ...]
    """
    return {
        "title": {"text": title, "left": "center"},
        "tooltip": {},
        "radar": {"indicator": indicators, "radius": "65%"},
        "series": [{"type": "radar", "data": series_data}],
    }


def to_wordcloud_option(title: str, data: list[dict[str, Any]]) -> dict[str, Any]:
    """生成词云图配置（需要 echarts-wordcloud 扩展）.

    Args:
        title: 图表标题
        data: [{name, value}, ...]
    """
    return {
        "title": {"text": title, "left": "center"},
        "tooltip": {"show": True},
        "series": [{
            "type": "wordCloud",
            "shape": "circle",
            "maskImage": None,
            "left": "center",
            "top": "center",
            "width": "70%",
            "height": "80%",
            "sizeRange": [12, 60],
            "rotationRange": [-90, 90],
            "rotationStep": 45,
            "gridSize": 8,
            "drawOutOfBound": False,
            "textStyle": {
                "fontFamily": "sans-serif",
                "fontWeight": "bold",
                "color": "random",
            },
            "emphasis": {"textStyle": {"shadowBlur": 10, "shadowColor": "#333"}},
            "data": data,
        }],
    }


def build_chart_configs(report_data: dict[str, Any]) -> list[dict[str, Any]]:
    """根据报告数据构建全部图表配置."""
    charts = []
    kpis = report_data.get("kpis") or []
    conclusions = report_data.get("conclusions") or []

    # 品类利润占比饼图
    category_data = [
        {"name": c.get("metric", ""), "value": c.get("value", 0)}
        for c in conclusions
        if isinstance(c.get("value"), (int, float))
    ]
    if category_data:
        charts.append({"id": "pie_profit", "config": to_pie_option("品类利润占比", category_data)})

    # 渠道 ROI 柱状图
    roi_data = [
        {"name": k.get("name", ""), "value": k.get("value", 0)}
        for k in kpis
        if isinstance(k.get("value"), (int, float)) and "roi" in k.get("name", "").lower()
    ]
    if roi_data:
        charts.append({
            "id": "bar_roi",
            "config": to_bar_option(
                "渠道 ROI 对比",
                [d["name"] for d in roi_data],
                [{"name": "ROI", "data": [d["value"] for d in roi_data]}],
                show_profit_loss=True,
            ),
        })

    # 健康度雷达图
    health_scores = report_data.get("health_scores") or []
    if health_scores:
        indicators = [{"name": h.get("dimension", ""), "max": 100} for h in health_scores]
        radar_data = [{"name": "当前", "value": [h.get("score", 0) for h in health_scores]}]
        charts.append({"id": "radar_health", "config": to_radar_option("经营健康度", indicators, radar_data)})

    return charts
