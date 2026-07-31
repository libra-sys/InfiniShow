# 可信经营洞察引擎 — 产品能力补充开发文档

> 本文件作为 `DEVELOPMENT_GUIDE.md` 的补充，聚焦产品经理视角审查出的核心体验断点与差异化能力缺口，按可执行粒度输出。

---

## 一、12 类高频经营场景定义与预置数据模板

### 1.1 场景总览

| 编号 | 场景名称 | 目标商户 | 核心分析维度 | 默认主指标 |
|------|---------|---------|-------------|-----------|
| S01 | 外卖餐饮店 | 入驻美团/饿了么的中小餐饮 | 订单、评价、菜品、时段 | 单均实收、差评率、出餐时长 |
| S02 | 电商小店 | 淘宝/拼多多/抖音电商个体 | 流量、转化、售后、SKU | 转化率、退货率、广告 ROI |
| S03 | 线下便利店 | 社区/写字楼便利店 | 销售、库存、损耗、品类 | 坪效、周转天数、缺货率 |
| S04 | 社区生鲜店 | 生鲜果蔬专营店 | 损耗、毛利、复购、时段 | 损耗率、毛利率、复购率 |
| S05 | 美发美甲店 | 美业个体/工作室 | 预约、客单价、会员、评价 | 客单价、翻台率、会员占比 |
| S06 | 教培工作室 | 线下/线上小班课机构 | 招生、消课、续费、退费率 | 消课率、续费率、获客成本 |
| S07 | 健身私教馆 | 健身房/瑜伽/私教工作室 | 会员、约课、续卡、体验 | 会员留存率、课消率、续卡率 |
| S08 | 宠物服务店 | 宠物美容/寄养/医院 | 服务、商品、会员、评价 | 服务占比、复购率、客单价 |
| S09 | 汽车后市场 | 洗车/保养/维修门店 | 工单、配件、客户、产值 | 单车产值、回厂率、毛利 |
| S10 | 母婴零售店 | 母婴用品实体店 | 会员、品类、库存、营销 | 会员销售占比、周转天数、连带率 |
| S11 | 文创手作店 | 手工体验/礼品店 | 体验课、零售、定制、评价 | 体验课转化、客单价、复购率 |
| S12 | 综合零售店 | 杂货铺/小超市 | 销售、品类、库存、客流 | 客单价、品类贡献、库存周转 |

### 1.2 场景配置结构

后端以 `scenario_config` 表（或在代码中维护 YAML）固化每类场景的元数据：

```yaml
# backend/config/scenarios.yaml
scenarios:
  S01:
    name: "外卖餐饮店"
    icon: "utensils"
    demo_file: "demo_S01.csv"
    form_groups:
      - group: "基础经营"
        fields:
          - key: "total_orders"
            label: "近30天总订单数"
            type: number
            required: true
          - key: "total_revenue"
            label: "近30天实收金额（元）"
            type: number
            required: true
      - group: "用户评价"
        fields:
          - key: "avg_rating"
            label: "平均评分（1-5）"
            type: number
            min: 1
            max: 5
          - key: "bad_review_count"
            label: "差评数"
            type: number
    default_metrics:
      - "GMV"
      - "单均实收"
      - "差评率"
      - "出餐时长"
    prompt_template: "prompts/S01_analyst.txt"
```

### 1.3 预置示例数据模板

每类场景提供 2 份示例数据：

1. **CSV 模板**（`backend/seed/templates/S{xx}_template.csv`）：用户下载后按列填充上传。
2. **Demo 数据**（`backend/seed/demos/S{xx}_demo.csv`）：30~200 行真实模拟数据，用于一键体验。

#### S01 外卖餐饮店字段规范

| 字段名 | 类型 | 是否必填 | 说明 |
|-------|------|---------|------|
| order_id | string | 是 | 订单唯一编号 |
| order_time | datetime | 是 | 下单时间，格式 `2025-07-01 12:34:00` |
| platform | enum | 是 | 美团/饿了么/自营 |
| actual_amount | decimal | 是 | 实收金额（元） |
| original_amount | decimal | 否 | 原价金额 |
| delivery_fee | decimal | 否 | 配送费 |
| platform_fee | decimal | 否 | 平台扣点/佣金 |
| food_cost | decimal | 否 | 食材成本 |
| dish_names | string | 否 | 菜品名称，多个用 `\|` 分隔 |
| rating | int | 否 | 用户评价 1-5 |
| review_text | string | 否 | 评价原文 |
| delivery_duration | int | 否 | 骑手送达时长（分钟） |
| refund_flag | bool | 否 | 是否退款 0/1 |

其他场景字段结构类似，按各自业务补充。所有字段映射由后端 `SchemaMapper` 统一处理，未命中字段进入“待确认字段”列表由用户二次映射。

---

## 二、无文件表单分析入口设计

### 2.1 产品目标

满足 PRD 中“填写核心数字即可生成专业报告”的零门槛体验，降低首次使用门槛。

### 2.2 交互流程

```
首页选择场景 → 进入“快速录入”页 → 按分组填写字段 → 提交 → 后端生成 CSV → 走标准 newTask 流程 → SSE 推送 → 报告页
```

