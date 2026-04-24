# 2026-04-25 INR 产品完善与契约对齐报告

## 1. 背景

本轮根据用户确认的 11 条产品要求进行完善，重点不是新增“多吃/补服”等低优先级能力，而是把已经确认的核心路径做成可实现、可验证、可部署的版本：

1. 首页展示最近一次 INR 检测结果与下次检测时间。
2. 完成服药后要求选择明日剂量：按计划服用或手动输入。
3. INR 异常分层：目标范围外但在 ±0.1 内弱提示，超过 ±0.1 强提示。
4. 设置中维护检测方式。
5. 全站主展示校正后 INR，同时弱展示校准前原始值。
6. 检测周期支持按天、按周、按月自由设置。
7. 首页状态卡片保持当前方向。
8. “多吃”暂不规划。
9. 不做补服，只记录用户操作服药的系统时间。
10. INR 趋势显示校准前与校准后两条曲线。
11. 首页必须有超明显提醒机制。

## 2. 现有问题

### 2.1 API 契约与服务端模型不一致

`/inr/records` 的 OpenAPI 原先声明 `data` 是 `INRRecord[]`，但服务端实际模型需要返回：

- `records`：INR 记录列表；
- `trend`：趋势图点位；
- `targetRange`：目标范围。

这会导致前端、小程序、Flutter 或未来 SDK 按契约接入时拿不到趋势和目标范围，形成“文档可读但不可实现”的问题。

### 2.2 INR 校正依据没有全链路保存

产品要求“校正后值主显示、校准前值弱显示”，同时要支持检测方式偏移量。原有记录里有 `rawValue` 与 `correctedValue`，但缺少每条记录当时使用的 `offsetValue` 快照。

如果只保存当前设置的偏移量，会出现两个风险：

- 用户修改检测方式偏移量后，历史记录展示依据不清；
- 历史校正值无法解释，趋势双曲线也无法稳定复现。

### 2.3 UI 验收口径不够细

此前 UI 文档只有入口说明，缺少可交付的验收矩阵，尤其是：

- 完成服药后的“明日剂量”弹层应如何展示；
- 首页强提醒到什么程度才算“超明显”；
- 异常弱提示/强提示如何在页面上区分；
- 哪些页面主显示校正后值，哪些位置弱显示校准前值；
- 趋势图双曲线的验收标准。

### 2.4 技术方案需要继续收敛

技术方案已有大方向，但需要把 MVP 口径固定下来：

- `nextTestAt` 以最近一次 INR 检测时间加检测周期计算；
- 检测方式偏移修改不回写历史记录；
- 补服能力不进入当前阶段；
- 服药记录只保存本次操作服药时间和用户确认的明日剂量来源。

## 3. 改动原因

本轮优先处理的是“后续开发会被放大”的问题：

| 问题 | 如果不改的后果 | 本轮处理方式 |
| --- | --- | --- |
| INR 列表契约错误 | 多端按错误 schema 接入，后续返工 | OpenAPI 改为 `INRRecordsResponse` |
| 缺少 `offsetValue` 快照 | 历史校正值不可解释 | 模型、SQLite、服务层、测试全链路补齐 |
| UI 验收不具体 | 实现时容易做成“看起来有”但不满足需求 | 补充逐页面验收矩阵 |
| 报告入口缺失 | 用户无法在 CF 文档站追踪本轮大改 | 新增独立报告并接入首页与构建脚本 |

## 4. 实际改动

### 4.1 API 契约

`packages/api-contract/openapi.yaml`：

- `/inr/records` 的响应 `data` 改为 `INRRecordsResponse`。
- 新增 `INRRecordsResponse` schema：包含 `records`、`trend`、`targetRange`。
- 新增 `INRTrendPoint` schema：包含 `date`、`rawValue`、`correctedValue`。
- 新增 `TargetRange` schema：包含 `min`、`max`。
- `INRRecord` required 字段加入 `offsetValue`。

### 4.2 服务端模型与持久化

服务端同步补齐 `offsetValue`：

- `server/internal/model/types.go`：`INRRecord` 增加 `OffsetValue`。
- `server/internal/service/service.go`：创建 INR 时保存实际使用的偏移量快照，并对原始值与偏移量做统一两位小数处理。
- `server/internal/repository/sqlite/repository.go`：SQLite 表新增 `offset_value` 字段，插入、查询、扫描均同步。
- `server/internal/repository/sqlite/repository_test.go`：补充 offset 持久化断言。
- `server/internal/service/service_test.go`：补充默认 offset 与请求 offset 的快照断言。

