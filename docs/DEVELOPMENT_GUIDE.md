# 可信经营洞察引擎 — 开发规则与开发文档

> **版本**：v1.0  
> **日期**：2026-07-31  
> **适用范围**：全栈开发团队（后端、前端、运维、测试）

---

## 一、项目概述与技术选型

### 1.1 项目定位
融合 Vibe-Coding 大赛头部作品优势的全链路可溯源智能经营分析工具。面向千万级中小实体经营者，所有 AI 计算逻辑 100% 基于 InfiniSynapse Server API 实现，应用层仅做产品化封装与交互。

### 1.2 技术栈选型

| 层级 | 技术选型 | 选型理由 |
|------|---------|---------|
| 前端交互层 | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui | 生态成熟、类型安全、构建快、响应式适配方便 |
| 后端服务层 | Python 3.12 + FastAPI + Uvicorn | 异步原生支持 SSE、类型自动推导、性能接近 Node.js、稳定性强 |
| 关系数据库 | PostgreSQL 16 | ACID 完备、JSON 字段支持、扩展性强 |
| 缓存与会话 | Redis 7 | SSE 连接状态管理、限流计数、会话缓存 |
| 对象存储 | MinIO / 阿里云 OSS | 报告文件、上传数据表、分享海报存储 |
| 任务队列 | Celery + Redis | 异步报告生成、PDF 渲染、数据清洗 |
| 容器化 | Docker + Docker Compose | 一键本地启动、环境一致性、便于 CI/CD |
| 部署 | Nginx 反向代理 + systemd / Kubernetes | 高可用、负载均衡、SSL 终止 |

---

## 二、开发规则总览

### 2.1 代码规范

#### Python（后端）
- **格式化**：Black (`line-length = 100`)
- **导入排序**：isort (`profile = black`)
- **类型检查**：mypy (`strict = true`，`ignore_missing_imports = true`)
- **Lint**：Ruff（替代 flake8 + pylint）
- **文档字符串**：Google Style Docstrings
- **命名规范**：
  - 模块/包：`snake_case`
  - 类：`PascalCase`
  - 函数/变量：`snake_case`
  - 常量：`UPPER_SNAKE_CASE`
  - 私有成员：前缀 `_`
- **异常处理**：禁止裸 `except:`，必须指定异常类型；所有接口异常统一包装为 `HTTPException`

#### TypeScript（前端）
- **格式化**：Prettier
- **Lint**：ESLint (`@typescript-eslint/recommended`)
- **严格模式**：`strict: true` in `tsconfig.json`
- **命名规范**：
  - 组件：`PascalCase.tsx`
  - Hooks：`useCamelCase.ts`
  - 工具函数：`camelCase.ts`
  - 类型/接口：`PascalCase`（优先 `type` 别名）
- **状态管理**：Zustand（轻量、无样板代码、TypeScript 友好）
- **HTTP 客户端**：Axios + 统一拦截器封装

### 2.2 Git 工作流

- **分支模型**：Git Flow 简化版
  - `main`：生产分支，仅接受 `release/*` 合并
  - `develop`：开发主分支，日常集成
  - `feature/<module>-<desc>`：功能分支，从 `develop` 切出
  - `hotfix/<desc>`：线上紧急修复，从 `main` 切出
- **提交规范**：Conventional Commits
  ```
  <type>(<scope>): <subject>
  ```
  - `type`：`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`
  - `scope`：模块名（如 `auth`, `report`, `sse`）
- **PR 规范**：
  - 必须关联 Issue / 需求文档
  - 必须通过 CI（Lint + Type Check + Unit Test）
  - 必须至少 1 人 Code Review 通过
  - 禁止直接 push 到 `main` / `develop`

### 2.3 接口规范

- **RESTful 设计原则**：
  - 资源名使用名词复数：`/api/v1/reports`, `/api/v1/tasks`
  - HTTP 方法语义：`GET` 查询、`POST` 创建、`PUT/PATCH` 更新、`DELETE` 删除
  - 状态码规范：
    - `200` 成功（查询/更新）
    - `201` 创建成功
    - `400` 请求参数错误（附带 `field_errors` 明细）
    - `401` 未认证 / Token 失效
    - `403` 无权访问
    - `404` 资源不存在
    - `429` 请求频率超限
    - `500` 服务端内部错误（禁止暴露堆栈）
