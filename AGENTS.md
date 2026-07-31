<!-- infinisynapse-assistant:begin (managed by tools/install-into.sh) -->
## InfiniSynapse 集成规则（引用规则包）

本项目依赖 InfiniSynapse。涉及 Server API、SSE、workspace、RAG、Skill、Browser Use、
文件上传下载、私有化部署或任务分享时，先读取本项目 .agents/skills/infinisynapse-*，
需要完整 reference / playbooks / 上游文档快照时读取规则包：
i:\infinshow\InfinisynapseAssistant

硬约束速览：
- API Key 只在可信后端边界；前端/客户端（含鸿蒙 app）只调用自己的后端。
- 非 agentic 轻量调用直连 LLM；agentic 长任务 / Browser Use / workspace 产物走 InfiniSynapse。
- 先 GET /api/ai/events 连 SSE，再 POST /api/ai/message 发 newTask。
- 产物读 getTaskWorkspace / previewFile / downloadTaskFile；下载端点是二进制流。
- 两类上传分清：/api/ai/upload（响应 Agent）vs /api/tools/taskUpload（主动归档）。
- 不编造端点；先搜规则包 upstream-docs/infinisynapse-site/zh/markdown/。
<!-- infinisynapse-assistant:end -->
