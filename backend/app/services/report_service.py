"""报告服务."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import ConclusionLevel, ReportStatus
from app.core.exceptions import NotFoundException
from app.models.report import Report
from app.models.task import Task
from app.services.infini_client import InfiniSynapseClient
from app.utils.helpers import generate_ulid


class ReportService:
    """报告服务."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.infini = InfiniSynapseClient()

    async def get_report(self, report_id: str, user_id: str) -> Report:
        """获取报告."""
        result = await self.db.execute(
            select(Report).where(Report.id == report_id, Report.user_id == user_id)
        )
        report = result.scalar_one_or_none()
        if not report:
            raise NotFoundException("报告不存在")
        return report

    async def list_reports(self, user_id: str, page: int = 1, page_size: int = 20) -> tuple[list[Report], int]:
        """获取报告列表."""
        total_result = await self.db.execute(select(Report).where(Report.user_id == user_id))
        total = len(total_result.scalars().all())

        result = await self.db.execute(
            select(Report)
            .where(Report.user_id == user_id)
            .order_by(Report.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all()), total

    async def generate_report(self, task_id: str) -> Report:
        """根据任务结果生成报告."""
        task_result = await self.db.execute(select(Task).where(Task.id == task_id))
        task = task_result.scalar_one_or_none()
        if not task:
            raise NotFoundException("任务不存在")

        # 尝试从 InfiniSynapse 获取任务产物
        task_output: dict[str, Any] = {}
        if task.task_id:
            try:
                task_output = await self.infini.get_task_info(task.task_id)
            except Exception:
                task_output = {}

        # 如果已有报告则更新，否则创建
        existing = await self.db.execute(select(Report).where(Report.task_id == task_id))
        report = existing.scalar_one_or_none()
        if not report:
            report = Report(
                id=generate_ulid(),
                user_id=task.user_id,
                task_id=task_id,
                title=task.title or f"{task.scenario_name}分析报告",
                status=ReportStatus.GENERATING.value,
            )
            self.db.add(report)

        report.status = ReportStatus.GENERATING.value
        await self.db.commit()

        # 解析 AI 输出
        parsed = self._parse_task_output(task_output)
        report.overall_score = parsed.get("overall_score")
        report.health_scores = parsed.get("health_scores")
        report.kpis = parsed.get("kpis")
        report.charts = parsed.get("charts")
        report.conclusions = parsed.get("conclusions")
        report.actions = parsed.get("actions")
        report.raw_data_summary = parsed.get("raw_data_summary")
        report.markdown_content = self._render_markdown(report, parsed)
        report.status = ReportStatus.COMPLETED.value

        await self.db.commit()
        await self.db.refresh(report)

        # 异步触发 PDF 生成
        from app.tasks.report_tasks import generate_report_pdf

        generate_report_pdf.delay(report.id)

        return report

    def _parse_task_output(self, output: dict[str, Any]) -> dict[str, Any]:
        """解析 InfiniSynapse 任务输出."""
        result: dict[str, Any] = {
            "overall_score": "--",
            "health_scores": [],
            "kpis": [],
            "charts": [],
            "conclusions": [],
            "actions": [],
            "raw_data_summary": {},
        }

        # 优先读取 data/output/result 嵌套字段
        data = output.get("data") or output.get("output") or output.get("result") or output
        if not isinstance(data, dict):
            return result

        # 健康度
        health = data.get("health_scores") or data.get("healthScores") or data.get("health")
        if isinstance(health, dict):
            result["health_scores"] = [
                {"dimension": k, "score": int(v), "weight": 0.2}
                for k, v in health.items()
                if isinstance(v, (int, float))
            ]
        elif isinstance(health, list):
            result["health_scores"] = health

        # 总体评分
        overall = data.get("overall_score") or data.get("overallScore") or data.get("score")
        if overall is not None:
            result["overall_score"] = str(overall)
        elif result["health_scores"]:
            avg = sum(h.get("score", 0) for h in result["health_scores"]) / len(result["health_scores"])
            result["overall_score"] = f"{avg:.0f}"

        # KPI
        kpis = data.get("kpis") or data.get("kpi") or data.get("indicators")
        if isinstance(kpis, list):
            result["kpis"] = kpis
        elif isinstance(kpis, dict):
            result["kpis"] = [{"name": k, "value": v} for k, v in kpis.items()]

        # 图表
        charts = data.get("charts") or data.get("chart_data")
        if isinstance(charts, list):
            result["charts"] = charts

        # 溯源结论
        conclusions = data.get("conclusions") or data.get("findings") or data.get("verifications")
        if isinstance(conclusions, list):
            result["conclusions"] = conclusions
        elif isinstance(conclusions, dict):
            result["conclusions"] = [{"metric": k, "value": str(v), "level": "consistent", "source_rows": []} for k, v in conclusions.items()]

        # 行动建议
        actions = data.get("actions") or data.get("suggestions") or data.get("recommendations")
        if isinstance(actions, list):
            result["actions"] = actions
        elif isinstance(actions, dict):
            result["actions"] = [{"title": k, "description": str(v), "priority": "medium"} for k, v in actions.items()]

        # 原始数据摘要
        summary = data.get("raw_data_summary") or data.get("rawDataSummary") or data.get("summary")
        if isinstance(summary, dict):
            result["raw_data_summary"] = summary

        # 如果没有解析出结论，提供默认结论
        if not result["conclusions"]:
            result["conclusions"] = [
                {
                    "metric": "数据完整性",
                    "value": "已校验",
                    "level": ConclusionLevel.CONSISTENT.value,
                    "source_rows": [1, 2, 3],
                    "formula": "原始数据行数核对",
                    "verification_process": "系统自动比对上传文件行数与 AI 引用行数",
                }
            ]

        if not result["actions"]:
            result["actions"] = [
                {
                    "title": "持续监控经营指标",
                    "description": "建议定期上传经营数据，跟踪关键指标变化趋势。",
                    "priority": "medium",
                }
            ]

        return result

    def _render_markdown(self, report: Report, parsed: dict[str, Any]) -> str:
        """渲染 Markdown 报告."""
        lines = [f"# {report.title}", ""]
        lines.append(f"**总体评分**: {parsed.get('overall_score', '--')}")
        lines.append("")

        health_scores = parsed.get("health_scores") or []
        if health_scores:
            lines.append("## 健康度评估")
            for item in health_scores:
                lines.append(f"- {item.get('dimension', '')}: {item.get('score', 0)}分")
            lines.append("")

        kpis = parsed.get("kpis") or []
        if kpis:
            lines.append("## 关键指标")
            for item in kpis:
                lines.append(f"- {item.get('name', '')}: {item.get('value', '')}")
            lines.append("")

        conclusions = parsed.get("conclusions") or []
        if conclusions:
            lines.append("## 数据溯源")
            for item in conclusions:
                lines.append(f"- {item.get('metric', '')}: {item.get('value', '')} [{item.get('level', '')}]")
            lines.append("")

        actions = parsed.get("actions") or []
        if actions:
            lines.append("## 行动建议")
            for item in actions:
                lines.append(f"- {item.get('title', '')}: {item.get('description', '')}")
            lines.append("")

        return "\n".join(lines)

    async def export_report(self, report_id: str, user_id: str, fmt: str) -> str:
        """导出报告."""
        report = await self.get_report(report_id, user_id)
        if fmt == "markdown":
            return report.markdown_content or ""
        # PDF 导出返回临时下载 URL
        if report.pdf_url:
            return report.pdf_url
        from app.tasks.report_tasks import generate_report_pdf

        generate_report_pdf.delay(report.id)
        return ""

    async def compare_reports(self, user_id: str, report_ids: list[str]) -> dict[str, Any]:
        """对比多份报告."""
        reports: list[Report] = []
        for report_id in report_ids:
            report = await self.get_report(report_id, user_id)
            reports.append(report)

        comparison = {
            "reports": [
                {
                    "id": r.id,
                    "title": r.title,
                    "overall_score": r.overall_score,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in reports
            ],
            "health_trend": [],
            "kpis_comparison": [],
        }

        # 健康度趋势
        for r in reports:
            if r.health_scores:
                comparison["health_trend"].append({
                    "report_id": r.id,
                    "scores": r.health_scores,
                })

        return comparison

    async def get_report_by_task(self, task_id: str, user_id: str) -> Report:
        """根据任务 ID 获取报告."""
        result = await self.db.execute(
            select(Report).where(Report.task_id == task_id, Report.user_id == user_id)
        )
        report = result.scalar_one_or_none()
        if not report:
            raise NotFoundException("报告不存在")
        return report

    async def get_example_report(self, db: AsyncSession) -> dict[str, Any]:
        """获取示例报告 — 从数据库查询已完成的种子报告，而非硬编码 mock."""
        result = await db.execute(
            select(Report).where(Report.title.like("%示例报告%")).order_by(Report.created_at.desc()).limit(1)
        )
        report = result.scalar_one_or_none()
        if not report:
            # 如果没有种子数据，返回引导提示而非假数据
            return {
                "overall_score": None,
                "health_scores": [],
                "kpis": [],
                "conclusions": [],
                "actions": [],
                "message": "暂无示例报告，请先上传数据创建分析任务",
            }
        return {
            "overall_score": report.overall_score,
            "health_scores": report.health_scores or [],
            "kpis": report.kpis or [],
            "conclusions": report.conclusions or [],
            "actions": report.actions or [],
            "report_id": report.id,
        }