- **统一响应体**：
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {},
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 100
    }
  }
  ```
- **分页参数**：`page`（默认 1）、`pageSize`（默认 20，最大 100）
- **排序参数**：`sortField`、`sortOrder`（`asc` / `desc`）

### 2.4 安全规范

- **密钥管理**：
  - InfiniSynapse API Key 仅存储于服务端环境变量（`.env`），禁止任何形式的客户端暴露
  - 数据库连接串、JWT Secret、Redis 密码全部通过环境变量注入
  - `.env` 文件加入 `.gitignore`，提供 `.env.example` 模板
- **认证与授权**：
  - JWT Access Token（有效期 15 分钟）+ Refresh Token（有效期 7 天）双 Token 机制
  - 敏感操作（数据销毁、分享设置）需二次身份校验
  - API 路由按角色（`user` / `admin`）装饰器分级保护
- **数据安全**：
  - 用户上传的 Excel/CSV 文件落盘时文件名使用 UUID + 原始扩展名，禁止保留原始文件名
  - 敏感字段（手机号）AES-256-GCM 加密存储
  - 「分析后即焚」调用 `deleteTaskWithId` 后，同步清理本地文件副本与数据库记录
- **输入校验**：
  - 所有接口入参必须使用 Pydantic（后端）/ Zod（前端）做严格校验
  - 文件上传限制：大小 ≤ 10MB，类型仅限 `.xlsx`、`.xls`、`.csv`
  - SQL 注入防护：全部使用 ORM 参数化查询，禁止字符串拼接 SQL
- **CORS 策略**：白名单制，生产环境仅允许配置的前端域名
- **Rate Limiting**：
  - 通用接口：IP 级别 100 次/分钟
  - 分析任务创建：用户级别 10 次/小时
  - 登录接口：IP 级别 5 次/分钟

### 2.5 日志与监控规范

- **日志级别**：
  - `ERROR`：异常、任务失败、API 调用超时
  - `WARNING`：参数校验失败、限流触发
  - `INFO`：任务创建/完成、用户注册/登录、分享生成
  - `DEBUG`：本地开发使用，生产环境关闭
- **日志格式**：结构化 JSON，包含 `timestamp`、`level`、`trace_id`、`module`、`message`、`extra`
- **Trace ID**：每个 HTTP 请求生成唯一 `X-Trace-ID`，贯穿全链路（FastAPI Middleware → API Client → InfiniSynapse）
- **监控指标**（Prometheus）：
  - `http_requests_total`（按 method、path、status 分标签）
  - `http_request_duration_seconds`（P50/P95/P99）
  - `infini_api_call_total`（按 endpoint、status 分标签）
  - `task_created_total`、`task_completed_total`、`task_failed_total`

---

## 三、系统架构设计

### 3.1 三层解耦架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端交互层                              │
│   React + TypeScript + Tailwind + Recharts + ECharts        │
│   响应式布局：Desktop / Tablet / Mobile                      │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                        业务逻辑层（FastAPI）                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 用户中心  │  │ 任务调度  │  │ 报告生成  │  │ 积分裂变  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ 文件管理  │  │ SSE网关   │  │ 政策检索  │  │ 数据销毁  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                         Redis (缓存/会话/限流)                 │
│                         PostgreSQL (业务数据)                  │
│                         MinIO/OSS (文件存储)                   │
└─────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                        AI 计算层                               │
│              InfiniSynapse Server API                        │
│    SSE 事件流 / newTask / askResponse / taskUpload           │
│    getTaskInfo / deleteTaskWithId / setShare                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 核心数据流

1. **用户上传文件** → 前端预校验格式 → 后端接收 `multipart/form-data` → 存入 MinIO → 生成 `file_record`
2. **创建分析任务** → 后端生成 `connId` + `taskId` → 先建立 SSE 连接 → 调用 `newTask` → 实时推送进度
3. **SSE 进度推送** → FastAPI 后台任务消费 InfiniSynapse SSE 流 → 解析事件 → 通过 WebSocket / SSE 推送给前端
4. **报告生成** → Celery Worker 轮询任务完成状态 → 读取工作区产物 → 渲染图表 → 生成 PDF / Markdown
5. **分享快照** → 调用 `setShare` 生成公开链接 → 后端存储快照元数据 → 前端生成海报

---

## 四、目录结构规范

### 4.1 后端目录（`backend/`）

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 应用入口
│   ├── config.py               # Pydantic Settings（环境变量统一管理）
│   ├── dependencies.py         # 全局依赖：DB Session、Redis、当前用户
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── logging.py          # Trace ID 注入、请求日志
│   │   ├── cors.py             # CORS 配置
│   │   └── rate_limit.py       # 限流中间件
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py         # 登录/注册/Token 刷新
│   │   │   ├── users.py        # 用户信息、积分查询
│   │   │   ├── tasks.py        # 分析任务 CRUD、SSE 连接
│   │   │   ├── files.py        # 文件上传/下载/删除
│   │   │   ├── reports.py      # 报告查询/导出/对比
│   │   │   ├── shares.py       # 分享链接生成/校验
│   │   │   ├── policies.py     # 政策检索接口
│   │   │   ├── invite.py       # 邀请码/裂变接口
│   │   │   └── destroy.py      # 数据销毁接口
│   │   └── deps.py             # API 路由通用依赖
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT 签发/校验、密码哈希
│   │   ├── exceptions.py       # 业务异常基类与处理器
│   │   └── constants.py        # 全局常量枚举
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py             # SQLAlchemy Base、通用字段 mixin
│   │   ├── user.py
│   │   ├── task.py
│   │   ├── file_record.py
│   │   ├── report.py
│   │   ├── share_snapshot.py
│   │   ├── invite_record.py
│   │   └── credit_log.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── base.py             # 统一响应体、分页模型
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── task.py
│   │   ├── file.py
│   │   ├── report.py
│   │   └── share.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── infini_client.py    # InfiniSynapse API 封装（核心）
│   │   ├── task_service.py     # 任务业务逻辑
│   │   ├── report_service.py   # 报告生成与导出
│   │   ├── file_service.py     # 文件存储管理
│   │   ├── credit_service.py   # 积分计算与扣减
│   │   ├── policy_service.py   # 政策检索与缓存
│   │   └── invite_service.py   # 邀请裂变逻辑
│   ├── tasks/
│   │   ├── __init__.py
│   │   └── celery_app.py       # Celery 配置与异步任务
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── excel_parser.py     # Excel/CSV 字段识别与校验
│   │   ├── pdf_generator.py    # 报告 PDF 生成
│   │   ├── chart_renderer.py   # 图表数据转 ECharts 配置
│   │   └── validators.py       # 自定义校验器
│   └── db/
│       ├── __init__.py
│       ├── session.py            # SQLAlchemy AsyncSession 管理
│       └── migrations/           # Alembic 迁移脚本
├── alembic/
│   ├── versions/               # 数据库迁移版本
│   └── env.py
├── celery_worker.py            # Celery Worker 启动入口
├── tests/
│   ├── __init__.py
│   ├── conftest.py             # Pytest 全局 fixture
│   ├── test_auth.py
│   ├── test_tasks.py
│   └── test_infini_client.py
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── requirements.txt
└── README.md
```

