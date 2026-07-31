"""政策服务."""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import PolicyStatus
from app.core.exceptions import NotFoundException
from app.models.policy_feed import PolicyFeed


class PolicyService:
    """政策服务."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def search(
        self,
        keyword: str | None = None,
        region: str | None = None,
        industry: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[PolicyFeed], int]:
        """搜索政策."""
        query = select(PolicyFeed).where(PolicyFeed.status == PolicyStatus.APPROVED.value)

        if keyword:
            query = query.where(
                PolicyFeed.title.ilike(f"%{keyword}%") | PolicyFeed.summary.ilike(f"%{keyword}%")
            )
        if region:
            query = query.where(PolicyFeed.region.ilike(f"%{region}%"))
        if industry:
            query = query.where(PolicyFeed.industry.ilike(f"%{industry}%"))

        total_result = await self.db.execute(query)
        total = len(total_result.scalars().all())

        result = await self.db.execute(
            query.order_by(PolicyFeed.publish_date.desc().nullslast()).offset((page - 1) * page_size).limit(page_size)
        )
        return list(result.scalars().all()), total

    async def create_policy(self, data: dict[str, Any]) -> PolicyFeed:
        """创建政策（Admin/种子库）."""
        feed = PolicyFeed(
            id=generate_ulid(),
            title=data["title"],
            source=data.get("source"),
            source_url=data.get("source_url"),
            region=data.get("region"),
            industry=data.get("industry"),
            summary=data.get("summary"),
            content=data.get("content"),
            publish_date=data.get("publish_date"),
            status=data.get("status", PolicyStatus.APPROVED.value),
            tags=data.get("tags"),
        )
        self.db.add(feed)
        await self.db.commit()
        await self.db.refresh(feed)
        return feed

    async def review_policy(self, policy_id: str, status: str) -> PolicyFeed:
        """审核政策."""
        result = await self.db.execute(select(PolicyFeed).where(PolicyFeed.id == policy_id))
        feed = result.scalar_one_or_none()
        if not feed:
            raise NotFoundException("政策不存在")
        feed.status = status
        await self.db.commit()
        await self.db.refresh(feed)
        return feed

    async def seed_demo_policies(self) -> None:
        """初始化示例政策数据."""
        policies = [
            {
                "title": "小微企业增值税减免政策",
                "source": "国家税务总局",
                "source_url": "https://example.com/policy/1",
                "region": "全国",
                "industry": "零售",
                "summary": "对月销售额 10 万元以下的小规模纳税人免征增值税。",
                "tags": ["增值税", "减免"],
            },
            {
                "title": "个体工商户经营贷款贴息",
                "source": "地方金融监管局",
                "source_url": "https://example.com/policy/2",
                "region": "浙江省",
                "industry": "餐饮",
                "summary": "符合条件的个体工商户可申请贷款贴息支持。",
                "tags": ["贷款", "贴息"],
            },
        ]
        for policy in policies:
            existing = await self.db.execute(
                select(PolicyFeed).where(PolicyFeed.title == policy["title"])
            )
            if not existing.scalar_one_or_none():
                await self.create_policy(policy)


# 导入放在末尾避免循环
from app.utils.helpers import generate_ulid
