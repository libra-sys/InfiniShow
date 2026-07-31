"""InfiniSynapse API 客户端封装.

严格对齐 InfiniSynapse 官方 Server API：
- SSE: GET /api/ai/events?connId=<uuid>
- 消息: POST /api/ai/message { type, ... }
- 任务信息: GET /api/ai_task/getTaskInfo/:id
- 工作区: GET /api/ai_task/getTaskWorkspace/:id
- UI 消息: GET /api/ai_task/getUiMessageById?id=
- 删除: POST /api/ai_task/deleteTaskWithId { ids: [] }
- 分享: POST /api/ai_task/setShare { taskId, isPublic }
- 上传: POST /api/tools/taskUpload/:taskId?subdir=&naming=
"""

import json
import logging
import uuid
from typing import Any, AsyncGenerator

import aiohttp

from app.config import get_settings

logger = logging.getLogger("infinshow.infini")


class InfiniSynapseClient:
    """InfiniSynapse Server API 封装."""

    def __init__(self):
        settings = get_settings()
        self.base_url = settings.infinisynapse_base_url.rstrip("/")
        self.api_key = settings.infinisynapse_api_key
        self._session: aiohttp.ClientSession | None = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=aiohttp.ClientTimeout(total=120),
            )
        return self._session

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    @staticmethod
    def generate_conn_id() -> str:
        """生成 SSE 连接 ID（UUID）."""
        return str(uuid.uuid4())

    @staticmethod
    def generate_task_id() -> str:
        """预生成 taskId（UUID），用于幂等控制."""
        return str(uuid.uuid4())

    async def connect_sse(self, conn_id: str) -> AsyncGenerator[dict[str, Any], None]:
        """建立 SSE 事件流连接.

        官方端点: GET /api/ai/events?connId=<conn_id>
        必须先调用此方法建立 SSE，再发 newTask。
        """
        session = await self._get_session()
        url = f"/api/ai/events?connId={conn_id}"

        async with session.get(url, headers={"Accept": "text/event-stream"}) as response:
            if response.status != 200:
                error_text = await response.text()
                logger.error("SSE connect failed: %s %s", response.status, error_text)
                return

            async for line in response.content:
                line_str = line.decode("utf-8").strip()
                if not line_str:
                    continue

                # SSE 格式: "data: {...}" 或 "data: [DONE]" 或纯文本 "ping"
                if line_str.startswith("data:"):
                    data_str = line_str[5:].strip()
                    if data_str == "[DONE]":
                        break
                    # ping 心跳（纯文本）
                    if data_str in ("ping", "pong", "heartbeat"):
                        continue
                    try:
                        yield json.loads(data_str)
                    except json.JSONDecodeError:
                        logger.debug("SSE non-JSON data: %s", data_str[:100])
                elif line_str in ("ping", "pong", "heartbeat"):
                    # 纯文本心跳行，跳过
                    continue
                elif line_str.startswith("event:"):
                    # SSE event 字段，跳过（我们在 data 行中处理）
                    continue

    async def new_task(
        self,
        conn_id: str,
        text: str,
        task_id: str | None = None,
        chat_settings: dict[str, Any] | None = None,
        files: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """创建新分析任务.

        官方端点: POST /api/ai/message
        Body: { type: "newTask", text, connId, taskId?, chatSettings?, files? }
        """
        session = await self._get_session()
        payload: dict[str, Any] = {
            "type": "newTask",
            "text": text,
            "connId": conn_id,
        }
        if task_id:
            payload["taskId"] = task_id
        if chat_settings:
            payload["chatSettings"] = chat_settings
        else:
            payload["chatSettings"] = {"mode": "act"}
        if files:
            payload["files"] = files

        async with session.post("/api/ai/message", json=payload) as resp:
            result = await resp.json()
            # 200 = 成功返回, 201 = 任务已创建并开始运行
            if resp.status not in (200, 201):
                logger.error("newTask failed: %s %s", resp.status, result)
            else:
                logger.info("newTask created: taskId=%s", task_id or "auto")
            return result

    async def ask_response(
        self,
        task_id: str,
        text: str,
        conn_id: str | None = None,
    ) -> dict[str, Any]:
        """增量追问，基于已有 taskId 发起多轮对话.

        官方端点: POST /api/ai/message
        Body: { type: "askResponse", taskId, askResponse: "messageResponse", text?, connId? }
        """
        session = await self._get_session()
        payload: dict[str, Any] = {
            "type": "askResponse",
            "taskId": task_id,
            "askResponse": "messageResponse",
            "text": text,
        }
        if conn_id:
            payload["connId"] = conn_id

        async with session.post("/api/ai/message", json=payload) as resp:
            result = await resp.json()
            if resp.status not in (200, 201):
                logger.error("askResponse failed: %s %s", resp.status, result)
            return result

    async def cancel_task(self, task_id: str) -> dict[str, Any]:
        """取消运行中任务.

        官方端点: POST /api/ai/message
        Body: { type: "cancelTask", taskId }
        """
        session = await self._get_session()
        payload = {"type": "cancelTask", "taskId": task_id}
        async with session.post("/api/ai/message", json=payload) as resp:
            return await resp.json()

    async def upload_to_task(
        self,
        task_id: str,
        file_path: str,
        subdir: str = "upload_documents",
        naming: str = "original",
    ) -> dict[str, Any]:
        """将文件归档到任务工作区.

        官方端点: POST /api/tools/taskUpload/:taskId?subdir=&naming=
        用于产品主动归档源文档（非 Agent 请求的被动上传）。
        """
        session = await self._get_session()
        form = aiohttp.FormData()
        filename = file_path.split("/")[-1].split("\\")[-1]
        with open(file_path, "rb") as f:
            form.add_field("file", f, filename=filename)
            url = f"/api/tools/taskUpload/{task_id}?subdir={subdir}&naming={naming}"
            async with session.post(url, data=form) as resp:
                return await resp.json()

    async def get_task_info(self, task_id: str) -> dict[str, Any]:
        """查询任务元信息与状态.

        官方端点: GET /api/ai_task/getTaskInfo/:id
        """
        session = await self._get_session()
        async with session.get(f"/api/ai_task/getTaskInfo/{task_id}") as resp:
            return await resp.json()

    async def get_ui_messages(self, task_id: str) -> list[dict[str, Any]]:
        """获取任务 UI 消息列表，用于断线恢复.

        官方端点: GET /api/ai_task/getUiMessageById?id=
        """
        session = await self._get_session()
        async with session.get("/api/ai_task/getUiMessageById", params={"id": task_id}) as resp:
            result = await resp.json()
            # 官方返回 { code, message, data: [...] }
            if isinstance(result, list):
                return result
            if isinstance(result, dict):
                return result.get("data", [])
            return []

    async def get_task_workspace(self, task_id: str) -> dict[str, Any]:
        """获取任务工作区目录与文件列表.

        官方端点: GET /api/ai_task/getTaskWorkspace/:id
        返回 { cwd, files }，files 可能是字符串路径数组或文件对象数组。
        """
        session = await self._get_session()
        async with session.get(f"/api/ai_task/getTaskWorkspace/{task_id}") as resp:
            return await resp.json()

    async def delete_tasks(self, task_ids: list[str]) -> dict[str, Any]:
        """批量删除任务（分析后即焚）.

        官方端点: POST /api/ai_task/deleteTaskWithId
        Body: { ids: [...] }
        """
        session = await self._get_session()
        async with session.post("/api/ai_task/deleteTaskWithId", json={"ids": task_ids}) as resp:
            return await resp.json()

    async def set_share(self, task_id: str, is_public: bool) -> dict[str, Any]:
        """设置任务公开分享状态.

        官方端点: POST /api/ai_task/setShare
        Body: { taskId, isPublic }
        """
        session = await self._get_session()
        async with session.post("/api/ai_task/setShare", json={"taskId": task_id, "isPublic": is_public}) as resp:
            return await resp.json()

    async def get_task_state(self, task_id: str | None = None) -> dict[str, Any]:
        """获取任务/全局完整前端状态.

        官方端点: GET /api/ai/state?taskId=
        """
        session = await self._get_session()
        params = {"taskId": task_id} if task_id else {}
        async with session.get("/api/ai/state", params=params) as resp:
            return await resp.json()

    async def download_task_file(self, task_id: str, path: str) -> bytes:
        """下载任务工作区文件（二进制流）.

        官方端点: GET /api/tools/storage/downloadTaskFile/:taskId?path=
        返回二进制，不要按 JSON 解析。
        """
        session = await self._get_session()
        from urllib.parse import quote
        encoded_path = quote(path, safe="")
        url = f"/api/tools/storage/downloadTaskFile/{task_id}?path={encoded_path}"
        async with session.get(url) as resp:
            return await resp.read()

    async def preview_file(self, task_id: str, file_name: str) -> dict[str, Any]:
        """预览任务工作区文件.

        官方端点: POST /api/ai_task/previewFile
        Body: { taskId, fileName }
        """
        session = await self._get_session()
        async with session.post("/api/ai_task/previewFile", json={"taskId": task_id, "fileName": file_name}) as resp:
            return await resp.json()

    async def ping(self) -> dict[str, Any]:
        """心跳检查 API Key 是否有效.

        官方端点: GET /api/ai/ping
        返回 { ok: true }
        """
        session = await self._get_session()
        async with session.get("/api/ai/ping") as resp:
            return await resp.json()


infini_client = InfiniSynapseClient()