### 4.2 前端目录（`frontend/`）

```
frontend/
├── src/
│   ├── main.tsx                # 应用入口
│   ├── App.tsx                 # 路由配置
│   ├── api/
│   │   ├── client.ts           # Axios 实例（拦截器、错误处理）
│   │   ├── auth.ts
│   │   ├── tasks.ts
│   │   ├── files.ts
│   │   ├── reports.ts
│   │   └── shares.ts
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── home/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── QuickDemoGrid.tsx
│   │   │   └── CTAButton.tsx
│   │   ├── upload/
│   │   │   ├── DropZone.tsx
│   │   │   ├── FileList.tsx
│   │   │   └── TemplateDownload.tsx
│   │   ├── analysis/
│   │   │   ├── ProgressNode.tsx
│   │   │   ├── SSEStatus.tsx
│   │   │   └── TraceabilityBadge.tsx
│   │   ├── report/
│   │   │   ├── KPICard.tsx
│   │   │   ├── ChartRenderer.tsx
│   │   │   ├── ActionAdvice.tsx
│   │   │   └── ExportToolbar.tsx
│   │   └── share/
│   │       ├── ShareModal.tsx
│   │       └── PosterCanvas.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── UploadPage.tsx
│   │   ├── AnalysisPage.tsx
│   │   ├── ReportPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── SharePage.tsx
│   │   ├── PolicyPage.tsx
│   │   └── SettingsPage.tsx
│   ├── hooks/
│   │   ├── useSSE.ts           # SSE 连接管理 Hook
│   │   ├── useAuth.ts
│   │   ├── useTasks.ts
│   │   └── useReports.ts
│   ├── stores/
│   │   ├── authStore.ts        # Zustand 用户状态
│   │   ├── taskStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── api.ts              # 后端接口类型映射
│   │   ├── models.ts           # 业务模型类型
│   │   └── enums.ts
│   ├── utils/
│   │   ├── format.ts           # 金额、百分比格式化
│   │   ├── constants.ts        # 前端常量
│   │   └── validators.ts       # 表单校验
│   └── styles/
│       └── globals.css
├── public/
│   └── templates/              # 预置经营场景模板下载
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── package.json
└── Dockerfile
```

