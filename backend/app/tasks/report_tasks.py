"""报告生成任务 — 兼容 Celery 和无 Celery 环境."""

import logging

from app.tasks.compat import task

logger = logging.getLogger("infinshow.tasks")


@task
def generate_report_pdf(report_id: str) -> dict:
    """生成报告 PDF."""
    try:
        from app.db.session import get_sync_session_factory
        from app.models.report import Report
        from app.utils.pdf_generator import generate_report_pdf as _gen_pdf

        session_factory = get_sync_session_factory()
        with session_factory() as db:
            report = db.get(Report, report_id)
            if not report:
                return {"report_id": report_id, "status": "error", "error": "report not found"}

            report_dict = {
                "title": report.title,
                "overall_score": report.overall_score,
                "health_scores": report.health_scores or [],
                "kpis": report.kpis or [],
                "conclusions": report.conclusions or [],
                "actions": report.actions or [],
            }
            pdf_bytes = _gen_pdf(report_dict)

            import os
            from app.config import get_settings
            settings = get_settings()
            upload_dir = settings.local_upload_dir
            os.makedirs(upload_dir, exist_ok=True)
            pdf_path = os.path.join(upload_dir, f"report_{report_id}.pdf")
            with open(pdf_path, "wb") as f:
                f.write(pdf_bytes)

            report.pdf_url = f"/api/v1/reports/{report_id}/pdf"
            db.commit()

        return {"report_id": report_id, "status": "completed"}
    except Exception as e:
        logger.error("PDF generation failed: %s", e)
        return {"report_id": report_id, "status": "error", "error": str(e)}


@task
def render_share_poster(share_id: str) -> dict:
    """渲染分享海报."""
    try:
        from app.db.session import get_sync_session_factory
        from app.models.share_snapshot import ShareSnapshot
        from app.services.poster_generator import generate_share_poster

        session_factory = get_sync_session_factory()
        with session_factory() as db:
            share = db.get(ShareSnapshot, share_id)
            if not share:
                return {"share_id": share_id, "status": "error", "error": "share not found"}

            share_data = {
                "title": share.title,
                "share_url": f"https://app.infinisynapse.cn/s/{share.token}",
                "snapshot_data": share.snapshot_data or {},
            }
            poster_bytes = generate_share_poster(share_data)

            import os
            from app.config import get_settings
            settings = get_settings()
            upload_dir = settings.local_upload_dir
            os.makedirs(upload_dir, exist_ok=True)
            poster_path = os.path.join(upload_dir, f"poster_{share.token}.png")
            with open(poster_path, "wb") as f:
                f.write(poster_bytes)

            share.poster_url = f"/api/v1/shares/{share.token}/poster"
            db.commit()

        return {"share_id": share_id, "status": "completed"}
    except Exception as e:
        logger.error("Poster generation failed: %s", e)
        return {"share_id": share_id, "status": "error", "error": str(e)}
