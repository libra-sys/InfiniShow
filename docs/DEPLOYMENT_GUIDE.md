# InfiniShow 部署指南

## 架构概览

```
评委浏览器 → Vercel CDN (前端) → Render.com (后端 FastAPI) → InfiniSynapse API (AI 分析)
                                      ↓
                                  SQLite (数据持久化)
                                  本地文件系统 (上传文件)
                                  内存缓存 (替代 Redis)
```

**三个平台均为免费且稳定**：
- Vercel：前端静态托管，全球 CDN，永不宕机
- Render.com：后端 Web Service，免费 750h/月，15 分钟无请求会休眠（首次访问冷启动 ~30 秒）
- InfiniSynapse：AI 分析能力由大赛平台提供

---

## 第一步：推送代码到 GitHub

```bash
cd i:\infinshow
git add -A
git commit -m "准备部署：适配云平台托管"
git push origin main
```

---

## 第二步：部署后端到 Render.com

1. 访问 https://render.com，用 GitHub 账号登录
2. 点击 **New +** → **Web Service**
3. 连接你的 GitHub 仓库 `Octo-o-o-o/InfiniShow`
4. 配置：
   - **Name**: `infinshow-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. 环境变量（Environment 标签页）：
   - `APP_ENV` = `production`
   - `DEBUG` = `false`
   - `SECRET_KEY` = （任意随机字符串，如 `infinshow-prod-2026-secret`）
   - `ALLOWED_ORIGINS` = `*`（部署完前端后改为 Vercel 域名）
   - `DATABASE_URL` = `sqlite+aiosqlite:///./infinshow.db`
   - `DATABASE_URL_SYNC` = `sqlite:///./infinshow.db`
   - `INFINISYNAPSE_API_KEY` = `sk-6a6b8467d3b5ec19a46276fb`
   - `INFINISYNAPSE_BASE_URL` = `https://app.infinisynapse.cn`
   - `LOCAL_UPLOAD_DIR` = `./data/uploads`
6. 点击 **Create Web Service**
7. 等待构建完成（约 2-3 分钟）
8. 验证：访问 `https://infinshow-backend.onrender.com/health`，应返回 `{"status":"ok"}`

> ⚠️ Render 免费版 15 分钟无请求会休眠，评委首次访问冷启动约 30 秒。为避免此问题，可在部署后用 https://cron-job.org 每 10 分钟 ping 一次 `/health` 端点。

---

## 第三步：部署前端到 Vercel

1. 访问 https://vercel.com，用 GitHub 账号登录
2. 点击 **Add New** → **Project**
3. 导入仓库 `Octo-o-o-o/InfiniShow`
4. 配置：
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 环境变量（Settings → Environment Variables）：
   - `VITE_API_BASE_URL` = `https://infinshow-backend.onrender.com/api/v1`
6. 点击 **Deploy**
7. 等待构建完成（约 1-2 分钟）
8. 验证：访问 Vercel 分配的域名（如 `https://infinshow.vercel.app`）

---

## 第四步：更新 CORS 白名单

1. 回到 Render.com → `infinshow-backend` → Environment
2. 将 `ALLOWED_ORIGINS` 改为你的 Vercel 域名：
   ```
   https://infinshow.vercel.app,https://infinshow-xxx.vercel.app
   ```
3. 保存后会自动重新部署

---

## 第五步：防止休眠（可选但推荐）

1. 访问 https://cron-job.org
2. 创建定时任务：
   - **URL**: `https://infinshow-backend.onrender.com/health`
   - **执行频率**: 每 10 分钟
3. 这样后端不会进入休眠状态，评委访问时秒开

---

## 部署验证清单

- [ ] `https://infinshow-backend.onrender.com/health` 返回 `{"status":"ok"}`
- [ ] `https://infinshow.vercel.app` 能打开前端页面
- [ ] 前端注册/登录功能正常
- [ ] 上传文件 → 创建分析任务 → SSE 进度 → 报告生成 全流程跑通
- [ ] InfiniSynapse 后台能看到 API 调用日志

---

## 降级策略说明

| 组件 | 生产环境 | 免费降级方案 | 影响 |
|------|---------|-------------|------|
| PostgreSQL | 外部数据库 | SQLite（本地文件） | 性能略低，评委量级无影响 |
| Redis | 外部缓存 | 内存字典 | 重启后缓存丢失，不影响功能 |
| MinIO | 对象存储 | 本地文件系统 | 文件存服务器磁盘（1GB 够用）|
| Celery | 异步任务队列 | 线程池直接执行 | PDF/海报生成在后台线程，不阻塞请求 |

**对于评委访问场景（几十人量级），降级方案完全够用。**

---

## 常见问题

**Q: 评委访问时后端冷启动慢怎么办？**
A: 用 cron-job.org 每 10 分钟 ping `/health`，保持后端唤醒。

**Q: SQLite 数据会丢吗？**
A: Render 免费版有 1GB 持久磁盘（`./data/` 目录），重启不丢数据。如需更强保障可升级到 Supabase 免费 PostgreSQL。

**Q: 上传的文件存哪？**
A: 存在后端服务器 `./data/uploads/` 目录，1GB 磁盘够存几百个 Excel/CSV。

**Q: InfiniSynapse 调用日志在哪查？**
A: 登录 https://app.infinisynapse.cn 后台，可看到所有 API 调用记录（含 taskId）。