---

## 五、InfiniSynapse API 集成规范

### 5.1 环境配置

```env
INFINI_BASE_URL=https://app.infinisynapse.cn
INFINI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
INFINI_TIMEOUT=60
```

### 5.2 核心封装（`services/infini_client.py`）

```python
class InfiniSynapseClient:
    """InfiniSynapse Server API 封装客户端"""

    async def connect_sse(self, conn_id: str) -> AsyncGenerator[dict, None]:
        """
        建立 SSE 事件流连接。
        必须先调用此方法，再发起 newTask。
        """
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/api/ai/events",
                params={"connId": conn_id},
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "text/event-stream",
                },
                timeout=aiohttp.ClientTimeout(total=None),
            ) as resp:
                async for line in resp.content:
                    event = self._parse_sse_line(line)
                    if event:
                        yield event

    async def new_task(
        self, conn_id: str, text: str, chat_settings: dict | None = None
    ) -> dict:
        """
        创建新的分析任务。
        前置条件：SSE 连接已建立且处于监听状态。
        """
        payload = {
            "type": "newTask",
            "text": text,
            "connId": conn_id,
            "chatSettings": chat_settings or {"mode": "act"},
        }
        return await self._post("/api/ai/message", payload)

    async def ask_response(
        self, task_id: str, text: str
    ) -> dict:
        """增量追问，基于已有 taskId 发起多轮对话。"""
        payload = {
            "type": "askResponse",
            "taskId": task_id,
            "askResponse": "messageResponse",
            "text": text,
        }
        return await self._post("/api/ai/message", payload)

    async def upload_to_task(
        self, task_id: str, file_path: str, subdir: str = ""
    ) -> dict:
        """将用户上传的文件归档到指定任务工作区。"""
        data = aiohttp.FormData()
        data.add_field("file", open(file_path, "rb"))
        params = {"subdir": subdir} if subdir else {}
        return await self._post(
            f"/api/tools/taskUpload/{task_id}",
            data=data,
            params=params,
        )

    async def get_task_info(self, task_id: str) -> dict:
        """查询任务元信息与状态。"""
        return await self._get(f"/api/ai_task/getTaskInfo/{task_id}")

    async def get_ui_messages(self, task_id: str) -> list[dict]:
        """获取任务 UI 消息列表，用于断线恢复。"""
        return await self._get("/api/ai_task/getUiMessageById", params={"id": task_id})

    async def get_task_workspace(self, task_id: str) -> dict:
        """获取任务工作区目录与文件列表。"""
        return await self._get(f"/api/ai_task/getTaskWorkspace/{task_id}")

    async def delete_tasks(self, task_ids: list[str]) -> dict:
        """批量删除任务（分析后即焚）。"""
        return await self._post("/api/ai_task/deleteTaskWithId", {"ids": task_ids})

    async def set_share(self, task_id: str, is_public: bool) -> dict:
        """设置任务公开分享状态。"""
        return await self._post("/api/ai_task/setShare", {
            "taskId": task_id,
            "isPublic": is_public,
        })
```

### 5.3 SSE 事件解析规范

| SSE 事件 | 字段标识 | 业务处理 |
|---------|---------|---------|
| `message.add` / `message.partial` | `message.type = "say"` | Agent 正常输出，聚合到报告文本 |
| `state.ready` | — | 任务就绪，开始监听后续事件 |
| `notification` + `type = error` | — | 标记任务失败，记录错误信息 |
| `heartbeat` | — | 保活，无需业务处理 |
| `message.ask = upload_file_to_sandbox` | — | Agent 请求上传文件：调用上传接口后用 `askResponse` 回传结果 |
| `message.ask/say = completion_result` | — | 任务完成，触发报告读取工作区产物 |