### 2.3 接口设计

#### POST `/api/v1/tasks/quick`

请求体：

```json
{
  "scenario_code": "S01",
  "inputs": {
    "total_orders": 1200,
    "total_revenue": 36000,
    "avg_rating": 4.2,
    "bad_review_count": 45,
    "delivery_duration_avg": 38,
    "food_cost_rate": 0.35,
    "platform_fee_rate": 0.22,
    "peak_hours": "11:00-13:00,17:00-19:00"
  },
  "currency_unit": "CNY"
}
```

后端处理逻辑：

1. 校验 `scenario_code` 存在且启用。
2. 根据场景配置校验必填字段与数值范围。
3. 调用 `QuickDataBuilder` 生成标准化 CSV，行数不少于 30 行（按输入聚合指标反推分布，避免 AI 因样本过少过度泛化）。
4. 将 CSV 通过 `taskUpload` 上传至任务工作区。
5. 调用 `newTask` 创建分析任务，后续流程与文件上传完全一致。

### 2.4 数据结构生成规则

以 S01 为例，给定输入后按以下规则生成模拟明细：

- 总订单数、总实收金额按输入严格对齐。
- 订单时间分布按高峰期加权随机生成。
- 评分分布：均值锚定 `avg_rating`，差评数严格等于 `bad_review_count`。
- 配送时长、平台扣点按输入均值正态分布生成。

生成后写入临时 CSV，保存至对象存储并关联 `file_records`，状态标记为 `generated_from_form = true`。

---

## 三、预置示例报告加载机制

### 3.1 产品目标

首页“一键体验”点击后，用户无需注册即可在 1 秒内看到完整报告，支持交互（图表、溯源、追问）。

### 3.2 技术方案

采用 **服务端预生成 Demo 报告 + 运行时复制到当前会话** 的机制：

1. 部署时通过种子脚本向 `tasks` / `reports` 表插入 12 条 `is_demo = true` 的示例任务。
2. 每条示例任务保留真实的 `task_id` / `conn_id`（指向 InfiniSynapse 平台历史任务），满足赛事核验要求。
3. 用户点击“一键体验”时，前端调用 `POST /api/v1/reports/demo`：

请求：

```json
{
  "scenario_code": "S01"
}
```

响应：

```json
{
  "code": 0,
  "data": {
    "report_id": "rpt_xxxxxxxx",
    "task_id": "task_xxxxxxxx",
    "redirect_url": "/reports/rpt_xxxxxxxx"
  }
}
```

4. 后端将对应示例报告复制一份，生成新的 `report_id`，关联到当前匿名会话或登录用户。
5. 复制后的报告支持追问，追问时基于原 `task_id` 调用 `askResponse`，新结果追加到当前复制报告的 `conversations` 中。

### 3.3 接口设计

#### POST `/api/v1/reports/demo`

- 权限：允许匿名访问（绑定 `anonymous_id`）。
- 限制：同一会话每日最多复制 20 次示例报告，防止滥用。
- 返回：报告 ID 与跳转地址。

### 3.4 前端实现

首页场景卡片绑定 `onDemoClick(scenarioCode)`：

```typescript
async function onDemoClick(scenarioCode: string) {
  const res = await api.post('/api/v1/reports/demo', { scenario_code: scenarioCode });
  navigate(`/reports/${res.data.report_id}?mode=demo`);
}
```

报告页读取 `mode=demo` 时，顶部显示“示例报告”水印条，并在溯源面板提示“示例数据，仅供体验”。

---

## 四、SSE 断线恢复与页面刷新同步

### 4.1 产品目标

确保长任务分析过程中，用户刷新页面、切换标签页、网络抖动后仍能恢复到当前状态，避免任务“丢失”。

### 4.2 状态持久化策略

前端使用 `localStorage` 缓存当前活跃任务：

```typescript
interface ActiveTaskCache {
  taskId: string;
  connId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  lastEventId: string;
  createdAt: number;
  scenarioCode: string;
  reportId?: string;
}

const CACHE_KEY = 'credible_insight_active_task';
```

生命周期：

- 创建任务成功后写入缓存。
- 收到 `status: completed` 事件后，更新缓存并写入 `reportId`。
- 用户主动关闭报告页或点击“结束分析”后清除缓存。

### 4.3 刷新恢复流程

页面加载时（如 `/analysis` 或 `/reports/:id`）：

```
1. 读取 localStorage 中的 ActiveTaskCache。
2. 若状态为 completed 且存在 reportId：
   - 直接跳转 /reports/:reportId，不重建 SSE。
3. 若状态为 running/pending：
   - 调 GET /api/v1/tasks/:taskId/status 获取后端最新状态。
   - 若后端状态已完成，跳转报告页。
   - 若仍在运行，重建 SSE 连接，并携带 Last-Event-ID 请求头实现断点续传。
4. 若状态为 failed：
   - 展示失败原因与“重试”按钮。
```

### 4.4 SSE 断点续传

连接接口支持 `Last-Event-ID` 查询参数：

