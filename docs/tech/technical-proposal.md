# 抗凝小助手技术方案

> 日期：2026-04-24  
> 范围：微信小程序、Android、iOS、服务端、数据存储、提醒与同步。  
> 指定技术栈：Go、Gin、MySQL、Redis、Flutter、TypeScript。

## 1. 项目目标

抗凝小助手面向长期服用华法林的用户，核心目标不是替代医生决策，而是帮助用户稳定完成以下事情：

1. 每日记录是否服药、服药时间、服药类型、剂量。
2. 记录 INR 检测结果，支持检测方式和偏移量校正。
3. 首页强提醒今日服药、最近 INR、下次检测时间和异常状态。
4. 支持检测周期按天、周、月自定义。
5. 支持 INR 异常分层展示：
   - 目标范围内：正常提示。
   - 超出目标范围但在 ±0.1 内：弱提示。
   - 超出目标范围超过 ±0.1：强提示。
6. 支持校准前与校准后 INR 同步记录：
   - 所有主要页面优先显示校正后的 INR。
   - 校准前 INR 作为弱信息展示。
   - 趋势图显示校准前和校准后两条曲线。
7. 支持微信小程序、Android、iOS 多端使用。
8. 后续可扩展家庭成员、医生协作、数据导出、智能提醒等能力。

## 2. 总体架构

```text
微信小程序 / Flutter App(Android/iOS)
        │
        │ HTTPS + JSON API
        ▼
Go Gin API Server
        │
        ├── MySQL：业务主数据
        ├── Redis：缓存、登录态、限流、提醒队列辅助
        └── 定时任务：服药提醒、INR 检测提醒、异常复测提醒
```

建议采用“单体优先、模块清晰”的架构：

- 第一阶段不要拆微服务，避免复杂度过高。
- 服务端用 Go + Gin 做一个清晰分层的单体应用。
- 数据库用 MySQL 作为主存储。
- Redis 用于缓存、验证码、登录态、限流、提醒任务辅助。
- 移动端 Android/iOS 使用 Flutter 共用一套主要代码。
- 微信小程序使用 TypeScript 独立开发，但复用接口协议和业务规则文档。

## 3. 仓库目录建议

当前仓库是静态 UI 原型。正式开发可逐步演进为 monorepo：

```text
warfarin-inr-demo/
├── docs/
│   ├── ui/                         # UI 设计、原型说明
│   └── tech/                       # 技术方案、接口、数据模型
├── prototype/                      # 后续可把当前静态原型迁入这里
├── server/                         # Go Gin 服务端
│   ├── cmd/api/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── handler/
│   │   ├── middleware/
│   │   ├── service/
│   │   ├── repository/
│   │   ├── model/
│   │   ├── job/
│   │   └── pkg/
│   ├── migrations/
│   └── tests/
├── app_flutter/                    # Flutter Android/iOS
│   ├── lib/
│   │   ├── app/
│   │   ├── core/
│   │   ├── features/
│   │   └── shared/
│   └── test/
├── miniapp/                        # 微信小程序 TypeScript
│   ├── miniprogram/
│   ├── typings/
│   └── tests/
└── packages/
    └── api-contract/               # 可选：OpenAPI、类型定义、接口 mock
```

现阶段不需要一次性创建全部工程。建议先把文档、UI 原型和未来代码目录分清楚。

## 4. 客户端方案

### 4.1 Flutter：Android 与 iOS

Flutter 作为 Android/iOS 主客户端，负责完整体验：

- 首页状态卡片。
- 每日服药记录。
- INR 检测记录与趋势。
- 服药设置、INR 设置、提醒设置。
- 本地通知。
- 离线记录与恢复同步。

推荐技术选型：

| 能力 | 建议 |
| --- | --- |
| 状态管理 | Riverpod |
| 路由 | go_router |
| HTTP | dio |
| JSON | freezed + json_serializable |
| 本地存储 | drift 或 isar，第一阶段也可用 sqflite |
| 图表 | fl_chart |
| 本地通知 | flutter_local_notifications |
| 错误上报 | Sentry，可后续接入 |

建议 Flutter 按 feature 分层：

```text
lib/features/
├── auth/
├── home/
├── medication/
├── inr/
├── settings/
└── reminder/
```

### 4.2 微信小程序

微信小程序适合日常快速记录和提醒触达：