### 4.3 UI 与产品验收文档

`docs/ui/README.md` 补充：

- 首页状态卡片验收；
- 完成服药后选择明日剂量弹层；
- INR 异常分层展示；
- 设置页检测方式与检测周期；
- 校正值/原始值逐页面展示矩阵；
- 趋势双曲线验收标准；
- 当前明确不做“多吃/补服”。

### 4.4 技术方案与数据库口径

`docs/tech/technical-proposal.md` 与 `docs/tech/database-and-cache-design.md` 继续强调：

- 偏移量是每条 INR 记录的快照；
- 检测方式偏移变更只影响新记录；
- `nextTestAt` 根据最近检测时间和周期计算；
- 服药完成记录系统操作时间，不做补服分支；
- 检测周期按 day/week/month + interval 表达。

### 4.5 文档站接入

- 新增本报告：`docs/reports/2026-04-25-inr-refinement-implementation.md`。
- `app.js` 首页增加“迭代报告与审计”文档分组。
- `build-dist.py` 将本报告纳入 Cloudflare 构建产物。
- `markdown-preview.spec.cjs` 增加报告路由渲染检查。

## 5. 改动结果与效果

### 5.1 对产品体验的效果

- 首页能在首屏同时看到：今日服药、最近 INR、校准前参考值、下次检测时间、超明显提醒、趋势图。
- 服药完成不再只是“打勾”，而是进入明日剂量确认，避免第二天计划不明确。
- INR 异常分层从一句文案变成可被 UI、服务端和测试共同验证的规则。
- 用户后续新增检测方式或修改偏移量，不会污染历史记录。

### 5.2 对技术实现的效果

- API 契约与 Go 模型收敛，后续多端接入能以 OpenAPI 为准。
- SQLite 开发环境已经能保存 offset 快照，后续切换 MySQL 时字段口径明确。
- 服务端测试覆盖了 offset 快照与异常分层的核心逻辑。
- 文档站新增独立报告路径，后续大改可以按同样机制追加报告。

## 6. 验收清单

| 用户要求 | 当前落点 |
| --- | --- |
| 首页增加最近 INR 和下次检测时间 | 原型首页、UI 文档、验收测试 |
| 完成服药后选择明日剂量 | 原型弹层、UI 文档、验收测试 |
| 异常分层弱/强提示 | 服务测试、原型、OpenAPI 字段 |
| 设置增加检测方式 | 原型设置页、技术方案、数据库设计 |
| 校正后主显示、原始值弱显示 | 原型、UI 矩阵、OpenAPI `rawValue/correctedValue/offsetValue` |
| 检测周期按天/周/月 | 原型弹窗、技术方案、数据库设计 |
| 首页状态卡片保持 | 原型继续保留并补充 INR 卡片 |
| 多吃暂不做 | UI 文档明确排除 |
| 不做补服，只记操作时间 | UI 文档、技术方案、服药请求示例 |
| 趋势双曲线 | 原型 SVG、验收测试、OpenAPI trend |
| 首页超明显提醒 | 首页 `homeReminder`、UI 文档、验收测试 |

## 7. 验证记录

本报告随代码一起提交前，需要完成以下验证：

- Go 服务端单测与 vet；
- 根项目 JS 语法、构建、产品验收、Markdown 预览验收；
- 小程序测试；
- Flutter 环境检查；
- 静态安全扫描；
- 独立代码评审；
- Cloudflare 部署后线上 smoke。

若 Flutter CLI 仍未安装，本轮记录为环境限制，不作为代码失败。

## 8. 后续机制

后续每次大的改动统一新增 `docs/reports/YYYY-MM-DD-主题.md`，并同步：

1. 加入 `build-dist.py` 的 `markdown_docs`；
2. 加入首页文档入口；
3. 加入 `markdown-preview.spec.cjs` 路由检查；
4. 报告固定包含“现有问题、改动原因、实际改动、改动结果、验证结果、后续建议”。

## 9. 后续建议

1. 下一轮可以把 OpenAPI 契约生成到小程序/Flutter/Go client，减少手写模型漂移。
2. SQLite 与未来 MySQL 的 schema 迁移需要增加版本化 migration。
3. WeChat/Push 提醒接入前，应先完成提醒队列与去重策略。
4. INR 异常强提示可以进一步加入“复测倒计时”和“联系医生记录”，但仍不直接给剂量建议。