```
GET /api/v1/tasks/{task_id}/events?last_event_id={lastEventId}
```

后端实现：

- 缓存最近 5 分钟的事件到 Redis（Key: `sse:buffer:{task_id}`，List 结构）。
- 重建连接时，先推送缓存中 `event_id > lastEventId` 的历史事件，再转发 InfiniSynapse 的实时 SSE 流。
- 若任务已结束，直接推送最终事件并关闭连接。

### 4.5 后端接口设计

#### GET `/api/v1/tasks/{task_id}/status`

返回任务当前聚合状态：

```json
{
  "code": 0,
  "data": {
    "task_id": "task_xxx",
    "status": "running",
    "progress": 65,
    "current_step": "指标核算",
    "report_id": null,
    "error_message": null,
    "updated_at": "2026-07-31T12:34:56Z"
  }
}
```

### 4.6 前端 Hook 规范

```typescript
function useAnalysisSSE(taskId: string) {
  const [events, setEvents] = useState<AnalysisEvent[]>([]);
  const [status, setStatus] = useState<TaskStatus>('pending');

  useEffect(() => {
    const cache = getActiveTaskCache();
    const lastEventId = cache?.taskId === taskId ? cache.lastEventId : undefined;

    const eventSource = new EventSource(
      `/api/v1/tasks/${taskId}/events?last_event_id=${lastEventId || ''}`
    );

    eventSource.onmessage = (e) => {
      const evt = JSON.parse(e.data);
      setEvents(prev => [...prev, evt]);
      updateActiveTaskCache({ lastEventId: evt.id, status: evt.status });
      if (evt.status === 'completed') {
        eventSource.close();
        clearActiveTaskCache();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setTimeout(() => reconnect(taskId), 3000);
    };

    return () => eventSource.close();
  }, [taskId]);

  return { events, status };
}
```

---

## 五、可信溯源前端交互设计

### 5.1 产品目标

让“每条结论都有据可查”从数据库字段变成用户可感知、可验证的交互能力，建立产品信任感。

### 5.2 溯源数据模型

后端返回的报告 JSON 中，每个指标包含 `traceability` 字段：

```json
{
  "metric_id": "m001",
  "name": "近30天GMV",
  "value": 36000,
  "unit": "元",
  "conclusion": "consistent",
  "traceability": {
    "formula": "SUM(actual_amount)",
    "row_count": 1200,
    "row_sample": ["row_1", "row_2", "row_3"],
    "data_source": "uploaded_order_S01.csv",
    "field_mapping": {
      "actual_amount": "实收金额"
    },
    "verification_log": [
      {
        "step": "数据清洗",
        "action": "剔除退款订单 12 笔",
        "affected_rows": 12
      },
      {
        "step": "指标核算",
        "action": "对 actual_amount 字段求和",
        "affected_rows": 1188
      }
    ]
  }
}
```

结论三档：

- `consistent`（一致）：指标可直接从原始数据计算得出，无异常。
- `questionable`（存疑）：部分字段缺失或存在异常值，AI 已做合理假设。
- `inconsistent`（不符）：指标与原始数据明显矛盾，需用户核实。

### 5.3 前端组件设计

#### 5.3.1 MetricCard 组件

每个指标卡片右上角显示结论徽章：

```
┌─────────────────────────────────────┐
│ 近30天GMV                    [一致] │
│ ¥36,000              ↑ 12% 环比    │
│                                     │
│ [查看溯源] [发起追问]              │
└─────────────────────────────────────┘
```

徽章颜色规范：

- 一致：绿色 `bg-emerald-100 text-emerald-700`
- 存疑：黄色 `bg-amber-100 text-amber-700`
- 不符：红色 `bg-rose-100 text-rose-700`

#### 5.3.2 TraceabilityDrawer 溯源抽屉

点击“查看溯源”后从右侧滑出：

```
┌────────────────────────────┐
│ 指标：近30天GMV      [×]   │
├────────────────────────────┤
│ 结论：一致 ✅              │
│ 计算方式：SUM(实收金额)     │
│ 参与行数：1,188 行          │
│ 数据来源：uploaded_xxx.csv │
├────────────────────────────┤
│ 核对过程                   │
│ • 剔除退款订单 12 笔        │
│ • 对 实收金额 字段求和      │
├────────────────────────────┤
│ 原始数据示例（前10行）      │
│ [表格：order_id | 实收金额] │
├────────────────────────────┤
│ [下载相关原始数据]          │
└────────────────────────────┘
```

表格列动态生成，仅展示与当前指标相关的字段，支持分页与导出。

### 5.4 接口设计

#### GET `/api/v1/reports/{report_id}/metrics/{metric_id}/trace`

返回完整溯源信息与原始数据行（带分页）：

```json
{
  "code": 0,
  "data": {
    "metric_id": "m001",
    "conclusion": "consistent",
    "formula": "SUM(actual_amount)",
    "row_count": 1188,
    "rows": [
      {"order_id": "O1001", "actual_amount": 28.5},
      {"order_id": "O1002", "actual_amount": 45.0}
    ],
    "pagination": {
      "page": 1,
      "page_size": 10,
      "total": 1188
    }
  }
}
```

