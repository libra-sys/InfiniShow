# 可信经营洞察引擎

面向千万级中小实体经营者的全链路可溯源智能经营分析工具。所有 AI 计算逻辑 100% 基于 InfiniSynapse Server API 实现。

## 技术栈

### 后端
- Python 3.12 + FastAPI + Uvicorn
- SQLAlchemy (async) + Alembic + PostgreSQL 16
- Redis 7 (缓存/限流/SSE缓冲)
- Celery (异步报告生成)
- MinIO (对象存储)
- JWT 双 Token 认证

### 前端
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand (状态管理)
- TanStack Query (数据获取)
- Axios (HTTP 客户端)
- ECharts (图表)

## 快速开始

### Docker Compose 一键启动

```bash
# 1. 复制环境变量模板
cp .env.example .env
# 编辑 .env 填入 INFINISYNAPSE_API_KEY 等敏感信息

# 2. 启动所有服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f backend
```

服务地址：
- 前端: http://localhost
- 后端 API: http://localhost:8000/docs
- MinIO 控制台: http://localhost:9001

### 本地开发

#### 后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
cp .env.example .env

# 数据库迁移
alembic upgrade head

# 启动开发服务器
uvicorn app.main:app --reload --port 8000
```

#### 前端

```bash
cd frontend
npm install
cp .env.example .env

npm run dev  # http://localhost:5173
```

## 项目结构

```
infinshow/
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── api/v1/         # API 路由
│   │   ├── core/           # 安全/异常/常量
│   │   ├── models/         # SQLAlchemy 模型
│   │   ├── schemas/        # Pydantic Schema
│   │   ├── services/       # 业务服务层
│   │   ├── tasks/          # Celery 异步任务
│   │   ├── middleware/     # 中间件
│   │   └── main.py         # 应用入口
│   ├── alembic/            # 数据库迁移
│   ├── tests/              # 测试
│   └── requirements.txt
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── api/            # API 客户端
│   │   ├── components/     # UI 组件
│   │   ├── hooks/          # React Hooks
│   │   ├── pages/          # 页面
│   │   ├── store/          # Zustand 状态
│   │   ├── types/          # 类型定义
│   │   └── main.tsx
│   └── Dockerfile
├── docker-compose.yml      # 容器编排
├── .env.example            # 环境变量模板
└── README.md
```

## API 接口

| 模块 | 路径 | 说明 |
|------|------|------|
| 认证 | `/api/v1/auth` | 注册/登录/Token刷新/登出 |
| 用户 | `/api/v1/users` | 用户信息/积分 |
| 任务 | `/api/v1/tasks` | 分析任务CRUD/SSE事件流/追问 |
| 文件 | `/api/v1/files` | 上传/下载/删除 |
| 报告 | `/api/v1/reports` | 查询/导出/对比 |
| 分享 | `/api/v1/shares` | 分享链接/海报 |
| 政策 | `/api/v1/policies` | 政策检索/反馈 |
| 邀请 | `/api/v1/invite` | 邀请码/签到/积分流水 |
| 销毁 | `/api/v1/destroy` | 数据销毁 |

## License

MIT
