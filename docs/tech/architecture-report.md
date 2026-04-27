# 抗凝小助手架构梳理报告

> 目标：用“单体优先、模块清晰、跨端共用契约”的方式，支撑微信小程序、Android/iOS、服务端、Cloudflare 文档站同步演进。

## 1. 架构目标

1. **安全边界清晰**：只记录、提醒、风险分层，不给华法林剂量调整建议。
2. **跨端一致**：微信小程序与 Flutter 使用同一 OpenAPI 契约和同一套服务端业务规则。
3. **渐进演进**：当前 SQLite MVP 可运行；后续可切 MySQL + Redis，而不推翻业务层。
4. **低成本部署**：文档与静态原型部署到 Cloudflare；API 可先部署单台服务或容器。
5. **可审计可追溯**：INR 保留原始值、偏移量、校正值；服药记录保留操作时间。

## 2. 当前逻辑架构

```text
用户
 ├─ 微信小程序（快速记录、微信触达）
 ├─ Flutter Android/iOS（完整体验、本地提醒）
 └─ Cloudflare 文档/静态原型（查看需求、UI、技术方案、进度）

客户端
 └─ HTTPS JSON API /api/v1
      └─ Go Gin API Server
           ├─ handler：HTTP 参数、状态码、JSON envelope
           ├─ service：业务规则、聚合、校正、异常分层
           ├─ repository：数据访问接口
           ├─ model：领域/API 结构
           └─ config：运行配置
                ├─ SQLite MVP（当前）
                ├─ MySQL（正式主库，下一阶段）
                └─ Redis（缓存、限流、提醒锁，下一阶段）
```

## 3. 为什么采用单体优先

| 方案 | 结论 | 理由 |
|---|---|---|
| 微服务 | 暂不采用 | 当前是单人项目/MVP，拆服务会引入服务发现、链路追踪、部署复杂度 |
| 清晰分层单体 | 采用 | 保持开发速度，同时通过 handler/service/repository 控制边界 |
| 多端直连数据库 | 不采用 | 健康数据必须通过服务端鉴权和业务校验，不能让客户端绕过规则 |
| 端上自行计算核心规则 | 不采用 | INR 校正、异常分层、下次检测要跨端一致，必须由服务端统一 |

## 4. 模块边界

### 4.1 客户端边界

客户端负责：

- 页面展示和交互；
- 本地输入校验（提升体验，不作为最终可信校验）；
- 网络错误提示和 fallback 展示；
- 后续本地通知、离线队列。

客户端不负责：

- 最终医疗/风险规则判定；
- 自动调药建议；
- 关键时间真实性裁决；
- 跨端冲突合并最终裁决。

### 4.2 服务端边界

服务端负责：

- API 鉴权、参数校验、统一响应；
- INR 校正值计算、趋势枚举、异常 tier；
- 首页聚合和强提醒生成；
- 服药记录系统时间写入；
- 数据持久化、缓存、限流、提醒任务。

### 4.3 数据层边界

数据层负责：

- 主数据一致持久化；
- 查询排序、索引、事务；
- 缓存只做加速/去重，不做事实来源。

## 5. 核心业务流

### 5.1 首页加载

```text
客户端打开首页
  -> GET /home/summary
    -> service 读取 settings
    -> service 读取 latest INR
    -> service 读取今日 medication
    -> service 计算 nextTestAt
    -> service 生成 prominentReminder
  <- 返回 HomeSummary
客户端渲染强提醒、最近 INR、下次检测、今日服药
```

**使用此方案理由**：首页是高频入口，单接口聚合减少延迟和端上状态错配。

### 5.2 完成服药

```text
用户点击完成服药
  -> 选择明日剂量：planned / manual
  -> POST /medication/records
    -> service 使用服务端 now() 写 recordedAt
    -> repository 保存动作、剂量、明日剂量模式
  <- 返回 MedicationRecord
客户端刷新首页/服药状态
```

**使用此方案理由**：服药时间是操作事实，服务端系统时间比用户手填更可靠；明日剂量只是记录，不生成建议。

### 5.3 新增 INR

```text
用户录入 rawValue + testMethod + testedAt + 可选 offset
  -> POST /inr/records
    -> service 取 offset（请求优先，否则设置）
    -> correctedValue = round(rawValue + offset, 2)
    -> trend = low / in_range / high
    -> abnormalTier = normal / weak_low / strong_low / weak_high / strong_high
    -> repository 保存 raw/corrected/tier/method/time
  <- 返回 INRRecord
客户端主显示 correctedValue，弱显示 rawValue
```