#### GET `/api/v1/reports/{report_id}/metrics/{metric_id}/export`

下载该指标关联的原始数据 CSV。

### 5.5 与 AI 追问的联动

用户在溯源抽屉中可点击“对这批数据有疑问”，自动填充追问 Prompt：

```
请针对“近30天GMV”指标，重点说明为什么剔除了 12 笔退款订单，并复核是否有其他应剔除项。
```

追问结果追加到当前报告的 `conversations` 列表。

---

## 六、经营健康度评分体系

### 6.1 产品目标

在报告顶部提供“一眼可知经营状况”的综合评分与五维雷达图，增强报告的直观价值。

### 6.2 五维评分模型

| 维度 | 权重 | 衡量内容 | 典型输入指标 |
|------|------|---------|-------------|
| 盈利能力 | 25% | 毛利、净利、ROI | 毛利率、净利率、广告 ROI |
| 运营效率 | 20% | 库存、周转、人效 | 库存周转天数、出餐时长、坪效 |
| 客户满意 | 20% | 评价、复购、投诉 | 好评率、差评率、复购率、NPS |
| 成本管控 | 20% | 成本结构、损耗 | 食材成本率、损耗率、平台扣点占比 |
| 成长潜力 | 15% | 增长、会员、渠道 | 环比增长率、会员占比、新客占比 |

综合得分 = Σ（维度得分 × 权重），结果取整 0-100。

### 6.3 评分规则

评分由 AI 基于原始数据计算并返回，但后端需校验 AI 给出的评分有明确的指标依据，避免幻觉。

AI Prompt 片段示例：

```
请基于用户上传的经营数据，计算以下五维得分（每项 0-100）：
1. 盈利能力：结合毛利率、净利率、ROI
2. 运营效率：结合库存周转、出餐/服务时长、坪效
3. 客户满意：结合好评率、差评率、复购率
4. 成本管控：结合食材成本率、损耗率、平台扣点
5. 成长潜力：结合环比增长率、会员占比

要求：
- 每个维度给出 0-100 的整数得分
- 对每个得分，列出 2-3 个关键支撑指标及其原始数据行号
- 若某维度数据不足，标注为“估算”并说明假设
```

### 6.4 报告数据结构

```json
{
  "health_score": {
    "total": 78,
    "grade": "B+",
    "summary": "整体经营状况良好，客户满意度与成本管控表现优秀，成长潜力有待提升。",
    "dimensions": [
      {"name": "盈利能力", "score": 75, "weight": 0.25},
      {"name": "运营效率", "score": 72, "weight": 0.20},
      {"name": "客户满意", "score": 88, "weight": 0.20},
      {"name": "成本管控", "score": 82, "weight": 0.20},
      {"name": "成长潜力", "score": 68, "weight": 0.15}
    ],
    "traceability": {
      "task_id": "task_xxx",
      "raw_response": "..."
    }
  }
}
```

### 6.5 前端展示

报告顶部固定区域展示：

```
┌────────────────────────────────────────────────────────────┐
│ 经营健康度评分              [雷达图]                        │
│                                                            │
│   综合得分 78        盈利能力 75                            │
│   等级 B+            运营效率 72                            │
│                      客户满意 88                            │
│   “整体经营状况良好...”  成本管控 82                            │
│                      成长潜力 68                            │
└────────────────────────────────────────────────────────────┘
```

雷达图使用 ECharts 渲染，每个维度可点击下钻到对应指标卡片。

### 6.6 评分兜底策略

若 AI 返回评分格式异常，后端采用规则引擎兜底：

- 根据场景定义的关键指标阈值计算各维度得分。
- 记录 `score_source = "rule_fallback"`，并在 UI 提示“该评分为系统估算，建议补充更完整数据后重新分析”。

---

## 七、补充接口总览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 场景 | GET | `/api/v1/scenarios` | 获取全部场景配置 |
| 场景 | GET | `/api/v1/scenarios/{code}/template` | 下载场景 CSV 模板 |
| 快速分析 | POST | `/api/v1/tasks/quick` | 表单数据生成分析任务 |
| 示例报告 | POST | `/api/v1/reports/demo` | 复制示例报告 |
| 任务状态 | GET | `/api/v1/tasks/{id}/status` | 查询任务聚合状态 |
| SSE | GET | `/api/v1/tasks/{id}/events` | 任务事件流（支持断点续传） |
| 溯源 | GET | `/api/v1/reports/{rid}/metrics/{mid}/trace` | 指标溯源详情 |
| 溯源 | GET | `/api/v1/reports/{rid}/metrics/{mid}/export` | 导出指标原始数据 |
| 健康度 | GET | `/api/v1/reports/{id}/health-score` | 获取经营健康度评分 |

---

## 八、与主开发文档的衔接说明

本补充文档中定义的接口、表结构与组件规范，应合并到 `DEVELOPMENT_GUIDE.md` 的对应章节中：

