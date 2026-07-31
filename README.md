# InfiniShow — 可信经营洞察引擎

> 让每个小店老板都能拥有自己的 AI 经营分析师

基于 InfiniSynapse Server API 构建的全链路可溯源智能经营分析工具。用户上传经营数据或填写核心指标，AI 自动生成包含健康度评分、KPI 看板、可信溯源和行动建议的专业经营诊断报告。

## 核心特性

- 🤖 **真实 AI 分析**：100% 基于 InfiniSynapse Server API，调用记录可在平台后台查验
- 📊 **12 类经营场景**：外卖、电商、便利店、生鲜、美业、教培等高频场景预置
- 🔍 **全链路溯源**：每个结论标注数据来源行号、计算公式、可信度等级
- ⚡ **快速体验**：填写核心数字即可生成报告，零门槛上手
- 📱 **响应式设计**：手机/平板/桌面端均可使用
- 🔐 **安全集成**：API Key 仅服务端存储，前端零暴露

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS + Zustand + ECharts |
| 后端 | Python 3.10+ + FastAPI + SQLAlchemy(async) + Pydantic |
| AI | InfiniSynapse Server API（SSE 长连接 + 多轮对话） |
| 存储 | SQLite（开发）/ PostgreSQL（生产）+ 本地文件系统 / MinIO |
| 部署 | Vercel（前端）+ Render.com（后端）|

## 快速开始

### 后端

```bash
cd backend
python -m venv .venv-py310
.venv-py310\Scripts\activate  # Windows
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 INFINISYNAPSE_API_KEY

# 启动
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

## 在线访问

- 前端：[Vercel 部署后填入]
- 后端 API：[Render 部署后填入]
- API 文档：`/docs`（Swagger UI）

## 项目结构

```
infinshow/
├── backend/          # FastAPI 后端
│   ├── app/
│   │   ├── api/v1/   # 66 个 API 端点
│   │   ├── models/   # 11 个数据模型
│   │   ├── services/ # InfiniSynapse 客户端 + 提示词工程 + 业务服务
│   │   ├── utils/    # PDF 生成 + 图表渲染 + Excel 解析
│   │   └── config.py # 可选依赖配置（Redis/MinIO 降级）
│   ├── config/scenarios.yaml  # 12 类场景配置
│   └── tests/        # 单元测试
├── frontend/         # React 前端
│   ├── src/
│   │   ├── pages/    # 16 个页面
│   │   ├── api/      # 10 个 API 模块
│   │   ├── hooks/    # SSE + Auth + Tasks 等
│   │   └── store/    # Zustand 状态管理
│   └── public/templates/  # 场景数据模板
├── docs/             # 开发文档 + 部署指南
└── docker-compose.yml
```

## 部署

参见 [部署指南](docs/DEPLOYMENT_GUIDE.md)

## License

MIT