### 5.4 错误码映射

| InfiniSynapse 错误 | 后端处理 | 前端提示 |
|-------------------|---------|---------|
| `code = 1101 / 1105` | 抛 `401`，触发前端 Token 刷新 | "会话已过期，请重新登录" |
| HTTP `422` | 参数校验失败，原样转发 `message` | 表单字段级红字提示 |
| HTTP `400` | 业务校验失败（文件超限等） | Toast 提示具体原因 |
| HTTP `404` | 任务/资源不存在 | "分析任务已失效，请重新上传" |
| SSE 断线 | 自动重连（最多 3 次），重连失败标记任务异常 | "连接中断，正在尝试恢复..." |

---

## 六、数据库设计（PostgreSQL）

### 6.1 核心表结构

#### `users` — 用户表
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(20) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    nickname        VARCHAR(50),
    avatar_url      TEXT,
    region          VARCHAR(50),          -- 属地（省/市）
    business_type   VARCHAR(50),          -- 经营类型
    credits         INTEGER DEFAULT 10,   -- 剩余分析额度
    invite_code     VARCHAR(20) UNIQUE,   -- 专属邀请码
    invited_by      UUID REFERENCES users(id),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `tasks` — 分析任务表
```sql
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    infini_task_id  VARCHAR(64),          -- InfiniSynapse 返回的 taskId
    infini_conn_id  VARCHAR(64),          -- SSE connId
    title           VARCHAR(200),         -- 任务标题（如"7月外卖经营分析"）
    status          VARCHAR(20) DEFAULT 'pending',
                    -- pending / running / completed / failed / cancelled
    scenario_type   VARCHAR(50),          -- 12类高频场景标识
    prompt_text     TEXT,                 -- 提交给 AI 的完整分析指令
    progress_percent INTEGER DEFAULT 0,   -- 实时进度 0-100
    progress_step   VARCHAR(100),         -- 当前步骤名称
    is_public       BOOLEAN DEFAULT FALSE, -- 是否公开分享
    share_token     VARCHAR(64) UNIQUE,   -- 公开分享令牌
    destroyed_at    TIMESTAMPTZ,          -- 分析后即焚时间
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);
CREATE INDEX idx_tasks_user_created ON tasks(user_id, created_at DESC);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_share_token ON tasks(share_token) WHERE share_token IS NOT NULL;
```

#### `file_records` — 上传文件记录表
```sql
CREATE TABLE file_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
    original_name   VARCHAR(255),         -- 原始文件名（展示用）
    storage_key     VARCHAR(255) NOT NULL, -- MinIO/OSS 对象键
    file_size       BIGINT,
    mime_type       VARCHAR(100),
    field_schema    JSONB,                -- 自动识别的字段结构
    validation_status VARCHAR(20) DEFAULT 'pending',
    validation_errors JSONB,              -- 校验失败的详细提示
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `reports` — 分析报告表
```sql
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    summary         JSONB,                -- 核心KPI卡片数据
    charts          JSONB,                -- 图表配置与数据
    traceability    JSONB,                -- 溯源信息：指标→行号→结论档位
    advice          JSONB,                -- 行动建议列表
    raw_content     TEXT,                 -- AI 原始返回文本（可选存储摘要）
    pdf_url         TEXT,                 -- 生成的PDF文件地址
    markdown_url    TEXT,                 -- Markdown文件地址
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `credit_logs` — 积分流水表
```sql
CREATE TABLE credit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    change_amount   INTEGER NOT NULL,     -- 正数增加，负数扣减
    balance_after   INTEGER NOT NULL,
    reason          VARCHAR(50) NOT NULL, -- signup / daily_checkin / invite / task_create / admin_grant
    related_user_id UUID REFERENCES users(id), -- 邀请关联用户
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

#### `policy_feeds` — 政策资讯缓存表
```sql
CREATE TABLE policy_feeds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region          VARCHAR(50) NOT NULL,
    business_type   VARCHAR(50),
    title           VARCHAR(300) NOT NULL,
    source_url      TEXT NOT NULL,        -- 官方来源链接
    source_org      VARCHAR(200),         -- 发布机构
    publish_date    DATE,
    summary         TEXT,
    raw_content     TEXT,
    fetched_at      TIMESTAMPTZ DEFAULT NOW(),
    expires_at      TIMESTAMPTZ           -- 缓存过期时间
);
CREATE INDEX idx_policy_region_type ON policy_feeds(region, business_type);
```

---

## 七、模块详细接口设计

### 7.1 认证模块（`api/v1/auth.py`）

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/api/v1/auth/register` | 手机号注册 | `{phone, password, invite_code?}` | `{access_token, refresh_token, user}` |
| POST | `/api/v1/auth/login` | 登录 | `{phone, password}` | 同上 |
| POST | `/api/v1/auth/refresh` | 刷新 Token | `{refresh_token}` | `{access_token, refresh_token}` |
| POST | `/api/v1/auth/logout` | 登出 | — | `204 No Content` |