- 第 4 章“目录结构规范”增加 `backend/config/scenarios.yaml`、`backend/seed/demos/`、`frontend/components/traceability/`。
- 第 6 章“数据库设计”增加 `scenarios` 表、`report_health_scores` 表，并在 `reports.metrics` JSONB 中固化 `traceability` 结构。
- 第 7 章“模块详细接口设计”补入本章第 7 节的全部接口。
- 第 8 章“核心业务逻辑设计”增加“快速表单分析”与“经营健康度评分计算”流程。
- 第 9 章“前端关键交互设计”增加 `MetricCard`、`TraceabilityDrawer`、`HealthScorePanel` 组件说明。

---

## 十、裂变传播链路设计

### 10.1 产品目标

实现 PRD 中“分享报告链接兑换免费分析额度”的社交传播逻辑，支持链接归因、邀请关系绑定与海报生成。

### 10.2 分享实体升级

在 `share_snapshots` 表基础上扩展以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `share_code` | string(16), unique | 分享短码，如 `A3B9K7` |
| `ref_code` | string(16) | 邀请人邀请码，分享时可选携带 |
| `visit_count` | int, default 0 | 总访问次数 |
| `unique_visitor_count` | int, default 0 | 去重访问用户数（按设备指纹/登录用户） |
| `converted_count` | int, default 0 | 通过该链接完成注册或首单的用户数 |
| `poster_url` | string | 海报图片 URL |
| `expires_at` | datetime | 分享链接过期时间，默认 90 天 |

### 10.3 分享链接结构

```
https://app.yourdomain.com/s/{share_code}?ref={ref_code}
```

- `/s/{share_code}` 为短链入口，302 跳转至报告快照页。
- `?ref={ref_code}` 用于邀请归因，进入页面时写入 `localStorage`。

### 10.4 邀请关系绑定时序

```
用户 A 生成分享链接（携带 ref_code=A001）
        ↓
用户 B 点击链接 → 前端记录 ref_code=A001 到 localStorage
        ↓
用户 B 点击注册 → 调用 POST /api/v1/auth/register
        ↓
后端读取请求 Header/Cookie 中的 ref_code，写入 user.referred_by
        ↓
用户 B 完成首次有效分析 → 触发奖励发放
        ↓
用户 A 获得 +3 次额度，用户 B 获得新用户礼包 +3 次额度
```

### 10.5 奖励规则

```yaml
invite_reward:
  inviter:
    condition: "被邀请人完成首次真实分析任务"
    reward_credits: 3
    daily_limit: 10
  invitee:
    condition: "首次注册且绑定邀请关系"
    reward_credits: 3
    valid_days: 30
```

奖励发放记录写入 `credit_logs`，类型分别为 `invite_reward_inviter` 和 `invite_reward_invitee`。

### 10.6 海报生成

#### 方案：后端 Puppeteer/Playwright 截图

前端提供海报专用页面 `/poster/{share_code}`，布局固定，字体与颜色与品牌一致：

```
┌────────────────────────────┐
│  [Logo] 可信经营洞察引擎     │
│                            │
│   “我的店健康度 78 分”      │
│   [雷达图缩略图]            │
│                            │
│   扫码查看完整溯源报告       │
│   [二维码]                  │
│                            │
│   新用户免费领 10 次分析     │
└────────────────────────────┘
```

后端调用 Playwright 访问该页面并截图，保存至对象存储，URL 回写 `share_snapshots.poster_url`。

#### 接口

- **POST** `/api/v1/shares/{share_code}/poster`：触发海报生成（异步，返回 job_id）。
- **GET** `/api/v1/shares/{share_code}/poster`：查询海报生成状态与 URL。

海报生成使用 Celery 异步任务，避免阻塞主请求。

### 10.7 接口补充

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/shares/{code}/stats` | 获取分享访问/转化数据 |
| POST | `/api/v1/invites/claim` | 手动领取邀请奖励（如未自动到账时） |

---

## 十一、政策检索数据来源与成本控制

### 11.1 产品目标

自动匹配用户属地的中小微企业扶持政策，所有推荐内容附带官方来源链接与申报指引。

### 11.2 数据来源策略

采用 **InfiniSynapse 联网检索 + 人工录入种子库 + 用户反馈修正** 三层架构：

1. **人工种子库**：赛前由运营团队录入 50-100 条重点城市政策（北上广深杭成渝等），写入 `policy_feeds`。
2. **联网检索**：用户填写属地后，通过 InfiniSynapse `newTask` 提交联网检索指令，动态补充最新政策。
3. **用户反馈**：每条政策支持“已过期/不准确”反馈，运营定期审核修正。

### 11.3 检索触发策略

避免每次分析都触发高成本联网检索：

- 用户首次填写属地时触发一次检索。
- 后续同属地用户优先读取缓存，缓存有效期 7 天。
- 检索失败或超时时，降级展示种子库中同区域政策。

### 11.4 政策结构化字段

`policy_feeds` 表扩展字段：

| 字段 | 说明 |
|------|------|
| `region_code` | 行政区划代码（国家统计局 6 位码） |
| `industry_tags` | 适用行业标签数组，如 `["餐饮", "零售"]` |
| `policy_type` | 补贴/税收减免/贷款贴息/场地支持 |
| `eligibility` | 申报条件（结构化文本） |
| `amount_range` | 补贴金额区间，如 `"5000-50000元"` |
| `deadline` | 截止日期 |
| `source_url` | 官方来源链接 |
| `apply_guide` | 申报指引步骤 |
| `retrieved_at` | 检索时间 |
| `verify_status` | pending / verified / expired |

### 11.5 成本控制

```yaml
policy_search:
  trigger:
    - event: "user_set_region"
    - cache_ttl: 7d
  budget:
    daily_limit: 200  # 每日联网检索次数上限
    fallback: "seed_db"  # 超限后降级到种子库
  logging:
    table: "policy_search_logs"
    fields: ["task_id", "cost_credits", "region_code", "result_count", "created_at"]