- 快捷登录。
- 今日服药打卡。
- INR 录入。
- 查看最近记录。
- 接收服务通知。

推荐技术选型：

| 能力 | 建议 |
| --- | --- |
| 语言 | TypeScript |
| 框架 | 原生小程序 + TS，或 Taro。第一阶段建议原生小程序，复杂度更低 |
| 请求层 | 统一 request 封装，自动带 token、处理错误码 |
| 状态 | 简单 store 或页面级状态，后续再抽象 |
| 类型 | 从 OpenAPI 生成 TS 类型，或先手写接口类型 |

小程序注意事项：

- 服务通知需要用户授权和模板配置。
- 登录需要处理 `wx.login` code 换取服务端 session。
- 小程序不建议承载过复杂的数据分析，趋势图保持简单清晰。

## 5. 服务端方案

### 5.1 Go Gin 分层

服务端建议分为四层：

```text
handler     处理 HTTP 请求、参数校验、响应格式
service     业务逻辑：剂量、INR、提醒、同步
repository  数据访问：MySQL、Redis
model       数据模型和领域对象
```

推荐目录：

```text
server/internal/
├── handler/
│   ├── auth_handler.go
│   ├── medication_handler.go
│   ├── inr_handler.go
│   └── settings_handler.go
├── service/
│   ├── auth_service.go
│   ├── medication_service.go
│   ├── inr_service.go
│   └── reminder_service.go
├── repository/
│   ├── user_repo.go
│   ├── medication_repo.go
│   ├── inr_repo.go
│   └── settings_repo.go
├── model/
├── middleware/
└── job/
```

### 5.2 API 设计原则

- 使用 REST JSON API，第一阶段足够简单。
- 所有时间使用服务端 UTC 存储，客户端按用户时区展示。
- 对用户行为记录要保留 `client_time` 与 `server_time`。
- 关键业务字段避免使用浮点直接参与严肃计算，INR 可用 decimal，剂量可同时存片数和 mg。
- 接口返回统一 envelope：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

错误码示例：

| code | 含义 |
| --- | --- |
| 0 | 成功 |
| 40001 | 参数错误 |
| 40101 | 未登录 |
| 40301 | 无权限 |
| 40401 | 数据不存在 |
| 42901 | 请求过于频繁 |
| 50001 | 服务端错误 |

## 6. 核心业务模块

### 6.1 用户与账号

第一阶段支持：

- 微信小程序登录。
- 手机号登录可后续加。
- Apple/Google 登录为 App 后续扩展。

用户设置包括：

- 目标 INR 范围，如 1.8–2.5。
- 默认服药时间，如 08:00。
- 默认药品，如 Marevan。
- 检测周期。
- 提醒渠道。

### 6.2 服药记录

服药记录关注“用户做了什么”和“什么时候做的”：

- 完成服药。
- 停服。
- 漏服。
- 手动记录。

当前需求明确：

- 不做补服功能。
- 只记录用户服药操作类型的系统时间。
- 完成服药后，需要用户选择明日剂量：
  - 按计划服用。
  - 手动输入。

记录字段建议：

- user_id
- record_date
- action_type：taken / paused / missed
- planned_dose_tablets
- actual_dose_tablets
- actual_dose_mg
- operation_time
- next_day_dose_source：plan / manual
- next_day_dose_tablets
- note

### 6.3 剂量计划

第一阶段做简单循环计划：

- 支持 1–3 个循环剂量。
- 例如：1.25 片、1.5 片交替。
- 每日首页根据计划计算今日剂量。
- 完成服药后确认明日剂量。

后续扩展：

- 按星期计划。
- 医生调整计划。
- 临时停服计划。
- 与 INR 异常联动的复测提醒。

### 6.4 INR 检测记录

INR 记录需要同时保存校准前和校准后：

- raw_value：用户录入或设备同步的原始值。
- offset_value：检测方式对应偏移量。
- corrected_value：校正后值，主要展示。
- method_id：检测方式。
- tested_at：检测时间。
- source：manual / device / import。

校正规则：

```text
corrected_value = raw_value + method.offset_value
```

展示规则：

- 首页、记录页、列表页优先展示 corrected_value。
- raw_value 只弱展示，例如“校准前 2.0”。
- 趋势图同时展示 corrected_value 和 raw_value 两条线。