### 7.2 文件模块（`api/v1/files.py`）

| 方法 | 路径 | 说明 | 请求 | 响应 |
|------|------|------|------|------|
| POST | `/api/v1/files` | 上传文件 | `multipart/form-data` | `{id, original_name, storage_key, validation_status}` |
| GET | `/api/v1/files` | 历史文件列表 | `page`, `pageSize` | 分页列表 |
| DELETE | `/api/v1/files/{id}` | 删除文件 | — | `204` |
| GET | `/api/v1/files/templates` | 获取模板下载列表 | — | `[{name, scenario, download_url}]` |

### 7.3 任务模块（`api/v1/tasks.py`）

| 方法 | 路径 | 说明 | 请求 | 响应 |
|------|------|------|------|------|
| POST | `/api/v1/tasks` | 创建分析任务 | `{title, scenario_type, file_ids[], prompt_text?}` | `{id, status, conn_id}` |
| GET | `/api/v1/tasks/{id}/sse` | SSE 实时进度流 | — | `text/event-stream` |
| POST | `/api/v1/tasks/{id}/ask` | 增量追问 | `{text}` | `{ask_id, status}` |
| GET | `/api/v1/tasks` | 任务列表 | `page`, `pageSize`, `status?` | 分页列表 |
| GET | `/api/v1/tasks/{id}` | 任务详情 | — | 任务完整信息 |
| DELETE | `/api/v1/tasks/{id}` | 删除任务（即焚） | — | `204` |

**SSE 事件格式**：
```
event: progress
data: {"step": "数据清洗", "percent": 25, "detail": "识别到 3,420 条订单记录"}

event: progress
data: {"step": "指标核算", "percent": 60, "detail": "核算 GMV ¥128,450"}

event: completed
data: {"report_id": "uuid", "preview_url": "/api/v1/reports/uuid"}

event: error
data: {"code": "VALIDATION_ERROR", "message": "订单金额列存在 12 条异常负数"}
```

### 7.4 报告模块（`api/v1/reports.py`）

| 方法 | 路径 | 说明 | 请求 | 响应 |
|------|------|------|------|------|
| GET | `/api/v1/reports/{id}` | 报告详情 | — | 完整报告 JSON |
| GET | `/api/v1/reports/{id}/pdf` | 下载 PDF | — | `application/pdf` |
| GET | `/api/v1/reports/{id}/markdown` | 下载 Markdown | — | `text/markdown` |
| POST | `/api/v1/reports/compare` | 周期对比 | `{report_id_a, report_id_b}` | 对比分析报告 |
| GET | `/api/v1/reports` | 历史报告列表 | `page`, `pageSize`, `keyword?` | 分页列表 |

### 7.5 分享模块（`api/v1/shares.py`）

| 方法 | 路径 | 说明 | 请求 | 响应 |
|------|------|------|------|------|
| POST | `/api/v1/shares` | 生成分享 | `{task_id}` | `{share_url, share_token, expires_at}` |
| GET | `/api/v1/shares/{token}` | 公开访问分享页 | — | 报告只读快照（免登录） |
| GET | `/api/v1/shares/{token}/poster` | 生成分享海报 | — | `image/png` |

### 7.6 积分与裂变模块（`api/v1/invite.py`）

| 方法 | 路径 | 说明 | 请求 | 响应 |
|------|------|------|------|------|
| GET | `/api/v1/users/credits` | 查询剩余额度 | — | `{credits, total_used}` |
| POST | `/api/v1/users/checkin` | 每日签到 | — | `{credits_added, balance}` |
| GET | `/api/v1/invite/link` | 获取专属邀请链接 | — | `{invite_url, invite_code}` |
| POST | `/api/v1/invite/claim` | 新用户填写邀请码 | `{invite_code}` | `{credits_added}` |