```

### 11.6 接口设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/policies?region_code=310104&industry=餐饮` | 查询匹配政策列表 |
| POST | `/api/v1/policies/{id}/feedback` | 提交政策反馈（过期/不准确） |
| GET | `/api/v1/admin/policies/pending` | Admin 待审核政策 |

---

## 十二、最小化 Admin 后台

### 12.1 产品目标

提供运营团队基础管理能力：用户查询、额度调整、任务核验演示、政策审核。

### 12.2 权限模型

新增角色字段 `user.role`：

- `user`：普通用户
- `admin`：运营管理员
- `superadmin`：超级管理员（可管理其他管理员）

Admin 接口统一前缀 `/api/v1/admin/`，JWT 中嵌入角色声明，中间件校验。

### 12.3 功能模块

#### 用户管理

- `GET /api/v1/admin/users`：用户列表（支持按手机号/邮箱/注册时间筛选）。
- `POST /api/v1/admin/users/{id}/status`：启用/禁用账号。

#### 额度管理

- `GET /api/v1/admin/credits/logs?user_id=xxx`：查询用户额度流水。
- `POST /api/v1/admin/credits/adjust`：手动调整用户额度。

```json
{
  "user_id": "u_xxx",
  "amount": 10,
  "reason": "运营补偿",
  "operator_id": "admin_001"
}
```

#### 任务核验演示

- `GET /api/v1/admin/tasks`：全部任务列表，展示 `task_id`、`conn_id`、`status`、`created_at`。
- `GET /api/v1/admin/tasks/{id}/verification`：返回 InfiniSynapse 平台核验链接，便于评委直接查验。

#### 政策审核

- `GET /api/v1/admin/policies/pending`：待审核政策。
- `POST /api/v1/admin/policies/{id}/verify`：审核通过/驳回/标记过期。

### 12.4 前端 Admin 页面

使用独立路由 `/admin`，不占用主站导航：

- `/admin/users`
- `/admin/credits`
- `/admin/tasks`
- `/admin/policies`

Admin 前端复用主站组件库，但增加敏感操作的二次确认弹窗。

---

## 十三、数据埋点规范

### 13.1 产品目标

建立完整的数据闭环，支持首页转化漏斗、任务完成率、分享转化率的分析与迭代。

### 13.2 埋点方案选型

建议采用 **PostHog** 开源版或自建 EventCollector：

- 事件采集：前端 SDK + 后端关键事件补录。
- 用户属性：匿名 ID、注册 ID、场景偏好、会员等级。
- 看板：转化率漏斗、任务成功率、分享裂变效果。

### 13.3 核心事件清单

| 事件名 | 触发时机 | 属性 |
|--------|---------|------|
| `page_view` | 页面切换 | `path`, `referrer`, `scenario_code` |
| `button_click` | 按钮点击 | `button_id`, `scenario_code`, `position` |
| `scenario_select` | 选择场景 | `scenario_code`, `source`（首页/导航） |
| `task_create` | 创建分析任务 | `scenario_code`, `input_type`（file/form/demo） |
| `task_complete` | 任务完成 | `scenario_code`, `duration_seconds`, `error_flag` |
| `task_fail` | 任务失败 | `scenario_code`, `error_code`, `error_message` |
| `report_view` | 查看报告 | `report_id`, `is_demo` |
| `trace_expand` | 展开溯源抽屉 | `metric_id`, `conclusion` |
| `follow_up_ask` | 发起追问 | `report_id`, `metric_id` |
| `share_generate` | 生成分享链接 | `report_id`, `channel` |
| `share_visit` | 访问分享链接 | `share_code`, `ref_code`, `is_unique` |
| `invite_convert` | 邀请转化 | `inviter_id`, `invitee_id`, `share_code` |
| `credit_consume` | 消耗额度 | `user_id`, `task_id`, `amount` |
| `policy_click` | 点击政策链接 | `policy_id`, `region_code` |

### 13.4 后端补录事件

以下事件由后端直接写入，避免前端采集遗漏：

- `task_create` / `task_complete` / `task_fail`
- `credit_consume` / `credit_grant`
- `invite_convert`
- `share_visit`（短链访问时记录）

### 13.5 隐私合规

- 匿名用户仅采集设备指纹与行为事件，不采集手机号等 PII。
- 用户销毁数据时同步清除埋点事件中的关联标识（保留聚合统计）。

