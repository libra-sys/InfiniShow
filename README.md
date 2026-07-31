<div align="center">

# InfiniShow

### 可信经营洞察引擎

让每个小店老板都能拥有自己的 AI 经营分析师

[功能特性](#功能特性) · [在线体验](#在线体验) · [技术架构](#技术架构) · [快速开始](#快速开始) · [部署](#部署指南)

</div>

---

## 项目简介

InfiniShow 是一款面向中小实体经营者的智能经营分析工具。用户上传经营数据或填写核心指标，系统通过 [InfiniSynapse](https://app.infinisynapse.cn) AI 平台完成深度分析，生成包含健康度评分、KPI 看板、可信溯源和行动建议的专业诊断报告。

**核心价值**：全链路可溯源——每个分析结论都标注数据来源行号、计算公式和可信度等级，让经营者看得懂、信得过、能落地。

## 功能特性

### 智能分析
- **真实 AI 驱动**：100% 基于 InfiniSynapse Server API，调用记录可在平台后台查验
- **12 类经营场景**：外卖餐饮、电商小店、便利店、生鲜、美业、教培、健身、宠物服务、汽车后市场、母婴零售、文创手作、综合零售
- **结构化提示词工程**：7 段式系统提示词（角色设定 → 场景上下文 → 用户数据 → 文件摘要 → 溯源约束 → 输出格式 → 行动指引），放大 AI 分析能力

### 可信溯源
- 每个结论标注 `source_rows`（数据来源行号）、`formula`（计算公式）、`level`（可信度等级）
- 三级可信度：`consistent`（数据一致）/ `questionable`（存疑）/ `inconsistent`（不符）
- 支持指标级溯源下钻，查看原始数据行

### 经营健康度
- 五维评分：盈利能力、运营效率、客户满意、成本管控、成长潜力
- 行业基准对比 + 百分位排名
- 雷达图可视化

### 数据接入
- **文件上传**：支持 Excel (.xlsx/.xls) 和 CSV，自动提取列信息注入 AI 上下文
- **快速表单**：填写核心数字即可分析，零门槛上手
- 文件归档到 InfiniSynapse 任务工作区，AI 可直接读取

### 报告与分享
- PDF 报告导出（含二维码溯源）
- Markdown 导出
- 分享链接 + 海报生成
- 访问统计

### 其他
- JWT 双 Token 认证（Access 15min + Refresh 7d）
- SSE 实时事件流，支持断线重连
- 管理后台（用户/任务/额度/政策管理）
- 邀请裂变 + 积分系统
- 暗色/亮色主题切换
- 响应式设计（手机/平板/桌面）

## 在线体验

- **应用地址**：[http://112.124.12.233](http://112.124.12.233)
- **API 文档**：[http://112.124.12.233:8000/docs](http://112.124.12.233:8000/docs)

## 技术架构

```
┌─────────────────────────────────────────────────┐
│                   用户浏览器                      │
│              React 18 + TypeScript               │
├─────────────────────────────────────────────────┤
│                   Nginx 反向代理                  │
├──────────────────────┬──────────────────────────┤
│     前端 (Vite)       │    后端 (FastAPI)         │
│  React 18 + Tailwind  │  Python 3.10+            │
│  Zustand + ECharts    │  SQLAlchemy (async)      │
│  Axios + SSE Hook     │  Pydantic Settings       │
├──────────────────────┴──────────────────────────┤
│              InfiniSynapse Server API             │
│          SSE 长连接 + 多轮对话 + 文件归档          │
├──────────────────────────────────────────────────┤
│              数据层 (可选降级)                     │
│  PostgreSQL / SQLite · Redis / 内存 · MinIO / 本地 │
└──────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + TypeScript + Vite 5 | SPA，响应式 |
| 样式 | Tailwind CSS + OKLCH 色彩空间 | 双模式主题 |
| 状态管理 | Zustand + TanStack Query | 轻量高效 |
| 图表 | ECharts + echarts-wordcloud | 饼图/折线/柱状/雷达/词云 |
| 后端 | FastAPI + Uvicorn + SQLAlchemy | 异步高性能 |
| AI | InfiniSynapse Server API | SSE + HTTP，真实调用 |
| 数据库 | SQLite（开发）/ PostgreSQL（生产） | 可选降级 |
| 缓存 | Redis（可选）/ 内存字典 | 可选降级 |
| 存储 | MinIO（可选）/ 本地文件系统 | 可选降级 |
| 部署 | Nginx + Uvicorn | ECS / Docker / Vercel + Render |

## API 端点

共 66 个 RESTful API 端点，覆盖完整的业务闭环：

| 模块 | 端点数 | 关键功能 |
|------|--------|---------|
| 认证 | 4 | 注册、登录、刷新、登出 |
| 用户 | 3 | 个人信息、额度、额度流水 |
| 任务 | 10 | 创建、快速创建、SSE 事件流、追问、人工介入 |
| 文件 | 5 | 上传、下载、删除、模板列表 |
| 报告 | 11 | 详情、PDF/Markdown 导出、健康度、指标溯源 |
| 分享 | 5 | 创建、查看、海报生成、访问统计 |
| 场景 | 3 | 列表、详情、模板下载 |
| 政策 | 3 | 列表、创建、反馈 |
| 邀请 | 4 | 邀请码、签到、领取奖励 |
| 付费 | 4 | 套餐、订单、支付回调 |
| 管理 | 8 | 用户/任务/额度/政策管理 |
| 其他 | 6 | 健康检查、API 文档等 |

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+
- InfiniSynapse API Key

### 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Linux/Mac
.venv\Scripts\activate       # Windows

pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 INFINISYNAPSE_API_KEY

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

### 生产构建

```bash
# 前端
cd frontend && npm run build    # 输出到 dist/

# 后端
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

## 部署指南

### 方式一：ECS + Nginx（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/libra-sys/InfiniShow.git
cd InfiniShow

# 2. 后端
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # 编辑填入 API Key
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2 &

# 3. 前端
cd ../frontend
npm install && npm run build

# 4. Nginx 配置
cat > /etc/nginx/sites-available/infinshow << 'EOF'
server {
    listen 80;
    location / {
        root /opt/infinshow/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
EOF
ln -sf /etc/nginx/sites-available/infinshow /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

### 方式二：Docker Compose

```bash
docker compose up -d --build
```

### 方式三：云平台托管

- 前端 → Vercel
- 后端 → Render.com
- 详见 [部署文档](docs/DEPLOYMENT_GUIDE.md)

## InfiniSynapse 集成说明

本项目通过 InfiniSynapse Server API 完成所有 AI 分析任务：

1. **SSE 连接**：`GET /api/ai/events?connId={uuid}` 建立长连接
2. **创建任务**：`POST /api/ai/message` (type=newTask) 发送分析请求
3. **文件归档**：`POST /api/tools/taskUpload/{taskId}` 上传数据文件到工作区
4. **监听结果**：SSE 事件流接收 `say`(推理/输出) → `success`(完成) 事件
5. **多轮追问**：`POST /api/ai/message` (type=askResponse) 基于已有任务追问
6. **任务管理**：`GET /api/ai_task/getTaskInfo/{id}` 查询任务状态

所有调用日志可在 [InfiniSynapse 后台](https://app.infinisynapse.cn) 查验。

## 项目结构

```
InfiniShow/
├── backend/                    # 后端服务
│   ├── app/
│   │   ├── api/v1/             # API 路由（66 个端点）
│   │   │   ├── auth.py         # 认证
│   │   │   ├── tasks.py        # 任务（含 SSE、快速创建、人工介入）
│   │   │   ├── reports.py      # 报告（含 PDF、溯源、健康度）
│   │   │   ├── scenarios.py    # 场景配置
│   │   │   └── ...
│   │   ├── models/             # 数据模型（11 个表）
│   │   ├── schemas/            # Pydantic 模型
│   │   ├── services/
│   │   │   ├── infini_client.py        # InfiniSynapse API 客户端
│   │   │   ├── task_service.py         # 任务编排 + SSE 监听
│   │   │   ├── prompt_engineering.py   # 提示词工程
│   │   │   ├── scenario_service.py     # 场景配置管理
│   │   │   ├── poster_generator.py     # 海报生成
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── pdf_generator.py        # PDF 报告生成
│   │   │   ├── chart_renderer.py       # 图表配置生成
│   │   │   └── ...
│   │   └── config.py           # 应用配置（可选依赖降级）
│   ├── config/scenarios.yaml   # 12 类场景配置
│   ├── alembic/                # 数据库迁移
│   └── tests/                  # 单元测试
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── pages/              # 16 个页面
│   │   ├── api/                # 10 个 API 模块
│   │   ├── hooks/              # SSE + 业务 Hooks
│   │   ├── store/              # Zustand 状态管理
│   │   ├── components/         # UI 组件
│   │   └── utils/              # 工具函数
│   └── public/templates/       # 场景数据模板
├── docs/                       # 文档
│   ├── DEVELOPMENT_GUIDE.md
│   ├── DEVELOPMENT_GUIDE_SUPPLEMENT.md
│   └── DEPLOYMENT_GUIDE.md
└── docker-compose.yml          # Docker 编排
```

## License

MIT
