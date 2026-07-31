"""种子数据初始化."""

import logging

logger = logging.getLogger("infinshow.seed")


async def seed_demo_reports():
    """插入示例报告种子数据（用于一键体验）."""
    from app.db.session import async_session_factory
    from app.models.report import Report
    from app.models.task import Task
    from app.core.constants import ReportStatus, TaskStatus

    demo_data = [
        {
            "scenario": "S01",
            "title": "外卖餐饮店 - 示例报告",
            "score": "B+",
            "health": [
                {"dimension": "盈利能力", "score": 75, "weight": 0.25},
                {"dimension": "运营效率", "score": 72, "weight": 0.20},
                {"dimension": "客户满意", "score": 88, "weight": 0.20},
                {"dimension": "成本管控", "score": 82, "weight": 0.20},
                {"dimension": "成长潜力", "score": 68, "weight": 0.15},
            ],
            "kpis": [
                {"name": "GMV", "value": "36,000", "unit": "元", "trend": "+12%"},
                {"name": "单均实收", "value": "30.0", "unit": "元", "trend": "+5%"},
                {"name": "差评率", "value": "3.75%", "trend": "-1.2%"},
                {"name": "出餐时长", "value": "35", "unit": "分钟"},
            ],
        },
    ]

    async with async_session_factory() as db:
        for demo in demo_data:
            task = Task(
                scenario_code=demo["scenario"],
                scenario_name=demo["title"],
                title=demo["title"],
                status=TaskStatus.COMPLETED.value,
                conn_id=f"demo_conn_{demo['scenario']}",
                task_id=f"demo_task_{demo['scenario']}",
            )
            db.add(task)
            await db.flush()

            report = Report(
                task_id=task.id,
                title=demo["title"],
                overall_score=demo["score"],
                health_scores=demo["health"],
                kpis=demo["kpis"],
                conclusions=[
                    {"metric": "GMV", "value": "36000", "level": "consistent", "source_rows": [1, 2, 3, 4, 5], "formula": "SUM(actual_amount)"},
                ],
                actions=[
                    {"title": "优化高峰出餐效率", "priority": "高", "description": "差评多因等待时间过长"},
                ],
                status=ReportStatus.COMPLETED.value,
                markdown_content=f"# {demo['title']}\n\n综合得分：{demo['score']}",
            )
            db.add(report)

        await db.commit()
        logger.info("Seeded %d demo reports", len(demo_data))