---

## 十四、付费模块预留

### 14.1 产品目标

为商业化路径预留数据结构，当前阶段不开放购买入口，但代码层面可平滑接入支付。

### 14.2 数据库表设计

#### `packages` 套餐表

| 字段 | 说明 |
|------|------|
| `id` | 套餐 ID |
| `name` | 套餐名称，如 "月度基础包" |
| `credits` | 包含分析次数 |
| `price_cents` | 价格（分） |
| `currency` | 币种，默认 CNY |
| `valid_days` | 购买后有效天数 |
| `is_active` | 是否上架 |

#### `orders` 订单表

| 字段 | 说明 |
|------|------|
| `id` | 订单号 |
| `user_id` | 用户 ID |
| `package_id` | 套餐 ID |
| `status` | pending / paid / cancelled / refunded |
| `amount_cents` | 订单金额 |
| `paid_at` | 支付时间 |
| `out_trade_no` | 第三方流水号 |
| `payment_channel` | 微信支付 / 支付宝 |

### 14.3 接口占位

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/packages` | 获取在售套餐 |
| POST | `/api/v1/orders` | 创建订单 |
| POST | `/api/v1/payments/webhook` | 支付回调（微信/支付宝） |
| POST | `/api/v1/orders/{id}/query` | 查询订单支付状态 |

### 14.4 额度叠加规则

- 购买套餐后，`user.credits` 立即增加。
- 免费额度与付费额度统一用一个字段存储，但 `credit_logs.type` 区分来源。
- 额度过期：可选实现，首期建议不设置过期，降低理解成本。

---

## 十五、分析异常人工介入

### 15.1 产品目标

当 AI 无法理解数据格式、字段映射歧义或需要用户确认时，提供交互式纠错面板，避免任务直接失败。

### 15.2 触发条件

分析过程中出现以下情况时，任务状态置为 `awaiting_user_input`：

1. **字段映射歧义**：AI 无法确定某列含义（如 `amount` 分不清是实收还是原价）。
2. **关键字段缺失**：必填字段未找到，但存在可能等价的列。
3. **AI 主动询问**：InfiniSynapse 返回 `ask = upload_file_to_sandbox` 或其他需要用户确认的事件。
4. **数据异常确认**：发现大量异常值（如 1000% 的利润率），需用户确认是否剔除。

### 15.3 交互面板设计

前端 `HumanInTheLoopPanel` 组件：

```
┌─────────────────────────────────────┐
│ 分析需要您的确认                     │
├─────────────────────────────────────┤
│ 系统检测到以下字段可能含义不明：      │
│                                     │
│ • "amt" → 请选择含义：              │
│   ○ 实收金额  ○ 原价金额  ○ 其他    │
│                                     │
│ • "评价" 列中存在空值，是否跳过？    │
│   ○ 跳过空值  ○ 视为 0 分           │
│                                     │
│ [取消分析]            [确认并继续]   │
└─────────────────────────────────────┘
```

### 15.4 接口设计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/tasks/{id}/pending-inputs` | 查询待用户确认的问题列表 |
| POST | `/api/v1/tasks/{id}/resolve-inputs` | 提交用户确认结果，继续分析 |

请求体示例：

```json
{
  "resolutions": [
    {"field": "amt", "resolved_as": "actual_amount"},
    {"field": "review", "empty_strategy": "skip"}
  ]
}
```

### 15.5 与 InfiniSynapse 的联动

用户确认后，后端将修正后的字段映射或数据说明追加到当前任务的上下文消息中，调用 `askResponse` 继续分析，无需重新上传文件。

---

## 十六、PDF 溯源二维码

### 16.1 产品目标

导出的 PDF 报告仍保持可溯源能力，扫码即可跳转到线上报告页查看完整交互式溯源。

### 16.2 二维码内容

```
https://app.yourdomain.com/reports/{report_id}?source=pdf_qr
```

- 报告必须为已设置分享（`setShare`）或公开访问状态，否则扫码后提示“报告未公开”。
- `source=pdf_qr` 用于统计 PDF 扫码转化。

### 16.3 PDF 生成增强

在 PDF 封面页或每页页脚嵌入二维码：

- 封面页：大二维码 + “扫码查看完整溯源”。
- 内容页：页脚小二维码 + 报告编号。

后端使用 `reportlab` 或 `weasyprint` 生成 PDF 时，调用 `qrcode` 库生成二维码图片并嵌入。

### 16.4 接口调整

导出 PDF 接口增加可选参数：

```
GET /api/v1/reports/{id}/export/pdf?embed_qr=true
```

默认 `embed_qr=true`。若报告未设置分享，返回 400 并提示“请先开启报告分享”。

---

## 十七、多语言预留

### 17.1 产品目标

为后续支持简体中文、繁体中文、英文等语言预留架构，当前默认仅启用简体中文。

### 17.2 后端支持

- 所有接口支持 `Accept-Language` Header，默认值 `zh-CN`。
- 错误码与提示语统一从 `i18n` 资源文件读取，避免硬编码。
- 向 InfiniSynapse 发起 `newTask` 时，根据用户语言传入对应 `language` 参数或 Prompt 前缀。