### 6.5 INR 异常分层

假设目标范围为 `[lower, upper]`，例如 `[1.8, 2.5]`。

```text
if value < lower - 0.1 or value > upper + 0.1:
    danger 强提示
elif value < lower or value > upper:
    soft 弱提示
else:
    ok 正常
```

注意：

- 参与判断的 value 应使用 corrected_value。
- 首页需要超明显提醒机制。
- 强提示文案要谨慎，避免直接给出剂量调整建议。
- 建议文案使用“复测、记录、联系医生”。

### 6.6 检测方式与偏移量

检测方式可在设置里维护：

- 名称：医院静脉血、指尖血 INR 仪、其他。
- 偏移量：例如 +0.10、+0.22、0.00。
- 是否默认。
- 备注。

偏移量修改时建议：

- 新检测记录使用新偏移量。
- 历史记录保留当时使用的 offset_value。
- 不要因为用户修改检测方式偏移量而批量改写历史 corrected_value，除非后续提供专门的“重新校准历史记录”功能。

### 6.7 检测周期

用户可自由设置周期：

- 按天：每 N 天。
- 按周：每 N 周。
- 按月：每 N 月。

建议存储：

- cycle_unit：day / week / month
- cycle_interval：整数
- last_tested_at
- next_test_due_at

每次新增 INR 检测记录后，自动计算下一次检测时间。

### 6.8 提醒

提醒分三类：

1. 服药提醒：每天固定时间。
2. INR 检测提醒：按检测周期，到期前提醒。
3. INR 异常提醒：弱提示/强提示。

实现建议：

- App 本地通知负责基础提醒。
- 服务端定时任务负责跨端提醒、小程序服务通知、异常提醒。
- Redis 可辅助存储待触发提醒、去重 key、限流 key。

第一阶段可以先做：

- 服务端记录提醒配置。
- 客户端本地提醒。
- 小程序服务通知后续接入。

### 6.9 本轮 MVP 收敛口径

- `nextTestAt` 以最近一次 INR `tested_at` 为基准，加上用户设置的 `test_cycle_unit` 与 `test_cycle_interval`。
- 检测方式偏移量保存为每条记录的 `offset_value` 快照；修改检测方式只影响新记录，不回写历史。
- 首页、记录页、趋势图默认使用 `corrected_value` 做主展示和异常判断。
- `raw_value` 只作为弱展示与双曲线参考值。
- 完成服药时只记录当前操作时间 `operation_time`，不做补服流程。
- 明日剂量通过 `next_day_dose_source=plan/manual` 与 `next_day_dose_tablets` 保存。
- “多吃”暂不进入当前阶段。

## 7. 数据库设计草案

### 7.1 users

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(64) NOT NULL DEFAULT '',
  avatar_url VARCHAR(512) NOT NULL DEFAULT '',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Shanghai',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

### 7.2 user_auth_accounts

```sql
CREATE TABLE user_auth_accounts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(128) NOT NULL,
  union_id VARCHAR(128) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_provider_user (provider, provider_user_id),
  KEY idx_user_id (user_id)
);
```

### 7.3 user_settings

