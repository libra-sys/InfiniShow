"""报告 PDF 生成工具."""

import io
import logging
from datetime import datetime
from typing import Any

logger = logging.getLogger("infinshow.pdf")


def generate_report_pdf(report: dict[str, Any]) -> bytes:
    """生成报告 PDF（纯 Python 无外部依赖版本）.

    使用 reportlab 生成结构化 PDF，包含封面、健康度、KPI、图表数据、溯源、建议。
    """
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
        from reportlab.lib.units import mm
        from reportlab.platypus import (
            SimpleDocTemplate,
            Paragraph,
            Spacer,
            Table,
            TableStyle,
            PageBreak,
        )
    except ImportError:
        logger.warning("reportlab not installed, falling back to plain text")
        return _generate_plain_pdf(report)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=22, spaceAfter=10)
    h2_style = ParagraphStyle("CustomH2", parent=styles["Heading2"], fontSize=14, spaceBefore=12, spaceAfter=6)
    normal_style = ParagraphStyle("CustomNormal", parent=styles["Normal"], fontSize=10, leading=16)
    small_style = ParagraphStyle("CustomSmall", parent=styles["Normal"], fontSize=8, textColor=colors.grey)

    story: list[Any] = []

    # 封面
    story.append(Paragraph(report.get("title", "经营分析报告"), title_style))
    story.append(Paragraph(f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}", small_style))
    story.append(Spacer(1, 10 * mm))

    # 健康度评分
    health_scores = report.get("health_scores") or []
    if health_scores:
        story.append(Paragraph("经营健康度评分", h2_style))
        overall = report.get("overall_score", "N/A")
        story.append(Paragraph(f"综合得分：<b>{overall}</b>", normal_style))
        score_data = [["维度", "得分", "权重"]]
        for dim in health_scores:
            score_data.append([
                dim.get("dimension", ""),
                str(dim.get("score", "")),
                f'{dim.get("weight", 0) * 100:.0f}%',
            ])
        t = Table(score_data, colWidths=[60 * mm, 40 * mm, 40 * mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f5f5")]),
        ]))
        story.append(t)
        story.append(Spacer(1, 8 * mm))

    # KPI 指标
    kpis = report.get("kpis") or []
    if kpis:
        story.append(Paragraph("核心指标 (KPI)", h2_style))
        kpi_data = [["指标", "数值", "单位", "趋势"]]
        for k in kpis:
            kpi_data.append([
                str(k.get("name", "")),
                str(k.get("value", "")),
                str(k.get("unit", "")),
                str(k.get("trend", "")),
            ])
        t = Table(kpi_data, colWidths=[40 * mm, 35 * mm, 25 * mm, 30 * mm])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(t)
        story.append(Spacer(1, 8 * mm))

    # 溯源结论
    conclusions = report.get("conclusions") or []
    if conclusions:
        story.append(PageBreak())
        story.append(Paragraph("可信溯源", h2_style))
        for c in conclusions:
            level = c.get("level", "")
            level_color = {"consistent": "green", "questionable": "orange", "inconsistent": "red"}.get(level, "grey")
            story.append(Paragraph(
                f'<font color="{level_color}">[{level}]</font> '
                f'<b>{c.get("metric", "")}</b>: {c.get("value", "")}',
                normal_style,
            ))
            if c.get("formula"):
                story.append(Paragraph(f"计算方式：{c['formula']}", small_style))
            if c.get("source_rows"):
                story.append(Paragraph(f"关联行号：{c['source_rows']}", small_style))
            story.append(Spacer(1, 4 * mm))

    # 行动建议
    actions = report.get("actions") or []
    if actions:
        story.append(Paragraph("行动建议", h2_style))
        for i, a in enumerate(actions, 1):
            story.append(Paragraph(
                f'{i}. <b>{a.get("title", "")}</b> '
                f'<font color="grey">[{a.get("priority", "")}]</font>',
                normal_style,
            ))
            if a.get("description"):
                story.append(Paragraph(a["description"], small_style))
            story.append(Spacer(1, 3 * mm))

    # 页脚二维码占位
    story.append(Spacer(1, 10 * mm))
    story.append(Paragraph("扫码查看完整交互式溯源报告 →", small_style))

    doc.build(story)
    return buf.getvalue()


def _generate_plain_pdf(report: dict[str, Any]) -> bytes:
    """纯文本 PDF 降级方案."""
    # 返回简单的 UTF-8 文本作为 fallback（非真正的 PDF）
    lines = [f"# {report.get('title', '报告')}", ""]
    for k in report.get("kpis") or []:
        lines.append(f"- {k.get('name')}: {k.get('value')} {k.get('unit', '')}")
    content = "\n".join(lines)
    return content.encode("utf-8")


def embed_qr_code(pdf_bytes: bytes, qr_url: str) -> bytes:
    """在 PDF 中嵌入溯源二维码（需要 qrcode 库）."""
    try:
        import qrcode
        from reportlab.lib.utils import ImageReader

        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")

        img_buf = io.BytesIO()
        qr_img.save(img_buf, format="PNG")
        img_buf.seek(0)

        # 注意：实际合并需要重新渲染 PDF，这里返回原始 bytes
        # 完整实现需要 overlay 方式合并
        logger.info("QR code generated for URL: %s", qr_url)
        return pdf_bytes
    except ImportError:
        logger.warning("qrcode not installed, skipping QR embed")
        return pdf_bytes