### 17.3 前端支持

- 使用 `react-i18next` 管理翻译资源。
- 翻译文件目录：

```
frontend/public/locales/
├── zh-CN/
│   └── common.json
├── zh-TW/
│   └── common.json
└── en/
    └── common.json
```

- 语言选择器默认隐藏，仅当配置 `ENABLE_I18N=true` 时展示。

### 17.4 数据库影响

- 用户表增加 `preferred_language` 字段，默认 `zh-CN`。
- 报告内容本身仍为中文生成，暂不做多语言报告翻译（成本过高）。

---

## 十八、P2/P3 补充后完整接口总览

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 场景 | GET | `/api/v1/scenarios` | 获取全部场景配置 |
| 场景 | GET | `/api/v1/scenarios/{code}/template` | 下载场景 CSV 模板 |
| 快速分析 | POST | `/api/v1/tasks/quick` | 表单数据生成分析任务 |
| 示例报告 | POST | `/api/v1/reports/demo` | 复制示例报告 |
| 任务状态 | GET | `/api/v1/tasks/{id}/status` | 查询任务聚合状态 |
| SSE | GET | `/api/v1/tasks/{id}/events` | 任务事件流（支持断点续传） |
| 人工介入 | GET | `/api/v1/tasks/{id}/pending-inputs` | 查询待确认问题 |
| 人工介入 | POST | `/api/v1/tasks/{id}/resolve-inputs` | 提交确认结果 |
| 溯源 | GET | `/api/v1/reports/{rid}/metrics/{mid}/trace` | 指标溯源详情 |
| 溯源 | GET | `/api/v1/reports/{rid}/metrics/{mid}/export` | 导出指标原始数据 |
| 健康度 | GET | `/api/v1/reports/{id}/health-score` | 获取经营健康度评分 |
| 分享 | POST | `/api/v1/shares/{code}/poster` | 生成分享海报 |
| 分享 | GET | `/api/v1/shares/{code}/poster` | 查询海报状态 |
| 分享 | GET | `/api/v1/shares/{code}/stats` | 分享访问/转化统计 |
| 邀请 | POST | `/api/v1/invites/claim` | 手动领取邀请奖励 |
| 政策 | GET | `/api/v1/policies` | 查询匹配政策 |
| 政策 | POST | `/api/v1/policies/{id}/feedback` | 政策反馈 |
| 套餐 | GET | `/api/v1/packages` | 获取在售套餐 |
| 订单 | POST | `/api/v1/orders` | 创建订单 |
| 支付 | POST | `/api/v1/payments/webhook` | 支付回调 |
| Admin 用户 | GET | `/api/v1/admin/users` | 用户列表 |
| Admin 用户 | POST | `/api/v1/admin/users/{id}/status` | 启用/禁用用户 |
| Admin 额度 | GET | `/api/v1/admin/credits/logs` | 额度流水 |
| Admin 额度 | POST | `/api/v1/admin/credits/adjust` | 手动调整额度 |
| Admin 任务 | GET | `/api/v1/admin/tasks` | 全部任务列表 |
| Admin 任务 | GET | `/api/v1/admin/tasks/{id}/verification` | 任务核验链接 |
| Admin 政策 | GET | `/api/v1/admin/policies/pending` | 待审核政策 |
| Admin 政策 | POST | `/api/v1/admin/policies/{id}/verify` | 审核政策 |

---

## 十九、与主开发文档的衔接说明（更新）

本补充文档中定义的接口、表结构与组件规范，应合并到 `DEVELOPMENT_GUIDE.md` 的对应章节中：

- 第 4 章“目录结构规范”增加：
  - `backend/config/scenarios.yaml`
  - `backend/seed/demos/`、`backend/seed/templates/`
  - `frontend/components/traceability/`、`frontend/components/admin/`、`frontend/components/share/`
  - `backend/services/poster_generator.py`、`backend/services/i18n.py`
- 第 6 章“数据库设计”增加：
  - `scenarios` 表
  - `report_health_scores` 表
  - `packages` 表、`orders` 表
  - `policy_search_logs` 表
  - `share_snapshots` 扩展字段（`visit_count`、`converted_count`、`poster_url` 等）
  - `users` 表扩展字段（`role`、`preferred_language`、`referred_by`）
- 第 7 章“模块详细接口设计”补入本章第 18 节的全部接口。
- 第 8 章“核心业务逻辑设计”增加：
  - 快速表单分析流程
  - 经营健康度评分计算流程
  - 邀请关系绑定与奖励发放流程
  - 政策检索与缓存降级流程
  - 人工介入（Human-in-the-loop）流程
- 第 9 章“前端关键交互设计”增加：
  - `MetricCard`、`TraceabilityDrawer`、`HealthScorePanel`
  - `SharePanel`、`PosterPreview`
  - `HumanInTheLoopPanel`
  - `AdminLayout`
- 第 10 章“部署与运维规范”增加：
  - Playwright/Chromium 依赖（海报生成）
  - PostHog 或自建埋点服务接入
  - 支付回调白名单配置