### 7.7 政策模块（`api/v1/policies.py`）

| 方法 | 路径 | 说明 | 请求 | 响应 |
|------|------|------|------|------|
| GET | `/api/v1/policies` | 检索政策 | `region`, `business_type?` | `[{title, source_url, source_org, publish_date, summary}]` |

### 7.8 数据销毁模块（`api/v1/destroy.py`）

| 方法 | 路径 | 说明 | 请求 | 响应 |
|------|------|------|------|------|
| POST | `/api/v1/destroy/all` | 一键销毁所有数据 | `{confirm_password}` | `{deleted_files, deleted_tasks, deleted_reports}` |

---

## 八、核心业务逻辑设计

### 8.1 任务创建与 SSE 流转

```
用户提交分析请求
    │
    ▼
后端生成 connId (UUID) + taskId (UUID)
    │
    ├── 扣除用户 1 次分析额度（事务）
    ├── 上传文件通过 taskUpload 归档到 InfiniSynapse 任务
    │
    ▼
启动后台 asyncio Task：
    1. 建立 SSE 连接 /api/ai/events?connId=xxx
    2. 调用 newTask 提交分析指令
    3. 实时解析 SSE 事件：
       - progress → 更新 DB tasks.progress_percent / progress_step
       - 通过 Redis Pub/Sub 推送给前端 SSE 网关
    4. 任务完成 → 读取工作区产物 → 调用 report_service 生成报告
    5. 任务失败 → 回滚额度、记录错误日志
```

### 8.2 可信溯源体系

- **指标提取**：AI 返回的每个经营指标必须附带 `source_rows`（原始数据行号数组）
- **三档结论**：
  - `consistent`（一致）：原始数据直接核算得出
  - `questionable`（存疑）：部分数据缺失，基于插值或行业均值推算
  - `mismatch`（不符）：原始数据与指标计算结果不一致，需人工复核
- **溯源存储**：`reports.traceability` JSONB 字段格式：
  ```json
  {
    "gmv": {
      "value": 128450,
      "source_rows": [2, 5, 8, 12, 15],
      "conclusion": "consistent",
      "calculation": "SUM(订单金额) WHERE 状态='已完成'"
    }
  }
  ```

### 8.3 积分体系规则

| 行为 | 额度变动 | 限制条件 |
|------|---------|---------|
| 新用户注册 | +10 | 仅限首次 |
| 每日签到 | +1 | 每日 0 点后重置，连续 7 天额外 +3 |
| 邀请好友注册 | +3 | 双方各得，无上限 |
| 创建分析任务 | -1 | 额度不足时禁止创建 |
| 分享报告被访问 | +0（记录数据，后续可运营激励） | — |

### 8.4 数据销毁流程

```
用户发起「一键销毁」
    │
    ▼
校验密码（二次身份确认）
    │
    ▼
事务执行：
    1. 查询用户所有 task.infini_task_id
    2. 调用 InfiniSynapse deleteTaskWithId 批量删除云端任务
    3. 删除本地 file_records → 级联删除 MinIO 对象
    4. 删除本地 tasks → 级联删除 reports
    5. 保留用户账号与积分流水（审计需要），其余经营数据清零
    6. 记录 destroy_logs 审计日志
```

---

## 九、前端关键交互设计

### 9.1 响应式断点

| 断点 | 宽度 | 布局策略 |
|------|------|---------|
| Mobile | < 640px | 单列堆叠、底部固定导航、图表转横向滚动 |
| Tablet | 640-1024px | 双列网格、侧边栏可折叠 |
| Desktop | > 1024px | 三列布局、固定侧边栏、图表全尺寸展示 |

### 9.2 SSE 前端实现规范

```typescript
// hooks/useSSE.ts
function useTaskSSE(taskId: string) {
  const [status, setStatus] = useState<'connecting' | 'running' | 'completed' | 'error'>('connecting');
  const [progress, setProgress] = useState({ step: '', percent: 0 });

  useEffect(() => {
    const evtSource = new EventSource(`/api/v1/tasks/${taskId}/sse`, {
      withCredentials: true,
    });

    evtSource.addEventListener('progress', (e) => {
      const data = JSON.parse(e.data);
      setProgress(data);
    });

    evtSource.addEventListener('completed', (e) => {
      setStatus('completed');
      evtSource.close();
    });

    evtSource.addEventListener('error', (e) => {
      setStatus('error');
      evtSource.close();
      // 3 秒后自动重连（最多 3 次）
    });

    return () => evtSource.close();
  }, [taskId]);

  return { status, progress };
}
```

