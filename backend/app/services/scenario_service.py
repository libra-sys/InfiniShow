"""场景配置管理."""

import os
from functools import lru_cache
from typing import Any

import yaml

CONFIG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "config")
SCENARIOS_FILE = os.path.join(CONFIG_DIR, "scenarios.yaml")


@lru_cache
def load_scenarios() -> dict[str, dict[str, Any]]:
    """加载场景配置 YAML."""
    with open(SCENARIOS_FILE, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data.get("scenarios", {})


def get_scenario(code: str) -> dict[str, Any] | None:
    """获取单个场景配置."""
    return load_scenarios().get(code)


def list_scenarios() -> list[dict[str, Any]]:
    """获取全部场景列表."""
    scenarios = load_scenarios()
    return [
        {
            "code": code,
            "name": cfg.get("name", ""),
            "icon": cfg.get("icon", ""),
            "target": cfg.get("target", ""),
            "dimensions": cfg.get("dimensions", []),
            "default_metrics": cfg.get("default_metrics", []),
            "form_groups": cfg.get("form_groups", []),
        }
        for code, cfg in scenarios.items()
    ]


def build_prompt(code: str, inputs: dict[str, Any]) -> str | None:
    """根据场景模板和用户输入构建分析 Prompt."""
    scenario = get_scenario(code)
    if not scenario:
        return None
    template = scenario.get("prompt_template", "")
    try:
        return template.format(**inputs)
    except KeyError:
        return template


def validate_inputs(code: str, inputs: dict[str, Any]) -> list[str]:
    """校验用户输入是否符合场景字段要求，返回错误列表."""
    scenario = get_scenario(code)
    if not scenario:
        return ["场景不存在"]
    errors: list[str] = []
    for group in scenario.get("form_groups", []):
        for field in group.get("fields", []):
            key = field["key"]
            if field.get("required") and key not in inputs:
                errors.append(f"{field['label']} 为必填项")
                continue
            val = inputs.get(key)
            if val is None:
                continue
            if field["type"] == "number":
                try:
                    num = float(val)
                    if "min" in field and num < field["min"]:
                        errors.append(f"{field['label']} 不能小于 {field['min']}")
                    if "max" in field and num > field["max"]:
                        errors.append(f"{field['label']} 不能大于 {field['max']}")
                except (ValueError, TypeError):
                    errors.append(f"{field['label']} 必须是数字")
    return errors


def build_demo_csv(code: str, inputs: dict[str, Any]) -> str:
    """根据表单输入生成模拟 CSV 明细数据（最少 30 行）."""
    import csv
    import io
    import random

    scenario = get_scenario(code)
    if not scenario:
        return ""

    # 根据 scenario code 决定列结构和生成逻辑
    random.seed(42)
    rows: list[dict[str, Any]] = []
    num_rows = max(30, int(inputs.get("total_orders", inputs.get("total_transactions", 30))))

    for i in range(num_rows):
        row: dict[str, Any] = {"id": f"R{i+1:04d}"}

        if "total_revenue" in inputs and "total_orders" in inputs:
            avg = inputs["total_revenue"] / max(inputs["total_orders"], 1)
            row["amount"] = round(avg * random.uniform(0.5, 1.5), 2)
        elif "total_revenue" in inputs:
            row["amount"] = round(inputs["total_revenue"] / num_rows * random.uniform(0.5, 1.5), 2)

        if "total_orders" in inputs:
            row["order_id"] = f"O{i+1:06d}"

        if "avg_rating" in inputs:
            row["rating"] = max(1, min(5, int(random.gauss(inputs["avg_rating"], 0.5))))

        if "bad_review_count" in inputs and "total_orders" in inputs:
            bad_ratio = inputs["bad_review_count"] / max(inputs["total_orders"], 1)
            row["is_bad"] = 1 if random.random() < bad_ratio else 0

        if "food_cost_rate" in inputs:
            row["food_cost"] = round(row.get("amount", 0) * inputs["food_cost_rate"] * random.uniform(0.8, 1.2), 2)

        if "platform_fee_rate" in inputs:
            row["platform_fee"] = round(row.get("amount", 0) * inputs["platform_fee_rate"], 2)

        rows.append(row)

    # 写 CSV
    buf = io.StringIO()
    if rows:
        writer = csv.DictWriter(buf, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    return buf.getvalue()
