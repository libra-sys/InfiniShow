"""add supplement tables and fields

Revision ID: 002_supplement
Revises: 001_initial
Create Date: 2026-07-31 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_supplement'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. packages 表
    op.create_table(
        'packages',
        sa.Column('id', sa.String(26), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('credits', sa.Integer, nullable=False),
        sa.Column('price_cents', sa.Integer, nullable=False),
        sa.Column('currency', sa.String(10), nullable=False, server_default='CNY'),
        sa.Column('valid_days', sa.Integer, nullable=False, server_default='30'),
        sa.Column('is_active', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_packages_id', 'packages', ['id'])

    # 2. orders 表
    op.create_table(
        'orders',
        sa.Column('id', sa.String(26), primary_key=True),
        sa.Column('user_id', sa.String(26), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('package_id', sa.String(26), sa.ForeignKey('packages.id'), nullable=False, index=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('amount_cents', sa.Integer, nullable=False),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('out_trade_no', sa.String(64), nullable=True),
        sa.Column('payment_channel', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_orders_id', 'orders', ['id'])

    # 3. policy_search_logs 表
    op.create_table(
        'policy_search_logs',
        sa.Column('id', sa.String(26), primary_key=True),
        sa.Column('user_id', sa.String(26), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('task_id', sa.String(26), nullable=True),
        sa.Column('region_code', sa.String(10), nullable=True),
        sa.Column('result_count', sa.Integer, nullable=False, server_default='0'),
        sa.Column('cost_credits', sa.Integer, nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_policy_search_logs_id', 'policy_search_logs', ['id'])

    # 4. 扩展 users 表
    op.add_column('users', sa.Column('preferred_language', sa.String(10), nullable=False, server_default='zh-CN'))
    op.add_column('users', sa.Column('referred_by', sa.String(26), nullable=True, index=True))

    # 5. 扩展 share_snapshots 表
    op.add_column('share_snapshots', sa.Column('share_code', sa.String(16), nullable=True, unique=True, index=True))
    op.add_column('share_snapshots', sa.Column('ref_code', sa.String(16), nullable=True))
    op.add_column('share_snapshots', sa.Column('unique_visitor_count', sa.Integer, nullable=False, server_default='0'))
    op.add_column('share_snapshots', sa.Column('converted_count', sa.Integer, nullable=False, server_default='0'))
    op.add_column('share_snapshots', sa.Column('poster_url', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('share_snapshots', 'poster_url')
    op.drop_column('share_snapshots', 'converted_count')
    op.drop_column('share_snapshots', 'unique_visitor_count')
    op.drop_column('share_snapshots', 'ref_code')
    op.drop_column('share_snapshots', 'share_code')

    op.drop_column('users', 'referred_by')
    op.drop_column('users', 'preferred_language')

    op.drop_index('ix_policy_search_logs_id', table_name='policy_search_logs')
    op.drop_table('policy_search_logs')

    op.drop_index('ix_orders_id', table_name='orders')
    op.drop_table('orders')

    op.drop_index('ix_packages_id', table_name='packages')
    op.drop_table('packages')