### 9.3 图表规范

- **品类利润占比**：ECharts 饼图 / 环形图，支持点击下钻
- **库存周转趋势**：ECharts 折线图，双 Y 轴（数量 + 周转天数）
- **评价关键词云**：ECharts WordCloud，字号映射词频
- **渠道 ROI 对比**：ECharts 柱状图，数值标签置顶，红绿色标注盈亏
- **所有图表**：hover 显示原始数据行号入口，点击跳转溯源面板

---

## 十、部署与运维规范

### 10.1 容器化部署

```yaml
# docker-compose.yml 核心服务
services:
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/infinshow
      - REDIS_URL=redis://redis:6379/0
      - INFINI_API_KEY=${INFINI_API_KEY}
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  postgres:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  celery_worker:
    build: ./backend
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/infinshow
      - REDIS_URL=redis://redis:6379/0
```

### 10.2 环境变量清单（`.env.example`）

```env
# === 应用基础 ===
APP_NAME=可信经营洞察引擎
APP_ENV=development  # development / staging / production
DEBUG=false
SECRET_KEY=change-me-in-production-min-32-chars

# === 数据库 ===
DATABASE_URL=postgresql+asyncpg://infinshow:infinshow@localhost:5432/infinshow

# === Redis ===
REDIS_URL=redis://localhost:6379/0

# === InfiniSynapse ===
INFINI_BASE_URL=https://app.infinisynapse.cn
INFINI_API_KEY=sk-your-api-key-here
INFINI_TIMEOUT=60

# === 存储 ===
STORAGE_TYPE=minio  # minio / aliyun_oss
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=infinshow

# === 邮件/短信（可选）===
SMS_ACCESS_KEY_ID=
SMS_ACCESS_KEY_SECRET=
```

### 10.3 CI/CD 流水线（GitHub Actions）

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r backend/requirements.txt
      - run: cd backend && ruff check .
      - run: cd backend && mypy app/
      - run: cd backend && pytest tests/ --cov=app --cov-report=xml

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }
      - run: cd frontend && npm ci
      - run: cd frontend && npm run lint
      - run: cd frontend && npm run type-check
      - run: cd frontend && npm run test
```

---

## 十一、测试规范

### 11.1 测试金字塔

| 层级 | 比例 | 工具 | 覆盖范围 |
|------|------|------|---------|
| 单元测试 | 70% | pytest + pytest-asyncio | Service 层纯函数、工具类、Pydantic Schema |
| 集成测试 | 20% | pytest + TestClient + httpx | API 路由、DB 事务、Redis 交互、文件上传 |
| E2E 测试 | 10% | Playwright | 核心用户旅程：注册→上传→分析→导出→分享 |

### 11.2 关键测试场景

- **InfiniSynapse 客户端**：Mock SSE 流，验证事件解析、断线重连、错误处理
- **任务创建**：Mock newTask 响应，验证额度扣减、文件归档、SSE 推送链路
- **报告对比**：构造两份报告 JSON，验证环比计算与驱动原因高亮逻辑
- **数据销毁**：验证级联删除、MinIO 对象清理、InfiniSynapse 任务删除调用
- **并发安全**：多用户同时创建任务，验证积分扣减无超卖

---

## 十二、赛事合规 checklist

- [ ] 所有 InfiniSynapse API Key 仅通过服务端环境变量存储，前端零暴露
- [ ] 所有长任务严格遵循「先 SSE 连接，再 newTask」的顺序
- [ ] 所有分析任务均为真实调用，保留 taskId 与 connId 记录供核验
- [ ] 公开分享页通过 `setShare` 生成，附带平台后台可查验的任务链接
- [ ] 公网部署版本无需本地运行，浏览器即可完整体验
- [ ] 无演示造假，所有 Task ID 可在 InfiniSynapse 平台后台核验调用记录

---

> **文档维护**：本开发文档随版本迭代同步更新，任何架构变更、接口调整、新增模块均需在合并前更新对应章节，并在 `CHANGELOG.md` 中记录变更摘要。