```sql
CREATE TABLE user_settings (
  user_id BIGINT PRIMARY KEY,
  inr_target_lower DECIMAL(4,2) NOT NULL DEFAULT 1.80,
  inr_target_upper DECIMAL(4,2) NOT NULL DEFAULT 2.50,
  default_medication_time TIME NOT NULL DEFAULT '08:00:00',
  medication_name VARCHAR(64) NOT NULL DEFAULT 'Marevan',
  tablet_mg DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  test_cycle_unit VARCHAR(16) NOT NULL DEFAULT 'week',
  test_cycle_interval INT NOT NULL DEFAULT 2,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

### 7.4 inr_test_methods

```sql
CREATE TABLE inr_test_methods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(64) NOT NULL,
  offset_value DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user_id (user_id)
);
```

### 7.5 inr_records

```sql
CREATE TABLE inr_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  method_id BIGINT NOT NULL,
  raw_value DECIMAL(4,2) NOT NULL,
  offset_value DECIMAL(4,2) NOT NULL,
  corrected_value DECIMAL(4,2) NOT NULL,
  status_level VARCHAR(16) NOT NULL,
  tested_at DATETIME NOT NULL,
  source VARCHAR(32) NOT NULL DEFAULT 'manual',
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user_tested_at (user_id, tested_at),
  KEY idx_user_status (user_id, status_level)
);
```

### 7.6 medication_plans

```sql
CREATE TABLE medication_plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(64) NOT NULL DEFAULT '默认计划',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date DATE NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user_active (user_id, is_active)
);
```

### 7.7 medication_plan_items

```sql
CREATE TABLE medication_plan_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  plan_id BIGINT NOT NULL,
  sequence_no INT NOT NULL,
  dose_tablets DECIMAL(5,2) NOT NULL,
  dose_mg DECIMAL(5,2) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_plan_seq (plan_id, sequence_no)
);
```

### 7.8 medication_records

```sql
CREATE TABLE medication_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  record_date DATE NOT NULL,
  action_type VARCHAR(16) NOT NULL,
  planned_dose_tablets DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  actual_dose_tablets DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  actual_dose_mg DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  operation_time DATETIME NOT NULL,
  next_day_dose_source VARCHAR(16) NOT NULL DEFAULT 'plan',
  next_day_dose_tablets DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  note VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  UNIQUE KEY uk_user_record_date (user_id, record_date),
  KEY idx_user_operation_time (user_id, operation_time)
);
```

### 7.9 reminder_settings

```sql
CREATE TABLE reminder_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  reminder_type VARCHAR(32) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  remind_time TIME NULL,
  advance_days INT NOT NULL DEFAULT 0,
  channel VARCHAR(32) NOT NULL DEFAULT 'app',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  KEY idx_user_type (user_id, reminder_type)
);
```

## 8. Redis 使用建议

Redis 不作为主数据存储，只做辅助：

| Key | 用途 | TTL |
| --- | --- | --- |
| `session:{token}` | 登录态 | 7–30 天 |
| `wx:code:{code}` | 微信登录临时 code 防重放 | 5 分钟 |
| `rate:{user_id}:{api}` | 接口限流 | 1 分钟 |
| `reminder:lock:{date}` | 定时任务分布式锁 | 1–10 分钟 |
| `home:{user_id}` | 首页聚合缓存 | 1–5 分钟 |

第一阶段可以少用 Redis，只在登录态、限流和提醒任务锁上使用。

## 9. API 草案

### 9.1 认证

```text
POST /api/v1/auth/wechat/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/me
```

### 9.2 首页

```text
GET /api/v1/home/summary
```

返回内容：

- 今日服药计划。
- 今日服药状态。
- 最近 INR。
- 下次检测时间。
- 首页强提醒。
- 最近趋势摘要。

### 9.3 服药

```text
GET  /api/v1/medication/records?month=2026-04
POST /api/v1/medication/records
GET  /api/v1/medication/plans/current
PUT  /api/v1/medication/plans/current
```

完成服药请求示例：

```json
{
  "record_date": "2026-04-24",
  "action_type": "taken",
  "actual_dose_tablets": "1.25",
  "operation_time": "2026-04-24T08:03:00+08:00",
  "next_day_dose_source": "plan",
  "next_day_dose_tablets": "1.50"
}
```

### 9.4 INR

```text
GET  /api/v1/inr/records?from=2026-03-01&to=2026-04-30
POST /api/v1/inr/records
GET  /api/v1/inr/trend?range=90d
GET  /api/v1/inr/methods
POST /api/v1/inr/methods
PUT  /api/v1/inr/methods/{id}
DELETE /api/v1/inr/methods/{id}
```

新增 INR 请求示例：

```json
{
  "raw_value": "2.00",
  "method_id": 12,
  "tested_at": "2026-04-23T09:00:00+08:00",
  "note": "指尖血自测"
}
```

服务端计算：

```json
{
  "raw_value": "2.00",
  "offset_value": "0.10",
  "corrected_value": "2.10",
  "status_level": "ok"
}
```

### 9.5 设置

当前静态演示服务端 MVP 暂时收敛为单一设置接口：`GET /api/v1/settings` 与 `PUT /api/v1/settings`。以下分拆接口属于后续服务拆分规划，不作为当前可调用契约：

```text
PUT /api/v1/settings/inr-target
PUT /api/v1/settings/test-cycle
PUT /api/v1/settings/default-test-method
PUT /api/v1/settings/medication
PUT /api/v1/settings/reminders
```

## 10. 同步与离线策略

第一阶段建议简单可靠：

- 客户端每次打开首页拉取 `/home/summary`。
- 记录新增成功后立即刷新相关页面。
- Flutter App 可做本地缓存，网络失败时暂存待同步队列。
- 小程序第一阶段可以不做复杂离线，只做失败重试和明确提示。

后续扩展：

- 每条记录带 `client_id`，避免重复提交。
- 使用 `updated_since` 增量同步。
- 服务端返回冲突状态，客户端提示用户处理。

## 11. 安全与隐私

这是健康数据，虽然是个人工具，也建议按较高标准处理：

- 全站 HTTPS。
- token 不放 URL。
- 密码/手机号等敏感信息后续接入时加密与脱敏。
- 日志中不要打印 INR、剂量、手机号、openid 等敏感字段。
- 数据库定期备份。
- 管理后台如后续增加，必须单独鉴权。
- 接口限流，避免被刷。

医疗边界：

- App 不提供自动调药建议。
- 异常 INR 只提示复测、记录、咨询医生。
- 所有页面保留“本工具不构成医疗建议”的边界说明。

## 12. 部署建议

### 12.1 第一阶段

适合低成本部署：

- Go Gin 服务端：单台云服务器或容器。
- MySQL：云数据库或同机 MySQL。
- Redis：云 Redis 或同机 Redis。
- 静态资源：Cloudflare Workers/Pages。
- 域名：API 和静态资源分开，例如：
  - `api.example.com`
  - `app.example.com`

### 12.2 后续扩展

当用户增长后再考虑：

- API 多实例部署。
- Redis 分布式锁和队列。
- 对象存储备份导出文件。
- Prometheus + Grafana 监控。
- Sentry 错误上报。

## 13. 开发阶段拆分

### 阶段 0：文档与原型

- UI 原型继续完善。
- 技术方案、数据模型、接口草案沉淀。
- 明确 MVP 范围。

### 阶段 1：服务端 MVP

- Go Gin 项目初始化。
- MySQL migration。
- 用户、设置、服药记录、INR 记录接口。
- 首页 summary 聚合接口。
- 基础单元测试和集成测试。

### 阶段 2：微信小程序 MVP

- 微信登录。
- 首页。
- 服药打卡。
- INR 录入。
- 设置页。

### 阶段 3：Flutter App MVP

- Android/iOS 共用页面。
- 本地通知。
- 本地缓存。
- 趋势图。

### 阶段 4：提醒与同步增强

- 服务端提醒任务。
- 小程序服务通知。
- App Push。
- 离线队列和增量同步。

### 阶段 5：长期扩展

- 数据导出。
- 多成员。
- 医生协作。
- 设备导入。
- 统计报表。

## 14. MVP 建议范围

为了避免第一版过重，建议 MVP 只做：

1. 登录：微信小程序登录 + App 临时 token 登录或手机号后续。
2. 首页：今日服药、最近 INR、下次检测、强提醒。
3. 服药：完成、停服、漏服；完成后确认明日剂量。
4. INR：新增检测、检测方式、偏移量、异常分层、趋势。
5. 设置：目标范围、检测周期、药品和循环剂量。
6. 提醒：App 本地提醒，小程序服务通知可作为下一步。

暂不做：

- 多吃规划。
- 补服功能。
- 自动调药建议。
- 医生端。
- 多用户家庭管理。
- 复杂报表。

## 15. 风险与注意事项

1. **医疗风险**：文案必须克制，不给具体调药建议。
2. **数据准确性**：INR 校正值和原始值必须同时保存，避免追溯困难。
3. **时间问题**：用户时区、记录日期、系统操作时间要定义清楚。
4. **提醒可靠性**：App 本地通知和服务端提醒都可能受系统限制，需要在 UI 中明确状态。
5. **跨端一致性**：Flutter 与小程序要共用 API 协议和业务规则。
6. **历史偏移量**：检测方式偏移量修改后，不应默认改写历史记录。

## 16. 推荐下一步

1. 确认 MVP 范围。
2. 创建 `server/` Go Gin 工程骨架。
3. 写 MySQL migration。
4. 先实现 `/api/v1/home/summary`、服药记录、INR 记录三个核心闭环。
5. 同步创建 OpenAPI 文档，供 Flutter 和小程序使用。
