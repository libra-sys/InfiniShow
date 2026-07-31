"""海报生成服务."""

import io
import logging
from typing import Any

logger = logging.getLogger("infinshow.poster")


def generate_share_poster(share_data: dict[str, Any]) -> bytes:
    """生成分享海报图片.

    使用 Pillow 绘制 750x1334 海报，包含：
    - Logo + 标题
    - 健康度评分
    - 雷达图缩略
    - 二维码
    - 裂变提示

    Args:
        share_data: 分享快照数据，包含 title/snapshot_data 等
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        logger.warning("Pillow not installed, returning placeholder")
        return _placeholder_poster(share_data)

    width, height = 750, 1334
    img = Image.new("RGB", (width, height), color=(248, 250, 252))
    draw = ImageDraw.Draw(img)

    # 尝试加载字体
    try:
        font_large = ImageFont.truetype("simhei.ttf", 36)
        font_medium = ImageFont.truetype("simhei.ttf", 24)
        font_small = ImageFont.truetype("simhei.ttf", 18)
    except (IOError, OSError):
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # 顶部 Logo + 标题
    draw.rectangle([(0, 0), (width, 120)], fill=(79, 70, 229))
    draw.text((40, 40), "可信经营洞察引擎", fill="white", font=font_large)

    # 健康度评分区域
    snapshot = share_data.get("snapshot_data", {})
    score = snapshot.get("overall_score", "N/A")
    draw.text((40, 160), f"我的店健康度 {score} 分", fill=(31, 41, 55), font=font_large)

    # KPI 区域
    kpis = snapshot.get("kpis", [])
    y = 240
    for kpi in kpis[:4]:
        name = kpi.get("name", "")
        value = str(kpi.get("value", ""))
        draw.text((40, y), f"{name}: {value}", fill=(100, 116, 139), font=font_medium)
        y += 40

    # 二维码区域（底部）
    qr_url = share_data.get("share_url", "https://infinisynapse.cn")
    try:
        import qrcode
        qr = qrcode.QRCode(version=1, box_size=8, border=2)
        qr.add_data(qr_url)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        qr_img = qr_img.resize((200, 200))
        img.paste(qr_img, (275, height - 350))
    except ImportError:
        draw.rectangle([(275, height - 350), (475, height - 150)], outline="black", width=2)
        draw.text((320, height - 250), "扫码查看", fill="black", font=font_small)

    # 裂变提示
    draw.text((200, height - 100), "新用户免费领 10 次分析", fill=(79, 70, 229), font=font_medium)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def _placeholder_poster(share_data: dict[str, Any]) -> bytes:
    """无 Pillow 时的占位符."""
    title = share_data.get("title", "报告")
    content = f"Poster: {title}"
    return content.encode("utf-8")