**使用此方案理由**：校正逻辑和异常分层集中在服务端，避免小程序/App/后续导入工具出现不同算法。

## 6. API 契约策略

- `packages/api-contract/openapi.yaml` 是跨端契约基准。
- Go model、Flutter model、小程序 types 必须围绕该契约演进。
- 新增字段优先做到向后兼容：新增可选字段，再推进端侧必填。
- 时间统一使用 RFC3339；数据库正式阶段建议 UTC 存储，展示按用户时区。

## 7. 部署架构建议

### 7.1 当前阶段

```text
Cloudflare Workers Static Assets
 ├─ UI 原型
 └─ 文档入口 / Markdown 预览

开发/测试 API
 └─ Go Server + SQLite
```

**理由**：最快可展示和验证需求；CF 文档站让需求、UI、技术方案在线可查。

### 7.2 正式 MVP

```text
Cloudflare / CDN
 ├─ 静态文档与 H5 原型
 └─ API 域名反代/直连

API Server（单实例或容器）
 ├─ Go Gin
 ├─ MySQL 主库
 └─ Redis 缓存/限流/提醒锁
```

**理由**：单实例足够支撑早期个人/小规模用户；MySQL 和 Redis 是成熟组合，方便备份和迁移。

### 7.3 增长后

- API 多实例 + 负载均衡；
- Redis 分布式锁和队列；
- 对象存储做导出文件与备份；
- Prometheus/Grafana/Sentry 监控；
- 审计日志与权限管理。

## 8. 安全与隐私架构

| 风险 | 方案 | 理由 |
|---|---|---|
| 健康数据泄露 | HTTPS、token 不进 URL、日志脱敏 | INR/剂量属于敏感健康数据 |
| 越权读取 | 每条业务数据带 user_id，repository 查询必须按用户过滤 | 后续多用户扩展必需 |
| 自动医疗建议风险 | 文案和 service 均不输出剂量调整建议 | 避免医疗合规和安全风险 |
| 请求滥用 | Redis rate limit + API 参数校验 | 防止刷接口和错误数据 |
| 历史数据不可追溯 | 保存 raw、offset、corrected、method、testedAt | 后续回看和校准分析必需 |

## 9. 当前架构差距与建议

| 差距 | 影响 | 建议 |
|---|---|---|
| SQLite 单用户表结构 | 不能直接支撑多用户正式部署 | 下一阶段引入 MySQL migration 和 user_id |
| Flutter CLI 不在当前机器 | 本机不能跑 Flutter 测试 | 安装 Flutter SDK 后补跑 `flutter test` |
| Redis 未接入 | 还没有登录态/限流/提醒锁 | 正式 API 前接入 Redis adapter |
| 小程序服务通知未接入 | 微信提醒还不能真正触达 | 完成小程序模板消息配置后实现 |
| 鉴权仍是 MVP | 不能开放真实公网 API | 接入微信登录/session 后再放开真实数据 |


## 10. 独立运行与目录边界

| 目录/入口 | 独立职责 | 运行边界 |
|---|---|---|
| 根目录静态站 | 文档入口、Markdown 预览、三端 UI 原型 | 通过 `npm run build` 生成 `dist/` 并部署到 Cloudflare；不承载真实业务数据 |
| `miniapp/` | 微信小程序工程 | 通过 `cd miniapp && npm test` 验证；与 `/wechat/...` 静态预览路由不是同一运行时 |
| `wechat/`、`android/`、`ios/` | 静态深链预览目录 | 由根目录 `index.html` 复制入口，用于产品/视觉验收 |
| `app_flutter/` | Flutter Android/iOS App | 通过 `ApiClient` 访问服务端；可用 mock API 独立预览，真实 API 通过 `API_BASE_URL` 配置 |
| `server/` | Go/Gin JSON API | 独立 Go module，从 `server/` 目录运行；不依赖前端静态资源 |
| `packages/api-contract/` | 跨端 OpenAPI 契约 | 共享字段语义，不共享端侧运行时代码 |

详细盘点见 `docs/reports/2026-04-27-project-boundary-independent-run.md`。

## 11. 架构结论

当前最合适的路线是：**Cloudflare 展示文档和原型，Go 单体承载业务规则，SQLite 先跑通 MVP，随后平滑切 MySQL + Redis**。这样既能快速迭代，又不会把核心业务规则散落在多个端里。
